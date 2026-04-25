import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { mono } from '../theme/typography';
import { VpnNode } from '../types/app';

interface Props {
  nodes: VpnNode[];
  selectedId: string | null;
  onSelect: (nodeId: string) => void;
}

export default function LocationList({ nodes, selectedId, onSelect }: Props) {
  const { colors } = useTheme();
  const { fontScale } = useSettings();

  return (
    <View style={styles.container}>
      {nodes.map((node) => {
        const isSelected = node.id === selectedId;

        return (
          <TouchableOpacity
            key={node.id}
            onPress={() => onSelect(node.id)}
            activeOpacity={0.7}
            style={[
              styles.row,
              {
                backgroundColor: isSelected ? 'rgba(18,18,20,1)' : 'transparent',
              },
            ]}
          >
            {isSelected ? <View style={[styles.selectedBar, { backgroundColor: colors.fg }]} /> : null}

            <View style={[styles.flagWrap, { backgroundColor: colors.glass08 }]}>
              <Text style={styles.flag}>{node.flag}</Text>
            </View>

            <View style={styles.content}>
              <Text
                style={[
                  styles.name,
                  {
                    color: colors.fg,
                    fontSize: 16 * fontScale,
                  },
                ]}
              >
                {node.name}
              </Text>

              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="signal-cellular-3" size={16} color={colors.active} />
                <Text
                  style={[
                    styles.metaText,
                    {
                      color: colors.active,
                      fontSize: 12 * fontScale,
                    },
                  ]}
                >
                  {node.pingMs !== null ? `${node.pingMs} ms` : 'нет данных'}
                </Text>
              </View>
            </View>

            <View style={styles.trailing}>
              <View style={[styles.iconCircle, { backgroundColor: colors.glass08 }]}>
                <MaterialIcons name="visibility" size={22} color={colors.glass45} />
              </View>
              <MaterialIcons
                name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                size={28}
                color={isSelected ? colors.fg : colors.glass20}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: 'relative',
  },
  selectedBar: {
    position: 'absolute',
    left: 9,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 2,
  },
  flagWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  flag: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  name: {
    letterSpacing: 0,
    fontFamily: mono.light,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: mono.bold,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginLeft: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
