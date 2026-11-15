import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { Case, NextStep } from '@/api/types';
import { DeadlineBanner } from '@/components/case/deadline-banner';
import { LawyerReferral } from '@/components/case/lawyer-referral';
import { NextStepItem } from '@/components/case/next-step-item';
import { ScoreRing } from '@/components/case/score-ring';
import { StageTracker } from '@/components/case/stage-tracker';
import { AIBadge, Badge, Button, Card, ErrorView, Icon, ICON_FORWARD, LoadingView, Screen, Text } from '@/components/ui';
import {
  caseTypeLabels,
  hearingModeLabels,
  hearingStatusLabels,
  memoKindLabels,
  memoStatusLabels,
  outcomeLabels,
  roleLabels,
  stageDescriptions,
  stageLabels,
} from '@/features/labels';
import { useCase, useConfirmDeadline, useToggleNextStep } from '@/features/queries';
import { formatDate, formatWeekdayTime, relativeDays } from '@/lib/format';
import { useTheme } from '@/theme';

type Section = 'hearings' | 'minutes' | 'memos' | 'timeline';
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'hearings', label: 'الجلسات' },
  { key: 'minutes', label: 'المحاضر' },
  { key: 'memos', label: 'المذكرات' },
  { key: 'timeline', label: 'السجل' },
];

export default function CaseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: c, isLoading, error, refetch, isRefetching } = useCase(id);
  const toggle = useToggleNextStep(id);
  const confirmDeadline = useConfirmDeadline(id);
  const { colors, spacing, radius } = useTheme();
  const [section, setSection] = useState<Section>('hearings');

  if (isLoading) return <LoadingView />;
  if (error || !c) return <ErrorView message={error?.message} onRetry={refetch} />;

  const openStep = (step: NextStep) => {
    switch (step.action) {
      case 'prepare_hearing': {
        const h = c.hearings.find((x) => x.status === 'scheduled');
        if (h) router.push({ pathname: '/case/[id]/hearing/[hearingId]', params: { id: c.id, hearingId: h.id } });
        break;
      }
      case 'draft_memo':
      case 'draft_appeal': {
        const m = c.memos.find((x) => x.status !== 'submitted');
        if (m) router.push({ pathname: '/case/[id]/memo/[memoId]', params: { id: c.id, memoId: m.id } });
        else router.push({ pathname: '/case/[id]/memo/new', params: { id: c.id, kind: step.action === 'draft_appeal' ? 'appeal' : 'statement_of_claim' } });
        break;
      }
      case 'upload_document':
        router.push({ pathname: '/upload', params: { caseId: c.id } });
        break;
      case 'record_outcome': {
        const h = c.hearings.find((x) => x.status === 'scheduled' && new Date(x.scheduledAt).getTime() < Date.now());
        if (h) router.push({ pathname: '/case/[id]/hearing-outcome', params: { id: c.id, hearingId: h.id } });
        break;
      }
      case 'file_najiz':
        router.push({ pathname: '/case/[id]/najiz', params: { id: c.id } });
        break;
      case 'ask_ai':
        router.push({ pathname: '/chat', params: { caseId: c.id, title: c.title } });
        break;
    }
  };

  const pending = c.nextSteps.filter((s) => !s.done).length;

  return (
    <Screen edges={[]} refreshing={isRefetching} onRefresh={refetch}>
      <Stack.Screen options={{ title: c.caseNumber ? `قضية ${c.caseNumber}` : 'القضية' }} />

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Badge label={caseTypeLabels[c.type]} />
          <Badge label={roleLabels[c.userRole]} tone="info" />
        </View>
        <Text variant="title">{c.title}</Text>
        <Text variant="caption" color="textMuted">
          ضد {c.opponentName}
          {c.court ? ` · ${c.court.name}${c.court.circuit ? ` · ${c.court.circuit}` : ''}` : ''}
        </Text>
      </View>

      {/* رحلة القضية */}
      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label" color="textMuted">
            المرحلة الحالية
          </Text>
          <Badge label={stageLabels[c.stage]} tone="accent" />
        </View>
        <Text variant="bodyStrong">{stageDescriptions[c.stage]}</Text>
        <StageTracker stage={c.stage} />
      </Card>

      {c.nextDeadline ? (
        <DeadlineBanner deadline={c.nextDeadline} onConfirm={() => confirmDeadline.mutate(c.nextDeadline!.id)} confirming={confirmDeadline.isPending} />
      ) : null}

      {c.assessment ? (
        <Card onPress={() => router.push({ pathname: '/case/[id]/assessment', params: { id: c.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <ScoreRing score={c.assessment.score} size={64} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" color="textMuted">
              تقييم موقفك
            </Text>
            <Text variant="bodyStrong">{c.assessment.headline}</Text>
          </View>
          <Icon name={ICON_FORWARD} size={18} color="textMuted" />
        </Card>
      ) : null}

      {/* الخطوات التالية */}
      <Card style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <AIBadge size="sm" />
          <Text variant="heading" style={{ flex: 1 }}>
            خطواتك التالية
          </Text>
          <Text variant="caption" color="textMuted">
            {pending ? `${pending} متبقية` : 'أنجزت الكل'}
          </Text>
        </View>
        {c.nextSteps.map((s) => (
          <NextStepItem key={s.id} step={s} onToggle={() => toggle.mutate(s.id)} onOpen={s.action ? () => openStep(s) : undefined} />
        ))}
      </Card>

      {(c.stage === 'assessment' || c.stage === 'drafting') && c.userRole === 'plaintiff' ? (
        <Card
          tone="accent"
          onPress={() => router.push({ pathname: '/case/[id]/najiz', params: { id: c.id } })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="paper-plane-outline" size={22} color="accentText" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{c.type === 'execution' ? 'جاهز لتقديم طلب التنفيذ؟' : 'جاهز لرفع الدعوى؟'}</Text>
            <Text variant="caption" color="textMuted">
              دليل ناجز خطوة بخطوة، ونص الدعوى جاهز للنسخ.
            </Text>
          </View>
          <Icon name={ICON_FORWARD} size={18} color="textMuted" />
        </Card>
      ) : null}

      {/* إجراءات سريعة */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button
          title="اسأل عن القضية"
          variant="primary"
          size="sm"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/chat', params: { caseId: c.id, title: c.title } })}
        />
        {c.judgment ? (
          <Button
            title="الحكم والاعتراض"
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/case/[id]/judgment', params: { id: c.id } })}
          />
        ) : null}
      </View>

      {c.judgment ? (
        <Card onPress={() => router.push({ pathname: '/case/[id]/judgment', params: { id: c.id } })} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="heading">الحكم</Text>
            <Badge
              label={outcomeLabels[c.judgment.outcome]}
              tone={c.judgment.outcome === 'in_favor' ? 'success' : c.judgment.outcome === 'against' ? 'danger' : 'warning'}
            />
          </View>
          <Text variant="reading">{c.judgment.summary}</Text>
          <Text variant="caption" color="textMuted">
            صدر {formatDate(c.judgment.issuedAt)}
          </Text>
        </Card>
      ) : null}

      {/* أقسام القضية */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 4 }}>
        {SECTIONS.map((s) => {
          const active = s.key === section;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSection(s.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{ flex: 1, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: active ? colors.surface : 'transparent' }}>
              <Text variant="label" align="center" color={active ? 'text' : 'textMuted'}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {section === 'hearings' ? <HearingsSection c={c} /> : null}
      {section === 'minutes' ? <MinutesSection c={c} /> : null}
      {section === 'memos' ? <MemosSection c={c} /> : null}
      {section === 'timeline' ? <TimelineSection c={c} /> : null}

      <LawyerReferral caseId={c.id} />
    </Screen>
  );
}

function HearingsSection({ c }: { c: Case }) {
  if (!c.hearings.length) return <Text color="textMuted">لم تحدد جلسات بعد.</Text>;
  return (
    <View style={{ gap: 10 }}>
      {[...c.hearings].reverse().map((h) => (
        <Card
          key={h.id}
          onPress={() => router.push({ pathname: '/case/[id]/hearing/[hearingId]', params: { id: c.id, hearingId: h.id } })}
          style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="bodyStrong">الجلسة {h.number}</Text>
            <Badge label={hearingStatusLabels[h.status]} tone={h.status === 'scheduled' ? 'info' : 'neutral'} />
          </View>
          <Text variant="caption" color="textMuted">
            {formatWeekdayTime(h.scheduledAt)} · {formatDate(h.scheduledAt)} · {hearingModeLabels[h.mode]}
            {h.status === 'scheduled' ? ` · ${relativeDays(h.scheduledAt)}` : ''}
          </Text>
          {h.outcome ? <Text variant="caption">{h.outcome}</Text> : h.agenda ? <Text variant="caption">{h.agenda}</Text> : null}
        </Card>
      ))}
    </View>
  );
}

function MinutesSection({ c }: { c: Case }) {
  const add = (
    <Button
      title="أضف محضراً"
      icon="camera-outline"
      variant="secondary"
      onPress={() => router.push({ pathname: '/upload', params: { caseId: c.id, kind: 'minute' } })}
    />
  );
  if (!c.minutes.length)
    return (
      <View style={{ gap: 10 }}>
        <Text color="textMuted">لا توجد محاضر بعد. بعد كل جلسة ارفع المحضر أو صوّره، وسألخصه وأستخرج المطلوب منك.</Text>
        {add}
      </View>
    );
  return (
    <View style={{ gap: 10 }}>
      {add}
      {c.minutes.map((m) => (
        <Card key={m.id} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="bodyStrong">محضر {formatDate(m.date)}</Text>
            <AIBadge size="sm" />
          </View>
          <Text variant="reading">
            {m.summary}
          </Text>
          <Text variant="label" color="textMuted">
            أهم النقاط
          </Text>
          {m.keyPoints.map((p) => (
            <Text key={p} variant="caption">
              • {p}
            </Text>
          ))}
          {m.requestsFromCourt.length ? (
            <View style={{ gap: 4, marginTop: 4 }}>
              <Text variant="label" color="danger">
                مطلوب منك
              </Text>
              {m.requestsFromCourt.map((r) => (
                <Text key={r} variant="caption">
                  • {r}
                </Text>
              ))}
            </View>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

function MemosSection({ c }: { c: Case }) {
  return (
    <View style={{ gap: 10 }}>
      <Button
        title="صياغة مذكرة جديدة"
        icon="create-outline"
        variant="secondary"
        onPress={() => router.push({ pathname: '/case/[id]/memo/new', params: { id: c.id } })}
      />
      {c.memos.map((m) => (
        <Card
          key={m.id}
          onPress={() => router.push({ pathname: '/case/[id]/memo/[memoId]', params: { id: c.id, memoId: m.id } })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="document-text-outline" size={24} color="accentText" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{m.title}</Text>
            <Text variant="caption" color="textMuted">
              {memoKindLabels[m.kind]} · {memoStatusLabels[m.status]} · {formatDate(m.updatedAt)}
            </Text>
          </View>
          <Icon name={ICON_FORWARD} size={18} color="textMuted" />
        </Card>
      ))}
      {!c.memos.length ? <Text color="textMuted">لا توجد مذكرات بعد.</Text> : null}
    </View>
  );
}

function TimelineSection({ c }: { c: Case }) {
  const { colors } = useTheme();
  const events = [...c.timeline].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <View>
      {events.map((e, i) => (
        <View key={e.id} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ alignItems: 'center', width: 14 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i === 0 ? colors.accent : colors.border, marginTop: 7 }} />
            {i < events.length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: colors.border }} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: 18 }}>
            <Text variant="bodyStrong">{e.title}</Text>
            <Text variant="caption" color="textMuted">
              {formatDate(e.at)}
              {e.detail ? ` · ${e.detail}` : ''}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
