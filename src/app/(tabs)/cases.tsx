import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CaseSummary } from '@/api/types';
import { CaseCard } from '@/components/case/case-card';
import { Button, EmptyState, ErrorView, LoadingView, Text } from '@/components/ui';
import { useCases } from '@/features/queries';
import { useTheme } from '@/theme';

type Filter = 'active' | 'closed' | 'all';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'active', label: 'الجارية' },
  { key: 'closed', label: 'المنتهية' },
  { key: 'all', label: 'الكل' },
];

const isActive = (c: CaseSummary) => c.stage !== 'closed' && c.stage !== 'final';

export default function Cases() {
  const { colors, spacing, radius } = useTheme();
  const [filter, setFilter] = useState<Filter>('active');
  const { data, isLoading, error, refetch, isRefetching } = useCases();

  const items = (data ?? []).filter((c) => (filter === 'all' ? true : filter === 'active' ? isActive(c) : !isActive(c)));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title">قضاياي</Text>
          <Button title="قضية جديدة" icon="add" size="sm" onPress={() => router.push('/case/new')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}>
                <Text variant="label" style={{ color: active ? colors.primaryText : colors.text }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error.message} onRetry={refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md, paddingBottom: 96 }}
          renderItem={({ item }) => <CaseCard item={item} />}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title="لا توجد قضايا هنا"
              body="ابدأ بإضافة قضيتك، وسأرشدك خطوة بخطوة."
              action={{ label: 'قضية جديدة', onPress: () => router.push('/case/new') }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
