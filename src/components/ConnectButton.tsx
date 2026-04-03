import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { VpnStatus } from '../context/AppContext';

interface Props {
  status: VpnStatus;
  onPress: () => void;
}

const SIZE = 164;

const GLOW = [
  { extra: 28,  op: 0.20 },
  { extra: 58,  op: 0.14 },
  { extra: 92,  op: 0.09 },
  { extra: 130, op: 0.06 },
  { extra: 172, op: 0.038 },
  { extra: 218, op: 0.022 },
  { extra: 268, op: 0.012 },
  { extra: 320, op: 0.006 },
] as const;

export default function ConnectButton({ status, onPress }: Props) {
  const { colors } = useTheme();

  const glowAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const arcRot     = useRef(new Animated.Value(0)).current;
  const fillAnim   = useRef(new Animated.Value(0)).current;
  const dotsAnims  = [
    useRef(new Animated.Value(0.15)).current,
    useRef(new Animated.Value(0.15)).current,
    useRef(new Animated.Value(0.15)).current,
  ];

  const isConnected = status === 'connected';
  const isLoading   = status === 'connecting' || status === 'disconnecting';

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(arcRot, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      dotsAnims.forEach((d, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 200),
            Animated.timing(d, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(d, { toValue: 0.15, duration: 280, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.delay(640 - i * 200),
          ])
        ).start();
      });
    } else {
      arcRot.stopAnimation();
      arcRot.setValue(0);
      dotsAnims.forEach((d) => { d.stopAnimation(); d.setValue(0.15); });
    }

    if (isConnected) {
      Animated.spring(fillAnim, { toValue: 1, tension: 55, friction: 11, useNativeDriver: false }).start();
      Animated.timing(glowAnim, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else if (!isLoading) {
      glowAnim.stopAnimation();
      pulseAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(glowAnim,  { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(fillAnim,  { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start();
    }
  }, [status]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 220, friction: 12, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const spin        = arcRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinReverse = arcRot.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  const circleColor = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.glass08, colors.fg] });
  const innerColor  = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.fg,    colors.bg] });

  const label = isConnected
    ? 'ПОДКЛЮЧЕНО'
    : status === 'disconnecting'
    ? 'ОТКЛЮЧЕНИЕ'
    : isLoading
    ? 'ПОДКЛЮЧЕНИЕ'
    : 'ПОДКЛЮЧИТЬ';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View style={[styles.wrap, { transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] }]}>

        {GLOW.map(({ extra, op }, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width:  SIZE + extra,
              height: SIZE + extra,
              borderRadius: (SIZE + extra) / 2,
              backgroundColor: '#FFFFFF',
              opacity: Animated.multiply(glowAnim, op),
            }}
          />
        ))}

        {isLoading && (
          <>
            <Animated.View style={[styles.arc, {
              width:  SIZE + 30,
              height: SIZE + 30,
              borderRadius: (SIZE + 30) / 2,
              borderTopColor:    colors.glass80,
              borderRightColor:  colors.glass20,
              borderBottomColor: 'transparent',
              borderLeftColor:   'transparent',
              transform: [{ rotate: spin }],
            }]} />
            <Animated.View style={[styles.arc, {
              width:  SIZE + 52,
              height: SIZE + 52,
              borderRadius: (SIZE + 52) / 2,
              borderWidth: 1,
              borderTopColor:    'transparent',
              borderRightColor:  'transparent',
              borderBottomColor: colors.glass45,
              borderLeftColor:   colors.glass20,
              transform: [{ rotate: spinReverse }],
            }]} />
          </>
        )}

        <Animated.View style={[
          styles.circle,
          {
            backgroundColor: circleColor,
            borderColor: isConnected ? 'transparent' : colors.glass20,
          },
        ]}>
          {isLoading ? (
            <View style={styles.inner}>
              <View style={styles.dotsRow}>
                {dotsAnims.map((d, i) => (
                  <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.fg, opacity: d }]} />
                ))}
              </View>
              <Animated.Text style={[styles.label, { color: innerColor }]}>{label}</Animated.Text>
            </View>
          ) : isConnected ? (
            <View style={styles.inner}>
              <Text style={[styles.checkmark, { color: colors.bg }]}>✓</Text>
              <Text style={[styles.label, { color: colors.bg }]}>{label}</Text>
            </View>
          ) : (
            <View style={styles.inner}>
              <Ionicons name="power" size={36} color={colors.fg} />
              <Text style={[styles.label, { color: colors.fg }]}>{label}</Text>
            </View>
          )}
        </Animated.View>

      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width:  SIZE + 80,
    height: SIZE + 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width:  SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arc: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  checkmark: {
    fontSize: 44,
    fontWeight: '300',
    lineHeight: 50,
  },
});
