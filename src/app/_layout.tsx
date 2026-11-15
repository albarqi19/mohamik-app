import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager, Platform, Pressable, Text as RNText, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/ui/offline-banner';
import { wireQueryLifecycle } from '@/lib/online';
import { AppLock } from '@/providers/app-lock';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { SettingsProvider } from '@/providers/settings-provider';
import { AppThemeProvider, fonts, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

// التطبيق عربي فقط: نطلب RTL من النظام (يسري من التشغيل التالي في Expo Go).
// في البناء الفعلي يضبطه إعداد expo-localization (forcesRTL) من أول تشغيل.
if (Platform.OS !== 'web' && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

wireQueryLifecycle();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const [loaded] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  return (
    // direction: 'rtl' يضمن تخطيطاً عربياً حتى قبل أن يسري إعداد RTL في Expo Go
    <GestureHandlerRootView style={{ flex: 1, direction: 'rtl' }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <AppThemeProvider>
              <AuthProvider>{loaded ? <AppLock><RootNavigator /><OfflineBanner /></AppLock> : <View style={{ flex: 1 }} />}</AuthProvider>
            </AppThemeProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { status } = useAuth();
  const { colors, dark } = useTheme();

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.accent },
  };
  const signedIn = status === 'signedIn';

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17 },
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="case/new" options={{ title: 'قضية جديدة', presentation: 'modal' }} />
          <Stack.Screen name="case/[id]/index" options={{ title: '' }} />
          <Stack.Screen name="case/[id]/hearing/[hearingId]" options={{ title: 'تجهيز الجلسة' }} />
          <Stack.Screen name="case/[id]/memo/[memoId]" options={{ title: 'المذكرة' }} />
          <Stack.Screen name="case/[id]/memo/new" options={{ title: 'صياغة مذكرة', presentation: 'modal' }} />
          <Stack.Screen name="case/[id]/judgment" options={{ title: 'الحكم والاعتراض' }} />
          <Stack.Screen name="case/[id]/assessment" options={{ title: 'تقييم القضية' }} />
          <Stack.Screen name="upload" options={{ title: 'رفع مستند', presentation: 'modal' }} />
          <Stack.Screen name="intake" options={{ title: 'قضية جديدة' }} />
          <Stack.Screen name="chat" options={{ title: 'اسأل محاميك' }} />
          <Stack.Screen name="agenda" options={{ title: 'الجلسات والمهل' }} />
          <Stack.Screen name="notifications" options={{ title: 'الإشعارات' }} />
          <Stack.Screen name="privacy" options={{ title: 'الخصوصية وبياناتي' }} />
          <Stack.Screen name="case/[id]/najiz" options={{ title: 'رفع الدعوى في ناجز' }} />
          <Stack.Screen name="case/[id]/hearing-outcome" options={{ title: 'ما جرى في الجلسة', presentation: 'modal' }} />
          <Stack.Screen name="case/[id]/add-date" options={{ title: 'إضافة موعد', presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

/** شاشة خطأ عربية بدل الشاشة الافتراضية عند أي عطل غير متوقع. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: '#F5F1E8' }}>
      <RNText style={{ fontSize: 20, fontWeight: '700', color: '#0E2433', textAlign: 'center' }}>حدث خطأ غير متوقع</RNText>
      <RNText style={{ fontSize: 14, color: '#5E6B73', textAlign: 'center' }}>نعتذر عن ذلك. حاول مرة أخرى، وإن تكرر الخطأ أعد تشغيل التطبيق.</RNText>
      {__DEV__ ? <RNText style={{ fontSize: 12, color: '#A63A2B', textAlign: 'center' }}>{error.message}</RNText> : null}
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        style={{ marginTop: 8, backgroundColor: '#0E2433', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 }}>
        <RNText style={{ color: '#FFFFFF', fontWeight: '600' }}>إعادة المحاولة</RNText>
      </Pressable>
    </View>
  );
}
