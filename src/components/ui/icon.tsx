import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { useTheme, type ColorScheme } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IconName;
  size?: number;
  color?: keyof ColorScheme;
  rawColor?: string;
};

export function Icon({ name, size = 20, color = 'text', rawColor }: Props) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={rawColor ?? colors[color]} />;
}

/** في الواجهة العربية "التالي" يتجه يساراً. */
export const ICON_FORWARD: IconName = 'chevron-back';
export const ICON_BACK: IconName = 'chevron-forward';
