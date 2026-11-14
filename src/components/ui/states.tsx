import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export function LoadingView() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="حدث خطأ"
      body={message ?? 'تعذر تحميل البيانات'}
      action={onRetry ? { label: 'إعادة المحاولة', onPress: onRetry } : undefined}
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 }}>
      <View style={{ backgroundColor: colors.surfaceMuted, padding: 16, borderRadius: 999, marginBottom: 8 }}>
        <Icon name={icon} size={32} color="textMuted" />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      {body ? (
        <Text color="textMuted" align="center">
          {body}
        </Text>
      ) : null}
      {action ? <Button title={action.label} onPress={action.onPress} variant="secondary" style={{ marginTop: 8 }} /> : null}
    </View>
  );
}
