import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemePalette } from '@/theme/palette';
import { cn } from '@/lib/cn';
import { useI18n } from '@/i18n';

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

/**
 * Insets-aware screen container — fixes content colliding with the iOS
 * status bar / home indicator. Every route renders inside one of these.
 */
export function Screen({
  className,
  topInset = true,
  bottomInset = 0,
  scroll = false,
  children,
}: {
  className?: string;
  /** Pad below the status bar / notch. Disable when a native header is shown. */
  topInset?: boolean;
  /** Extra bottom padding added to the home-indicator inset (e.g. floating tab bar). */
  bottomInset?: number;
  scroll?: boolean;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={cn('flex-1 bg-base-100', className)}
      style={{
        paddingTop: topInset ? insets.top : 0,
        paddingBottom: bottomInset > 0 ? insets.bottom + bottomInset : insets.bottom,
      }}
    >
      {scroll ? (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );
}

/** Horizontal page gutter used across screens. */
export function Page({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn('px-4', className)}>{children}</View>;
}

/* ------------------------------------------------------------------ */
/* Brand wordmark                                                      */
/* ------------------------------------------------------------------ */

export function Wordmark({ light = false, size = 24 }: { light?: boolean; size?: number }) {
  return (
    <RNText className="font-extrabold tracking-tight" style={{ fontSize: size }}>
      <RNText className="text-primary">near</RNText>
      <RNText className={light ? 'text-white' : 'text-base-content'}>cade</RNText>
    </RNText>
  );
}

/* ------------------------------------------------------------------ */
/* Button (daisyUI `btn`)                                              */
/* ------------------------------------------------------------------ */

type BtnVariant = 'primary' | 'soft' | 'ghost' | 'outline' | 'neutral' | 'danger';
type BtnSize = 'xs' | 'sm' | 'md' | 'lg';

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-primary text-primary-content active:bg-primary/85',
  soft: 'bg-primary/15 text-primary active:bg-primary/25',
  ghost: 'text-base-content/75 active:bg-base-content/10',
  outline: 'border border-primary/50 text-primary active:bg-primary/15',
  neutral: 'bg-neutral text-neutral-content active:bg-neutral/85',
  danger: 'bg-error/15 text-error active:bg-error/25',
};

const BTN_SIZES: Record<BtnSize, string> = {
  xs: 'h-7 px-2.5 gap-1 rounded-lg',
  sm: 'h-9 px-3.5 gap-1.5 rounded-xl',
  md: 'h-11 px-5 gap-2 rounded-xl',
  lg: 'h-13 px-6 gap-2 rounded-2xl',
};

const BTN_LABEL: Record<BtnSize, string> = {
  xs: 'text-xs font-bold',
  sm: 'text-sm font-semibold',
  md: 'text-[15px] font-semibold',
  lg: 'text-base font-semibold',
};

const BTN_ICON: Record<BtnSize, number> = { xs: 13, sm: 15, md: 17, lg: 19 };

function textClassOf(variant: BtnVariant): string {
  return BTN_VARIANTS[variant].split(' ').find((c) => c.startsWith('text-')) ?? '';
}

export function Btn({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  loading = false,
  disabled = false,
  block = false,
  className,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconEnd?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  className?: string;
  accessibilityLabel?: string;
}) {
  const textCls = textClassOf(variant);
  const palette = useThemePalette();
  const spinnerColor =
    variant === 'primary' || variant === 'neutral'
      ? (palette.primaryContent)
      : variant === 'danger'
        ? palette.error
        : palette.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? label}
      className={cn(
        'flex-row items-center justify-center overflow-hidden',
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        block && 'w-full',
        disabled && !loading && 'opacity-40',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={BTN_ICON[size]} className={textCls} /> : null}
          <RNText className={cn(BTN_LABEL[size], textCls)} numberOfLines={1}>
            {label}
          </RNText>
          {iconEnd ? <Ionicons name={iconEnd} size={BTN_ICON[size]} className={textCls} /> : null}
        </>
      )}
    </Pressable>
  );
}

/** Square icon-only button (daisyUI `btn btn-circle`-ish). */
export function IconButton({
  icon,
  onPress,
  variant = 'soft',
  size = 38,
  loading = false,
  className,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  variant?: 'soft' | 'ghost' | 'outline';
  size?: number;
  loading?: boolean;
  className?: string;
  accessibilityLabel?: string;
}) {
  const textCls = textClassOf(variant);
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size }}
      className={cn(
        'items-center justify-center overflow-hidden rounded-xl',
        BTN_VARIANTS[variant],
        loading && 'opacity-60',
        className
      )}
    >
      {loading ? <ActivityIndicator /> : <Ionicons name={icon} size={size * 0.47} className={textCls} />}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Card (daisyUI `card` + the site's density-tinted borders)           */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className,
  onPress,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  padding?: boolean;
}) {
  const cls = cn(
    'rounded-2xl border-2 border-base-300/40 bg-base-200/60',
    padding && 'p-4',
    onPress && 'active:border-primary/70 active:bg-base-200',
    className
  );
  if (onPress) {
    return (
      <Pressable className={cls} onPress={onPress}>
        {children}
      </Pressable>
    );
  }
  return <View className={cls}>{children}</View>;
}

/* ------------------------------------------------------------------ */
/* Badge / soft status colors                                          */
/* ------------------------------------------------------------------ */

export type SoftColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral';

export const SOFT_BG: Record<SoftColor, string> = {
  primary: 'bg-primary/15',
  secondary: 'bg-secondary/15',
  accent: 'bg-accent/15',
  info: 'bg-info/15',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  error: 'bg-error/15',
  neutral: 'bg-base-content/10',
};

export const SOFT_TEXT: Record<SoftColor, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  neutral: 'text-base-content/80',
};

export function Badge({
  children,
  color = 'neutral',
  className,
}: {
  children: React.ReactNode;
  color?: SoftColor;
  className?: string;
}) {
  return (
    <View className={cn('self-start rounded-full px-2 py-0.5', SOFT_BG[color], className)}>
      <RNText className={cn('text-[11px] font-bold', SOFT_TEXT[color])}>{children}</RNText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Alert (daisyUI `alert alert-soft`)                                  */
/* ------------------------------------------------------------------ */

const ALERT_ICONS: Record<SoftColor, keyof typeof Ionicons.glyphMap> = {
  primary: 'information-circle',
  secondary: 'information-circle',
  accent: 'information-circle',
  info: 'information-circle',
  success: 'checkmark-circle',
  warning: 'warning',
  error: 'alert-circle',
  neutral: 'information-circle',
};

export function Alert({
  children,
  type = 'info',
  icon,
  className,
}: {
  children: React.ReactNode;
  type?: SoftColor;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}) {
  return (
    <View className={cn('flex-row items-center gap-2.5 rounded-xl px-3 py-2.5', SOFT_BG[type], className)}>
      <Ionicons name={icon ?? ALERT_ICONS[type]} size={16} className={SOFT_TEXT[type]} />
      {typeof children === 'string' ? (
        <RNText className={cn('flex-1 text-[13px] font-medium leading-[18px]', SOFT_TEXT[type])}>{children}</RNText>
      ) : (
        <View className="flex-1">{children}</View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Chip (filter pill toggle)                                           */
/* ------------------------------------------------------------------ */

export function Chip({
  label,
  active = false,
  onPress,
  color = 'primary',
  icon,
  className,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: SoftColor;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'h-8 flex-row items-center gap-1.5 rounded-full px-3.5',
        active ? cn(SOFT_BG[color], 'active:opacity-70') : 'bg-base-200 active:bg-base-300/60',
        className
      )}
    >
      {icon ? <Ionicons name={icon} size={14} className={active ? SOFT_TEXT[color] : 'text-base-content/55'} /> : null}
      <RNText
        className={cn(
          'text-[13px] font-semibold',
          active ? SOFT_TEXT[color] : 'text-base-content/80'
        )}
      >
        {label}
      </RNText>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented tabs (daisyUI `tabs tabs-box`)                            */
/* ------------------------------------------------------------------ */

export function SegTabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <View className={cn('flex-row rounded-xl bg-base-200 p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn(
              'flex-1 items-center justify-center rounded-lg py-2',
              active ? 'bg-primary shadow-sm' : 'active:bg-base-300/50'
            )}
          >
            <RNText
              className={cn('text-[13px] font-bold', active ? 'text-primary-content' : 'text-base-content/70')}
              numberOfLines={1}
            >
              {opt.label}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

export function Input({ className, placeholderTextColor, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? '#8A8A8A'}
      className={cn(
        'rounded-xl border border-base-300/70 bg-base-100 px-3 py-2.5 text-[14px] text-base-content focus:border-primary/60',
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Section title / list rows                                           */
/* ------------------------------------------------------------------ */

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View className="mb-2 mt-4 flex-row items-center justify-between">
      <RNText className="text-[17px] font-extrabold tracking-tight text-base-content">{title}</RNText>
      {action}
    </View>
  );
}

export function ListRow({
  icon,
  label,
  value,
  onPress,
  danger = false,
  badge,
  className,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  badge?: number;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={cn('flex-row items-center gap-3 rounded-xl px-3.5 py-3 active:bg-base-content/5', className)}
    >
      <View className={cn('h-8 w-8 items-center justify-center rounded-lg', danger ? SOFT_BG.error : SOFT_BG.primary)}>
        <Ionicons name={icon} size={16} className={danger ? SOFT_TEXT.error : SOFT_TEXT.primary} />
      </View>
      <RNText className={cn('flex-1 text-[14px] font-semibold', danger ? SOFT_TEXT.error : 'text-base-content')}>
        {label}
      </RNText>
      {value ? <RNText className="text-[13px] text-base-content/50">{value}</RNText> : null}
      {badge != null && badge > 0 ? (
        <View className="min-w-[18px] items-center justify-center rounded-full bg-error px-1 py-0.5">
          <RNText className="text-[10px] font-extrabold text-white">{badge > 99 ? '99+' : badge}</RNText>
        </View>
      ) : null}
      {onPress && !danger ? <Ionicons name="chevron-forward" size={15} className="text-base-content/30" /> : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function Spinner({ className }: { className?: string }) {
  return <ActivityIndicator className={className} />;
}

export function LoadingView() {
  const { t } = useI18n();
  return (
    <View className="items-center justify-center gap-3 py-16">
      <ActivityIndicator size="large" />
      <RNText className="text-[13px] text-base-content/50">{t('common.loading')}</RNText>
    </View>
  );
}

export function EmptyState({
  message,
  icon = 'sad-outline',
}: {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="items-center justify-center gap-3 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-base-200">
        <Ionicons name={icon} size={28} className="text-base-content/40" />
      </View>
      <RNText className="px-8 text-center text-[13.5px] leading-5 text-base-content/50">{message}</RNText>
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    <View className="mx-4 my-6">
      <Alert type="error">{message || t('common.error')}</Alert>
      {onRetry ? (
        <Btn
          label={t('common.retry')}
          variant="outline"
          size="sm"
          icon="refresh"
          className="mt-3 self-center"
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

/** Infinite-list footer: spinner while fetching next page, "load more" otherwise. */
export function ListFooter({
  hasMore,
  loading,
  onMore,
}: {
  hasMore?: boolean;
  loading?: boolean;
  onMore?: () => void;
}) {
  const { t } = useI18n();
  if (loading) return <Spinner className="py-4" />;
  if (!hasMore || !onMore) return null;
  return <Btn label={t('common.more')} variant="ghost" size="sm" className="mt-2 self-center" onPress={onMore} />;
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = ['#E23A78', '#0AA2C0', '#7C5CE0', '#1D9E62', '#D08A2C'];

export function Avatar({ name, image, size = 36 }: { name?: string | null; image?: string | null; size?: number }) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  const bg = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];
  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        transition={120}
      />
    );
  }
  return (
    <View className="items-center justify-center rounded-full" style={{ width: size, height: size, backgroundColor: bg }}>
      <RNText className="font-extrabold text-white" style={{ fontSize: size * 0.42 }}>
        {initial}
      </RNText>
    </View>
  );
}

/** Icon + small metric used in cards and tables. */
export function Meta({
  icon,
  value,
  className,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('flex-row items-center gap-1', className)}>
      <Ionicons name={icon} size={13} className="text-base-content/45" />
      <RNText className="text-[12px] font-medium text-base-content/55">{value}</RNText>
    </View>
  );
}
