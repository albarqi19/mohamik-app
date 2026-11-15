import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import type { DocumentKind, UploadInput } from '@/api/types';
import { DeadlineBanner } from '@/components/case/deadline-banner';
import { AIBadge, Button, Card, Icon, LoadingView, Screen, Text, type IconName } from '@/components/ui';
import { useCases, useConfirmDeadline, useUploadAndExtract } from '@/features/queries';
import { useTheme } from '@/theme';

const KINDS: { kind: DocumentKind; label: string; hint: string; icon: IconName }[] = [
  { kind: 'minute', label: 'محضر جلسة', hint: 'أستخرج ما جرى والمطلوب منك ومواعيده', icon: 'reader-outline' },
  { kind: 'judgment', label: 'صك حكم', hint: 'أشرح الحكم وأحسب مهلة الاعتراض', icon: 'hammer-outline' },
  { kind: 'contract', label: 'عقد', hint: 'يدعم التقييم والمذكرات', icon: 'document-text-outline' },
  { kind: 'evidence', label: 'إثبات', hint: 'رسائل، فواتير، كشوف حساب', icon: 'images-outline' },
];

type Picked = Omit<UploadInput, 'caseId' | 'kind'>;

/** رفع مستند وقراءته: كاميرا، صور، أو ملف PDF. */
export default function Upload() {
  const params = useLocalSearchParams<{ caseId?: string; kind?: DocumentKind }>();
  const { colors, spacing, radius } = useTheme();
  const cases = useCases();
  const [caseId, setCaseId] = useState(params.caseId);
  const [kind, setKind] = useState<DocumentKind | undefined>(params.kind);
  const [pickError, setPickError] = useState<string>();
  const run = useUploadAndExtract();
  const confirm = useConfirmDeadline(caseId ?? '');
  const [confirmed, setConfirmed] = useState<string[]>([]);

  const send = (p: Picked) => {
    if (!caseId || !kind) return;
    run.mutate({ caseId, kind, ...p });
  };

  const fromCamera = async () => {
    setPickError(undefined);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted && Platform.OS !== 'web') {
      setPickError('نحتاج إذن الكاميرا لتصوير المستند. يمكنك تفعيله من إعدادات الجهاز.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (r.canceled) return;
    const a = r.assets[0];
    send({ uri: a.uri, name: a.fileName ?? 'صورة مستند.jpg', mimeType: a.mimeType ?? 'image/jpeg', size: a.fileSize, file: a.file });
  };

  const fromPhotos = async () => {
    setPickError(undefined);
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (r.canceled) return;
    const a = r.assets[0];
    send({ uri: a.uri, name: a.fileName ?? 'صورة مستند.jpg', mimeType: a.mimeType ?? 'image/jpeg', size: a.fileSize, file: a.file });
  };

  const fromFiles = async () => {
    setPickError(undefined);
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    send({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf', size: a.size, file: a.file });
  };

  // 1) اختيار القضية إن لم تُحدد
  if (!caseId) {
    if (cases.isLoading) return <LoadingView />;
    return (
      <Screen edges={['bottom']}>
        <Text variant="title">لأي قضية هذا المستند؟</Text>
        {cases.data?.map((c) => (
          <Card key={c.id} onPress={() => setCaseId(c.id)}>
            <Text variant="bodyStrong">{c.title}</Text>
            <Text variant="caption" color="textMuted">
              ضد {c.opponentName}
            </Text>
          </Card>
        ))}
      </Screen>
    );
  }

  // 3) النتيجة
  if (run.isSuccess && run.data.extraction) {
    const x = run.data.extraction;
    return (
      <Screen
        edges={['bottom']}
        footer={
          <View style={{ padding: spacing.lg }}>
            <Button title="تم" onPress={() => router.back()} />
          </View>
        }>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AIBadge size="sm" />
          <Text variant="caption" color="textMuted">
            قرأت {run.data.name}
          </Text>
        </View>
        <Card style={{ gap: 8 }}>
          <Text variant="reading">{x.summary}</Text>
          {x.keyPoints.map((k) => (
            <Text key={k} variant="caption">
              • {k}
            </Text>
          ))}
        </Card>
        {x.requests.length ? (
          <Card tone="muted" style={{ gap: 4 }}>
            <Text variant="label" color="danger">
              مطلوب منك
            </Text>
            {x.requests.map((r) => (
              <Text key={r}>• {r}</Text>
            ))}
          </Card>
        ) : null}
        {x.deadlines.map((d) => {
          const isConfirmed = d.confirmed || confirmed.includes(d.id);
          return (
            <View key={d.id} style={{ gap: 8 }}>
              <DeadlineBanner deadline={{ ...d, confirmed: isConfirmed }} />
              {!isConfirmed ? (
                <Button
                  title="تأكدت من التاريخ، فعّل التذكير"
                  variant="secondary"
                  icon="checkmark"
                  loading={confirm.isPending}
                  onPress={() => confirm.mutate(d.id, { onSuccess: () => setConfirmed((c) => [...c, d.id]) })}
                />
              ) : (
                <Text variant="caption" color="success">
                  أُكّدت المهلة وسأذكّرك بها.
                </Text>
              )}
            </View>
          );
        })}
        <Text variant="caption" color="textMuted">
          القراءة الآلية قد تخطئ، فراجع التواريخ والمبالغ مع المستند الأصلي.
        </Text>
      </Screen>
    );
  }

  // 2) نوع المستند ومصدره
  return (
    <Screen edges={['bottom']}>
      <Text variant="title">ما نوع المستند؟</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {KINDS.map((k) => {
          const active = k.kind === kind;
          return (
            <Pressable
              key={k.kind}
              onPress={() => setKind(k.kind)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={{
                width: '48%',
                flexGrow: 1,
                padding: spacing.md,
                gap: 4,
                borderRadius: radius.lg,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.accent : colors.border,
                backgroundColor: active ? colors.accentSoft : colors.surface,
              }}>
              <Icon name={k.icon} size={22} color={active ? 'accentText' : 'text'} />
              <Text variant="bodyStrong">{k.label}</Text>
              <Text variant="caption" color="textMuted">
                {k.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {run.isPending ? (
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: spacing.xl }}>
          <AIBadge />
          <Text align="center">أرفع المستند وأقرؤه...</Text>
          <Text variant="caption" color="textMuted" align="center">
            أستخرج الملخص والمطلوب منك والمواعيد
          </Text>
        </Card>
      ) : (
        <View style={{ gap: spacing.sm, opacity: kind ? 1 : 0.5 }}>
          <Button title="صوّر المستند" icon="camera-outline" disabled={!kind} onPress={fromCamera} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button title="من الصور" icon="image-outline" variant="secondary" disabled={!kind} onPress={fromPhotos} style={{ flex: 1 }} />
            <Button title="ملف PDF" icon="document-outline" variant="secondary" disabled={!kind} onPress={fromFiles} style={{ flex: 1 }} />
          </View>
        </View>
      )}
      {pickError || run.error ? (
        <Text color="danger">{pickError ?? run.error?.message}</Text>
      ) : null}
      <Text variant="caption" color="textMuted">
        مستنداتك محفوظة في حسابك فقط، ولا يراها أحد دون إذنك.
      </Text>
    </Screen>
  );
}
