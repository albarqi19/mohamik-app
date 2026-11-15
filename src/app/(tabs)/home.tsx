import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { CaseCard } from '@/components/case/case-card';
import { DeadlineBanner } from '@/components/case/deadline-banner';
import { AIBadge, Card, Icon, ICON_FORWARD, LoadingView, SectionHeader, Text, Screen, Button } from '@/components/ui';
import { hearingModeLabels } from '@/features/labels';
import { useCases, useDeadlines, useNotifications, useUpcomingHearings } from '@/features/queries';
import { formatHijri, formatWeekdayTime, relativeDays } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { fonts, useTheme } from '@/theme';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'صباح الخير' : 'مساء الخير';
}

export default function Home() {
  const { user } = useAuth();
  const { colors, spacing } = useTheme();
  const cases = useCases();
  const deadlines = useDeadlines();
  const hearings = useUpcomingHearings();
  const notifications = useNotifications();
  const unread = notifications.data?.filter((n) => !n.read).length ?? 0;

  const refreshing = cases.isRefetching || deadlines.isRefetching || hearings.isRefetching;
  const refresh = () => {
    void cases.refetch();
    void deadlines.refetch();
    void hearings.refetch();
    void notifications.refetch();
  };

  const nextHearing = hearings.data?.[0];
  const urgentDeadline = deadlines.data?.[0];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text variant="caption" color="textMuted">
            {formatHijri(new Date().toISOString())}
          </Text>
          <Text variant="title">
            {greeting()}، {user?.name ?? ''}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={10} accessibilityLabel="الإشعارات" style={{ padding: 6 }}>
          <Icon name="notifications-outline" size={26} />
          {unread > 0 ? (
            <View style={{ position: 'absolute', top: 4, end: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger }} />
          ) : null}
        </Pressable>
      </View>

      {/* ما المطلوب منك الآن */}
      <Card tone="hero" style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AIBadge size="sm" />
          <Text variant="label" style={{ color: colors.heroAccent }}>
            المطلوب منك الآن
          </Text>
        </View>
        {nextHearing ? (
          <>
            <Text style={{ fontFamily: fonts.bold, fontSize: 21, lineHeight: 32, color: colors.heroText }}>
              استعد للجلسة {relativeDays(nextHearing.scheduledAt)}
            </Text>
            <Text variant="caption" style={{ color: colors.heroMuted }}>
              {nextHearing.caseTitle} · {formatWeekdayTime(nextHearing.scheduledAt)} · {hearingModeLabels[nextHearing.mode]}
            </Text>
            <Button
              title="ابدأ التجهيز"
              variant="accent"
              icon={ICON_FORWARD}
              onPress={() =>
                router.push({ pathname: '/case/[id]/hearing/[hearingId]', params: { id: nextHearing.caseId, hearingId: nextHearing.id } })
              }
            />
          </>
        ) : (
          <>
            <Text style={{ fontFamily: fonts.bold, fontSize: 21, lineHeight: 32, color: colors.heroText }}>
              عندك قضية أو استفسار؟
            </Text>
            <Text variant="caption" style={{ color: colors.heroMuted }}>
              احكِ لي ما حدث، وسأقيّم موقفك وأرتب معك الخطوات.
            </Text>
            <Button title="احكِ لي قصتك" variant="accent" onPress={() => router.push('/intake')} />
          </>
        )}
      </Card>

      {urgentDeadline ? (
        <Pressable onPress={() => router.push({ pathname: '/case/[id]', params: { id: urgentDeadline.caseId } })}>
          <DeadlineBanner deadline={urgentDeadline} />
        </Pressable>
      ) : null}

      {/* اسأل بسرعة */}
      <Card onPress={() => router.push('/ask')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AIBadge />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">اسأل محاميك</Text>
          <Text variant="caption" color="textMuted">
            إجابات مستندة إلى الأنظمة السعودية والسوابق القضائية
          </Text>
        </View>
        <Icon name={ICON_FORWARD} size={18} color="textMuted" />
      </Card>

      <SectionHeader title="الجلسات القادمة" action="الكل" onAction={() => router.push('/agenda')} />
      {hearings.isLoading ? (
        <LoadingView />
      ) : hearings.data?.length ? (
        hearings.data.slice(0, 2).map((h) => (
          <Card
            key={h.id}
            onPress={() => router.push({ pathname: '/case/[id]/hearing/[hearingId]', params: { id: h.caseId, hearingId: h.id } })}
            style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 52, alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 12, paddingVertical: 6 }}>
              <Text variant="label" color="textMuted" align="center">
                {relativeDays(h.scheduledAt)}
              </Text>
              <Icon name={h.mode === 'remote' ? 'videocam-outline' : 'business-outline'} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{h.caseTitle}</Text>
              <Text variant="caption" color="textMuted">
                الجلسة {h.number} · {formatWeekdayTime(h.scheduledAt)}
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <Text color="textMuted">لا توجد جلسات قادمة</Text>
      )}

      <SectionHeader title="قضاياي" action="عرض الكل" onAction={() => router.push('/cases')} />
      {cases.isLoading ? <LoadingView /> : cases.data?.slice(0, 2).map((c) => <CaseCard key={c.id} item={c} />)}
    </Screen>
  );
}
