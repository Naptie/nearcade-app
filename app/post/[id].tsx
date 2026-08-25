import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Avatar,
  Badge,
  Btn,
  Card,
  ErrorState,
  LoadingView,
  Screen,
} from '@/components/ui';
import { MarkdownView } from '@/components/MarkdownView';
import { formatRelativeTime } from '@/utils/format';
import { useI18n } from '@/i18n';
import { useCommentOnPostMutation, useIsAuthed, usePost, useVotePostMutation } from '@/hooks/api';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const authed = useIsAuthed();

  const query = usePost(id);
  const voteMutation = useVotePostMutation();
  const commentMutation = useCommentOnPostMutation();

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const comments = useMemo(
    () => [...(query.data?.comments ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [query.data]
  );

  if (query.isLoading) return <LoadingView />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const { post, userVote } = query.data!;

  const onVote = (voteType: 'upvote' | 'downvote') => {
    if (!authed) {
      Alert.alert(t('shop.commentLoginRequired'));
      return;
    }
    void Haptics.selectionAsync?.();
    voteMutation.mutate({ postId: id, voteType });
  };

  const submitComment = () => {
    const content = draft.trim();
    if (!content) return;
    commentMutation.mutate(
      { postId: id, content },
      {
        onSuccess: () => {
          setDraft('');
          setReplyTo(null);
        },
        onError: (err) => Alert.alert(String(err)),
      }
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: post.title }} />
      <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* Post card — mirrors the site's PostCard */}
          <Card className="gap-2.5">
            <View className="flex-row flex-wrap gap-1.5">
              {post.isPinned ? (
                <Badge color="primary" className="flex-row items-center gap-1">
                  <Ionicons name="pin" size={10} /> {t('post.pinned')}
                </Badge>
              ) : null}
              {post.isLocked ? (
                <Badge color="warning" className="flex-row items-center gap-1">
                  <Ionicons name="lock-closed" size={10} /> {t('post.locked')}
                </Badge>
              ) : null}
            </View>
            <Text className="text-[19px] font-extrabold leading-6 tracking-tight text-base-content">{post.title}</Text>
            <View className="flex-row items-center gap-2">
              <Avatar name={post.author?.displayName ?? post.author?.name} image={post.author?.image} size={26} />
              <Text className="text-[12.5px] font-bold text-base-content/60">
                {post.author?.displayName || post.author?.name || '—'}
              </Text>
              <Text className="text-[11.5px] text-base-content/45">{formatRelativeTime(post.createdAt, locale)}</Text>
            </View>

            {/* Vote bar */}
            <View className="mt-1 flex-row gap-2">
              <Pressable
                onPress={() => onVote('upvote')}
                className={`flex-row items-center gap-1.5 rounded-xl px-3 py-1.5 ${
                  userVote === 'upvote' ? 'bg-success/20' : 'bg-base-content/5 active:bg-success/15'
                }`}
              >
                <Ionicons
                  name="arrow-up"
                  size={15}
                  className={userVote === 'upvote' ? 'text-success' : 'text-base-content/55'}
                />
                <Text
                  className={`text-[13px] font-bold ${userVote === 'upvote' ? 'text-success' : 'text-base-content/55'}`}
                >
                  {post.upvotes}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onVote('downvote')}
                className={`flex-row items-center gap-1.5 rounded-xl px-3 py-1.5 ${
                  userVote === 'downvote' ? 'bg-error/20' : 'bg-base-content/5 active:bg-error/15'
                }`}
              >
                <Ionicons
                  name="arrow-down"
                  size={15}
                  className={userVote === 'downvote' ? 'text-error' : 'text-base-content/55'}
                />
                <Text
                  className={`text-[13px] font-bold ${userVote === 'downvote' ? 'text-error' : 'text-base-content/55'}`}
                >
                  {post.downvotes}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Body */}
          {post.content ? (
            <Card className="mt-3">
              <MarkdownView source={post.content} />
            </Card>
          ) : null}

          {/* Comments */}
          <Text className="mb-2 mt-4 text-[16px] font-extrabold tracking-tight text-base-content">
            {t('post.comments', { count: comments.length })}
          </Text>
          {comments.map((comment) => (
            <Card key={comment.id} padding={false} className={`mb-2 p-3 ${comment.parentCommentId ? 'ml-6' : ''}`}>
              <View className="flex-row gap-2.5">
                <Avatar name={comment.author?.displayName ?? comment.author?.name} image={comment.author?.image} size={28} />
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[12.5px] font-bold text-base-content">
                      {comment.author?.displayName || comment.author?.name || '—'}
                    </Text>
                    <Text className="text-[10.5px] text-base-content/45">{formatRelativeTime(comment.createdAt, locale)}</Text>
                  </View>
                  {comment.content ? (
                    <Text className="mt-0.5 text-[14px] leading-[21px] text-base-content/90">{comment.content}</Text>
                  ) : null}
                  <View className="mt-1 flex-row items-center gap-3.5">
                    <Pressable
                      onPress={() => {
                        setReplyTo(comment.id);
                        setDraft(`@${(comment.author?.displayName || comment.author?.name) ?? ''} `);
                      }}
                    >
                      <Text className="text-[11.5px] font-bold text-accent">{t('post.reply')}</Text>
                    </Pressable>
                    <Text className="text-[11.5px] font-semibold text-success">▲ {comment.upvotes}</Text>
                    <Text className="text-[11.5px] font-semibold text-error">▽ {comment.downvotes}</Text>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>

        {/* Compose bar (inset-safe, keyboard-aware) */}
        <View
          className="flex-row items-center gap-2 border-t border-base-300/50 bg-base-100 p-3"
          style={{ paddingBottom: 12 }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={authed ? t('post.writeComment') : t('shop.commentLoginRequired')}
            placeholderTextColor="#8A8A8A"
            editable={authed}
            multiline
            className="max-h-[90px] flex-1 rounded-xl bg-base-200 px-3 py-2 text-[14px] text-base-content"
          />
          <Btn
            label={t('post.send')}
            size="sm"
            loading={commentMutation.isPending}
            disabled={!authed || !draft.trim()}
            onPress={submitComment}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
    </>
  );
}
