import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CaseType, NewCaseInput, PartyRole } from '@/api/types';
import { AIBadge, Button, Card, Icon, ProgressBar, Text, TextField, type IconName } from '@/components/ui';
import { caseTypeLabels, roleLabels } from '@/features/labels';
import { useCreateCase } from '@/features/queries';
import { useTheme } from '@/theme';

const TYPES: { type: CaseType; icon: IconName; hint: string }[] = [
  { type: 'labor', icon: 'construct-outline', hint: 'رواتب، فصل، مكافأة نهاية خدمة' },
  { type: 'commercial', icon: 'storefront-outline', hint: 'عقود، توريد، شراكات' },
  { type: 'personal_status', icon: 'people-outline', hint: 'نفقة، حضانة، زيارة' },
  { type: 'general', icon: 'scale-outline', hint: 'مطالبات مالية، عقار، إيجار' },
  { type: 'execution', icon: 'hammer-outline', hint: 'تنفيذ حكم أو سند تنفيذي' },
  { type: 'administrative', icon: 'business-outline', hint: 'دعاوى ضد جهة حكومية' },
];

const STEPS = ['نوع القضية', 'صفتك', 'الطرف الآخر', 'ما حدث', 'المراجعة'] as const;

export default function NewCase() {
  const { colors, spacing, radius } = useTheme();
  const create = useCreateCase();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<NewCaseInput>>({});
  const set = (patch: Partial<NewCaseInput>) => setForm((f) => ({ ...f, ...patch }));

  const canNext = [
    !!form.type,
    !!form.userRole,
    !!form.opponentName?.trim() && !!form.title?.trim(),
    (form.description?.trim().length ?? 0) >= 20,
    true,
  ][step];

  const submit = async () => {
    const c = await create.mutateAsync(form as NewCaseInput);
    router.dismiss();
    router.push({ pathname: '/case/[id]/assessment', params: { id: c.id } });
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ padding: spacing.lg, gap: 8 }}>
          <Text variant="caption" color="textMuted">
            الخطوة {step + 1} من {STEPS.length} · {STEPS[step]}
          </Text>
          <ProgressBar value={(step + 1) / STEPS.length} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          {step === 0 ? (
            <>
              <Text variant="title">ما نوع قضيتك؟</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {TYPES.map((t) => {
                  const active = form.type === t.type;
                  return (
                    <Pressable
                      key={t.type}
                      onPress={() => set({ type: t.type })}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={{
                        width: '48%',
                        flexGrow: 1,
                        padding: spacing.md,
                        gap: 6,
                        borderRadius: radius.lg,
                        borderWidth: active ? 2 : 1,
                        borderColor: active ? colors.accent : colors.border,
                        backgroundColor: active ? colors.accentSoft : colors.surface,
                      }}>
                      <Icon name={t.icon} size={24} color={active ? 'accentText' : 'text'} />
                      <Text variant="bodyStrong">{caseTypeLabels[t.type]}</Text>
                      <Text variant="caption" color="textMuted">
                        {t.hint}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text variant="caption" color="textMuted">
                لست متأكداً؟ اختر الأقرب، وسأصححه لاحقاً عند قراءة التفاصيل.
              </Text>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text variant="title">ما صفتك في القضية؟</Text>
              {(['plaintiff', 'defendant'] as PartyRole[]).map((r) => {
                const active = form.userRole === r;
                return (
                  <Card
                    key={r}
                    onPress={() => set({ userRole: r })}
                    style={{ borderWidth: active ? 2 : 1, borderColor: active ? colors.accent : colors.border, gap: 4 }}>
                    <Text variant="heading">{roleLabels[r]}</Text>
                    <Text variant="caption" color="textMuted">
                      {r === 'plaintiff' ? 'أنت من يرفع الدعوى ويطالب بحقه' : 'رُفعت عليك دعوى وتريد الدفاع عن نفسك'}
                    </Text>
                  </Card>
                );
              })}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text variant="title">من الطرف الآخر؟</Text>
              <TextField
                label="اسم الطرف الآخر"
                placeholder="مثال: شركة ...، أو اسم الشخص"
                value={form.opponentName ?? ''}
                onChangeText={(v) => set({ opponentName: v })}
                hint="الأسماء لا تُرسل لمحرك الذكاء الاصطناعي، تبقى في حسابك فقط"
              />
              <TextField
                label="عنوان مختصر للقضية"
                placeholder="مثال: مطالبة برواتب متأخرة"
                value={form.title ?? ''}
                onChangeText={(v) => set({ title: v })}
              />
              <TextField
                label="رقم القضية في ناجز (إن وجد)"
                keyboardType="number-pad"
                value={form.caseNumber ?? ''}
                onChangeText={(v) => set({ caseNumber: v || undefined })}
              />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Text variant="title">احكِ لي ما حدث</Text>
              <Text color="textMuted">اكتب بكلماتك: متى بدأ الأمر، ماذا حدث، وما الذي تطالب به. كلما زادت التفاصيل كان التقييم أدق.</Text>
              <TextField
                multiline
                placeholder="عملت لدى ... منذ ... وفي تاريخ ..."
                value={form.description ?? ''}
                onChangeText={(v) => set({ description: v })}
                style={{ minHeight: 180 }}
                hint={`${form.description?.trim().length ?? 0} حرف (20 على الأقل)`}
              />
              <TextField
                label="المبلغ المطالب به (اختياري)"
                keyboardType="numeric"
                placeholder="بالريال"
                value={form.claimAmount ? String(form.claimAmount) : ''}
                onChangeText={(v) => set({ claimAmount: Number(v.replace(/\D/g, '')) || undefined })}
              />
            </>
          ) : null}

          {step === 4 ? (
            <>
              <Text variant="title">راجع قبل البدء</Text>
              <Card style={{ gap: 10 }}>
                <Row label="النوع" value={form.type ? caseTypeLabels[form.type] : ''} />
                <Row label="صفتك" value={form.userRole ? roleLabels[form.userRole] : ''} />
                <Row label="الطرف الآخر" value={form.opponentName ?? ''} />
                <Row label="العنوان" value={form.title ?? ''} />
                {form.claimAmount ? <Row label="المبلغ" value={`${form.claimAmount.toLocaleString('ar-SA')} ريال`} /> : null}
              </Card>
              <Card tone="accent" style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <AIBadge size="sm" />
                <Text variant="caption" style={{ flex: 1 }}>
                  بعد الإنشاء سأقيّم موقفك، وأقترح الأنظمة ذات الصلة، وأرتب لك الخطوات الأولى.
                </Text>
              </Card>
              {create.error ? <Text color="danger">{create.error.message}</Text> : null}
            </>
          ) : null}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.lg }}>
          {step > 0 ? <Button title="السابق" variant="secondary" onPress={() => setStep((s) => s - 1)} style={{ flex: 1 }} /> : null}
          <Button
            title={step === STEPS.length - 1 ? 'أنشئ القضية' : 'التالي'}
            disabled={!canNext}
            loading={create.isPending}
            onPress={() => (step === STEPS.length - 1 ? submit() : setStep((s) => s + 1))}
            style={{ flex: 2 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="bodyStrong" style={{ flexShrink: 1 }}>
        {value}
      </Text>
    </View>
  );
}
