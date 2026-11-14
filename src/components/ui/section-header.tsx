import { Pressable, View } from 'react-native';

import { Text } from './text';

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="heading">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="link">
          <Text variant="label" color="accentText">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
