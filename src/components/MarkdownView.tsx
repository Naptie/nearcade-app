import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';

/**
 * Minimal Markdown renderer covering the subset used in nearcade posts and
 * comments: headings, bold/italic/inline-code, links, images, fenced code
 * blocks, unordered/ordered lists, blockquotes, hr and plain paragraphs.
 * No native deps — intentionally tiny.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\))|(https?:\/\/[^\s)]+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<Text key={`${keyPrefix}-b${i}`} style={{ fontWeight: '800' }}>{token.slice(2, -2)}</Text>);
    } else if (token.startsWith('*')) {
      nodes.push(<Text key={`${keyPrefix}-i${i}`} style={{ fontStyle: 'italic' }}>{token.slice(1, -1)}</Text>);
    } else if (token.startsWith('`')) {
      nodes.push(
        <Text key={`${keyPrefix}-c${i}`} style={styles.code}>
          {token.slice(1, -1)}
        </Text>
      );
    } else if (token.startsWith('[')) {
      const label = token.slice(1, token.indexOf(']'));
      const url = token.slice(token.indexOf('(') + 1, -1);
      nodes.push(
        <Text key={`${keyPrefix}-l${i}`} style={styles.link} onPress={() => void Linking.openURL(url)}>
          {label}
        </Text>
      );
    } else {
      nodes.push(
        <Text key={`${keyPrefix}-u${i}`} style={styles.link} onPress={() => void Linking.openURL(token)}>
          {token}
        </Text>
      );
    }
    last = match.index + token.length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MarkdownView({ source }: { source: string }) {
  const { colors } = useTheme();
  const lines = (source ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let listOrdered = false;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <View key={`list-${blocks.length}`} style={{ gap: 4, marginVertical: 6 }}>
        {listBuffer.map((item, idx) => (
          <View key={idx} style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: '800' }}>{listOrdered ? `${idx + 1}.` : '•'}</Text>
            <Text style={[styles.body, { color: colors.text, flex: 1 }]}>{renderInline(item, `li${idx}`)}</Text>
          </View>
        ))}
      </View>
    );
    listBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = /^(#{1,4})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      blocks.push(
        <Text
          key={`h-${i}`}
          style={{
            color: colors.text,
            fontWeight: '800',
            fontSize: [20, 18, 16, 15][level - 1],
            marginTop: level === 1 ? 10 : 8,
            marginBottom: 4,
          }}
        >
          {renderInline(headingMatch[2], `h${i}`)}
        </Text>
      );
      continue;
    }
    if (/^```/.test(line)) {
      flushList();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <View key={`code-${i}`} style={[styles.codeBlock, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={{ fontFamily: 'monospace', fontSize: 12.5, color: colors.text }}>{codeLines.join('\n')}</Text>
        </View>
      );
      continue;
    }
    const imgMatch = /^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/.exec(line.trim());
    if (imgMatch) {
      flushList();
      blocks.push(
        <Image
          key={`img-${i}`}
          source={{ uri: imgMatch[2] }}
          style={{ width: '100%', height: 180, borderRadius: 10, marginVertical: 6 }}
          contentFit="cover"
          accessibilityLabel={imgMatch[1] || 'image'}
        />
      );
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (listOrdered) flushList();
      listOrdered = false;
      listBuffer.push(line.replace(/^[-*]\s+/, ''));
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (!listOrdered && listBuffer.length) flushList();
      listOrdered = true;
      listBuffer.push(line.replace(/^\d+\.\s+/, ''));
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushList();
      blocks.push(
        <View key={`q-${i}`} style={{ borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 10, marginVertical: 6 }}>
          <Text style={{ color: colors.textMuted }}>{renderInline(line.replace(/^>\s?/, ''), `q${i}`)}</Text>
        </View>
      );
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flushList();
      blocks.push(<View key={`hr-${i}`} style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 10 }} />);
      continue;
    }
    if (line.trim() === '') {
      flushList();
      continue;
    }
    // Paragraph line — accumulate soft-wrapped lines separated by single newlines
    flushList();
    const para: string[] = [line];
    while (i + 1 < lines.length && lines[i + 1].trim() !== '' && !/^(#{1,4}\s|```|[-*]\s|\d+\.\s|>\s?|!\[)/.test(lines[i + 1])) {
      para.push(lines[i + 1]);
      i++;
    }
    blocks.push(
      <Text key={`p-${i}`} style={[styles.body, { color: colors.text, marginBottom: 6 }]}>
        {para.map((l, j) => (
          <Text key={j}>
            {j > 0 ? '\n' : null}
            {renderInline(l, `p${i}-${j}`)}
          </Text>
        ))}
      </Text>
    );
  }
  flushList();
  return <View>{blocks}</View>;
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 22 },
  link: { color: '#38BDF8', textDecorationLine: 'underline' },
  code: { fontFamily: 'monospace', backgroundColor: '#88888833', paddingHorizontal: 3 },
  codeBlock: { borderRadius: 10, padding: 12, marginVertical: 6 },
});
