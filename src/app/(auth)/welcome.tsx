import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AIBadge, Button, Icon, Text, type IconName } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { fonts, useTheme } from '@/theme';

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'git-branch-outline', title: 'يمشي معك خطوة بخطوة', body: 'من فهم قضيتك حتى تنفيذ الحكم، تعرف دائماً ما المطلوب الآن.' },
  { icon: 'calendar-outline', title: 'لا تفوتك جلسة ولا مهلة', body: 'تذكير بالجلسات وعدّ تنازلي لمهل الاعتراض والمذكرات.' },
  { icon: 'document-text-outline', title: 'مذكرات مبنية على الأنظمة والسوابق', body: 'صياغة ومراجعة مع ذكر السند النظامي لكل حجة.' },
];

export default function Welcome() {
  const { colors, spacing } = useTheme();
  const { markWelcomeSeen, hasSeenWelcome } = useAuth();
  if (hasSeenWelcome) return <Redirect href="/login" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.heroBackground }}>
      <SafeAreaView style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between' }}>
        <View style={{ gap: spacing.md, marginTop: spacing.xxl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 40, lineHeight: 64, color: colors.heroText }}>محاميك</Text>
            <AIBadge size="lg" />
          </View>
          <Text style={{ fontFamily: fonts.serif, fontSize: 20, lineHeight: 36, color: colors.heroMuted }}>
            محامٍ ذكي في جيبك، يتابع قضيتك من أول سؤال حتى آخر حكم.
          </Text>
        </View>

        <View style={{ gap: spacing.lg }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.heroLine,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name={f.icon} size={22} rawColor={colors.heroAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={{ color: colors.heroText }}>
                  {f.title}
                </Text>
                <Text variant="caption" style={{ color: colors.heroMuted }}>
                  {f.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: spacing.md }}>
          <Button
            title="ابدأ الآن"
            variant="accent"
            onPress={() => {
              markWelcomeSeen();
              router.push('/login');
            }}
          />
          <Text variant="caption" align="center" style={{ color: colors.heroMuted }}>
            بالمتابعة توافق على الشروط وسياسة الخصوصية
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
