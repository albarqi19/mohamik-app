import { View } from 'react-native';

import { CASE_STAGES, type CaseStage } from '@/api/types';
import { Text } from '@/components/ui';
import { journeyStages, stageLabels } from '@/features/labels';
import { useTheme } from '@/theme';

/** يربط أي مرحلة بأقرب مرحلة ظاهرة في الشريط. */
function visibleIndex(stage: CaseStage): number {
  const order = CASE_STAGES.indexOf(stage);
  let idx = 0;
  journeyStages.forEach((s, i) => {
    if (CASE_STAGES.indexOf(s) <= order) idx = i;
  });
  return idx;
}

/** شريط رحلة القضية: نقاط متصلة، المكتمل نحاسي والحالي بارز. */
export function StageTracker({ stage, compact = false }: { stage: CaseStage; compact?: boolean }) {
  const { colors } = useTheme();
  const current = visibleIndex(stage);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {journeyStages.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <View key={s} style={{ flex: i === journeyStages.length - 1 ? 0 : 1, flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: active ? 14 : 10,
                  height: active ? 14 : 10,
                  borderRadius: 7,
                  backgroundColor: done || active ? colors.accent : colors.surfaceMuted,
                  borderWidth: active ? 3 : 0,
                  borderColor: colors.accentSoft,
                }}
              />
              {i < journeyStages.length - 1 ? (
                <View style={{ flex: 1, height: 2, backgroundColor: done ? colors.accent : colors.surfaceMuted }} />
              ) : null}
            </View>
          );
        })}
      </View>
      {compact ? null : (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {journeyStages.map((s, i) => (
            <Text
              key={s}
              variant="label"
              color={i === current ? 'text' : 'textMuted'}
              align="center"
              style={{ width: 44, fontSize: 10, lineHeight: 14 }}>
              {stageLabels[s]}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
