import * as Clipboard from 'expo-clipboard';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { api } from '@/api';
import { Button, Card, Icon, Screen, SectionHeader, Text } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/theme';

const PROMISES = [
  { icon: 'lock-closed-outline', text: 'بياناتك مشفرة أثناء النقل والتخزين، ولا نبيعها ولا نشاركها.' },
  { icon: 'eye-off-outline', text: 'لا نرسل أسماء الأطراف إلى الذكاء الاصطناعي، ونستبدلها برموز.' },
  { icon: 'notifications-off-outline', text: 'الإشعارات عامة الصياغة، لا تظهر فيها أسماء قضاياك أو أرقامها.' },
  { icon: 'people-outline', text: 'لا يطلع محامٍ من الرائد على قضيتك إلا إذا طلبت ذلك بنفسك.' },
] as const;

function confirm(title: string, message: string, ok: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${title}\n${message}`) ?? false);
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'إلغاء', style: 'cancel', onPress: () => resolve(false) },
      { text: ok, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export default function PrivacyScreen() {
  const { colors, spacing } = useTheme();
  const { signOut } = useAuth();
  const [exported, setExported] = useState<string | null>(null);

  const exportData = useMutation({
    mutationFn: () => api.account.exportData(),
    onSuccess: async (data) => {
      const json = JSON.stringify(data, null, 2);
      await Clipboard.setStringAsync(json);
      setExported(`نسخنا بياناتك (${Math.round(json.length / 1024)} ك.ب) إلى الحافظة بصيغة JSON.`);
    },
  });

  const remove = useMutation({
    mutationFn: () => api.account.deleteAccount(),
    onSuccess: () => signOut(),
  });

  const askDelete = async () => {
    const ok = await confirm('حذف الحساب', 'سيحذف حسابك وكل قضاياك ومستنداتك نهائيا، ولا يمكن التراجع.', 'احذف نهائيا');
    if (ok) remove.mutate();
  };

  return (
    <Screen>
      <Card style={{ gap: spacing.md }}>
        {PROMISES.map((p) => (
          <View key={p.icon} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Icon name={p.icon} size={20} color="accentText" />
            <Text style={{ flex: 1 }}>{p.text}</Text>
          </View>
        ))}
      </Card>

      <SectionHeader title="حقوقك على بياناتك" />
      <Card style={{ gap: spacing.md }}>
        <Text variant="bodyStrong">تصدير بياناتي</Text>
        <Text variant="caption" color="textMuted">
          نسخة كاملة من قضاياك وإشعاراتك، وفق نظام حماية البيانات الشخصية.
        </Text>
        <Button title="صدّر بياناتي" variant="secondary" icon="download-outline" loading={exportData.isPending} onPress={() => exportData.mutate()} />
        {exported ? (
          <Text variant="caption" style={{ color: colors.success }}>
            {exported}
          </Text>
        ) : null}
        {exportData.error ? (
          <Text variant="caption" color="danger">
            تعذر التصدير. حاول مرة أخرى.
          </Text>
        ) : null}
      </Card>

      <Card style={{ gap: spacing.md, borderColor: colors.danger }}>
        <Text variant="bodyStrong" color="danger">
          حذف الحساب
        </Text>
        <Text variant="caption" color="textMuted">
          نحذف حسابك وكل ما فيه من قضايا ومستندات ومحادثات، ولا نحتفظ إلا بما يلزمنا النظام بحفظه.
        </Text>
        <Button title="احذف حسابي" variant="danger" icon="trash-outline" loading={remove.isPending} onPress={askDelete} />
      </Card>
    </Screen>
  );
}
