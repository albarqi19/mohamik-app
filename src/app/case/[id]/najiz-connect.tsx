import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NajizBrowser, najizBrowserSupported, type NajizBrowserHandle } from '@/components/najiz/najiz-browser';
import { Button, Card, ErrorView, Icon, LoadingView, Screen, SectionHeader, Text, TextField } from '@/components/ui';
import { NAJIZ_URL, filingStatement } from '@/features/najiz';
import { hasUsefulData, parseNajizText, type NajizImport } from '@/features/najiz-import';
import { useApplyNajizImport, useCase } from '@/features/queries';
import { formatDate, formatHijri, formatWeekdayTime } from '@/lib/format';
import { useTheme } from '@/theme';

type Mode = 'import' | 'file';

export default function NajizConnectScreen() {
  const { id, mode: modeParam } = useLocalSearchParams<{ id: string; mode?: Mode }>();
  const mode: Mode = modeParam === 'file' ? 'file' : 'import';
  const { data: c, isLoading, error, refetch } = useCase(id);
  const apply = useApplyNajizImport(id);
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const browser = useRef<NajizBrowserHandle>(null);

  const [result, setResult] = useState<NajizImport | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [pasted, setPasted] = useState('');
  const [skip, setSkip] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const statement = useMemo(() => (c ? filingStatement(c) : ''), [c]);

  if (isLoading) return <LoadingView />;
  if (error || !c) return <ErrorView message={error?.message} onRetry={refetch} />;

  const onText = (text: string) => {
    const r = parseNajizText(text);
    if (hasUsefulData(r)) {
      setResult(r);
      setReadFailed(false);
    } else setReadFailed(true);
  };

  const copyStatement = async () => {
    await Clipboard.setStringAsync(statement);
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const save = () => {
    if (!result) return;
    apply.mutate(
      {
        caseNumber: result.caseNumber,
        court: result.court ? { name: result.court, circuit: result.circuit, city: c.court?.city ?? '' } : undefined,
        hearings: result.hearings.filter((h) => !skip[h.at]).map((h) => ({ scheduledAt: h.at, mode: 'remote' as const })),
      },
      { onSuccess: () => router.back() },
    );
  };

  /* ---------- مراجعة ما قرأناه ---------- */
  if (result) {
    return (
      <Screen>
        <Text variant="title">هذا ما قرأته من ناجز</Text>
        <Text color="textMuted">راجعه قبل الحفظ. قرأته على جهازك فقط، ولم يُرسل شيء من صفحة ناجز.</Text>
        <Card style={{ gap: spacing.sm }}>
          <Row label="رقم القضية" value={result.caseNumber} />
          <Row label="المحكمة" value={result.court} />
          <Row label="الدائرة" value={result.circuit} />
        </Card>

        <SectionHeader title={result.hearings.length ? 'الجلسات القادمة' : 'لم أجد جلسات قادمة في الصفحة'} />
        {result.hearings.map((h) => {
          const on = !skip[h.at];
          return (
            <Pressable
              key={h.at}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => setSkip((s) => ({ ...s, [h.at]: on }))}>
              <Card tone={on ? 'default' : 'muted'} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Icon name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? 'success' : 'textMuted'} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">
                    {formatWeekdayTime(h.at)} · {formatDate(h.at)}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {formatHijri(h.at)} · كما في الصفحة: {h.raw}
                  </Text>
                  {h.approximate ? (
                    <Text variant="caption" color="warning">
                      تاريخ هجري محوّل، وقد يختلف يوما. تأكد منه.
                    </Text>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          );
        })}

        {apply.error ? (
          <Text color="danger" variant="caption">
            {apply.error.message}
          </Text>
        ) : null}
        <Button title="احفظ في قضيتي" icon="checkmark" onPress={save} loading={apply.isPending} />
        <Button title="رجوع لناجز" variant="ghost" onPress={() => setResult(null)} />
      </Screen>
    );
  }

  /* ---------- الويب: لا متصفح داخلي، فنستعمل اللصق ---------- */
  if (!najizBrowserSupported) {
    return (
      <Screen>
        <Text color="textMuted">
          {mode === 'file'
            ? 'افتح ناجز، ثم الصق نص الدعوى في الحقل المطلوب واضغط إرسال بنفسك.'
            : 'افتح صفحة قضيتك في ناجز، وانسخ ما فيها (تحديد الكل ثم نسخ)، ثم الصقه هنا وأقرأه لك.'}
        </Text>
        <Button title="افتح ناجز" variant="accent" icon="open-outline" onPress={() => Linking.openURL(NAJIZ_URL)} />
        {mode === 'file' ? (
          <Button title={copied ? 'تم النسخ' : 'انسخ نص الدعوى'} variant="secondary" icon="copy-outline" onPress={copyStatement} />
        ) : (
          <>
            <TextField label="نص صفحة القضية" value={pasted} onChangeText={setPasted} multiline placeholder="الصق هنا" />
            {readFailed ? (
              <Text variant="caption" color="danger">
                لم أجد رقم قضية أو جلسات في هذا النص. تأكد أنك نسخت صفحة تفاصيل القضية.
              </Text>
            ) : null}
            <Button title="اقرأ النص" disabled={!pasted.trim()} onPress={() => onText(pasted)} />
          </>
        )}
      </Screen>
    );
  }

  /* ---------- ناجز داخل التطبيق ---------- */
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md, gap: 4, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border }}>
        <Text variant="bodyStrong">{mode === 'file' ? 'قدّمها بنفسك في ناجز' : 'افتح صفحة قضيتك ثم اضغط «اقرأ القضية»'}</Text>
        <Text variant="caption" color="textMuted">
          ادخل بنفاذ بنفسك. لا نرى بيانات دخولك ولا نحفظ جلستك، والإرسال في ناجز بيدك دائما.
        </Text>
      </View>
      <NajizBrowser ref={browser} onPageText={onText} onError={() => setReadFailed(true)} />
      <View
        style={{
          padding: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          gap: 8,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderColor: colors.border,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
        }}>
        {readFailed ? (
          <Text variant="caption" color="danger">
            لم أجد رقم قضية أو جلسات في هذه الصفحة. افتح صفحة تفاصيل القضية ثم حاول.
          </Text>
        ) : null}
        {mode === 'file' ? (
          <Button title={copied ? 'تم النسخ، الصقه في ناجز' : 'انسخ نص الدعوى'} icon="copy-outline" onPress={copyStatement} />
        ) : (
          <Button title="اقرأ القضية من هذه الصفحة" icon="download-outline" onPress={() => browser.current?.readPage()} />
        )}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="bodyStrong" color={value ? 'text' : 'textMuted'} style={{ flexShrink: 1 }}>
        {value ?? 'لم أجده'}
      </Text>
    </View>
  );
}
