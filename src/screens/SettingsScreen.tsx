import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings, Language, FontSize, TrafficMode } from '../context/SettingsContext';
import { ThemeMode } from '../theme/colors';

export default function SettingsScreen() {
  const { colors, isDark, mode, setMode } = useTheme();
  const {
    language, setSetting, fontSize, dns1, dns2,
    trafficMode, muxEnabled, muxConcurrency, noiseEnabled, fontScale,
  } = useSettings();

  const t = (ru: string, en: string) => (language === 'ru' ? ru : en);

  const SectionLabel = ({ label }: { label: string }) => (
    <Text style={[styles.sectionLabel, { color: colors.glass45, fontSize: 11 * fontScale, borderBottomColor: colors.glass08 }]}>
      {label}
    </Text>
  );

  const SegmentControl = <T extends string>({
    options,
    value,
    onChange,
    labels,
  }: {
    options: T[];
    value: T;
    onChange: (v: T) => void;
    labels?: string[];
  }) => (
    <View style={[styles.segment, { backgroundColor: colors.glass08, borderColor: colors.glass12 }]}>
      {options.map((opt, i) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              styles.segItem,
              active && { backgroundColor: colors.fg },
            ]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segText,
                {
                  color: active ? colors.bg : colors.glass60,
                  fontSize: 12 * fontScale,
                },
              ]}
            >
              {labels ? labels[i] : opt.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const ThemeOption = ({
    option,
    icon,
    label,
  }: {
    option: ThemeMode;
    icon: string;
    label: string;
  }) => {
    const active = mode === option;
    return (
      <TouchableOpacity
        style={[styles.themeRow, { borderBottomColor: colors.glass08 }]}
        onPress={() => setMode(option)}
        activeOpacity={0.7}
      >
        <Text style={[styles.themeIcon, { color: colors.glass60, fontSize: 16 }]}>{icon}</Text>
        <Text style={[styles.themeName, { color: active ? colors.fg : colors.glass80, fontSize: 15 * fontScale, fontWeight: active ? '500' : '400' }]}>
          {label}
        </Text>
        {active && <Text style={[styles.themeCheck, { color: colors.fg }]}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const DnsInput = ({ field, value }: { field: 'dns1' | 'dns2'; value: string }) => (
    <View style={[styles.inputWrap, { backgroundColor: colors.glass08, borderColor: colors.glass12 }]}>
      <TextInput
        value={value}
        onChangeText={(v) => setSetting(field, v)}
        style={[styles.input, { color: colors.fg, fontSize: 14 * fontScale }]}
        keyboardType="numeric"
        placeholderTextColor={colors.glass30}
        selectionColor={colors.fg}
      />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.fg, fontSize: 28 * fontScale }]}>
            {t('НАСТРОЙКИ', 'SETTINGS')}
          </Text>
          <Text style={[styles.version, { color: colors.glass45, fontSize: 12 * fontScale }]}>Spacy v1.0</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}>
          <SectionLabel label={t('ЯЗЫК', 'LANGUAGE')} />
          <SegmentControl<Language>
            options={['en', 'ru']}
            value={language}
            onChange={(v) => setSetting('language', v)}
            labels={['ENGLISH', 'RUSSIAN']}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}>
          <SectionLabel label={t('РАЗМЕР ШРИФТА', 'FONT SIZE')} />
          <SegmentControl<FontSize>
            options={['small', 'medium', 'large']}
            value={fontSize}
            onChange={(v) => setSetting('fontSize', v)}
            labels={['SMALL', 'MEDIUM', 'LARGE']}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.glass04, borderColor: colors.glass12, paddingBottom: 0 }]}>
          <SectionLabel label={t('ТЕМА', 'THEME')} />
          <ThemeOption option="dark" icon="🌙" label="Dark" />
          <ThemeOption option="light" icon="☀️" label="Light" />
          <View style={[{ borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.themeRow}
              onPress={() => setMode('system')}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeIcon, { color: colors.glass60, fontSize: 16 }]}>⊙</Text>
              <Text style={[styles.themeName, { color: mode === 'system' ? colors.fg : colors.glass80, fontSize: 15 * fontScale, fontWeight: mode === 'system' ? '500' : '400' }]}>
                System
              </Text>
              {mode === 'system' && <Text style={[styles.themeCheck, { color: colors.fg }]}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}>
          <SectionLabel label={t('СЕТЕВЫЕ НАСТРОЙКИ', 'NETWORK SETTINGS')} />

          <Text style={[styles.fieldLabel, { color: colors.glass45, fontSize: 11 * fontScale }]}>DNS #1</Text>
          <DnsInput field="dns1" value={dns1} />

          <Text style={[styles.fieldLabel, { color: colors.glass45, fontSize: 11 * fontScale, marginTop: 10 }]}>DNS #2</Text>
          <DnsInput field="dns2" value={dns2} />

          <View style={[styles.trafficRow, { marginTop: 14 }]}>
            <SegmentControl<TrafficMode>
              options={['safe', 'balanced', 'aggressive']}
              value={trafficMode}
              onChange={(v) => setSetting('trafficMode', v)}
              labels={[t('БЕЗОПАСНЫЙ', 'SAFE'), t('СБАЛАНСИРОВАННЫЙ', 'BALANCED'), t('АГРЕССИВНЫЙ', 'AGGRESSIVE')]}
            />
          </View>

          <View style={[styles.switchRow, { borderTopColor: colors.glass08, marginTop: 14 }]}>
            <Text style={[styles.switchLabel, { color: colors.fg, fontSize: 14 * fontScale }]}>
              {t('Включить MUX', 'Enable MUX')}
            </Text>
            <Switch
              value={muxEnabled}
              onValueChange={(v) => setSetting('muxEnabled', v)}
              trackColor={{ false: colors.glass20, true: colors.active }}
              thumbColor={colors.fg}
            />
          </View>

          {muxEnabled && (
            <View style={[styles.switchRow, { borderTopColor: colors.glass08 }]}>
              <Text style={[styles.switchLabel, { color: colors.fg, fontSize: 14 * fontScale }]}>
                {t('Параллельность MUX', 'MUX Concurrency')}
              </Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={[styles.counterBtn, { borderColor: colors.glass20 }]}
                  onPress={() => muxConcurrency > 1 && setSetting('muxConcurrency', muxConcurrency - 1)}
                >
                  <Text style={[{ color: colors.fg, fontSize: 16 }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.counterVal, { color: colors.fg, fontSize: 14 * fontScale }]}>
                  {muxConcurrency}
                </Text>
                <TouchableOpacity
                  style={[styles.counterBtn, { borderColor: colors.glass20 }]}
                  onPress={() => muxConcurrency < 32 && setSetting('muxConcurrency', muxConcurrency + 1)}
                >
                  <Text style={[{ color: colors.fg, fontSize: 16 }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.switchRow, { borderTopColor: colors.glass08 }]}>
            <Text style={[styles.switchLabel, { color: colors.fg, fontSize: 14 * fontScale }]}>
              {t('Включить Noise', 'Enable Noise')}
            </Text>
            <Switch
              value={noiseEnabled}
              onValueChange={(v) => setSetting('noiseEnabled', v)}
              trackColor={{ false: colors.glass20, true: colors.active }}
              thumbColor={colors.fg}
            />
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  version: {
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  sectionLabel: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  themeIcon: {},
  themeName: { flex: 1 },
  themeCheck: { fontSize: 16, fontWeight: '500' },
  fieldLabel: {
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputWrap: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    padding: 0,
    margin: 0,
  },
  trafficRow: {},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  switchLabel: { flex: 1 },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterVal: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
});
