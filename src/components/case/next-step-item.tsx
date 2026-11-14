import { Pressable, View } from 'react-native';

import type { NextStep } from '@/api/types';
import { Icon, Text } from '@/components/ui';
import { relativeDays } from '@/lib/format';
import { useTheme } from '@/theme';

export function NextStepItem({ step, onToggle, onOpen }: { step: NextStep; onToggle: () => void; onOpen?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 10 }}>
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: step.done }}
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 2,
          borderColor: step.done ? colors.success : colors.border,
          backgroundColor: step.done ? colors.success : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}>
        {step.done ? <Icon name="checkmark" size={16} rawColor="#fff" /> : null}
      </Pressable>
      <Pressable onPress={onOpen} disabled={!onOpen} style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" color={step.done ? 'textMuted' : 'text'} style={step.done ? { textDecorationLine: 'line-through' } : undefined}>
          {step.title}
        </Text>
        <Text variant="caption" color="textMuted">
          {step.detail}
          {step.dueAt && !step.done ? ` · ${relativeDays(step.dueAt)}` : ''}
        </Text>
      </Pressable>
    </View>
  );
}
