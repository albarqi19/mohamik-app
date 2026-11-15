import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Chip, Icon, Text } from '@/components/ui';
import { formatDate, formatHijri, formatWeekday, formatWeekdayTime } from '@/lib/format';

const QUICK_DAYS: { days: number; label: string }[] = [
  { days: 7, label: 'بعد أسبوع' },
  { days: 14, label: 'بعد أسبوعين' },
  { days: 21, label: 'بعد 3 أسابيع' },
  { days: 30, label: 'بعد شهر' },
];
const HOURS = [9, 10, 11, 12, 13];

export function dateAt(days: number, hour: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

type Props = {
  /** يُستدعى بالتاريخ المختار بصيغة ISO */
  onChange: (iso: string) => void;
  /** إظهار اختيار الساعة (للجلسات) */
  withTime?: boolean;
  hint?: string;
};

/** اختيار تاريخ بلا تقويم أصلي: اختيار سريع ثم تعديل اليوم والساعة. يعرض الهجري معه. */
export function DateQuickPicker({ onChange, withTime = true, hint }: Props) {
  const [days, setDays] = useState<number | null>(null);
  const [hour, setHour] = useState(withTime ? 10 : 9);

  const pick = (d: number, h = hour) => {
    setDays(d);
    setHour(h);
    onChange(dateAt(d, h).toISOString());
  };
  const iso = days != null ? dateAt(days, hour).toISOString() : null;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {QUICK_DAYS.map((q) => (
          <Chip key={q.days} label={q.label} selected={days === q.days} onPress={() => pick(q.days)} />
        ))}
      </View>
      {iso && days != null ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable accessibilityLabel="يوم قبل" onPress={() => pick(Math.max(0, days - 1))} hitSlop={8}>
              <Icon name="remove-circle-outline" size={28} color="textMuted" />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="bodyStrong" align="center">
                {withTime ? formatWeekdayTime(iso) : formatWeekday(iso)} · {formatDate(iso)}
              </Text>
              <Text variant="caption" color="textMuted" align="center">
                {formatHijri(iso)}
              </Text>
            </View>
            <Pressable accessibilityLabel="يوم بعد" onPress={() => pick(days + 1)} hitSlop={8}>
              <Icon name="add-circle-outline" size={28} color="textMuted" />
            </Pressable>
          </View>
          {withTime ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {HOURS.map((hr) => (
                <Chip key={hr} label={`${hr > 12 ? hr - 12 : hr}:00 ${hr >= 12 ? 'م' : 'ص'}`} selected={hour === hr} onPress={() => pick(days, hr)} />
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <Text variant="caption" color="textMuted">
          {hint ?? 'اختر الأقرب ثم عدّل اليوم بالزرين.'}
        </Text>
      )}
    </View>
  );
}
