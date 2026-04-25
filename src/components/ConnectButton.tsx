import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { mono } from '../theme/typography';
import { VpnStatus } from '../types/app';

interface Props {
  status: VpnStatus;
  onPress: () => void;
}

const SIZE = 154;

export default function ConnectButton({ status, onPress }: Props) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;
  const filledAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isConnected = status === 'connected';
  const isBusy = status === 'connecting' || status === 'disconnecting';

  useEffect(() => {
    if (isBusy) {
      Animated.loop(
        Animated.timing(ringRotation, {
          toValue: 1,
          duration: 1600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      ringRotation.stopAnimation();
      ringRotation.setValue(0);
    }

    if (isConnected) {
      Animated.spring(filledAnim, {
        toValue: 1,
        tension: 55,
        friction: 12,
        useNativeDriver: false,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.035,
            duration: 1900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (!isBusy) {
      pulseAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(pulseAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(filledAnim, { toValue: 0, duration: 260, useNativeDriver: false }),
      ]).start();
    }
  }, [filledAnim, isBusy, isConnected, pulseAnim, ringRotation]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 210, friction: 13, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const spin = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const circleColor = filledAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(24,24,24,1)', colors.fg],
  });

  const contentColor = filledAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.fg, colors.bg],
  });

  const label = isConnected
    ? 'АКТИВНО'
    : status === 'disconnecting'
    ? 'ОТКЛЮЧЕНИЕ'
    : isBusy
    ? 'ПОДКЛЮЧЕНИЕ'
    : 'ПОДКЛЮЧИТЬ';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.92}>
      <Animated.View style={[styles.wrap, { transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] }]}>
        <View style={[styles.outerFrame, { borderColor: colors.glass12 }]} />
        <View style={[styles.outerShadow, { borderColor: colors.glass08 }]} />

        {isBusy ? (
          <Animated.View
            style={[
              styles.progressRing,
              {
                borderColor: colors.glass20,
                borderTopColor: colors.glass80,
                transform: [{ rotate: spin }],
              },
            ]}
          />
        ) : null}

        <Animated.View
          style={[
            styles.circle,
            {
              backgroundColor: circleColor,
              borderColor: isConnected ? 'transparent' : colors.glass12,
            },
          ]}
        >
          <View style={styles.inner}>
            <MaterialIcons name="power-settings-new" size={42} color={isConnected ? colors.bg : colors.fg} />
            <Animated.Text style={[styles.label, { color: contentColor }]}>{label}</Animated.Text>
          </View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE + 44,
    height: SIZE + 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerFrame: {
    position: 'absolute',
    width: SIZE + 18,
    height: SIZE + 18,
    borderRadius: (SIZE + 18) / 2,
    borderWidth: 1,
  },
  outerShadow: {
    position: 'absolute',
    width: SIZE + 8,
    height: SIZE + 8,
    borderRadius: (SIZE + 8) / 2,
    borderWidth: 1,
  },
  progressRing: {
    position: 'absolute',
    width: SIZE + 24,
    height: SIZE + 24,
    borderRadius: (SIZE + 24) / 2,
    borderWidth: 1.2,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 11,
    letterSpacing: 2.8,
    fontFamily: mono.extraBold,
  },
});
