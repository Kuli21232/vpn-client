export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  bg: string;
  fg: string;
  btnBg: string;
  btnText: string;
  glass04: string;
  glass08: string;
  glass12: string;
  glass20: string;
  glass30: string;
  glass45: string;
  glass60: string;
  glass80: string;
  active: string;
  warning: string;
  error: string;
  debugLog: string;
  infoLog: string;
  separator: string;
}

export const darkColors: ThemeColors = {
  bg: '#000000',
  fg: '#FFFFFF',
  btnBg: '#FFFFFF',
  btnText: '#000000',
  glass04: 'rgba(255,255,255,0.04)',
  glass08: 'rgba(255,255,255,0.08)',
  glass12: 'rgba(255,255,255,0.12)',
  glass20: 'rgba(255,255,255,0.20)',
  glass30: 'rgba(255,255,255,0.30)',
  glass45: 'rgba(255,255,255,0.45)',
  glass60: 'rgba(255,255,255,0.60)',
  glass80: 'rgba(255,255,255,0.80)',
  active: '#34C759',
  warning: 'rgba(255,149,0,0.75)',
  error: '#FF3B30',
  debugLog: '#007AFF',
  infoLog: '#34C759',
  separator: 'rgba(255,255,255,0.08)',
};

export const lightColors: ThemeColors = {
  bg: '#FFFFFF',
  fg: '#000000',
  btnBg: '#000000',
  btnText: '#FFFFFF',
  glass04: 'rgba(0,0,0,0.04)',
  glass08: 'rgba(0,0,0,0.08)',
  glass12: 'rgba(0,0,0,0.12)',
  glass20: 'rgba(0,0,0,0.20)',
  glass30: 'rgba(0,0,0,0.30)',
  glass45: 'rgba(0,0,0,0.45)',
  glass60: 'rgba(0,0,0,0.60)',
  glass80: 'rgba(0,0,0,0.80)',
  active: '#34C759',
  warning: 'rgba(255,149,0,0.75)',
  error: '#FF3B30',
  debugLog: '#007AFF',
  infoLog: '#34C759',
  separator: 'rgba(0,0,0,0.08)',
};
