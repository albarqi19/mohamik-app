import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Button, Card, ErrorView, Icon, LoadingView, ProgressBar, Screen, SectionHeader, Text } from '@/components/ui';
import { useCase } from '@/features/queries';
import { filingStatement, filingSteps, NAJIZ_URL } from '@/features/najiz';
import { useTheme } from '@/theme';

export default function NajizGuideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: c, isLoading, error, refetch } = useCase(id);
  const { colors, spacing, radius } = useTheme();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const steps = useMemo(() => (c ? filingSteps(c) : []), [c]);
  const statement = useMemo(() => (c ? filingStatement(c) : ''), [c]);

  if (isLoading) return <LoadingView />;
  if (error || !c) return <ErrorView message={error?.message} onRetry={refetch} />;

  const count = steps.filter((s) => done[s.id]).length;

  const copy = async () => {
    await Clipboard.setStringAsync(statement);
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Screen>
      <Card tone="hero" style={{ gap: spacing.sm }}>
        <Text variant="title" style={{ color: colors.heroText }}>
          ارفع دعواك بنفسك
        </Text>
        <Text style={{ color: colors.heroMuted }}>
          سأرافقك خطوة بخطوة. علّم كل خطوة عند إنجازها، ونصّ الدعوى جاهز للنسخ.
        </Text>
        <ProgressBar value={steps.length ? count / steps.length : 0} onHero />
        <Text variant="caption" style={{ color: colors.heroMuted }}>
          {count} من {steps.length} خطوات
        </Text>
      </Card>

      <View style={{ gap: spacing.sm }}>
        {steps.map((s, i) => {
          const on = !!done[s.id];
          return (
            <Pressable
              key={s.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => setDone((d) => ({ ...d, [s.id]: !on }))}>
              <Card tone={on ? 'muted' : 'default'} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: radius.pill,
                    backgroundColor: on ? colors.success : colors.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {on ? <Icon name="checkmark" size={16} color="textInverse" /> : <Text variant="label">{i + 1}</Text>}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong" style={on ? { textDecorationLine: 'line-through', color: colors.textMuted } : undefined}>
                    {s.title}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {s.detail}
                  </Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Button title="افتح ناجز" variant="accent" icon="open-outline" onPress={() => Linking.openURL(NAJIZ_URL)} full />

      <SectionHeader title="نص الدعوى الجاهز" />
      <Card style={{ gap: spacing.md }}>
        <Text variant="reading" selectable>
          {statement}
        </Text>
        <Button
          title={copied ? 'تم النسخ' : 'انسخ النص'}
          variant="secondary"
          icon={copied ? 'checkmark-circle-outline' : 'copy-outline'}
          onPress={copy}
        />
        {!c.memos.some((m) => m.kind === 'statement_of_claim') ? (
          <Button
            title="صغ لائحة دعوى كاملة بالذكاء الاصطناعي"
            variant="ghost"
            onPress={() => router.push({ pathname: '/case/[id]/memo/new', params: { id: c.id, kind: 'statement_of_claim' } })}
          />
        ) : null}
      </Card>

      <Text variant="caption" color="textMuted" align="center">
        ناجز منصة وزارة العدل، وقد تختلف أسماء الخدمات والحقول فيها عمّا هنا. راجع النص قبل الإرسال، والقرار الأخير لك.
      </Text>
    </Screen>
  );
}
