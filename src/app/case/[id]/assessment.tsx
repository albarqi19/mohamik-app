import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { CitationChip } from '@/components/case/citation-chip';
import { LawyerReferral } from '@/components/case/lawyer-referral';
import { ScoreRing } from '@/components/case/score-ring';
import { AIBadge, Button, Card, EmptyState, ErrorView, Icon, LoadingView, Screen, Text } from '@/components/ui';
import { useCase } from '@/features/queries';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/theme';

export default function Assessment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: c, isLoading, error, refetch } = useCase(id);
  const { spacing, colors } = useTheme();

  if (isLoading) return <LoadingView />;
  if (error || !c) return <ErrorView message={error?.message} onRetry={refetch} />;
  const a = c.assessment;
  if (!a) return <EmptyState icon="analytics-outline" title="لا يوجد تقييم بعد" body="احكِ تفاصيل قضيتك وسأقيّم موقفك." />;

  const total = a.claims.reduce((s, x) => s + x.amount, 0);

  return (
    <Screen
      edges={['bottom']}
      footer={
        <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Button title="انتقل إلى القضية" onPress={() => router.replace({ pathname: '/case/[id]', params: { id: c.id } })} />
        </View>
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AIBadge size="sm" />
        <Text variant="caption" color="textMuted">
          تقييم أولي مبني على أنظمة وسوابق الرائد
        </Text>
      </View>
      <Text variant="display">{a.headline}</Text>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <ScoreRing score={a.score} />
        <View style={{ flex: 1, gap: 8 }}>
          {a.strengths.map((s) => (
            <View key={s} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <Icon name="checkmark-circle-outline" size={16} color="success" />
              <Text variant="caption" style={{ flex: 1 }}>
                {s}
              </Text>
            </View>
          ))}
          {a.needsEvidence.map((s) => (
            <View key={s} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <Icon name="alert-circle-outline" size={16} color="danger" />
              <Text variant="caption" style={{ flex: 1 }}>
                يحتاج دليلاً: {s}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {a.claims.length ? (
        <Card style={{ gap: 0, paddingVertical: spacing.sm }}>
          {a.claims.map((cl) => (
            <View
              key={cl.label}
              style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text>{cl.label}</Text>
              <Text variant="bodyStrong">{formatMoney(cl.amount)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 }}>
            <Text variant="bodyStrong">الإجمالي التقديري</Text>
            <Text variant="heading" color="accentText">
              {formatMoney(total)}
            </Text>
          </View>
          {a.basis ? (
            <Text variant="caption" color="textMuted" style={{ paddingBottom: 6 }}>
              {a.basis}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {a.citations.length ? (
        <View style={{ gap: 8 }}>
          <Text variant="heading">السند</Text>
          {a.citations.map((ct) => (
            <CitationChip key={ct.id} citation={ct} />
          ))}
        </View>
      ) : null}

      {a.beforeYouStart ? (
        <View style={{ backgroundColor: colors.dangerSoft, borderRadius: 16, padding: 14 }}>
          <Text variant="caption">
            <Text variant="label" color="danger">
              قبل أن نبدأ:{' '}
            </Text>
            {a.beforeYouStart}
          </Text>
        </View>
      ) : null}

      <LawyerReferral caseId={c.id} emphasized={a.recommendLawyer} />

      <Text variant="caption" color="textMuted" align="center">
        التقييم استرشادي ويتغير مع المستندات والوقائع، ولا يعد ضماناً لنتيجة الحكم.
      </Text>
    </Screen>
  );
}
