import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import type { DeadlineKind, HearingMode } from '@/api';
import { DateQuickPicker } from '@/components/case/date-quick-picker';
import { Button, Card, Chip, Screen, SectionHeader, Text, TextField } from '@/components/ui';
import { deadlineKindLabels, hearingModeLabels } from '@/features/labels';
import { useAddDate } from '@/features/queries';
import { useTheme } from '@/theme';

type Type = 'hearing' | 'deadline';
const KINDS: DeadlineKind[] = ['memo_submission', 'document', 'appeal', 'other'];

export default function AddDateScreen() {
  const { id, type: initial } = useLocalSearchParams<{ id: string; type?: Type }>();
  const add = useAddDate(id);
  const { spacing } = useTheme();

  const [type, setType] = useState<Type>(initial === 'deadline' ? 'deadline' : 'hearing');
  const [at, setAt] = useState<string | undefined>();
  const [mode, setMode] = useState<HearingMode>('remote');
  const [link, setLink] = useState('');
  const [kind, setKind] = useState<DeadlineKind>('memo_submission');
  const [title, setTitle] = useState('');

  const switchType = (t: Type) => {
    setType(t);
    setAt(undefined);
  };
  const effectiveTitle = title.trim() || (kind === 'other' ? '' : deadlineKindLabels[kind]);
  const canSave = !!at && (type === 'hearing' || !!effectiveTitle);

  const save = () => {
    if (!at) return;
    add.mutate(
      type === 'hearing'
        ? {
            type: 'hearing',
            data: { scheduledAt: at, mode, meetingUrl: mode === 'remote' ? link : undefined, location: mode === 'in_person' ? link : undefined },
          }
        : { type: 'deadline', data: { title: effectiveTitle, dueAt: at, kind } },
      {
        onSuccess: () => {
          if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    );
  };

  return (
    <Screen>
      <Text color="textMuted">وصلتك رسالة من ناجز أو المحكمة بموعد؟ أضفه هنا وسأذكرك به.</Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="جلسة" selected={type === 'hearing'} onPress={() => switchType('hearing')} />
        <Chip label="مهلة" selected={type === 'deadline'} onPress={() => switchType('deadline')} />
      </View>

      {type === 'deadline' ? (
        <>
          <SectionHeader title="نوع المهلة" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {KINDS.map((k) => (
              <Chip key={k} label={deadlineKindLabels[k]} selected={kind === k} onPress={() => setKind(k)} />
            ))}
          </View>
          <TextField
            label={kind === 'other' ? 'عنوان المهلة' : 'عنوان المهلة (اختياري)'}
            value={title}
            onChangeText={setTitle}
            placeholder={kind === 'other' ? 'مثلا: سداد رسوم' : deadlineKindLabels[kind]}
          />
        </>
      ) : (
        <>
          <SectionHeader title="نوع الجلسة" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['remote', 'in_person'] as HearingMode[]).map((m) => (
              <Chip key={m} label={hearingModeLabels[m]} selected={mode === m} onPress={() => setMode(m)} />
            ))}
          </View>
          <TextField
            label={mode === 'remote' ? 'رابط الجلسة (اختياري)' : 'المكان (اختياري)'}
            value={link}
            onChangeText={setLink}
            placeholder={mode === 'remote' ? 'https://' : 'مثلا: المحكمة العمالية، الدور الثاني'}
            autoCapitalize="none"
            keyboardType={mode === 'remote' ? 'url' : 'default'}
          />
        </>
      )}

      <SectionHeader title={type === 'hearing' ? 'موعد الجلسة' : 'آخر يوم في المهلة'} />
      <Card style={{ gap: spacing.md }}>
        <DateQuickPicker key={type} onChange={setAt} withTime={type === 'hearing'} />
      </Card>

      {add.error ? (
        <Text color="danger" variant="caption">
          {add.error.message}
        </Text>
      ) : null}

      <Button title="أضف" icon="add" onPress={save} disabled={!canSave} loading={add.isPending} />
    </Screen>
  );
}
