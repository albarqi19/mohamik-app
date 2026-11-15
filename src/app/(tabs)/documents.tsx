import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';

import { api } from '@/api';
import { AIBadge, Badge, Card, EmptyState, Icon, ICON_FORWARD, LoadingView, Screen, SectionHeader, Text } from '@/components/ui';
import { documentKindLabels, memoKindLabels, memoStatusLabels } from '@/features/labels';
import { qk, useCases } from '@/features/queries';
import { formatDate } from '@/lib/format';
import { useTheme } from '@/theme';

export default function Documents() {
  const { spacing, colors } = useTheme();
  const cases = useCases();
  const details = useQueries({
    queries: (cases.data ?? []).map((c) => ({ queryKey: qk.case(c.id), queryFn: () => api.cases.get(c.id) })),
  });
  const loading = cases.isLoading || details.some((d) => d.isLoading);
  const memos = details
    .flatMap((d) => (d.data ? d.data.memos.map((m) => ({ ...m, caseTitle: d.data!.title })) : []))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const files = details
    .flatMap((d) => (d.data?.documents ?? []).map((f) => ({ ...f, caseTitle: d.data!.title })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen>
      <Text variant="title">المستندات</Text>

      <Card tone="muted" onPress={() => router.push('/upload')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="camera-outline" size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">صوّر محضراً أو حكماً</Text>
          <Text variant="caption" color="textMuted">
            سأقرؤه وأستخرج المواعيد والمطلوب منك
          </Text>
        </View>
      </Card>

      {files.length ? (
        <>
          <SectionHeader title="المستندات المرفوعة" />
          <View style={{ gap: spacing.sm }}>
            {files.map((f) => (
              <Card
                key={f.id}
                onPress={() => router.push({ pathname: '/case/[id]', params: { id: f.caseId } })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Icon name={f.mimeType.includes('pdf') ? 'document-outline' : 'image-outline'} size={24} color="accentText" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {documentKindLabels[f.kind]} · {f.caseTitle} · {formatDate(f.createdAt)}
                  </Text>
                </View>
                {f.extraction ? <AIBadge size="sm" /> : null}
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="المذكرات واللوائح" />
      {loading ? (
        <LoadingView />
      ) : memos.length ? (
        <View style={{ gap: spacing.sm }}>
          {memos.map((m) => (
            <Card
              key={m.id}
              onPress={() => router.push({ pathname: '/case/[id]/memo/[memoId]', params: { id: m.caseId, memoId: m.id } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="document-text-outline" size={24} color="accentText" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="bodyStrong">{m.title}</Text>
                <Text variant="caption" color="textMuted">
                  {m.caseTitle} · {formatDate(m.updatedAt)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Badge label={memoKindLabels[m.kind]} />
                  <Badge label={memoStatusLabels[m.status]} tone={m.status === 'submitted' ? 'success' : 'warning'} />
                </View>
              </View>
              <Icon name={ICON_FORWARD} size={18} color="textMuted" />
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState icon="folder-open-outline" title="لا توجد مستندات" body="ستظهر هنا المذكرات والمحاضر والأحكام لكل قضاياك." />
      )}
    </Screen>
  );
}
