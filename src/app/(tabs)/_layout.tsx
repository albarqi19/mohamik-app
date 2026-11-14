import { Tabs } from 'expo-router';
import { View, type ColorValue } from 'react-native';

import { Icon, Text, type IconName } from '@/components/ui';
import { fonts, palette, useTheme } from '@/theme';

const tabIcon = (name: IconName, active: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon name={focused ? active : name} size={22} rawColor={String(color)} />;
  };

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 68, paddingTop: 6 },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="home" options={{ title: 'الرئيسية', tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen name="cases" options={{ title: 'قضاياي', tabBarIcon: tabIcon('briefcase-outline', 'briefcase') }} />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'اسأل',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                marginTop: -22,
                backgroundColor: palette.ink,
                borderWidth: focused ? 3 : 0,
                borderColor: palette.brass,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
              }}>
              <View style={{ backgroundColor: palette.brass, borderRadius: 999, paddingHorizontal: 8 }}>
                {/* وسم AI نصي بدل أيقونة النجوم */}
                <TabAIText />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="documents" options={{ title: 'المستندات', tabBarIcon: tabIcon('folder-outline', 'folder') }} />
      <Tabs.Screen name="account" options={{ title: 'حسابي', tabBarIcon: tabIcon('person-outline', 'person') }} />
    </Tabs>
  );
}

function TabAIText() {
  return (
    <Text align="center" style={{ fontFamily: fonts.bold, fontSize: 13, lineHeight: 20, color: palette.ink, writingDirection: 'ltr' }}>
      AI
    </Text>
  );
}
