import { Pressable, View } from 'react-native';

import type { Deadline } from '@/api/types';
import { Icon, Text } from '@/components/ui';
import { daysUnit, daysUntil, formatDate, formatHijri } from '@/lib/format';
import { useTheme } from '@/theme';

/** تنبيه المهلة: عدّ تنازلي بارز للمهل الحرجة كالاعتراض. */
export function DeadlineBanner({
  deadline,
  onConfirm,
  confirming,
}: {
  deadline: Pick<Deadline, 'title' | 'dueAt' | 'confirmed'>;
  onConfirm?: () => void;
  confirming?: boolean;
}) {
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
        <Text variant="display" color={urgent ? 'danger' : 'warning'} align="center" style={{ lineHeight: 36 }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text variant="caption" color="warning">
              مهلة مستخرجة تحتاج تأكيدك
            </Text>
            {onConfirm ? (
              <Pressable onPress={onConfirm} disabled={confirming} hitSlop={8} accessibilityRole="button">
                <Text variant="label" color="accentText" style={{ textDecorationLine: 'underline' }}>
                  {confirming ? 'جارٍ التأكيد...' : 'أكّدها'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
