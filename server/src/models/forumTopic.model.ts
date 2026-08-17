import mongoose, { Schema, Document } from 'mongoose';
import { FORUM_CATEGORY_SLUGS } from '../constants/forum';

export interface IForumReply {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isBestAnswer: boolean;
}

export interface IForumTopic extends Document {
  author: mongoose.Types.ObjectId;
  category: string;
  title: string;
  content: string;
  tags: string[];
  views: number;
  likeCount: number;
  likes: mongoose.Types.ObjectId[];
  replies: IForumReply[];
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  bestReplyId?: mongoose.Types.ObjectId | null;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const forumReplySchema = new Schema<IForumReply>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    isBestAnswer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const forumTopicSchema = new Schema<IForumTopic>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: FORUM_CATEGORY_SLUGS,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    tags: [{ type: String, trim: true, maxlength: 30 }],
    views: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: { type: [forumReplySchema], default: [] },
    replyCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isSolved: { type: Boolean, default: false },
    bestReplyId: { type: Schema.Types.ObjectId, ref: 'ForumTopic.replies', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

forumTopicSchema.index({ isDeleted: 1, isPinned: -1, createdAt: -1 });
forumTopicSchema.index({ isDeleted: 1, category: 1, createdAt: -1 });
forumTopicSchema.index({ likes: 1 });

export const ForumTopic = mongoose.model<IForumTopic>('ForumTopic', forumTopicSchema);