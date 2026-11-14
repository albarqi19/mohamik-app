import { View } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './text';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'accent';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const { colors, radius } = useTheme();
  const map: Record<BadgeTone, [string, string]> = {
    neutral: [colors.surfaceMuted, colors.textMuted],
    success: [colors.successSoft, colors.success],
    danger: [colors.dangerSoft, colors.danger],
    warning: [colors.warningSoft, colors.warning],
    info: [colors.infoSoft, colors.info],
    accent: [colors.accentSoft, colors.accent],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2, alignSelf: 'flex-start' }}>
      <Text variant="label" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}
