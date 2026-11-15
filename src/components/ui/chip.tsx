import { Pressable } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './text';

type Props = { label: string; selected?: boolean; onPress: () => void };

/** خيار صغير قابل للاختيار (حبة). */
export function Chip({ label, selected, onPress }: Props) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        minHeight: 40,
        justifyContent: 'center',
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accentSoft : colors.surface,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Text variant="label" color={selected ? 'accentText' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}
