import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, I18nManager, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';

import { api, type ChatMessage } from '@/api';
import { CitationChip } from '@/components/case/citation-chip';
import { AIBadge, Icon, ICON_FORWARD, Text } from '@/components/ui';
import { fonts, useTheme } from '@/theme';

const GENERAL_SUGGESTIONS = [
  'كم مدة الاعتراض على الحكم؟',
  'كيف أحسب مكافأة نهاية الخدمة؟',
  'كيف أستعد لجلستي القادمة؟',
  'فُصلت من عملي، ماذا أفعل؟',
];

const CASE_SUGGESTIONS = ['لخص لي القضية', 'كيف أستعد للجلسة القادمة؟', 'هل أعترض على الحكم؟', 'ما نقاط القوة في موقفي؟'];

type Props = { caseId?: string; caseTitle?: string; header?: React.ReactNode };

export function ChatView({ caseId, caseTitle, header }: Props) {
  const { colors, radius, spacing } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const conversationId = useRef<string | undefined>(undefined);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const ask = useMutation({
    mutationFn: (message: string) => api.assistant.ask({ caseId, conversationId: conversationId.current, message }),
    onSuccess: (res) => {
      conversationId.current = res.conversationId;
      setMessages((m) => [...m.filter((x) => !x.pending), res.message]);
    },
    onError: (e) => {
      setMessages((m) => [
        ...m.filter((x) => !x.pending),
        { id: `err-${Date.now()}`, role: 'assistant', content: `تعذر الرد: ${e.message}`, createdAt: new Date().toISOString() },
      ]);
    },
  });

  const send = (text: string) => {
    const t = text.trim();
    if (!t || ask.isPending) return;
    const now = new Date().toISOString();
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: 'user', content: t, createdAt: now },
      { id: 'pending', role: 'assistant', content: '', createdAt: now, pending: true },
    ]);
    setInput('');
    ask.mutate(t);
  };

  const suggestions = caseId ? CASE_SUGGESTIONS : GENERAL_SUGGESTIONS;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            {header}
            {messages.length === 0 ? (
              <View style={{ gap: spacing.md, paddingTop: spacing.lg }}>
                <AIBadge size="lg" />
                <Text variant="title">{caseTitle ? 'اسألني عن قضيتك' : 'كيف أساعدك اليوم؟'}</Text>
                <Text color="textMuted">
                  {caseTitle
                    ? `أعرف تفاصيل "${caseTitle}" ومحاضرها ومذكراتها، فاسألني مباشرة.`
                    : 'اشرح موقفك بكلماتك، وسأجيبك بالسند النظامي والخطوات العملية.'}
                </Text>
                {!caseId ? (
                  <Pressable
                    onPress={() => router.push('/intake')}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: colors.primary,
                      borderRadius: radius.lg,
                      padding: 14,
                      opacity: pressed ? 0.85 : 1,
                    })}>
                    <Icon name="chatbubbles-outline" size={22} rawColor={colors.primaryText} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" style={{ color: colors.primaryText }}>
                        عندك قضية؟ احكِ لي قصتك
                      </Text>
                      <Text variant="caption" style={{ color: colors.primaryText, opacity: 0.8 }}>
                        أسألك وأرتّب ملف قضيتك وأقيّم موقفك
                      </Text>
                    </View>
                    <Icon name={ICON_FORWARD} size={18} rawColor={colors.primaryText} />
                  </Pressable>
                ) : null}
                <View style={{ gap: 8 }}>
                  {suggestions.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => send(s)}
                      style={({ pressed }) => ({
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        borderRadius: radius.md,
                        padding: 12,
                        opacity: pressed ? 0.7 : 1,
                      })}>
                      <Text>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <Bubble message={item} />}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 8,
          padding: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="اكتب سؤالك..."
          placeholderTextColor={colors.textMuted}
          multiline
          style={{
            flex: 1,
            fontFamily: fonts.regular,
            fontSize: 16,
            color: colors.text,
            backgroundColor: colors.background,
            borderRadius: radius.lg,
            paddingHorizontal: 14,
            paddingVertical: 10,
            maxHeight: 120,
            minHeight: 44,
            textAlign: I18nManager.isRTL ? 'left' : 'right',
            writingDirection: 'rtl',
          }}
        />
        <Pressable
          onPress={() => send(input)}
          disabled={!input.trim() || ask.isPending}
          accessibilityLabel="إرسال"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: input.trim() ? colors.primary : colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {/* السهم يتجه يساراً في الواجهة العربية */}
          <Icon name="arrow-back" size={20} rawColor={input.trim() ? colors.primaryText : colors.textMuted} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const { colors, radius } = useTheme();
  const mine = message.role === 'user';
  if (message.pending) {
    return (
      <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AIBadge size="sm" />
        <Text variant="caption" color="textMuted">
          أبحث في الأنظمة والسوابق...
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '88%',
        backgroundColor: mine ? colors.primary : colors.surface,
        borderWidth: mine ? 0 : 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: 14,
        gap: 10,
      }}>
      {!mine ? <AIBadge size="sm" /> : null}
      <Text style={{ color: mine ? colors.primaryText : colors.text }}>{message.content}</Text>
      {message.citations?.length ? (
        <View style={{ gap: 6 }}>
          {message.citations.map((c) => (
            <CitationChip key={c.id} citation={c} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
