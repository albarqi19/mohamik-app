import { View } from 'react-native';

import { fonts, palette, useTheme } from '@/theme';
import { Text } from './text';

/** وسم AI: كلمة "AI" في كبسولة نحاسية، بلا أيقونة نجوم (هوية الديوان). */
export function AIBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { radius } = useTheme();
  const font = size === 'sm' ? 10 : size === 'md' ? 12 : 18;
  const padH = size === 'sm' ? 6 : size === 'md' ? 9 : 14;
  return (
    <View
      style={{
        backgroundColor: palette.brass,
        borderRadius: radius.pill,
        paddingHorizontal: padH,
        paddingVertical: size === 'lg' ? 4 : 1,
        alignSelf: 'flex-start',
      }}>
      <Text align="center" style={{ fontFamily: fonts.bold, fontSize: font, lineHeight: font * 1.5, color: palette.ink, writingDirection: 'ltr' }}>
        AI
      </Text>
    </View>
  );
}
