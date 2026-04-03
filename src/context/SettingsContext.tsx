import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'ru' | 'en';
export type FontSize = 'small' | 'medium' | 'large';
export type TrafficMode = 'safe' | 'balanced' | 'aggressive';

interface Settings {
  language: Language;
  fontSize: FontSize;
  dns1: string;
  dns2: string;
  trafficMode: TrafficMode;
  muxEnabled: boolean;
  muxConcurrency: number;
  noiseEnabled: boolean;
}

interface SettingsContextType extends Settings {
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  fontScale: number;
}

const defaults: Settings = {
  language: 'ru',
  fontSize: 'medium',
  dns1: '1.1.1.1',
  dns2: '8.8.8.8',
  trafficMode: 'balanced',
  muxEnabled: false,
  muxConcurrency: 8,
  noiseEnabled: false,
};

const fontScales = { small: 0.85, medium: 1, large: 1.15 };

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaults);

  useEffect(() => {
    AsyncStorage.getItem('app_settings').then((raw) => {
      if (raw) {
        try {
          setSettings({ ...defaults, ...JSON.parse(raw) });
        } catch {}
      }
    });
  }, []);

  const setSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await AsyncStorage.setItem('app_settings', JSON.stringify(next));
  };

  return (
    <SettingsContext.Provider
      value={{ ...settings, setSetting, fontScale: fontScales[settings.fontSize] }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
