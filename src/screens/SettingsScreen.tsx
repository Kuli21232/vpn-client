import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Switch, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  DnsPreset,
  FontSize,
  Language,
  OnDemandMode,
  PingProtocol,
  useSettings,
} from '../context/SettingsContext';
import { ThemeMode } from '../theme/colors';
import { mono } from '../theme/typography';

export default function SettingsScreen() {
  const { colors, isDark, mode, setMode } = useTheme();
  const {
    applyDnsPreset,
    dns1,
    dns2,
    dnsPreset,
    fontScale,
    fontSize,
    fragmentationEnabled,
    language,
    muxEnabled,
    onDemandMode,
    pingProtocol,
    routeAllTraffic,
    setSetting,
  } = useSettings();

  const t = (ru: string, en: string) => (language === 'ru' ? ru : en);

  const cycleValue = async <T extends string>(
    values: T[],
    current: T,
    onChange: (next: T) => Promise<void> | void
  ) => {
    const currentIndex = values.indexOf(current);
    const next = values[(currentIndex + 1) % values.length];
    await onChange(next);
  };

  const SectionTitle = ({ label }: { label: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.glass45, fontSize: 11 * fontScale }]}>
      {label}
    </Text>
  );

  const OptionRow = ({
    icon,
    label,
    value,
    onPress,
    isLast = false,
  }: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    value: string;
    onPress: () => void;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.optionRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.glass08 },
      ]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={[styles.optionIconWrap, { backgroundColor: colors.glass08 }]}>
        <MaterialIcons name={icon} size={20} color={colors.glass60} />
      </View>
      <Text style={[styles.optionLabel, { color: colors.fg, fontSize: 15 * fontScale }]}>
        {label}
      </Text>
      <Text style={[styles.optionValue, { color: colors.glass60, fontSize: 14 * fontScale }]}>
        {value}
      </Text>
      <MaterialIcons name="expand-more" size={18} color={colors.glass45} />
    </TouchableOpacity>
  );

  const ToggleRow = ({
    icon,
    label,
    value,
    onChange,
    isLast = false,
  }: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    value: boolean;
    onChange: (next: boolean) => Promise<void>;
    isLast?: boolean;
  }) => (
    <View
      style={[
        styles.optionRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.glass08 },
      ]}
    >
      <View style={[styles.optionIconWrap, { backgroundColor: colors.glass08 }]}>
        <MaterialIcons name={icon} size={20} color={colors.glass60} />
      </View>
      <Text style={[styles.optionLabel, { color: colors.fg, fontSize: 15 * fontScale }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={(next) => {
          void onChange(next);
        }}
        trackColor={{ false: colors.glass20, true: colors.glass45 }}
        thumbColor={colors.fg}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.fg, fontSize: 28 * fontScale }]}>
          {t('НАСТРОЙКИ', 'SETTINGS')}
        </Text>
        <Text style={[styles.version, { color: colors.glass45, fontSize: 12 * fontScale }]}>Spacy v1.0.0</Text>

        <SectionTitle label={t('ИНТЕРФЕЙС', 'INTERFACE')} />
        <View style={[styles.card, { backgroundColor: colors.glass04 }]}>
          <OptionRow
            icon="contrast"
            label={t('ТЕМА', 'THEME')}
            value={mode[0].toUpperCase() + mode.slice(1)}
            onPress={() => {
              void cycleValue<ThemeMode>(['dark', 'light', 'system'], mode, setMode);
            }}
          />
          <OptionRow
            icon="translate"
            label={t('ЯЗЫК', 'LANGUAGE')}
            value={language === 'ru' ? 'Russian' : 'English'}
            onPress={() => {
              void cycleValue<Language>(['ru', 'en'], language, (next) => setSetting('language', next));
            }}
          />
          <OptionRow
            icon="text-fields"
            label={t('РАЗМЕР ШРИФТА', 'FONT SIZE')}
            value={fontSize[0].toUpperCase() + fontSize.slice(1)}
            onPress={() => {
              void cycleValue<FontSize>(['small', 'medium', 'large'], fontSize, (next) =>
                setSetting('fontSize', next)
              );
            }}
            isLast
          />
        </View>

        <SectionTitle label={t('ПОДПИСКА', 'SUBSCRIPTION')} />
        <View style={[styles.card, { backgroundColor: colors.glass04 }]}>
          <OptionRow
            icon="speed"
            label={t('ПРОТОКОЛ ПИНГА', 'PING PROTOCOL')}
            value={pingProtocol.toUpperCase()}
            onPress={() => {
              void cycleValue<PingProtocol>(['tcp', 'udp'], pingProtocol, (next) =>
                setSetting('pingProtocol', next)
              );
            }}
            isLast
          />
        </View>

        <SectionTitle label={t('СЕТЬ', 'NETWORK')} />
        <View style={[styles.card, { backgroundColor: colors.glass04 }]}>
          <OptionRow
            icon="mobile-friendly"
            label={t('ПО ТРЕБОВАНИЮ', 'ON DEMAND')}
            value={
              onDemandMode === 'off'
                ? 'Off'
                : onDemandMode === 'wifi'
                ? 'Wi-Fi'
                : 'Always'
            }
            onPress={() => {
              void cycleValue<OnDemandMode>(['off', 'wifi', 'always'], onDemandMode, (next) =>
                setSetting('onDemandMode', next)
              );
            }}
          />
          <ToggleRow
            icon="swap-horiz"
            label="ENABLE MUX"
            value={muxEnabled}
            onChange={(next) => setSetting('muxEnabled', next)}
          />
          <ToggleRow
            icon="filter-center-focus"
            label="ENABLE FRAGMENTATION"
            value={fragmentationEnabled}
            onChange={(next) => setSetting('fragmentationEnabled', next)}
          />
          <OptionRow
            icon="dns"
            label="DNS PRESET"
            value={dnsPreset[0].toUpperCase() + dnsPreset.slice(1)}
            onPress={() => {
              void cycleValue<DnsPreset>(['custom', 'cloudflare', 'google'], dnsPreset, applyDnsPreset);
            }}
            isLast
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.glass04 }]}>
          <Text style={[styles.inputLabel, { color: colors.glass45, fontSize: 11 * fontScale }]}>
            Primary DNS
          </Text>
          <TextInput
            value={dns1}
            onChangeText={(next) => {
              void setSetting('dns1', next);
            }}
            style={[styles.input, { color: colors.fg, fontSize: 15 * fontScale, borderColor: colors.glass08 }]}
            placeholderTextColor={colors.glass30}
          />

          <Text style={[styles.inputLabel, { color: colors.glass45, fontSize: 11 * fontScale, marginTop: 14 }]}>
            Secondary DNS
          </Text>
          <TextInput
            value={dns2}
            onChangeText={(next) => {
              void setSetting('dns2', next);
            }}
            style={[styles.input, { color: colors.fg, fontSize: 15 * fontScale, borderColor: colors.glass08 }]}
            placeholderTextColor={colors.glass30}
          />
        </View>

        <SectionTitle label={t('МАРШРУТИЗАЦИЯ', 'ROUTING')} />
        <View style={[styles.card, { backgroundColor: colors.glass04 }]}>
          <ToggleRow
            icon="alt-route"
            label={t('ВКЛЮЧИТЬ ROUTING', 'ENABLE ROUTING')}
            value={routeAllTraffic}
            onChange={(next) => setSetting('routeAllTraffic', next)}
            isLast
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
  },
  title: {
    fontFamily: mono.light,
    letterSpacing: 2.6,
  },
  version: { fontFamily: mono.regular },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    fontFamily: mono.bold,
    letterSpacing: 2,
  },
  card: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontFamily: mono.bold,
    letterSpacing: 0.2,
  },
  optionValue: {
    fontFamily: mono.regular,
  },
  inputLabel: {
    marginBottom: 8,
    fontFamily: mono.bold,
    letterSpacing: 1.4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: mono.regular,
  },
});
