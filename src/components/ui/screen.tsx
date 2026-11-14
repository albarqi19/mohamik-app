import type { PropsWithChildren, ReactElement } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactElement;
}>;

/** حاوية الشاشة: خلفية، مناطق آمنة، تمرير وسحب للتحديث. */
export function Screen({ children, scroll = true, edges = ['top'], contentStyle, refreshing, onRefresh, footer }: Props) {
  const { colors, spacing } = useTheme();
  const padding: ViewStyle = { padding: spacing.lg, gap: spacing.lg };
  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[padding, { paddingBottom: spacing.xxl * 2 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, contentStyle]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
