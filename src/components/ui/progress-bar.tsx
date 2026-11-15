import { View } from 'react-native';

import { useTheme } from '@/theme';

type Props = { value: number; tone?: 'accent' | 'primary'; /** على خلفية داكنة (البطاقة البارزة) */ onHero?: boolean };

export function ProgressBar({ value, tone = 'accent', onHero }: Props) {
  const { colors, radius } = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={{ height: 6, backgroundColor: onHero ? colors.heroLine : colors.surfaceMuted, borderRadius: radius.pill, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors[tone], borderRadius: radius.pill }} />
    </View>
  );
}
