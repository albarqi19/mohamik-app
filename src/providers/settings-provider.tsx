import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { storage } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

type Settings = {
  themePreference: ThemePreference;
  hijriFirst: boolean;
  hearingReminders: boolean;
  deadlineReminders: boolean;
};

type SettingsContextValue = Settings & {
  update: (patch: Partial<Settings>) => void;
};

const DEFAULTS: Settings = {
  themePreference: 'system',
  hijriFirst: false,
  hearingReminders: true,
  deadlineReminders: true,
};

const KEY = 'mohamik.settings';
const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    storage.get(KEY).then((raw) => {
      if (!raw) return;
      try {
        setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) });
      } catch {
        // إعدادات تالفة: نبقي الافتراضي
      }
    });
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void storage.set(KEY, JSON.stringify(next));
      return next;
    });
  };

  return <SettingsContext.Provider value={{ ...settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
