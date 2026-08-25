import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Meta } from '@/components/ui';
import type { Post } from '@/api/types';

/** Post list row mirroring the site's PostCard (title + excerpt + vote/comment footer). */
export function PostRow({
  post,
  timeText,
  onPress,
}: {
  post: Post;
  timeText: string;
  onPress?: () => void;
}) {
  const excerpt = post.content?.replace(/[#*`>\[\]!\-]/g, '').trim().slice(0, 140);
  const netVotes = post.upvotes - post.downvotes;
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center gap-1.5">
        {post.isPinned ? <Ionicons name="pin" size={13} className="text-primary" /> : null}
        {post.isLocked ? <Ionicons name="lock-closed" size={12} className="text-warning" /> : null}
        <Text
          className="shrink text-[15px] font-bold leading-[21px] tracking-tight text-base-content"
          numberOfLines={2}
        >
          {post.title}
        </Text>
      </View>
      {excerpt ? (
        <Text className="mt-1 text-[12.5px] leading-[17px] text-base-content/55" numberOfLines={3}>
          {excerpt}
        </Text>
      ) : null}
      <View className="mt-2 flex-row items-center gap-3.5">
        <Meta icon="chatbubble-outline" value={post.commentCount} />
        <View className="flex-row items-center gap-1">
          <Ionicons
            name="arrow-up"
            size={12}
            className={netVotes > 0 ? 'text-success' : netVotes < 0 ? 'text-error' : 'text-base-content/45'}
          />
          <Text
            className={`text-[11.5px] font-semibold ${
              netVotes > 0 ? 'text-success' : netVotes < 0 ? 'text-error' : 'text-base-content/55'
            }`}
          >
            {netVotes}
          </Text>
        </View>
        <Text className="text-[11px] text-base-content/45">{timeText}</Text>
      </View>
    </Card>
  );
}
