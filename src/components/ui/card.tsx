import { Pressable, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

type Props = ViewProps & { onPress?: () => void; padded?: boolean; tone?: 'default' | 'muted' | 'hero' | 'accent' };

export function Card({ onPress, padded = true, tone = 'default', style, children, ...rest }: Props) {
  const { colors, radius, spacing, dark } = useTheme();
  const bg =
    tone === 'hero' ? colors.heroBackground : tone === 'muted' ? colors.surfaceMuted : tone === 'accent' ? colors.accentSoft : colors.surface;
  const base: ViewStyle = {
    backgroundColor: bg,
    borderRadius: radius.lg,
    padding: padded ? spacing.lg : 0,
    borderWidth: tone === 'default' ? StyleSheet.hairlineWidth : 0,
    borderColor: colors.border,
    ...(tone === 'default' && !dark ? styles.shadow : null),
  };
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }, style as ViewStyle]}
        {...rest}>
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[base, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#0B1F2E',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
});
