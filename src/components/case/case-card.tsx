import { router } from 'expo-router';
import { View } from 'react-native';

import type { CaseSummary } from '@/api/types';
import { Badge, Card, Icon, Text } from '@/components/ui';
import { caseTypeLabels, roleLabels, stageLabels } from '@/features/labels';
import { daysUntil, formatWeekdayTime, isPast, relativeDays } from '@/lib/format';
import { StageTracker } from './stage-tracker';

export function CaseCard({ item }: { item: CaseSummary }) {
  const deadlineDays = item.nextDeadline ? daysUntil(item.nextDeadline.dueAt) : undefined;
  return (
    <Card onPress={() => router.push({ pathname: '/case/[id]', params: { id: item.id } })} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Badge label={caseTypeLabels[item.type]} />
        <Badge label={stageLabels[item.stage]} tone="accent" />
        <Badge label={roleLabels[item.userRole]} tone="info" />
      </View>
      <View style={{ gap: 2 }}>
        <Text variant="heading">{item.title}</Text>
        <Text variant="caption" color="textMuted">
          ضد {item.opponentName}
          {item.court ? ` · ${item.court.name}` : ''}
        </Text>
      </View>
      <StageTracker stage={item.stage} compact />
      {item.nextHearingAt || item.nextDeadline ? (
        <View style={{ gap: 6 }}>
          {item.nextHearingAt ? (
            isPast(item.nextHearingAt) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="chatbubble-ellipses-outline" size={16} color="accentText" />
                <Text variant="caption" color="accentText">
                  جلسة {relativeDays(item.nextHearingAt)}: أخبرني بما جرى
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="calendar-outline" size={16} color="textMuted" />
                <Text variant="caption" color="textMuted">
                  الجلسة القادمة: {formatWeekdayTime(item.nextHearingAt)} ({relativeDays(item.nextHearingAt)})
                </Text>
              </View>
            )
          ) : null}
          {item.nextDeadline ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="alarm-outline" size={16} color={deadlineDays !== undefined && deadlineDays <= 3 ? 'danger' : 'textMuted'} />
              <Text variant="caption" color={deadlineDays !== undefined && deadlineDays <= 3 ? 'danger' : 'textMuted'}>
                {item.nextDeadline.title}: {relativeDays(item.nextDeadline.dueAt)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
