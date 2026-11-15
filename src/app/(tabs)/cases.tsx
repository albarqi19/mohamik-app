import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, I18nManager, Platform, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CaseSummary } from '@/api/types';
import { CaseCard } from '@/components/case/case-card';
import { Button, EmptyState, ErrorView, Icon, LoadingView, Text } from '@/components/ui';
import { searchCases, sortByUrgency } from '@/features/case-search';
import { useCases } from '@/features/queries';
import { fonts, useTheme } from '@/theme';

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

  const [query, setQuery] = useState('');
  const items = useMemo(() => {
    const byFilter = (data ?? []).filter((c) => (filter === 'all' ? true : filter === 'active' ? isActive(c) : !isActive(c)));
    return sortByUrgency(searchCases(byFilter, query));
  }, [data, filter, query]);
  const searching = query.trim().length > 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text variant="title">قضاياي</Text>
          <Button title="قضية جديدة" icon="add" size="sm" onPress={() => router.push('/intake')} />
        </View>
        {(data?.length ?? 0) > 2 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 14,
              minHeight: 46,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}>
            <Icon name="search" size={18} color="textMuted" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث بالعنوان أو الخصم أو رقم القضية"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              accessibilityLabel="بحث في القضايا"
              style={{
                flex: 1,
                fontFamily: fonts.regular,
                fontSize: 15,
                color: colors.text,
                textAlign: I18nManager.isRTL ? 'left' : 'right',
                writingDirection: 'rtl',
                paddingVertical: 10,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
              }}
            />
            {searching ? (
              <Pressable onPress={() => setQuery('')} accessibilityLabel="مسح البحث" hitSlop={8}>
                <Icon name="close-circle" size={18} color="textMuted" />
              </Pressable>
            ) : null}
          </View>
        ) : null}
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
          contentContainerStyle={{
            padding: spacing.lg,
            paddingTop: 0,
            gap: spacing.md,
            paddingBottom: 96,
          }}
          renderItem={({ item }) => <CaseCard item={item} />}
          refreshing={isRefetching}
          onRefresh={refetch}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searching ? (
              <EmptyState
                icon="search"
                title="لا نتائج"
                body={`لم أجد قضية تطابق «${query.trim()}».`}
                action={{ label: 'مسح البحث', onPress: () => setQuery('') }}
              />
            ) : (
              <EmptyState
                icon="briefcase-outline"
                title="لا توجد قضايا هنا"
                body="ابدأ بإضافة قضيتك، وسأرشدك خطوة بخطوة."
                action={{
                  label: 'احكِ لي قصتك',
                  onPress: () => router.push('/intake'),
                }}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
