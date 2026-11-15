/**
 * رموز التصميم (Design Tokens) لتطبيق محاميك.
 * كل الألوان والمسافات والخطوط تأتي من هنا فقط، حتى يسهل استبدالها
 * بمخرجات مسار التصميم دون لمس الشاشات.
 */

/** هوية «الديوان»: ورق رسمي فاتح + حبر أزرق داكن + لمسة نحاسية. (من مسار التصميم) */
export const palette = {
  ink: '#0E2433',
  inkLine: '#33506A',
  inkMuted: '#C9D3DA',
  ground: '#F5F1E8',
  surface: '#FFFFFF',
  line: '#E4DDCF',
  muted: '#5E6B73',
  body2: '#3A4A55',
  brass: '#C9A25A',
  brassLight: '#E2C68C',
  brassText: '#85601F',
  brassSoft: '#F3EAD6',
  sandMuted: '#EDE7DA',
  success: '#2F6B55',
  successBg: '#E8F1EC',
  danger: '#A63A2B',
  dangerBg: '#FBF3EF',
  warning: '#9A6212',
  warningBg: '#FBF1DF',
  info: '#2D5B83',
  infoBg: '#E8EFF6',
} as const;

export type ColorScheme = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryText: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  heroBackground: string;
  heroText: string;
  heroMuted: string;
  heroLine: string;
  heroAccent: string;
};

export const lightColors: ColorScheme = {
  background: palette.ground,
  surface: palette.surface,
  surfaceMuted: palette.sandMuted,
  border: palette.line,
  text: palette.ink,
  textMuted: palette.muted,
  textInverse: '#FFFFFF',
  primary: palette.ink,
  primaryText: '#FFFFFF',
  accent: palette.brass,
  accentText: palette.brassText,
  accentSoft: palette.brassSoft,
  success: palette.success,
  successSoft: palette.successBg,
  danger: palette.danger,
  dangerSoft: palette.dangerBg,
  warning: palette.warning,
  warningSoft: palette.warningBg,
  info: palette.info,
  infoSoft: palette.infoBg,
  heroBackground: palette.ink,
  heroText: '#FFFFFF',
  heroMuted: palette.inkMuted,
  heroLine: palette.inkLine,
  heroAccent: palette.brassLight,
};

export const darkColors: ColorScheme = {
  background: '#0A1822',
  surface: '#10222F',
  surfaceMuted: '#162C3B',
  border: '#24405A',
  text: '#F1EEE6',
  textMuted: '#9AA8B2',
  textInverse: '#FFFFFF',
  primary: palette.brass,
  primaryText: palette.ink,
  accent: palette.brass,
  accentText: palette.brassLight,
  accentSoft: '#2C2516',
  success: '#6FB596',
  successSoft: '#13291F',
  danger: '#E07A6A',
  dangerSoft: '#341A15',
  warning: '#E2B062',
  warningSoft: '#33260C',
  info: '#7DA9D2',
  infoSoft: '#122A40',
  heroBackground: '#13293A',
  heroText: '#FFFFFF',
  heroMuted: palette.inkMuted,
  heroLine: palette.inkLine,
  heroAccent: palette.brassLight,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 42 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 34 },
  /** نصوص المذكرات والأحكام والمواد النظامية: أكبر قليلاً وبتباعد أسطر مريح للقراءة */
  reading: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 29 },
  heading: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 28 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 25 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 24 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
} as const;

export type TypographyVariant = keyof typeof typography;
