import { router, useLocalSearchParams } from 'expo-router';
import { Share, View } from 'react-native';

import { CitationChip } from '@/components/case/citation-chip';
import { AIBadge, Badge, Button, Card, ErrorView, LoadingView, Screen, Text } from '@/components/ui';
import { memoKindLabels, memoStatusLabels } from '@/features/labels';
import { useMemo_ } from '@/features/queries';
import { formatDate } from '@/lib/format';
import { useTheme } from '@/theme';

export default function MemoScreen() {
  const { id, memoId } = useLocalSearchParams<{ id: string; memoId: string }>();
  const { data: m, isLoading, error, refetch } = useMemo_(id, memoId);
  const { spacing } = useTheme();

  if (isLoading) return <LoadingView />;
  if (error || !m) return <ErrorView message={error?.message} onRetry={refetch} />;

  return (
    <Screen
      edges={['bottom']}
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.lg }}>
          <Button
            title="عدّل مع AI"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/chat', params: { caseId: id, title: m.title } })}
          />
          <Button title="مشاركة" icon="share-outline" style={{ flex: 1 }} onPress={() => Share.share({ title: m.title, message: m.body })} />
        </View>
      }>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Badge label={memoKindLabels[m.kind]} />
          <Badge label={memoStatusLabels[m.status]} tone={m.status === 'submitted' ? 'success' : 'warning'} />
          {m.generatedByAI ? <AIBadge size="sm" /> : null}
        </View>
        <Text variant="title">{m.title}</Text>
        <Text variant="caption" color="textMuted">
          آخر تعديل {formatDate(m.updatedAt)}
        </Text>
      </View>

      <Card style={{ gap: spacing.md }}>
        <Text variant="reading">{m.body}</Text>
      </Card>

      {m.citations.length ? (
        <View style={{ gap: 8 }}>
          <Text variant="heading">السند</Text>
          {m.citations.map((c) => (
            <CitationChip key={c.id} citation={c} />
          ))}
        </View>
      ) : null}

      {m.status !== 'submitted' ? (
        <Card tone="accent" style={{ gap: 4 }}>
          <Text variant="bodyStrong">قبل التقديم</Text>
          <Text variant="caption">
            راجع الوقائع والأرقام بنفسك. المذكرة مسودة يقترحها AI، وأنت صاحب القرار في تقديمها عبر ناجز.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}
