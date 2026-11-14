import { router } from 'expo-router';
import { View } from 'react-native';

import { Card, Icon, LoadingView, Screen, SectionHeader, Text } from '@/components/ui';
import { hearingModeLabels } from '@/features/labels';
import { useDeadlines, useUpcomingHearings } from '@/features/queries';
import { daysUntil, formatDate, formatHijri, formatWeekdayTime, relativeDays } from '@/lib/format';
import { useTheme } from '@/theme';

export default function Agenda() {
  const hearings = useUpcomingHearings();
  const deadlines = useDeadlines();
  const { spacing } = useTheme();
  if (hearings.isLoading || deadlines.isLoading) return <LoadingView />;

  return (
    <Screen edges={[]}>
      <SectionHeader title="المهل" />
      {deadlines.data?.length ? (
        deadlines.data.map((d) => {
          const urgent = daysUntil(d.dueAt) <= 3;
          return (
            <Card key={d.id} onPress={() => router.push({ pathname: '/case/[id]', params: { id: d.caseId } })} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Icon name="alarm-outline" size={22} color={urgent ? 'danger' : 'warning'} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{d.title}</Text>
                <Text variant="caption" color="textMuted">
                  {formatDate(d.dueAt)} · {formatHijri(d.dueAt)}
                </Text>
              </View>
              <Text variant="label" color={urgent ? 'danger' : 'textMuted'}>
                {relativeDays(d.dueAt)}
              </Text>
            </Card>
          );
        })
      ) : (
        <Text color="textMuted">لا توجد مهل قادمة</Text>
      )}

      <View style={{ height: spacing.sm }} />
      <SectionHeader title="الجلسات" />
      {hearings.data?.length ? (
        hearings.data.map((h) => (
          <Card
            key={h.id}
            onPress={() => router.push({ pathname: '/case/[id]/hearing/[hearingId]', params: { id: h.caseId, hearingId: h.id } })}
            style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Icon name={h.mode === 'remote' ? 'videocam-outline' : 'business-outline'} size={22} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{h.caseTitle}</Text>
              <Text variant="caption" color="textMuted">
                الجلسة {h.number} · {formatWeekdayTime(h.scheduledAt)} · {hearingModeLabels[h.mode]}
              </Text>
            </View>
            <Text variant="label" color="textMuted">
              {relativeDays(h.scheduledAt)}
            </Text>
          </Card>
        ))
      ) : (
        <Text color="textMuted">لا توجد جلسات قادمة</Text>
      )}
    </Screen>
  );
}
