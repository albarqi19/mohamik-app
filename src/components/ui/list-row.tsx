import { Pressable, View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/theme';
import { Icon, ICON_FORWARD, type IconName } from './icon';
import { Text } from './text';

type Props = {
  icon?: IconName;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
};

export function ListRow({ icon, title, subtitle, trailing, onPress, danger }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        minHeight: 52,
        opacity: pressed ? 0.7 : 1,
      })}>
      {icon ? (
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? colors.dangerSoft : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={danger ? 'danger' : 'text'} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color={danger ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Icon name={ICON_FORWARD} size={18} color="textMuted" /> : null)}
    </Pressable>
  );
}
