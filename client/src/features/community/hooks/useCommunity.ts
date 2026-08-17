import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@/api/endpoints/community';
import { QUERY_KEYS } from '@/lib/constants';
import type { CreateForumTopicInput, ForumTopicFilters } from '@/types/community';

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

export function useForumTopics(params: ForumTopicFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.community.topics(params),
    queryFn: ({ signal }) => communityApi.listTopics(params, signal).then(unwrap),
  });
}

export function useForumCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.community.categories(),
    queryFn: ({ signal }) => communityApi.listCategories(signal).then(unwrap),
  });
}

export function useForumStats() {
  return useQuery({
    queryKey: QUERY_KEYS.community.stats(),
    queryFn: ({ signal }) => communityApi.getStats(signal).then(unwrap),
  });
}

export function useForumTopic(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.community.topic(id ?? ''),
    queryFn: ({ signal }) => communityApi.getTopic(id!, signal).then(unwrap),
    enabled: Boolean(id),
  });
}

export function useCreateForumTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateForumTopicInput) => communityApi.createTopic(data).then(unwrap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'topics'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.categories() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.stats() });
    },
  });
}

export function useReplyToForumTopic(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => communityApi.replyToTopic(topicId, content).then(unwrap),
    onSuccess: (topic) => {
      queryClient.setQueryData(QUERY_KEYS.community.topic(topicId), topic);
      queryClient.invalidateQueries({ queryKey: ['community', 'topics'] });
    },
  });
}

export function useToggleForumLike(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => communityApi.toggleLike(topicId).then((r) => r.data.data),
    onSuccess: (result) => {
      const key = QUERY_KEYS.community.topic(topicId);
      const current = queryClient.getQueryData<ForumTopicLikeView>(key);
      if (current) {
        queryClient.setQueryData(key, {
          ...current,
          likedByMe: result.liked,
          likeCount: result.likeCount,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['community', 'topics'] });
    },
  });
}

interface ForumTopicLikeView {
  likedByMe: boolean;
  likeCount: number;
}

export function useMarkForumSolved(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (solved: boolean) => communityApi.markSolved(topicId, solved).then(unwrap),
    onSuccess: (topic) => {
      queryClient.setQueryData(QUERY_KEYS.community.topic(topicId), topic);
      queryClient.invalidateQueries({ queryKey: ['community', 'topics'] });
    },
  });
}

export function useMarkBestAnswer(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (replyId: string) => communityApi.markBestAnswer(topicId, replyId).then(unwrap),
    onSuccess: (topic) => {
      queryClient.setQueryData(QUERY_KEYS.community.topic(topicId), topic);
    },
  });
}

export function useSetForumPinned(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pinned: boolean) => communityApi.setPinned(topicId, pinned).then(unwrap),
    onSuccess: (topic) => {
      queryClient.setQueryData(QUERY_KEYS.community.topic(topicId), topic);
      queryClient.invalidateQueries({ queryKey: ['community', 'topics'] });
    },
  });
}

export function useSetForumLocked(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locked: boolean) => communityApi.setLocked(topicId, locked).then(unwrap),
    onSuccess: (topic) => {
      queryClient.setQueryData(QUERY_KEYS.community.topic(topicId), topic);
    },
  });
}

export function useDeleteForumTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => communityApi.deleteTopic(topicId).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'topics'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.categories() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.stats() });
    },
  });
}

export function useDeleteForumReply(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (replyId: string) => communityApi.deleteReply(topicId, replyId).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.topic(topicId) });
      queryClient.invalidateQueries({ queryKey: ['community', 'topics'] });
    },
  });
}