import React, { createContext, useContext, useState, ReactNode } from 'react';

export type VpnStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

export interface Location {
  id: string;
  name: string;
  flag: string;
  country: string;
}

export interface UserProfile {
  username: string;
  id: string;
  avatar?: string;
  daysLeft: number;
  trafficLeft: number;
  expiresAt: string;
  isActive: boolean;
}

interface AppContextType {
  vpnStatus: VpnStatus;
  selectedLocation: Location;
  locations: Location[];
  profile: UserProfile | null;
  isAuthenticated: boolean;
  ping: number | null;
  sentBytes: number;
  receivedBytes: number;
  setVpnStatus: (s: VpnStatus) => void;
  setSelectedLocation: (l: Location) => void;
  setProfile: (p: UserProfile | null) => void;
  setIsAuthenticated: (v: boolean) => void;
  setPing: (p: number | null) => void;
  setSentBytes: React.Dispatch<React.SetStateAction<number>>;
  setReceivedBytes: React.Dispatch<React.SetStateAction<number>>;
}

const defaultLocations: Location[] = [
  { id: 'de', name: 'Германия', flag: '🇩🇪', country: 'Germany' },
  { id: 'fi', name: 'Финляндия', flag: '🇫🇮', country: 'Finland' },
  { id: 'ru-bypass', name: 'Обход блокировок (с ютубом)', flag: '🇷🇺', country: 'Russia' },
  { id: 'ru-whitelist', name: 'Обход белых списков', flag: '🇷🇺', country: 'Russia' },
];

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [vpnStatus, setVpnStatus] = useState<VpnStatus>('disconnected');
  const [selectedLocation, setSelectedLocation] = useState<Location>(defaultLocations[0]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ping, setPing] = useState<number | null>(null);
  const [sentBytes, setSentBytes] = useState(0);
  const [receivedBytes, setReceivedBytes] = useState(0);

  return (
    <AppContext.Provider
      value={{
        vpnStatus,
        selectedLocation,
        locations: defaultLocations,
        profile,
        isAuthenticated,
        ping,
        sentBytes,
        receivedBytes,
        setVpnStatus,
        setSelectedLocation,
        setProfile,
        setIsAuthenticated,
        setPing,
        setSentBytes,
        setReceivedBytes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
