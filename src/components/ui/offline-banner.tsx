import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/lib/online';
import { useTheme } from '@/theme';
import { Icon } from './icon';
import { Text } from './text';

/** شريط صغير أعلى الشاشة عند انقطاع الاتصال. لا يحجب اللمس. */
export function OfflineBanner() {
  const online = useIsOnline();
  const insets = useSafeAreaInsets();
  const { colors, radius } = useTheme();
  if (online) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 6, start: 0, end: 0, alignItems: 'center' }}>
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: radius.pill,
          backgroundColor: colors.heroBackground,
        }}>
        <Icon name="cloud-offline-outline" size={16} color="heroText" />
        <Text variant="label" style={{ color: colors.heroText }}>
          لا يوجد اتصال، نعرض آخر ما حُفظ
        </Text>
      </View>
    </View>
  );
}
