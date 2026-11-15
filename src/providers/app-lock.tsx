import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Platform, View } from 'react-native';

import { AIBadge, Button, Text } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { useTheme } from '@/theme';

const RELOCK_AFTER_MS = 60_000;

export async function biometricsAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export async function authenticate(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage: 'افتح محاميك',
    cancelLabel: 'إلغاء',
  });
  return r.success;
}

/** قفل التطبيق بالبصمة: عند الفتح، وعند العودة بعد دقيقة في الخلفية. */
export function AppLock({ children }: PropsWithChildren) {
  const { appLock, loaded } = useSettings();
  const { status } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [prev, setPrev] = useState({ loaded, appLock });
  const backgroundedAt = useRef<number | null>(null);
  const { colors, spacing } = useTheme();

  // تفعيل القفل من الإعدادات يمر بالبصمة أولا، فلا نقفل فورا بعده
  if (prev.loaded !== loaded || prev.appLock !== appLock) {
    if (prev.loaded && loaded && appLock && !prev.appLock) setUnlocked(true);
    setPrev({ loaded, appLock });
  }

  const active = appLock && loaded && status === 'signedIn' && Platform.OS !== 'web';
  const locked = active && !unlocked;

  const unlock = useCallback(() => {
    void authenticate().then((ok) => ok && setUnlocked(true));
  }, []);

  useEffect(() => {
    if (!active) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && backgroundedAt.current && Date.now() - backgroundedAt.current > RELOCK_AFTER_MS) {
        setUnlocked(false);
      }
    });
    return () => sub.remove();
  }, [active]);

  useEffect(() => {
    if (locked) unlock();
  }, [locked, unlock]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {locked ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            start: 0,
            end: 0,
            backgroundColor: colors.heroBackground,
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            gap: spacing.lg,
          }}>
          <AIBadge size="lg" />
          <Text variant="title" align="center" style={{ color: colors.heroText }}>
            محاميك مقفل
          </Text>
          <Text align="center" style={{ color: colors.heroMuted }}>
            قضاياك محمية. افتح بالبصمة للمتابعة.
          </Text>
          <Button title="افتح بالبصمة" variant="accent" icon="finger-print" onPress={unlock} />
        </View>
      ) : null}
    </View>
  );
}
