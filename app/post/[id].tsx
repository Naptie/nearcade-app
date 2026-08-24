import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Card, LoadingView, ErrorState, Button } from '@/components/ui';
import { MarkdownView } from '@/components/MarkdownView';
import { UserAvatar } from '@/components/ShopCard';
import { formatRelativeTime } from '@/utils/format';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import {
  useCommentOnPostMutation,
  useIsAuthed,
  usePost,
  useVotePostMutation,
} from '@/hooks/api';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
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
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {post.isPinned ? (
              <View style={{ backgroundColor: `${colors.primary}20`, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{t('post.pinned')}</Text>
              </View>
            ) : null}
            {post.isLocked ? (
              <View style={{ backgroundColor: `${colors.warning}22`, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.warning }}>{t('post.locked')}</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ fontSize: 19, fontWeight: '900' }}>{post.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UserAvatar name={post.author?.displayName ?? post.author?.name} image={post.author?.image} size={26} />
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textMuted }}>
              {post.author?.displayName || post.author?.name || '—'}
            </Text>
            <Text style={{ fontSize: 11.5, color: colors.textMuted }}>{formatRelativeTime(post.createdAt, locale)}</Text>
          </View>

          {/* Vote bar */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Pressable
              onPress={() => onVote('upvote')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: userVote === 'upvote' ? `${colors.success}25` : colors.surfaceAlt,
              }}
            >
              <Ionicons name="arrow-up" size={15} color={userVote === 'upvote' ? colors.success : colors.textMuted} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: userVote === 'upvote' ? colors.success : colors.textMuted }}>
                {post.upvotes}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onVote('downvote')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: userVote === 'downvote' ? `${colors.danger}25` : colors.surfaceAlt,
              }}
            >
              <Ionicons name="arrow-down" size={15} color={userVote === 'downvote' ? colors.danger : colors.textMuted} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: userVote === 'downvote' ? colors.danger : colors.textMuted }}>
                {post.downvotes}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Body */}
        {post.content ? (
          <Card style={{ marginTop: 12 }}>
            <MarkdownView source={post.content} />
          </Card>
        ) : null}

        {/* Comments */}
        <Text style={{ fontSize: 16, fontWeight: '800', marginTop: 16, marginBottom: 8 }}>
          {t('post.comments', { count: comments.length })}
        </Text>
        {comments.map((comment) => (
          <Card key={comment.id} style={{ marginLeft: comment.parentCommentId ? 24 : 0, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <UserAvatar
                name={comment.author?.displayName ?? comment.author?.name}
                image={comment.author?.image}
                size={28}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 12.5, fontWeight: '700' }}>
                    {comment.author?.displayName || comment.author?.name || '—'}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: colors.textMuted }}>{formatRelativeTime(comment.createdAt, locale)}</Text>
                </View>
                {comment.content ? (
                  <Text style={{ fontSize: 14, lineHeight: 21, marginTop: 3 }}>{comment.content}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 }}>
                  <Pressable
                    onPress={() => {
                      setReplyTo(comment.id);
                      setDraft(`@${(comment.author?.displayName || comment.author?.name) ?? ''} `);
                    }}
                  >
                    <Text style={{ fontSize: 11.5, color: colors.accent, fontWeight: '700' }}>{t('post.reply')}</Text>
                  </Pressable>
                  <Text style={{ fontSize: 11.5, color: colors.textMuted }}>▲ {comment.upvotes}</Text>
                  <Text style={{ fontSize: 11.5, color: colors.textMuted }}>▽ {comment.downvotes}</Text>
                </View>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Compose bar */}
      <KeyboardAvoidingWrapper>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 12,
            paddingBottom: 18,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={authed ? t('post.writeComment') : t('shop.commentLoginRequired')}
            placeholderTextColor={colors.textMuted}
            editable={authed}
            multiline
            style={{
              flex: 1,
              maxHeight: 90,
              color: colors.text,
              fontSize: 14,
              backgroundColor: colors.surfaceAlt,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          />
          <Button label={t('post.send')} small loading={commentMutation.isPending} disabled={!authed || !draft.trim()} onPress={submitComment} />
        </View>
      </KeyboardAvoidingWrapper>
    </Screen>
  );
}

function KeyboardAvoidingWrapper({ children }: { children: React.ReactNode }) {
  // Kept as a wrapper so we can add platform-specific keyboard handling later.
  return <>{children}</>;
}
