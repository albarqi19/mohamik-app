import { useMutation } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, I18nManager, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, type IntakeFact, type IntakeTurn } from '@/api';
import { AIBadge, Button, Icon, ProgressBar, Text } from '@/components/ui';
import { useCreateCase } from '@/features/queries';
import { fonts, useTheme } from '@/theme';

type Item =
  | { id: string; kind: 'ai'; text: string }
  | { id: string; kind: 'me'; text: string }
  | { id: string; kind: 'facts'; facts: IntakeFact[]; tip?: string };

let seq = 0;
const nid = () => `i${++seq}`;

/** البداية الذكية: يحكي المستخدم قصته، و AI يسأل ويرتّب ويبني ملف القضية. */
export default function Intake() {
  const { colors, spacing, radius } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [current, setCurrent] = useState<IntakeTurn>();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<Item>>(null);
  const create = useCreateCase();

  const next = useMutation({
    mutationFn: (answer?: string) => api.intake.next({ sessionId: current?.sessionId, answer }),
    onSuccess: (t) => {
      const prev = current?.facts ?? [];
      // نعرض ما استجد فقط، وعند الاكتمال نعرض الملف كاملاً للمراجعة
      const fresh = t.done ? t.facts : t.facts.filter((f) => !prev.some((p) => p.label === f.label && p.value === f.value));
      const add: Item[] = t.messages.map((m) => ({ id: nid(), kind: 'ai', text: m }));
      if (fresh.length || t.tip) {
        const card: Item = { id: nid(), kind: 'facts', facts: fresh, tip: t.tip };
        // ما فهمناه يسبق السؤال التالي؛ وعند الاكتمال يأتي الملف بعد رسالة المراجعة
        add.splice(t.done ? add.length : add.length > 1 ? 1 : 0, 0, card);
      }
      setItems((x) => [...x, ...add]);
      setCurrent(t);
    },
  });

  useEffect(() => {
    next.mutate(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answer = (text: string) => {
    const t = text.trim();
    if (!t || next.isPending || current?.done) return;
    setItems((x) => [...x, { id: nid(), kind: 'me', text: t }]);
    setInput('');
    next.mutate(t);
  };

  const finish = async () => {
    if (!current?.draft) return;
    const c = await create.mutateAsync(current.draft);
    router.dismissTo('/home');
    router.push({ pathname: '/case/[id]/assessment', params: { id: c.id } });
  };

  const step = current?.step ?? 0;
  const total = current?.totalSteps ?? 6;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'قضية جديدة',
          headerRight: () => (
            <Pressable onPress={() => router.replace('/case/new')} hitSlop={10} accessibilityRole="button" style={{ paddingHorizontal: 8 }}>
              <Text variant="label" color="accentText">
                إدخال يدوي
              </Text>
            </Pressable>
          ),
        }}
      />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 6 }}>
        <Text variant="caption" color="textMuted">
          {current?.done ? 'ملف القضية جاهز' : `ملف القضية يتكوّن · ${Math.min(step + 1, total)} من ${total}`}
        </Text>
        <ProgressBar value={current?.done ? 1 : step / total} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(i) => i.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          renderItem={({ item }) => <Row item={item} />}
          ListFooterComponent={
            <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
              {next.isPending ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AIBadge size="sm" />
                  <Text variant="caption" color="textMuted">
                    أرتّب ما قلته...
                  </Text>
                </View>
              ) : null}
              {!next.isPending && current?.options?.length && !current.done ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {current.options.map((o) => (
                    <Pressable
                      key={o}
                      onPress={() => answer(o)}
                      style={({ pressed }) => ({
                        minHeight: 44,
                        paddingHorizontal: 16,
                        justifyContent: 'center',
                        borderRadius: radius.pill,
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                        backgroundColor: colors.surface,
                        opacity: pressed ? 0.7 : 1,
                      })}>
                      <Text variant="bodyStrong">{o}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {current?.done ? (
                <Button title="أنشئ القضية وقيّم موقفي" onPress={finish} loading={create.isPending} />
              ) : null}
              {next.isError ? (
                <Button title="إعادة المحاولة" variant="secondary" onPress={() => next.mutate(undefined)} />
              ) : null}
            </View>
          }
        />

        {!current?.done ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 8,
              padding: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="اكتب هنا..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={{
                flex: 1,
                fontFamily: fonts.regular,
                fontSize: 16,
                color: colors.text,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                paddingHorizontal: 14,
                paddingVertical: 12,
                minHeight: 50,
                maxHeight: 140,
                textAlign: I18nManager.isRTL ? 'left' : 'right',
                writingDirection: 'rtl',
              }}
            />
            <Pressable
              onPress={() => answer(input)}
              disabled={!input.trim() || next.isPending}
              accessibilityLabel="إرسال"
              style={{
                width: 50,
                height: 50,
                borderRadius: radius.lg,
                backgroundColor: input.trim() ? colors.primary : colors.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name="arrow-back" size={22} rawColor={input.trim() ? colors.primaryText : colors.textMuted} />
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ item }: { item: Item }) {
  const { colors, radius } = useTheme();
  if (item.kind === 'me') {
    return (
      <View style={{ alignSelf: 'flex-end', maxWidth: '84%', backgroundColor: colors.primary, borderRadius: radius.lg, padding: 12 }}>
        <Text style={{ color: colors.primaryText }}>{item.text}</Text>
      </View>
    );
  }
  if (item.kind === 'facts') {
    return (
      <View
        style={{
          alignSelf: 'flex-start',
          maxWidth: '90%',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: 12,
          gap: 8,
        }}>
        {item.facts.length ? (
        <View style={{ backgroundColor: colors.background, borderRadius: radius.md, padding: 10, gap: 6 }}>
          {item.facts.map((f) => (
            <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="checkmark" size={16} color="success" />
              <Text variant="caption">
                {f.label}: <Text variant="label">{f.value}</Text>
              </Text>
            </View>
          ))}
        </View>
        ) : null}
        {item.tip ? (
          <Text variant="label" color="accentText">
            {item.tip}
          </Text>
        ) : null}
      </View>
    );
  }
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        maxWidth: '88%',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: 12,
        gap: 6,
      }}>
      <AIBadge size="sm" />
      <Text>{item.text}</Text>
    </View>
  );
}
