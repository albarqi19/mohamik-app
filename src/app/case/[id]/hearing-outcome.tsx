import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import type { HearingResult } from '@/api';
import { DateQuickPicker } from '@/components/case/date-quick-picker';
import { Button, Card, ErrorView, Icon, LoadingView, Screen, SectionHeader, Text, TextField } from '@/components/ui';
import { useCase, useRecordHearingOutcome } from '@/features/queries';
import { formatDate, formatWeekdayTime } from '@/lib/format';
import { useTheme } from '@/theme';

const RESULTS: { key: HearingResult; title: string; detail: string; icon: 'calendar-outline' | 'hourglass-outline' | 'hammer-outline' | 'close-circle-outline' }[] = [
  { key: 'postponed', title: 'أُجّلت لجلسة أخرى', detail: 'انعقدت الجلسة وحُدد موعد جديد', icon: 'calendar-outline' },
  { key: 'reserved', title: 'حُجزت للحكم', detail: 'انتهت المرافعة وينتظر النطق بالحكم', icon: 'hourglass-outline' },
  { key: 'judgment', title: 'صدر الحكم', detail: 'نطق القاضي بالحكم في الجلسة', icon: 'hammer-outline' },
  { key: 'not_held', title: 'لم تنعقد', detail: 'غياب أو عذر، وحُدد موعد بديل', icon: 'close-circle-outline' },
];

export default function HearingOutcomeScreen() {
  const { id, hearingId } = useLocalSearchParams<{ id: string; hearingId: string }>();
  const { data: c, isLoading, error, refetch } = useCase(id);
  const record = useRecordHearingOutcome(id, hearingId);
  const { colors, spacing, radius } = useTheme();

  const [result, setResult] = useState<HearingResult | null>(null);
  const [nextAt, setNextAt] = useState<string | undefined>();
  const [note, setNote] = useState('');

  if (isLoading) return <LoadingView />;
  const h = c?.hearings.find((x) => x.id === hearingId);
  if (error || !c || !h) return <ErrorView message={error?.message ?? 'الجلسة غير موجودة'} onRetry={refetch} />;

  const needsDate = result === 'postponed' || result === 'not_held';
  const wantsDate = needsDate || result === 'reserved';
  const canSave = !!result && (!needsDate || !!nextAt);

  const save = () => {
    if (!result) return;
    record.mutate(
      { result, nextAt: wantsDate ? nextAt : undefined, note },
      {
        onSuccess: () => {
          if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (result === 'judgment') router.replace({ pathname: '/upload', params: { caseId: c.id, kind: 'judgment' } });
          else router.back();
        },
      },
    );
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text variant="title">كيف كانت الجلسة {h.number}؟</Text>
        <Text color="textMuted">
          {formatWeekdayTime(h.scheduledAt)} · {formatDate(h.scheduledAt)}
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        {RESULTS.map((r) => {
          const on = result === r.key;
          return (
            <Pressable key={r.key} onPress={() => setResult(r.key)} accessibilityRole="radio" accessibilityState={{ selected: on }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  borderWidth: on ? 2 : 1,
                  borderColor: on ? colors.accent : colors.border,
                  backgroundColor: on ? colors.accentSoft : colors.surface,
                }}>
                <Icon name={r.icon} size={22} color={on ? 'accentText' : 'textMuted'} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{r.title}</Text>
                  <Text variant="caption" color="textMuted">
                    {r.detail}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {wantsDate ? (
        <>
          <SectionHeader title={result === 'reserved' ? 'موعد النطق بالحكم (إن عُرف)' : 'موعد الجلسة القادمة'} />
          <Card style={{ gap: spacing.md }}>
            <DateQuickPicker onChange={setNextAt} hint="اختر الأقرب ثم عدّل اليوم بالزرين، كما في المحضر أو رسالة ناجز." />
          </Card>
        </>
      ) : null}

      {result ? (
        <TextField label="ملاحظة (اختياري)" value={note} onChangeText={setNote} placeholder="مثلا: طلب القاضي كشف حساب الراتب" multiline />
      ) : null}

      {record.error ? (
        <Text color="danger" variant="caption">
          {record.error.message}
        </Text>
      ) : null}

      <Button title={result === 'judgment' ? 'احفظ وارفع صك الحكم' : 'احفظ'} onPress={save} disabled={!canSave} loading={record.isPending} />
      <Text variant="caption" color="textMuted" align="center">
        رفع المحضر يغني عن هذا: أقرؤه وأستخرج الموعد والطلبات والمهل.
      </Text>
    </Screen>
  );
}
