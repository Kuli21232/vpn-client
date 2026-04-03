import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import ConnectButton from '../components/ConnectButton';
import LocationList from '../components/LocationList';
import { Ionicons } from '@expo/vector-icons';

const STATUS_LABELS: Record<string, { ru: string; en: string }> = {
  disconnected: { ru: 'Нажмите для подключения', en: 'Tap to connect' },
  connecting: { ru: 'Установка туннеля...', en: 'Setting up tunnel...' },
  connected: { ru: '', en: '' },
  disconnecting: { ru: 'Отключение...', en: 'Disconnecting...' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { language, fontScale } = useSettings();
  const {
    vpnStatus,
    setVpnStatus,
    selectedLocation,
    setSelectedLocation,
    locations,
    ping,
    setPing,
    sentBytes,
    setSentBytes,
    receivedBytes,
    setReceivedBytes,
  } = useApp();

  const trafficInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (vpnStatus === 'connected') {
      Animated.timing(statsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      trafficInterval.current = setInterval(() => {
        setSentBytes((prev) => prev + Math.floor(Math.random() * 800 + 100));
        setReceivedBytes((prev) => prev + Math.floor(Math.random() * 3000 + 500));
      }, 1000);
    } else {
      Animated.timing(statsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      if (trafficInterval.current) {
        clearInterval(trafficInterval.current);
        trafficInterval.current = null;
      }
      if (vpnStatus === 'disconnected') {
        setSentBytes(0);
        setReceivedBytes(0);
      }
    }
    return () => {
      if (trafficInterval.current) clearInterval(trafficInterval.current);
    };
  }, [vpnStatus]);

  const handleConnect = useCallback(() => {
    if (vpnStatus === 'disconnected') {
      setVpnStatus('connecting');
      setTimeout(() => setVpnStatus('connected'), 2000 + Math.random() * 1000);
    } else if (vpnStatus === 'connected') {
      setVpnStatus('disconnecting');
      setTimeout(() => setVpnStatus('disconnected'), 1200);
    }
  }, [vpnStatus]);

  const handlePing = useCallback(() => {
    setPing(null);
    setTimeout(() => setPing(Math.floor(Math.random() * 60 + 15)), 800);
  }, []);

  const handleRefresh = useCallback(() => {
    if (vpnStatus === 'connected') {
      setVpnStatus('disconnecting');
      setTimeout(() => {
        setVpnStatus('connecting');
        setTimeout(() => setVpnStatus('connected'), 2000);
      }, 1000);
    }
  }, [vpnStatus]);

  const isConnected = vpnStatus === 'connected';
  const statusLabel = STATUS_LABELS[vpnStatus]?.[language] ?? '';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentInset={{ bottom: 90 }}
      >
        <View style={styles.buttonSection}>
          <ConnectButton status={vpnStatus} onPress={handleConnect} />

          {isConnected && (
            <Animated.View style={[styles.connectedMeta, { opacity: statsOpacity }]}>
              <Text style={[styles.locationLabel, { color: colors.fg, fontSize: 15 * fontScale }]}>
                • {selectedLocation.name}
              </Text>
              <Text style={[styles.metaLine, { color: colors.glass45, fontSize: 11 * fontScale }]}>
                DNS 1.1.1.1/8.8.8.8 • MUX off • MTU 1300 • Noise off
              </Text>
            </Animated.View>
          )}

          {!isConnected && statusLabel ? (
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.active : colors.glass30 }]} />
              <Text style={[styles.statusText, { color: colors.glass60, fontSize: 13 * fontScale }]}>
                {statusLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {isConnected && (
          <Animated.View style={[styles.statsCard, { backgroundColor: colors.glass04, borderColor: colors.glass12, opacity: statsOpacity }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statArrow, { color: colors.glass45, fontSize: 11 * fontScale }]}>↑</Text>
              <Text style={[styles.statValue, { color: colors.fg, fontSize: 20 * fontScale }]}>
                {formatBytes(sentBytes)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.glass45, fontSize: 10 * fontScale }]}>
                {language === 'ru' ? 'ОТПРАВЛЕНО' : 'SENT'}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.glass12 }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statArrow, { color: colors.glass45, fontSize: 11 * fontScale }]}>↓</Text>
              <Text style={[styles.statValue, { color: colors.fg, fontSize: 20 * fontScale }]}>
                {formatBytes(receivedBytes)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.glass45, fontSize: 10 * fontScale }]}>
                {language === 'ru' ? 'ПОЛУЧЕНО' : 'RECEIVED'}
              </Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: colors.fg, fontSize: 13 * fontScale }]}>
              ↺  {language === 'ru' ? 'ОБНОВИТЬ' : 'REFRESH'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}
            onPress={handlePing}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: colors.fg, fontSize: 13 * fontScale }]}>
              ◉  {language === 'ru' ? 'ПИНГ' : 'PING'}
              {ping !== null ? `  ${ping} ms` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <LocationList
          locations={locations}
          selected={selectedLocation}
          onSelect={setSelectedLocation}
        />

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
    gap: 16,
  },
  buttonSection: {
    alignItems: 'center',
    paddingBottom: 10,
    gap: 20,
    minHeight: 240,
    justifyContent: 'center',
  },
  connectedMeta: {
    alignItems: 'center',
    gap: 5,
  },
  locationLabel: {
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  metaLine: {
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    letterSpacing: 1,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 4,
  },
  statArrow: {
    letterSpacing: 0.5,
  },
  statValue: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statLabel: {
    letterSpacing: 1.5,
  },
  statDivider: {
    width: 1,
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    fontWeight: '500',
    letterSpacing: 1.2,
  },
});
