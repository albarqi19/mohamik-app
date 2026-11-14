import { forwardRef } from 'react';
import { I18nManager, TextInput, View, type TextInputProps } from 'react-native';

import { fonts, useTheme } from '@/theme';
import { Text } from './text';

type Props = TextInputProps & { label?: string; error?: string; hint?: string };

export const TextField = forwardRef<React.ComponentRef<typeof TextInput>, Props>(function TextField({ label, error, hint, style, multiline, ...rest }, ref) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text variant="label" color="textMuted">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[
          {
            fontFamily: fonts.regular,
            fontSize: 16,
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderWidth: 1,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
            minHeight: multiline ? 110 : 52,
            textAlign: I18nManager.isRTL ? 'left' : 'right',
            textAlignVertical: multiline ? 'top' : 'center',
            writingDirection: 'rtl',
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
