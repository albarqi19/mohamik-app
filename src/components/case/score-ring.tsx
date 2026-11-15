import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

/** حلقة قوة الموقف (0..100). */
export function ScoreRing({ score, size = 104 }: { score: number; size?: number }) {
  const { colors } = useTheme();
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, score));
  const tone = value >= 70 ? colors.success : value >= 45 ? colors.warning : colors.danger;
  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={`قوة الموقف ${value} من 100`}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceMuted} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * value) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="title" align="center" style={{ lineHeight: 30 }}>
          {value}
        </Text>
        <Text variant="label" color="textMuted" align="center">
          من 100
        </Text>
      </View>
    </View>
  );
}
