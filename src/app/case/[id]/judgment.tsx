import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { CitationChip } from '@/components/case/citation-chip';
import { DeadlineBanner } from '@/components/case/deadline-banner';
import { AIBadge, Badge, Button, Card, EmptyState, ErrorView, LoadingView, Screen, Text } from '@/components/ui';
import { appealKindLabels, appealStatusLabels, outcomeLabels } from '@/features/labels';
import { useCase } from '@/features/queries';
import { formatDate, formatHijri } from '@/lib/format';
import { useTheme } from '@/theme';

export default function JudgmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: c, isLoading, error, refetch } = useCase(id);
  const { spacing } = useTheme();

  if (isLoading) return <LoadingView />;
  if (error || !c) return <ErrorView message={error?.message} onRetry={refetch} />;
  const j = c.judgment;
  if (!j) return <EmptyState icon="hammer-outline" title="لم يصدر حكم بعد" body="عند صدور الحكم ارفع صورة الصك وسأحلله لك." />;

  const appealMemo = c.appeal?.memoId ? c.memos.find((m) => m.id === c.appeal?.memoId) : undefined;

  return (
    <Screen edges={[]}>
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label" color="textMuted">
            منطوق الحكم
          </Text>
          <Badge label={outcomeLabels[j.outcome]} tone={j.outcome === 'in_favor' ? 'success' : j.outcome === 'against' ? 'danger' : 'warning'} />
        </View>
        <Text variant="reading" style={{ fontSize: 18, lineHeight: 31 }}>
          {j.summary}
        </Text>
        <Text variant="caption" color="textMuted">
          صدر {formatDate(j.issuedAt)} ({formatHijri(j.issuedAt)}) · استلمت الصك {formatDate(j.receivedAt)}
        </Text>
      </Card>

      {!j.isFinal ? <DeadlineBanner deadline={{ title: 'آخر موعد للاعتراض', dueAt: j.appealDeadline, confirmed: true }} /> : null}

      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AIBadge size="sm" />
          <Text variant="heading">قراءة في الأسباب</Text>
        </View>
        <Text>{j.reasoning}</Text>
      </Card>

      {c.appeal ? (
        <Card style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="heading">الاعتراض ({appealKindLabels[c.appeal.kind]})</Text>
            <Badge label={appealStatusLabels[c.appeal.status]} tone="info" />
          </View>
          <Text variant="label" color="textMuted">
            أوجه الاعتراض المقترحة
          </Text>
          {c.appeal.grounds.map((g, i) => (
            <Text key={g}>
              {i + 1}. {g}
            </Text>
          ))}
          {appealMemo ? (
            <>
              <View style={{ gap: 6 }}>
                {appealMemo.citations.map((ct) => (
                  <CitationChip key={ct.id} citation={ct} />
                ))}
              </View>
              <Button
                title="افتح اللائحة الاعتراضية"
                onPress={() => router.push({ pathname: '/case/[id]/memo/[memoId]', params: { id: c.id, memoId: appealMemo.id } })}
              />
            </>
          ) : null}
        </Card>
      ) : (
        <Card tone="accent" style={{ gap: 8 }}>
          <Text variant="bodyStrong">هل تعترض على الحكم؟</Text>
          <Text variant="caption">سأقارن الحكم بالأنظمة والسوابق، وأوضح لك فرص الاعتراض قبل أن تقرر.</Text>
          <Button title="قيّم فرص الاعتراض" onPress={() => router.push({ pathname: '/chat', params: { caseId: c.id, title: c.title } })} />
        </Card>
      )}
    </Screen>
  );
}
