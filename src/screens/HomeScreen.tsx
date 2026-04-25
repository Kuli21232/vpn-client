import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import ConnectButton from '../components/ConnectButton';
import LocationList from '../components/LocationList';
import { mono } from '../theme/typography';

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const {
    dnsPreset,
    dns1,
    dns2,
    fontScale,
    fragmentationEnabled,
    language,
    muxEnabled,
    pingProtocol,
  } = useSettings();
  const {
    activeSubscriptionName,
    isPingingNodes,
    isRefreshingNodes,
    nodes,
    pingNodes,
    refreshNodes,
    selectNode,
    selectedNode,
    sentBytes,
    receivedBytes,
    toggleConnection,
    vpnStatus,
  } = useApp();

  const t = (ru: string, en: string) => (language === 'ru' ? ru : en);

  const statusCopy =
    vpnStatus === 'connected'
      ? t('ТУННЕЛЬ АКТИВЕН', 'TUNNEL ACTIVE')
      : vpnStatus === 'connecting'
      ? t('ПОДКЛЮЧАЕМСЯ К УЗЛУ', 'CONNECTING TO NODE')
      : vpnStatus === 'disconnecting'
      ? t('ОТКЛЮЧАЕМ ТУННЕЛЬ', 'DISCONNECTING')
      : t('Нажмите для подключения', 'Tap to connect');

  const dnsLabel = dnsPreset === 'custom' ? `${dns1}/${dns2}` : dnsPreset.toUpperCase();
  const metaLine = `${pingProtocol.toUpperCase()} / ${dnsLabel} / MUX ${muxEnabled ? 'on' : 'off'} / FRAG ${
    fragmentationEnabled ? 'on' : 'off'
  }`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.hero}>
          <ConnectButton status={vpnStatus} onPress={toggleConnection} />

          <View style={styles.heroCopy}>
            <Text style={[styles.statusLabel, { color: colors.glass45, fontSize: 15 * fontScale }]}>
              {statusCopy}
            </Text>

            {selectedNode ? (
              <View style={styles.selectedNodeBlock}>
                <Text style={[styles.selectedNodeName, { color: colors.fg, fontSize: 14 * fontScale }]}>
                  {selectedNode.flag} {selectedNode.name}
                </Text>
                <Text style={[styles.metaLine, { color: colors.glass45, fontSize: 10 * fontScale }]}>
                  {metaLine}
                </Text>
                {activeSubscriptionName ? (
                  <Text style={[styles.metaLine, { color: colors.glass30, fontSize: 10 * fontScale }]}>
                    {activeSubscriptionName}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.trafficCard, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}>
          <View style={styles.trafficBlock}>
            <Text style={[styles.trafficLabel, { color: colors.glass45, fontSize: 11 * fontScale }]}>
              {t('ОТПРАВЛЕНО', 'UPLINK')}
            </Text>
            <Text style={[styles.trafficValue, { color: colors.fg, fontSize: 18 * fontScale }]}>
              {formatBytes(sentBytes)}
            </Text>
          </View>

          <View style={[styles.trafficDivider, { backgroundColor: colors.glass08 }]} />

          <View style={styles.trafficBlock}>
            <Text style={[styles.trafficLabel, { color: colors.glass45, fontSize: 11 * fontScale }]}>
              {t('ПОЛУЧЕНО', 'DOWNLINK')}
            </Text>
            <Text style={[styles.trafficValue, { color: colors.fg, fontSize: 18 * fontScale }]}>
              {formatBytes(receivedBytes)}
            </Text>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.glass45, fontSize: 11 * fontScale }]}>
            {t('ЛОКАЦИИ', 'LOCATIONS')} / {nodes.length}
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.glass08 }]}
              onPress={refreshNodes}
              activeOpacity={0.72}
            >
              <MaterialIcons name="refresh" size={16} color={colors.fg} />
              <Text style={[styles.headerButtonLabel, { color: colors.fg, fontSize: 11 * fontScale }]}>
                {isRefreshingNodes ? t('ОБНОВЛЯЕМ', 'SYNCING') : t('ОБНОВИТЬ', 'REFRESH')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.glass08 }]}
              onPress={pingNodes}
              activeOpacity={0.72}
            >
              <MaterialIcons name="speed" size={16} color={colors.fg} />
              <Text style={[styles.headerButtonLabel, { color: colors.fg, fontSize: 11 * fontScale }]}>
                {isPingingNodes ? t('ПИНГУЕМ', 'PINGING') : t('ПИНГ', 'PING')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <LocationList
          nodes={nodes}
          selectedId={selectedNode?.id ?? null}
          onSelect={(nodeId) => {
            void selectNode(nodeId);
          }}
        />

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 14,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  heroCopy: {
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontFamily: mono.regular,
    letterSpacing: 0.2,
  },
  selectedNodeBlock: {
    alignItems: 'center',
    gap: 2,
  },
  selectedNodeName: {
    fontFamily: mono.light,
    letterSpacing: 0,
  },
  metaLine: {
    textAlign: 'center',
    fontFamily: mono.regular,
  },
  trafficCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 13,
  },
  trafficBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  trafficLabel: {
    fontFamily: mono.bold,
    letterSpacing: 1.5,
  },
  trafficValue: {
    fontFamily: mono.bold,
  },
  trafficDivider: {
    width: 1,
    marginVertical: 6,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  listTitle: {
    fontFamily: mono.bold,
    letterSpacing: 2.1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  headerButtonLabel: {
    fontFamily: mono.bold,
    letterSpacing: 0.8,
  },
});
