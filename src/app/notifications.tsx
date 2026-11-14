import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';

import { api } from '@/api';
import { Card, EmptyState, LoadingView, Text } from '@/components/ui';
import { qk, useNotifications } from '@/features/queries';
import { relativeDays } from '@/lib/format';
import { useTheme } from '@/theme';

export default function Notifications() {
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const qc = useQueryClient();
  const { colors, spacing } = useTheme();

  if (isLoading) return <LoadingView />;
  return (
    <FlatList
      data={data}
      keyExtractor={(n) => n.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
      ListEmptyComponent={<EmptyState icon="notifications-off-outline" title="لا توجد إشعارات" />}
      renderItem={({ item }) => (
        <Card
          onPress={async () => {
            if (!item.read) {
              await api.notifications.markRead(item.id);
              void qc.invalidateQueries({ queryKey: qk.notifications });
            }
            if (item.caseId) router.push({ pathname: '/case/[id]', params: { id: item.caseId } });
          }}
          style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 9, backgroundColor: item.read ? 'transparent' : colors.accent }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{item.title}</Text>
            <Text variant="caption">{item.body}</Text>
            <Text variant="label" color="textMuted">
              {relativeDays(item.createdAt)}
            </Text>
          </View>
        </Card>
      )}
    />
  );
}
