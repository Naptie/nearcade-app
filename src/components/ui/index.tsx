import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text as RNText,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';

export function Text({ style, ...rest }: { style?: TextStyle | TextStyle[] } & React.ComponentProps<typeof RNText>) {
  const { colors } = useTheme();
  return <RNText {...rest} style={[{ color: colors.text }, ...(Array.isArray(style) ? style : [style])]} />;
}

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  const { colors } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: colors.background }, ...(Array.isArray(style) ? [style] : [style])]}>{children}</View>;
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, style, pressed && { opacity: 0.7 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, ...(Array.isArray(style) ? style : [style])]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  small,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: bg,
        borderWidth: variant === 'ghost' || variant === 'outline' ? 1 : 0,
        borderColor: variant === 'outline' ? colors.primary : 'transparent',
        borderRadius: 10,
        paddingVertical: small ? 7 : 11,
        paddingHorizontal: small ? 12 : 16,
        opacity: disabled || loading ? 0.5 : 1,
      }}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon}
      <Text style={{ color: fg, fontWeight: '600', fontSize: small ? 13 : 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? color ?? colors.primary : colors.surfaceAlt,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: active ? 'transparent' : colors.border,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '500', color: active ? '#FFF' : colors.textMuted }}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ backgroundColor: `${color}22`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 3 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 7,
              borderRadius: 8,
              backgroundColor: active ? colors.surface : 'transparent',
              shadowColor: '#000',
              shadowOpacity: active ? 0.08 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? colors.text : colors.textMuted }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function LoadingView() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const message = error instanceof Error ? error.message : String(error);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 16 }}>{t('common.error')}</Text>
      <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{message}</Text>
      {onRetry ? <Button label={t('common.retry')} onPress={onRetry} variant="outline" small /> : null}
    </View>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
      {icon}
      <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{message}</Text>
    </View>
  );
}

export function SectionHeader({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>{title}</Text>
      {trailing}
    </View>
  );
}

export function ListFooter({ hasMore, loading, onMore }: { hasMore: boolean; loading: boolean; onMore?: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  if (loading) {
    return (
      <View style={{ paddingVertical: 18 }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (hasMore && onMore) {
    return (
      <View style={{ paddingVertical: 12 }}>
        <Button label={t('common.more')} onPress={onMore} variant="ghost" />
      </View>
    );
  }
  return null;
}
