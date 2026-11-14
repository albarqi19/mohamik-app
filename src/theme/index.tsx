import { createContext, useContext, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { useSettings } from '@/providers/settings-provider';
import { darkColors, lightColors, radius, spacing, typography, type ColorScheme } from './tokens';

export * from './tokens';

type Theme = {
  colors: ColorScheme;
  dark: boolean;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

const ThemeContext = createContext<Theme | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const { themePreference } = useSettings();
  const dark = themePreference === 'system' ? system === 'dark' : themePreference === 'dark';
  const value: Theme = {
    colors: dark ? darkColors : lightColors,
    dark,
    spacing,
    radius,
    typography,
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside AppThemeProvider');
  return ctx;
}
