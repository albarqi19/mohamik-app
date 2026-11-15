import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AIBadge, Badge, Button, Card, ErrorView, Icon, LoadingView, ProgressBar, Screen, Text } from '@/components/ui';
import { hearingModeLabels, hearingStatusLabels } from '@/features/labels';
import { useCase, useToggleHearingPrep } from '@/features/queries';
import { formatDate, formatHijri, formatWeekdayTime, relativeDays } from '@/lib/format';
import { useTheme } from '@/theme';

export default function HearingPrep() {
  const { id, hearingId } = useLocalSearchParams<{ id: string; hearingId: string }>();
  const { data: c, isLoading, error, refetch } = useCase(id);
  const toggle = useToggleHearingPrep(id, hearingId);
  const { colors, spacing } = useTheme();

  if (isLoading) return <LoadingView />;
  const h = c?.hearings.find((x) => x.id === hearingId);
  if (error || !c || !h) return <ErrorView message={error?.message ?? 'الجلسة غير موجودة'} onRetry={refetch} />;

  const done = h.preparation.filter((p) => p.done).length;
  const total = h.preparation.length;
  const lastMinute = c.minutes[c.minutes.length - 1];
  const upcoming = h.status === 'scheduled';

  return (
    <Screen edges={[]}>
      <Card tone="hero" style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label" style={{ color: colors.heroAccent }}>
            الجلسة {h.number} · {hearingModeLabels[h.mode]}
          </Text>
          <Badge label={hearingStatusLabels[h.status]} tone={upcoming ? 'accent' : 'neutral'} />
        </View>
        <Text variant="title" style={{ color: colors.heroText }}>
          {upcoming ? relativeDays(h.scheduledAt) : formatDate(h.scheduledAt)}
        </Text>
        <Text variant="caption" style={{ color: colors.heroMuted }}>
          {formatWeekdayTime(h.scheduledAt)} · {formatDate(h.scheduledAt)} · {formatHijri(h.scheduledAt)}
        </Text>
        <Text variant="caption" style={{ color: colors.heroMuted }}>
          {c.title}
        </Text>
        {upcoming && h.meetingUrl ? (
          <Button title="فتح رابط الجلسة في ناجز" variant="accent" icon="videocam-outline" onPress={() => Linking.openURL(h.meetingUrl!)} />
        ) : null}
      </Card>

      {h.agenda || h.outcome ? (
        <Card style={{ gap: 4 }}>
          <Text variant="label" color="textMuted">
            {h.outcome ? 'ما جرى في الجلسة' : 'موضوع الجلسة'}
          </Text>
          <Text>{h.outcome ?? h.agenda}</Text>
        </Card>
      ) : null}

      {total ? (
        <Card style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AIBadge size="sm" />
            <Text variant="heading" style={{ flex: 1 }}>
              قائمة التجهيز
            </Text>
            <Text variant="caption" color="textMuted">
              {done} من {total}
            </Text>
          </View>
          <ProgressBar value={total ? done / total : 0} />
          {h.preparation.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => toggle.mutate(p.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: p.done }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
              <Icon name={p.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={p.done ? 'success' : 'textMuted'} />
              <Text style={{ flex: 1, textDecorationLine: p.done ? 'line-through' : 'none' }} color={p.done ? 'textMuted' : 'text'}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {lastMinute && upcoming ? (
        <Card tone="muted" style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">
            من المحضر السابق
          </Text>
          {lastMinute.requestsFromCourt.map((r) => (
            <Text key={r}>• {r}</Text>
          ))}
        </Card>
      ) : null}

      <Card style={{ gap: 10 }}>
        <Text variant="heading">ما تقوله في الجلسة</Text>
        <Text color="textMuted" variant="caption">
          تدرّب مع AI: يلعب دور القاضي ويسألك الأسئلة المتوقعة، ثم يقترح عليك ردوداً مختصرة.
        </Text>
        <Button
          title="تدرّب على الجلسة"
          variant="secondary"
          onPress={() => router.push({ pathname: '/chat', params: { caseId: c.id, title: c.title, mode: 'practice' } })}
        />
      </Card>
    </Screen>
  );
}
