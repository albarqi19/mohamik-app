import { I18nManager, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type ColorScheme, type TypographyVariant } from '@/theme';

/**
 * نص موحّد للتطبيق: يضبط الخط العربي والمحاذاة لليمين دائماً.
 * في RTL الحقيقي تعني 'left' بداية السطر (اليمين)، وإلا نستخدم 'right'.
 */
export const START_ALIGN = I18nManager.isRTL ? 'left' : 'right';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: keyof ColorScheme;
  align?: 'start' | 'center' | 'end';
};

export function Text({ variant = 'body', color = 'text', align = 'start', style, ...rest }: TextProps) {
  const { colors, typography } = useTheme();
  const textAlign = align === 'center' ? 'center' : align === 'start' ? START_ALIGN : I18nManager.isRTL ? 'right' : 'left';
  return (
    <RNText
      {...rest}
      style={[typography[variant], { color: colors[color], textAlign, writingDirection: 'rtl' }, style]}
    />
  );
}
