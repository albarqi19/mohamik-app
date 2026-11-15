import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import { useMockApi } from '@/api';
import { Badge, Card, ListRow, Screen, Text } from '@/components/ui';
import { authenticate, biometricsAvailable } from '@/providers/app-lock';
import { useAuth } from '@/providers/auth-provider';
import { useSettings, type ThemePreference } from '@/providers/settings-provider';
import { useTheme } from '@/theme';

const THEMES: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'حسب الجهاز' },
  { key: 'light', label: 'فاتح' },
  { key: 'dark', label: 'داكن' },
];

export default function Account() {
  const { user, signOut } = useAuth();
  const [canLock, setCanLock] = useState(false);
  useEffect(() => {
    void biometricsAvailable().then(setCanLock);
  }, []);
  // التفعيل يتطلب نجاح البصمة أولا، حتى لا يقفل المستخدم نفسه خارج التطبيق
  const toggleLock = async (v: boolean) => {
    if (v && !(await authenticate())) return;
    settings.update({ appLock: v });
  };
  const settings = useSettings();
  const { colors, spacing } = useTheme();
  const cycleTheme = () => {
    const i = THEMES.findIndex((t) => t.key === settings.themePreference);
    settings.update({ themePreference: THEMES[(i + 1) % THEMES.length].key });
  };

  return (
    <Screen>
      <Text variant="title">حسابي</Text>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="title" style={{ color: colors.primaryText }} align="center">
            {user?.name?.[0] ?? 'م'}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading">{user?.name}</Text>
          <Text variant="caption" color="textMuted" style={{ writingDirection: 'ltr' }}>
            {user?.phone}
          </Text>
        </View>
        <Badge label={user?.plan === 'pro' ? 'الباقة الاحترافية' : 'الباقة المجانية'} tone="accent" />
      </Card>

      <Card style={{ paddingVertical: spacing.xs }}>
        <ListRow icon="notifications-outline" title="الإشعارات" onPress={() => router.push('/notifications')} />
        <ListRow
          icon="calendar-outline"
          title="تذكير بالجلسات"
          subtitle="قبل الجلسة بيوم وبساعة"
          trailing={<Switch value={settings.hearingReminders} onValueChange={(v) => settings.update({ hearingReminders: v })} trackColor={{ true: colors.accent }} />}
        />
        <ListRow
          icon="alarm-outline"
          title="تنبيه المهل"
          subtitle="الاعتراض وتقديم المذكرات"
          trailing={<Switch value={settings.deadlineReminders} onValueChange={(v) => settings.update({ deadlineReminders: v })} trackColor={{ true: colors.accent }} />}
        />
        {canLock ? (
          <ListRow
            icon="finger-print"
            title="قفل التطبيق بالبصمة"
            subtitle="عند الفتح وبعد دقيقة في الخلفية"
            trailing={<Switch value={settings.appLock} onValueChange={toggleLock} trackColor={{ true: colors.accent }} />}
          />
        ) : null}
        <ListRow
          icon="moon-outline"
          title="المظهر"
          subtitle={THEMES.find((t) => t.key === settings.themePreference)?.label}
          onPress={cycleTheme}
        />
      </Card>

      <Card style={{ paddingVertical: spacing.xs }}>
        <ListRow icon="shield-checkmark-outline" title="الخصوصية وبياناتي" subtitle="تصدير بياناتي أو حذف الحساب" onPress={() => router.push('/privacy')} />
        <ListRow icon="help-circle-outline" title="المساعدة والدعم" onPress={() => undefined} />
        <ListRow icon="log-out-outline" title="تسجيل الخروج" danger onPress={signOut} />
      </Card>

      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text variant="caption" color="textMuted" align="center">
          محاميك {Constants.expoConfig?.version ?? ''} · من الرائد للمحاماة
        </Text>
        {useMockApi ? (
          <Text variant="caption" color="accentText" align="center">
            يعمل ببيانات تجريبية
          </Text>
        ) : null}
        <Text variant="caption" color="textMuted" align="center">
          محاميك مساعد قانوني ذكي، ولا يغني عن استشارة محامٍ مرخّص في القضايا المعقدة.
        </Text>
      </View>
    </Screen>
  );
}
