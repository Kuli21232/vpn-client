import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'ru' | 'en';
export type FontSize = 'small' | 'medium' | 'large';
export type PingProtocol = 'tcp' | 'udp';
export type OnDemandMode = 'off' | 'wifi' | 'always';
export type DnsPreset = 'custom' | 'cloudflare' | 'google';

interface Settings {
  language: Language;
  fontSize: FontSize;
  pingProtocol: PingProtocol;
  onDemandMode: OnDemandMode;
  muxEnabled: boolean;
  fragmentationEnabled: boolean;
  dnsPreset: DnsPreset;
  dns1: string;
  dns2: string;
  routeAllTraffic: boolean;
}

interface SettingsContextType extends Settings {
  fontScale: number;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  applyDnsPreset: (preset: DnsPreset) => Promise<void>;
}

const STORAGE_KEY = 'spacy.app.settings';

const defaults: Settings = {
  language: 'ru',
  fontSize: 'small',
  pingProtocol: 'tcp',
  onDemandMode: 'off',
  muxEnabled: false,
  fragmentationEnabled: false,
  dnsPreset: 'custom',
  dns1: '1.1.1.4',
  dns2: '8.8.8.8',
  routeAllTraffic: true,
};

const presetValues: Record<DnsPreset, Pick<Settings, 'dns1' | 'dns2'>> = {
  custom: { dns1: defaults.dns1, dns2: defaults.dns2 },
  cloudflare: { dns1: '1.1.1.1', dns2: '1.0.0.1' },
  google: { dns1: '8.8.8.8', dns2: '8.8.4.4' },
};

const fontScales: Record<FontSize, number> = {
  small: 0.86,
  medium: 0.94,
  large: 1.02,
};

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaults);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) {
        return;
      }

      try {
        setSettings({
          ...defaults,
          ...(JSON.parse(raw) as Partial<Settings>),
        });
      } catch {
        setSettings(defaults);
      }
    });
  }, []);

  const persist = async (next: Settings) => {
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = {
      ...settings,
      [key]: value,
      ...(key === 'dns1' || key === 'dns2' ? { dnsPreset: 'custom' as const } : {}),
    };
    await persist(next);
  };

  const applyDnsPreset = async (preset: DnsPreset) => {
    const next = {
      ...settings,
      dnsPreset: preset,
      ...presetValues[preset],
    };
    await persist(next);
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        fontScale: fontScales[settings.fontSize],
        setSetting,
        applyDnsPreset,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
