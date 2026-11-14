import { View } from 'react-native';

import type { Deadline } from '@/api/types';
import { Icon, Text } from '@/components/ui';
import { daysUnit, daysUntil, formatDate, formatHijri } from '@/lib/format';
import { useTheme } from '@/theme';

/** تنبيه المهلة: عدّ تنازلي بارز للمهل الحرجة كالاعتراض. */
export function DeadlineBanner({ deadline }: { deadline: Pick<Deadline, 'title' | 'dueAt' | 'confirmed'> }) {
  const { colors, radius } = useTheme();
  const days = daysUntil(deadline.dueAt);
  const urgent = days <= 7;
  return (
    <View
      style={{
        backgroundColor: urgent ? colors.dangerSoft : colors.warningSoft,
        borderRadius: radius.lg,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}>
      <View style={{ alignItems: 'center', minWidth: 56 }}>
        <Text variant="display" color={urgent ? 'danger' : 'warning'} align="center" style={{ fontFamily: undefined, fontWeight: '700', lineHeight: 36 }}>
          {Math.max(days, 0)}
        </Text>
        <Text variant="label" color={urgent ? 'danger' : 'warning'} align="center">
          {daysUnit(Math.max(days, 0))}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="alarm-outline" size={16} color={urgent ? 'danger' : 'warning'} />
          <Text variant="bodyStrong">{deadline.title}</Text>
        </View>
        <Text variant="caption" color="textMuted">
          ينتهي {formatDate(deadline.dueAt)} · {formatHijri(deadline.dueAt)}
        </Text>
        {!deadline.confirmed ? (
          <Text variant="caption" color="warning">
            مهلة محسوبة تحتاج تأكيدك
          </Text>
        ) : null}
      </View>
    </View>
  );
}
