import mongoose from 'mongoose';
import { ForumTopic, type IForumReply } from '../models/forumTopic.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { buildSafeRegex } from '../utils/escapeRegex';
import {
  FORUM_CATEGORY_NAMES,
  FORUM_CATEGORIES,
  type ForumCategorySlug,
  type ForumSort,
} from '../constants/forum';
import { ROLES } from '../constants/roles';

interface ListOptions {
  page: number;
  limit: number;
  sort: ForumSort;
  category?: string;
  search?: string;
  solved?: string;
  instructor?: string;
}

const MAX_TAGS = 8;

interface ForumAuthorView {
  _id: mongoose.Types.ObjectId;
  name: string;
  avatar?: { url: string; publicId?: string };
  role: string;
}

interface ForumReplyView {
  _id: mongoose.Types.ObjectId;
  author: ForumAuthorView;
  content: string;
  createdAt: Date;
  isBestAnswer: boolean;
}

interface ForumTopicView {
  _id: mongoose.Types.ObjectId;
  author?: ForumAuthorView;
  category: string;
  categoryName: string;
  title: string;
  content: string;
  tags: string[];
  views: number;
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  bestReplyId?: mongoose.Types.ObjectId | null;
  replies?: ForumReplyView[];
  likes?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
}

function normalizeTags(tags: string[] = []): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const tag of tags) {
    const cleaned = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      normalized.push(cleaned);
    }
    if (normalized.length >= MAX_TAGS) break;
  }
  return normalized;
}

function categoryName(category: string): string {
  return FORUM_CATEGORY_NAMES[category as ForumCategorySlug] ?? category;
}

function sortSpec(sort: ForumSort): Record<string, 1 | -1> {
  switch (sort) {
    case 'active':
      return { isPinned: -1, updatedAt: -1 };
    case 'viewed':
      return { isPinned: -1, views: -1, createdAt: -1 };
    case 'discussed':
      return { isPinned: -1, replyCount: -1, createdAt: -1 };
    case 'trending':
      return { isPinned: -1, score: -1, createdAt: -1 };
    default:
      return { isPinned: -1, createdAt: -1 };
  }
}

async function instructorIds(): Promise<mongoose.Types.ObjectId[]> {
  const instructors = await User.find({ role: ROLES.INSTRUCTOR }).select('_id').lean();
  return instructors.map((u) => u._id);
}

export const listForumTopics = async (options: ListOptions, userId?: string) => {
  const { page, limit, sort } = options;
  const skip = (page - 1) * limit;

  const match: Record<string, unknown> = { isDeleted: false };

  if (options.category) match.category = options.category;

  if (options.solved === 'true') match.isSolved = true;
  if (options.solved === 'false') match.isSolved = false;

  if (options.instructor === 'true') {
    const ids = await instructorIds();
    match.author = { $in: ids };
  }

  if (options.search && options.search.trim()) {
    const pattern = buildSafeRegex(options.search.trim());
    const or: Record<string, unknown>[] = [
      { title: pattern },
      { content: pattern },
      { tags: pattern },
    ];
    const matchingCategories = FORUM_CATEGORIES.filter((c) =>
      c.name.toLowerCase().includes(options.search!.toLowerCase())
    ).map((c) => c.slug);
    if (matchingCategories.length > 0) {
      or.push({ category: { $in: matchingCategories } });
    }
    match.$or = or;
  }

  const isTrending = sort === 'trending';
  if (isTrending) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    match.createdAt = { $gte: thirtyDaysAgo };
  }

  const pipeline: Record<string, unknown>[] = [
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
      },
    },
    { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        lastActivityAt: { $ifNull: [{ $arrayElemAt: ['$replies.createdAt', -1] }, '$updatedAt'] },
      },
    },
  ];

  if (isTrending) {
    pipeline.push({
      $addFields: {
        score: { $add: [{ $multiply: ['$likeCount', 1] }, { $multiply: ['$replyCount', 2] }] },
      },
    });
  }

  pipeline.push({
    $project: {
      _id: 1,
      category: 1,
      title: 1,
      content: 1,
      tags: 1,
      views: 1,
      likeCount: 1,
      likes: 1,
      replyCount: 1,
      isPinned: 1,
      isLocked: 1,
      isSolved: 1,
      bestReplyId: 1,
      createdAt: 1,
      updatedAt: 1,
      lastActivityAt: 1,
      author: {
        _id: '$author._id',
        name: '$author.name',
        avatar: '$author.avatar',
        role: '$author.role',
      },
    },
  });

  pipeline.push({ $sort: sortSpec(sort) }, { $skip: skip }, { $limit: limit });

  const [discussions, total] = await Promise.all([
    ForumTopic.aggregate(pipeline as unknown as mongoose.PipelineStage[]),
    ForumTopic.countDocuments(match),
  ]);

  const enriched = discussions.map((topic) => {
    const likedByMe = userId
      ? (topic.likes as mongoose.Types.ObjectId[]).some((id) => id.toString() === userId)
      : false;
    const { likes: _likes, ...rest } = topic;
    return { ...rest, likedByMe, categoryName: categoryName(topic.category) };
  });

  return {
    discussions: enriched,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const listForumCategories = async () => {
  const counts = await ForumTopic.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  const categories = FORUM_CATEGORIES.map((category) => ({
    slug: category.slug,
    name: category.name,
    count: countMap.get(category.slug) ?? 0,
  }));

  return categories;
};

export const getForumStats = async () => {
  const [members, discussions, repliesAgg] = await Promise.all([
    User.countDocuments({ isActive: true, isDeleted: false }),
    ForumTopic.countDocuments({ isDeleted: false }),
    ForumTopic.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, replies: { $sum: '$replyCount' } } },
    ]),
  ]);

  return {
    members,
    discussions,
    replies: repliesAgg[0]?.replies ?? 0,
  };
};

export const getForumTopic = async (topicId: string, userId?: string): Promise<ForumTopicView> => {
  const topic = (await ForumTopic.findOneAndUpdate(
    { _id: topicId, isDeleted: false },
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('author', 'name avatar role')
    .populate('replies.author', 'name avatar role')
    .lean()) as unknown as ForumTopicView | null;

  if (!topic) throw ApiError.notFound('Discussion not found');

  const likedByMe = userId
    ? (topic.likes ?? []).some((id) => id.toString() === userId)
    : false;

  return { ...topic, likedByMe, categoryName: categoryName(topic.category) };
};

export const createForumTopic = async (
  userId: string,
  data: { category: string; title: string; content: string; tags?: string[] }
): Promise<ForumTopicView> => {
  const topic = await ForumTopic.create({
    author: userId,
    category: data.category,
    title: data.title,
    content: data.content,
    tags: normalizeTags(data.tags),
  });

  const populated = (await ForumTopic.findById(topic._id)
    .populate('author', 'name avatar role')
    .lean()) as unknown as ForumTopicView;
  if (!populated) throw ApiError.notFound('Discussion not found');
  return { ...populated, likedByMe: false, categoryName: categoryName(populated.category) };
};

export const replyToTopic = async (topicId: string, userId: string, content: string): Promise<ForumTopicView> => {
  const topic = await ForumTopic.findOne({ _id: topicId, isDeleted: false });
  if (!topic) throw ApiError.notFound('Discussion not found');
  if (topic.isLocked) throw ApiError.forbidden('This discussion is locked and no longer accepts replies');

  topic.replies.push({ author: userId as any, content, isBestAnswer: false } as any);
  topic.replyCount += 1;
  await topic.save();

  const populated = (await ForumTopic.findById(topicId)
    .populate('author', 'name avatar role')
    .populate('replies.author', 'name avatar role')
    .lean()) as unknown as ForumTopicView;
  if (!populated) throw ApiError.notFound('Discussion not found');
  return { ...populated, likedByMe: false, categoryName: categoryName(populated.category) };
};

export const toggleTopicLike = async (topicId: string, userId: string) => {
  const topic = await ForumTopic.findOne({ _id: topicId, isDeleted: false });
  if (!topic) throw ApiError.notFound('Discussion not found');

  const idx = topic.likes.findIndex((id) => id.toString() === userId);
  let liked: boolean;
  if (idx >= 0) {
    topic.likes.splice(idx, 1);
    topic.likeCount = Math.max(0, topic.likeCount - 1);
    liked = false;
  } else {
    topic.likes.push(userId as any);
    topic.likeCount += 1;
    liked = true;
  }
  await topic.save();

  return { liked, likeCount: topic.likeCount };
};

export const deleteTopic = async (topicId: string, userId: string, role: string) => {
  const topic = await ForumTopic.findOne({ _id: topicId, isDeleted: false });
  if (!topic) throw ApiError.notFound('Discussion not found');
  if (role !== ROLES.ADMIN && topic.author.toString() !== userId) {
    throw ApiError.forbidden('You are not allowed to delete this discussion');
  }

  topic.isDeleted = true;
  topic.deletedAt = new Date();
  await topic.save();
  return { success: true };
};

export const deleteReply = async (topicId: string, replyId: string, userId: string, role: string) => {
  const topic = await ForumTopic.findOne({ _id: topicId, isDeleted: false });
  if (!topic) throw ApiError.notFound('Discussion not found');

  const replies = topic.replies as unknown as mongoose.Types.DocumentArray<IForumReply>;
  const reply = replies.id(replyId);
  if (!reply) throw ApiError.notFound('Reply not found');
  if (role !== ROLES.ADMIN && reply.author.toString() !== userId) {
    throw ApiError.forbidden('You are not allowed to delete this reply');
  }

  replies.pull(replyId);
  topic.replyCount = Math.max(0, topic.replyCount - 1);
  if (topic.bestReplyId && topic.bestReplyId.toString() === replyId) {
    topic.bestReplyId = null;
  }
  await topic.save();
  return { success: true };
};

export const markTopicSolved = async (
  topicId: string,
  userId: string,
  role: string,
  solved: boolean
): Promise<ForumTopicView> => {
  const topic = await ForumTopic.findOne({ _id: topicId, isDeleted: false });
  if (!topic) throw ApiError.notFound('Discussion not found');
  if (role !== ROLES.ADMIN && topic.author.toString() !== userId) {
    throw ApiError.forbidden('Only the author can mark this discussion as solved');
  }

  topic.isSolved = solved;
  if (!solved) {
    topic.bestReplyId = null;
    for (const reply of topic.replies) {
      reply.isBestAnswer = false;
    }
  }
  await topic.save();

  const populated = (await ForumTopic.findById(topicId)
    .populate('author', 'name avatar role')
    .populate('replies.author', 'name avatar role')
    .lean()) as unknown as ForumTopicView;
  if (!populated) throw ApiError.notFound('Discussion not found');
  return { ...populated, likedByMe: false, categoryName: categoryName(populated.category) };
};

export const markBestAnswer = async (
  topicId: string,
  replyId: string,
  userId: string,
  role: string
): Promise<ForumTopicView> => {
  if (role !== ROLES.INSTRUCTOR && role !== ROLES.ADMIN) {
    throw ApiError.forbidden('Only instructors can mark a best answer');
  }

  const topic = await ForumTopic.findOne({ _id: topicId, isDeleted: false });
  if (!topic) throw ApiError.notFound('Discussion not found');

  const reply = (topic.replies as unknown as mongoose.Types.DocumentArray<IForumReply>).id(replyId);
  if (!reply) throw ApiError.notFound('Reply not found');

  const alreadyBest = reply.isBestAnswer;
  for (const r of topic.replies) {
    r.isBestAnswer = false;
  }
  if (!alreadyBest) {
    reply.isBestAnswer = true;
    topic.bestReplyId = reply._id;
    topic.isSolved = true;
  } else {
    topic.bestReplyId = null;
    topic.isSolved = false;
  }
  await topic.save();

  const populated = (await ForumTopic.findById(topicId)
    .populate('author', 'name avatar role')
    .populate('replies.author', 'name avatar role')
    .lean()) as unknown as ForumTopicView;
  if (!populated) throw ApiError.notFound('Discussion not found');
  return { ...populated, likedByMe: false, categoryName: categoryName(populated.category) };
};

export const setTopicPinned = async (topicId: string, pinned: boolean): Promise<ForumTopicView> => {
  const topic = (await ForumTopic.findOneAndUpdate(
    { _id: topicId, isDeleted: false },
    { isPinned: pinned },
    { new: true }
  )
    .populate('author', 'name avatar role')
    .populate('replies.author', 'name avatar role')
    .lean()) as unknown as ForumTopicView | null;
  if (!topic) throw ApiError.notFound('Discussion not found');
  return { ...topic, likedByMe: false, categoryName: categoryName(topic.category) };
};

export const setTopicLocked = async (topicId: string, locked: boolean): Promise<ForumTopicView> => {
  const topic = (await ForumTopic.findOneAndUpdate(
    { _id: topicId, isDeleted: false },
    { isLocked: locked },
    { new: true }
  )
    .populate('author', 'name avatar role')
    .populate('replies.author', 'name avatar role')
    .lean()) as unknown as ForumTopicView | null;
  if (!topic) throw ApiError.notFound('Discussion not found');
  return { ...topic, likedByMe: false, categoryName: categoryName(topic.category) };
};