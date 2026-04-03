import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Location } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';

interface Props {
  locations: Location[];
  selected: Location;
  onSelect: (loc: Location) => void;
}

export default function LocationList({ locations, selected, onSelect }: Props) {
  const { colors } = useTheme();
  const { fontScale } = useSettings();

  return (
    <View style={[styles.container, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}>
      <View style={[styles.header, { borderBottomColor: colors.glass12 }]}>
        <Text style={[styles.headerIcon, { color: colors.glass45 }]}>↓</Text>
        <Text style={[styles.headerText, { color: colors.glass45, fontSize: 11 * fontScale }]}>
          ДОСТУПНЫЕ ЛОКАЦИИ
        </Text>
        <Text style={[styles.count, { color: colors.glass45, fontSize: 11 * fontScale }]}>
          {locations.length}
        </Text>
      </View>

      {locations.map((loc, idx) => {
        const isSelected = loc.id === selected.id;
        const isLast = idx === locations.length - 1;

        return (
          <TouchableOpacity
            key={loc.id}
            onPress={() => onSelect(loc)}
            activeOpacity={0.7}
            style={[
              styles.row,
              !isLast && { borderBottomWidth: 1, borderBottomColor: colors.glass08 },
            ]}
          >
            <Text style={styles.flag}>{loc.flag}</Text>
            <Text
              style={[
                styles.name,
                {
                  color: isSelected ? colors.fg : colors.glass80,
                  fontSize: 15 * fontScale,
                  fontWeight: isSelected ? '500' : '400',
                },
              ]}
            >
              {loc.name}
            </Text>
            {isSelected && (
              <Text style={[styles.check, { color: colors.fg }]}>✓</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 6,
  },
  headerIcon: {
    fontSize: 12,
  },
  headerText: {
    flex: 1,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  count: {
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  flag: {
    fontSize: 20,
  },
  name: {
    flex: 1,
    letterSpacing: 0.2,
  },
  check: {
    fontSize: 16,
    fontWeight: '500',
  },
});
