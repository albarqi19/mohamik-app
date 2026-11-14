import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'sm';
  style?: ViewStyle;
  full?: boolean;
};

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, size = 'md', style, full }: Props) {
  const { colors, radius } = useTheme();
  const bg: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceMuted,
    ghost: 'transparent',
    accent: colors.accent,
    danger: colors.dangerSoft,
  };
  const fg: Record<Variant, string> = {
    primary: colors.primaryText,
    secondary: colors.text,
    ghost: colors.primary,
    accent: colors.primary === colors.accent ? colors.primaryText : '#0E2433',
    danger: colors.danger,
  };
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg[variant],
          borderRadius: radius.md,
          paddingVertical: size === 'md' ? 14 : 8,
          minHeight: size === 'md' ? 52 : 40,
          paddingHorizontal: size === 'md' ? 20 : 14,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: full ? 'stretch' : 'auto',
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === 'md' ? 20 : 16} rawColor={fg[variant]} /> : null}
          <Text variant={size === 'md' ? 'bodyStrong' : 'label'} style={{ color: fg[variant] }} align="center">
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
