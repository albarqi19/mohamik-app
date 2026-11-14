import { View } from 'react-native';

import { useTheme } from '@/theme';

export function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'primary' }) {
  const { colors, radius } = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height: 6, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors[tone], borderRadius: radius.pill }} />
    </View>
  );
}
