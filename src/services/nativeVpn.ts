import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { OnDemandMode, PingProtocol } from '../context/SettingsContext';
import { VpnStatus } from '../types/app';

interface NativeVpnModuleShape {
  prepare(): Promise<boolean>;
  connect(config: NativeVpnConfig): Promise<boolean>;
  disconnect(): Promise<boolean>;
  getStatus(): Promise<string>;
}

interface NativeStatusEvent {
  status?: string;
  reason?: string | null;
}

export interface NativeVpnConfig {
  sessionName: string;
  nodeName: string;
  nodeAddress: string;
  nodePort: number;
  protocol: string;
  pingProtocol: PingProtocol;
  onDemandMode: OnDemandMode;
  dnsServers: string[];
  routeAllTraffic: boolean;
  muxEnabled: boolean;
  fragmentationEnabled: boolean;
  mtu: number;
}

const nativeModule = NativeModules.SpacyVpnModule as NativeVpnModuleShape | undefined;
const emitter =
  Platform.OS === 'android' && nativeModule ? new NativeEventEmitter(NativeModules.SpacyVpnModule) : null;

function normalizeStatus(status: string | undefined | null): VpnStatus {
  if (status === 'connecting' || status === 'connected' || status === 'disconnecting') {
    return status;
  }

  return 'disconnected';
}

export function isNativeVpnSupported() {
  return Platform.OS === 'android' && Boolean(nativeModule);
}

export async function getNativeVpnStatus(): Promise<VpnStatus> {
  if (!nativeModule || Platform.OS !== 'android') {
    return 'disconnected';
  }

  try {
    return normalizeStatus(await nativeModule.getStatus());
  } catch {
    return 'disconnected';
  }
}

export async function connectNativeVpn(config: NativeVpnConfig) {
  if (!nativeModule || Platform.OS !== 'android') {
    return false;
  }

  const granted = await nativeModule.prepare();
  if (!granted) {
    throw new Error('VPN permission was not granted.');
  }

  return nativeModule.connect(config);
}

export async function disconnectNativeVpn() {
  if (!nativeModule || Platform.OS !== 'android') {
    return false;
  }

  return nativeModule.disconnect();
}

export function addNativeVpnStatusListener(
  listener: (status: VpnStatus, reason?: string | null) => void
) {
  if (!emitter) {
    return {
      remove() {
        return undefined;
      },
    };
  }

  return emitter.addListener('SpacyVpnStatusChanged', (event: NativeStatusEvent) => {
    listener(normalizeStatus(event.status), event.reason ?? null);
  });
}
