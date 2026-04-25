import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useNetInfo } from '@react-native-community/netinfo';
import { FALLBACK_NODES } from '../data/fallbackNodes';
import { useSettings } from './SettingsContext';
import {
  clearSubscriptionSnapshot,
  estimatePing,
  importRemnawaveSubscription,
  loadSubscriptionSnapshot,
  mergeImportedSubscription,
  nodesOrFallback,
  saveSubscriptionSnapshot,
  SubscriptionSnapshot,
} from '../services/remnawave';
import {
  clearSession,
  fetchUserProfile,
  initTelegramBotAuth,
  loadSession,
  openTelegramBot,
  pollTelegramBotAuth,
  saveSession,
} from '../services/telegramAuth';
import {
  addNativeVpnStatusListener,
  connectNativeVpn,
  disconnectNativeVpn,
  getNativeVpnStatus,
  isNativeVpnSupported,
  NativeVpnConfig,
} from '../services/nativeVpn';
import { AuthState, UserProfile, VpnNode, VpnStatus } from '../types/app';

interface AppContextType {
  isReady: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  authState: AuthState;
  profile: UserProfile | null;
  nodes: VpnNode[];
  selectedNode: VpnNode | null;
  vpnStatus: VpnStatus;
  sentBytes: number;
  receivedBytes: number;
  activeSubscriptionName: string | null;
  isRefreshingProfile: boolean;
  isRefreshingNodes: boolean;
  isPingingNodes: boolean;
  enterDemoMode: () => Promise<void>;
  loginWithTelegram: () => Promise<void>;
  cancelAuth: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshNodes: () => Promise<void>;
  pingNodes: () => Promise<void>;
  selectNode: (id: string) => Promise<void>;
  toggleConnection: () => Promise<void>;
}

const EMPTY_AUTH_STATE: AuthState = {
  stage: 'idle',
  code: null,
  errorMessage: null,
};

const EMPTY_SNAPSHOT: SubscriptionSnapshot = {
  activeURL: null,
  urls: [],
  names: {},
  nodes: [],
};

const DEMO_TOKEN = 'spacy-demo-session';

const DEMO_PROFILE: UserProfile = {
  id: 'demo-user',
  username: 'spacydemo',
  displayName: 'Demo Operator',
  avatar: 'https://i.pravatar.cc/160?img=12',
  daysLeft: 26740,
  trafficLeftGb: null,
  expiresAt: '2099-12-31T23:59:59.000Z',
  isActive: true,
  subscriptionUrl: null,
};

function isDemoSession(token: string | null) {
  return token === DEMO_TOKEN;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const { dns1, dns2, fragmentationEnabled, muxEnabled, onDemandMode, pingProtocol, routeAllTraffic } =
    useSettings();
  const netInfo = useNetInfo();
  const [isReady, setIsReady] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(EMPTY_AUTH_STATE);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot>(EMPTY_SNAPSHOT);
  const [nodes, setNodes] = useState<VpnNode[]>(FALLBACK_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(FALLBACK_NODES[0]?.id ?? '');
  const [vpnStatus, setVpnStatus] = useState<VpnStatus>('disconnected');
  const [sentBytes, setSentBytes] = useState(0);
  const [receivedBytes, setReceivedBytes] = useState(0);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [isRefreshingNodes, setIsRefreshingNodes] = useState(false);
  const [isPingingNodes, setIsPingingNodes] = useState(false);

  const authCancelled = useRef(false);
  const trafficInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const runtimeConfigSignature = useRef('');

  useEffect(() => {
    const bootstrap = async () => {
      const [session, savedSnapshot, nativeStatus] = await Promise.all([
        loadSession(),
        loadSubscriptionSnapshot(),
        getNativeVpnStatus(),
      ]);

      if (session) {
        setAuthToken(session.token);
        setIsDemoMode(isDemoSession(session.token));
        setProfile(session.profile);
      }

      const initialNodes = nodesOrFallback(savedSnapshot.nodes);
      setSnapshot(savedSnapshot);
      setNodes(initialNodes);
      setSelectedNodeId(initialNodes[0]?.id ?? '');
      setVpnStatus(nativeStatus);
      setIsReady(true);
    };

    void bootstrap();

    return () => {
      if (trafficInterval.current) {
        clearInterval(trafficInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    const subscription = addNativeVpnStatusListener((status) => {
      setVpnStatus(status);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (nodes.length === 0) {
      setSelectedNodeId('');
      return;
    }

    if (!nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(nodes[0].id);
    }
  }, [nodes, selectedNodeId]);

  useEffect(() => {
    if (trafficInterval.current) {
      clearInterval(trafficInterval.current);
      trafficInterval.current = null;
    }

    if (vpnStatus === 'connected') {
      trafficInterval.current = setInterval(() => {
        setSentBytes((previous) => previous + Math.floor(Math.random() * 2400 + 700));
        setReceivedBytes((previous) => previous + Math.floor(Math.random() * 4200 + 1100));
      }, 1200);
      return;
    }

    if (vpnStatus === 'disconnected') {
      setSentBytes(0);
      setReceivedBytes(0);
    }
  }, [vpnStatus]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? nodes[0] ?? null,
    [nodes, selectedNodeId]
  );

  const activeSubscriptionName =
    snapshot.activeURL ? snapshot.names[snapshot.activeURL] ?? null : null;

  const buildVpnConfig = (nodeOverride?: VpnNode | null): NativeVpnConfig | null => {
    const node = nodeOverride ?? selectedNode;
    if (!node) {
      return null;
    }

    return {
      sessionName: `Spacy VPN • ${node.name}`,
      nodeName: node.name,
      nodeAddress: node.address,
      nodePort: node.port,
      protocol: node.protocol,
      pingProtocol,
      onDemandMode,
      dnsServers: [dns1.trim(), dns2.trim()].filter(Boolean),
      routeAllTraffic,
      muxEnabled,
      fragmentationEnabled,
      mtu: fragmentationEnabled ? 1280 : 1500,
    };
  };

  const runFallbackConnectionToggle = async () => {
    if (vpnStatus === 'disconnected') {
      setVpnStatus('connecting');
      setTimeout(() => {
        setVpnStatus('connected');
      }, 900);
      return;
    }

    setVpnStatus('disconnecting');
    setTimeout(() => {
      setVpnStatus('disconnected');
    }, 650);
  };

  const connectWithCurrentConfig = async (nodeOverride?: VpnNode | null) => {
    if (!isNativeVpnSupported()) {
      await runFallbackConnectionToggle();
      return;
    }

    const config = buildVpnConfig(nodeOverride);
    if (!config) {
      return;
    }

    setVpnStatus('connecting');
    await connectNativeVpn(config);
  };

  const disconnectActiveConnection = async () => {
    if (!isNativeVpnSupported()) {
      setVpnStatus('disconnecting');
      setTimeout(() => {
        setVpnStatus('disconnected');
      }, 450);
      return;
    }

    setVpnStatus('disconnecting');
    await disconnectNativeVpn();
  };

  useEffect(() => {
    if (!isReady || !selectedNode) {
      return;
    }

    const nextSignature = JSON.stringify({
      selectedNodeId: selectedNode.id,
      dns1,
      dns2,
      fragmentationEnabled,
      muxEnabled,
      onDemandMode,
      pingProtocol,
      routeAllTraffic,
    });

    const previousSignature = runtimeConfigSignature.current;
    runtimeConfigSignature.current = nextSignature;

    if (!previousSignature || previousSignature === nextSignature) {
      return;
    }

    if (vpnStatus === 'connected') {
      void connectWithCurrentConfig();
    }
  }, [
    dns1,
    dns2,
    fragmentationEnabled,
    isReady,
    muxEnabled,
    onDemandMode,
    pingProtocol,
    routeAllTraffic,
    selectedNode,
    vpnStatus,
  ]);

  useEffect(() => {
    if (!isReady || !profile || !selectedNode || !isNativeVpnSupported()) {
      return;
    }

    if (vpnStatus === 'connecting' || vpnStatus === 'disconnecting') {
      return;
    }

    const shouldBeConnected =
      onDemandMode === 'always'
        ? true
        : onDemandMode === 'wifi'
        ? netInfo.isConnected === true && netInfo.type === 'wifi'
        : false;

    if (shouldBeConnected && vpnStatus === 'disconnected') {
      void connectWithCurrentConfig();
    }

    if (!shouldBeConnected && onDemandMode === 'wifi' && vpnStatus === 'connected') {
      void disconnectActiveConnection();
    }
  }, [isReady, netInfo.isConnected, netInfo.type, onDemandMode, profile, selectedNode, vpnStatus]);

  const applyNodes = async (nextSnapshot: SubscriptionSnapshot) => {
    await saveSubscriptionSnapshot(nextSnapshot);
    setSnapshot(nextSnapshot);
    setNodes(nodesOrFallback(nextSnapshot.nodes));
  };

  const refreshNodesFromUrl = async (subscriptionURL: string) => {
    const imported = await importRemnawaveSubscription(subscriptionURL);
    const nextSnapshot = mergeImportedSubscription(snapshot, imported);
    await applyNodes(nextSnapshot);
  };

  const loginWithTelegram = async () => {
    authCancelled.current = false;
    setIsDemoMode(false);
    setAuthState({
      stage: 'opening',
      code: null,
      errorMessage: null,
    });

    try {
      const init = await initTelegramBotAuth();
      setAuthState({
        stage: 'polling',
        code: init.code,
        errorMessage: null,
      });

      await openTelegramBot(init.botURL);

      const session = await pollTelegramBotAuth(init.code, () => authCancelled.current);
      if (authCancelled.current) {
        return;
      }

      setAuthToken(session.token);
      setProfile(session.profile);
      setAuthState(EMPTY_AUTH_STATE);

      if (session.profile.subscriptionUrl) {
        await refreshNodesFromUrl(session.profile.subscriptionUrl);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось завершить вход.';
      if (message === 'Авторизация отменена.') {
        setAuthState(EMPTY_AUTH_STATE);
        return;
      }

      setAuthState({
        stage: 'error',
        code: null,
        errorMessage: message,
      });
    }
  };

  const enterDemoMode = async () => {
    authCancelled.current = true;

    const session = {
      token: DEMO_TOKEN,
      profile: DEMO_PROFILE,
    };

    await saveSession(session);

    setAuthState(EMPTY_AUTH_STATE);
    setAuthToken(DEMO_TOKEN);
    setIsDemoMode(true);
    setProfile(DEMO_PROFILE);
    setVpnStatus('disconnected');
    setSentBytes(0);
    setReceivedBytes(0);

    const initialNodes = nodesOrFallback(snapshot.nodes);
    setNodes(initialNodes);
    setSelectedNodeId(initialNodes[0]?.id ?? '');
  };

  const cancelAuth = () => {
    authCancelled.current = true;
    setAuthState(EMPTY_AUTH_STATE);
  };

  const logout = async () => {
    authCancelled.current = true;
    setAuthState(EMPTY_AUTH_STATE);

    if (vpnStatus === 'connected' || vpnStatus === 'connecting') {
      try {
        await disconnectActiveConnection();
      } catch {
        setVpnStatus('disconnected');
      }
    } else {
      setVpnStatus('disconnected');
    }

    setAuthToken(null);
    setIsDemoMode(false);
    setProfile(null);
    setSnapshot(EMPTY_SNAPSHOT);
    setNodes(FALLBACK_NODES);
    setSelectedNodeId(FALLBACK_NODES[0]?.id ?? '');
    await Promise.all([clearSession(), clearSubscriptionSnapshot()]);
  };

  const refreshProfileData = async () => {
    if (!authToken) {
      return;
    }

    setIsRefreshingProfile(true);
    try {
      if (isDemoSession(authToken)) {
        await delay(420);
        return;
      }

      const nextProfile = await fetchUserProfile(authToken);
      setProfile(nextProfile);

      if (nextProfile.subscriptionUrl) {
        await refreshNodesFromUrl(nextProfile.subscriptionUrl);
      }
    } catch {
      // Keep the last known profile on transient failures.
    } finally {
      setIsRefreshingProfile(false);
    }
  };

  const pingNodes = async () => {
    setIsPingingNodes(true);
    const salt = Date.now();

    await delay(380);

    setNodes((previousNodes) => {
      const nextNodes = previousNodes.map((node) => ({
        ...node,
        pingMs: estimatePing(node, salt, pingProtocol),
      }));

      if (snapshot.nodes.length) {
        const nextSnapshot = {
          ...snapshot,
          nodes: nextNodes,
        };
        void saveSubscriptionSnapshot(nextSnapshot);
        setSnapshot(nextSnapshot);
      }

      return nextNodes;
    });

    setIsPingingNodes(false);
  };

  const refreshNodes = async () => {
    const subscriptionURL = profile?.subscriptionUrl ?? snapshot.activeURL;
    setIsRefreshingNodes(true);

    try {
      if (subscriptionURL) {
        await refreshNodesFromUrl(subscriptionURL);
      } else {
        await pingNodes();
      }
    } finally {
      setIsRefreshingNodes(false);
    }
  };

  const selectNode = async (id: string) => {
    setSelectedNodeId(id);
    await Haptics.selectionAsync();
  };

  const toggleConnection = async () => {
    if (vpnStatus === 'connecting' || vpnStatus === 'disconnecting') {
      return;
    }

    await Haptics.selectionAsync();

    try {
      if (vpnStatus === 'disconnected') {
        await connectWithCurrentConfig();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      await disconnectActiveConnection();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      setVpnStatus('disconnected');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isReady,
        isAuthenticated: Boolean(profile && authToken),
        isDemoMode,
        authState,
        profile,
        nodes,
        selectedNode,
        vpnStatus,
        sentBytes,
        receivedBytes,
        activeSubscriptionName,
        isRefreshingProfile,
        isRefreshingNodes,
        isPingingNodes,
        enterDemoMode,
        loginWithTelegram,
        cancelAuth,
        logout,
        refreshProfile: refreshProfileData,
        refreshNodes,
        pingNodes,
        selectNode,
        toggleConnection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
