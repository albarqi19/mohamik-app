import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { MemoKind } from '@/api/types';
import { AIBadge, Button, Card, Screen, Text, TextField } from '@/components/ui';
import { memoKindLabels } from '@/features/labels';
import { useCase, useDraftMemo } from '@/features/queries';
import { useTheme } from '@/theme';

const KINDS: { kind: MemoKind; hint: string }[] = [
  { kind: 'statement_of_claim', hint: 'لبدء الدعوى: الوقائع والطلبات وسندها' },
  { kind: 'reply', hint: 'للرد على دعوى أو مذكرة الخصم' },
  { kind: 'rejoinder', hint: 'للتعقيب على جواب الخصم' },
  { kind: 'closing', hint: 'قبل حجز القضية للحكم' },
  { kind: 'appeal', hint: 'للاعتراض على الحكم في مهلته' },
];

/** صياغة مذكرة جديدة بـ AI، مبنية على وقائع القضية ومحاضرها والأنظمة. */
export default function NewMemo() {
  const { id, kind: initial } = useLocalSearchParams<{ id: string; kind?: MemoKind }>();
  const { data: c } = useCase(id);
  const draft = useDraftMemo();
  const { colors, spacing, radius } = useTheme();
  const [kind, setKind] = useState<MemoKind>(initial ?? (c?.judgment ? 'appeal' : 'statement_of_claim'));
  const [instructions, setInstructions] = useState('');

  const submit = async () => {
    const memo = await draft.mutateAsync({ caseId: id, kind, instructions: instructions.trim() || undefined });
    router.replace({ pathname: '/case/[id]/memo/[memoId]', params: { id, memoId: memo.id } });
  };

  return (
    <Screen
      edges={['bottom']}
      footer={
        <View style={{ padding: spacing.lg }}>
          <Button title={draft.isPending ? 'أصوغ المذكرة...' : 'صغ المسودة'} loading={draft.isPending} onPress={submit} />
        </View>
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AIBadge size="sm" />
        <Text variant="caption" color="textMuted">
          {c ? `لقضية: ${c.title}` : ''}
        </Text>
      </View>
      <Text variant="title">ما المذكرة التي تحتاجها؟</Text>
      <View style={{ gap: spacing.sm }}>
        {KINDS.map((k) => {
          const active = k.kind === kind;
          return (
            <Pressable
              key={k.kind}
              onPress={() => setKind(k.kind)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={{
                padding: spacing.md,
                borderRadius: radius.lg,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.accent : colors.border,
                backgroundColor: active ? colors.accentSoft : colors.surface,
              }}>
              <Text variant="bodyStrong">{memoKindLabels[k.kind]}</Text>
              <Text variant="caption" color="textMuted">
                {k.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextField
        label="توجيهات إضافية (اختياري)"
        placeholder="مثال: ركّز على أن الشركة لم تقدم ما يثبت الصرف"
        multiline
        value={instructions}
        onChangeText={setInstructions}
      />
      <Card tone="muted">
        <Text variant="caption">
          سأبني المسودة على وقائع القضية ومحاضرها ومستنداتها، مع ذكر السند من الأنظمة والسوابق. راجعها قبل تقديمها.
        </Text>
      </Card>
      {draft.error ? <Text color="danger">{draft.error.message}</Text> : null}
    </Screen>
  );
}
