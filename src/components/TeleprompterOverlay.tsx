import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Pause, Play, RotateCcw } from 'lucide-react-native';
import { colors } from '../theme';
import { useTranslation } from '../i18n';

export type TeleprompterHandle = {
  play: () => void;
  pause: () => void;
  reset: () => void;
};

type Props = {
  script: string;
  speed: number; // 0..1
  fontSize: 'S' | 'M' | 'L';
  accentColor?: string;
  height?: number;
};

const FONT_SIZES: Record<Props['fontSize'], number> = { S: 16, M: 19, L: 23 };
const MIN_PX_PER_SEC = 1;
const MAX_PX_PER_SEC = 100;

function clamp(v: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, v));
}

const TeleprompterOverlay = forwardRef<TeleprompterHandle, Props>(function TeleprompterOverlay(
  { script, speed, fontSize, accentColor = colors.accent, height = 200 },
  ref
) {
  const { t } = useTranslation();
  const [bandWidth, setBandWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const translateY = useSharedValue(height);
  const isPlayingRef = useRef(false);

  const pxPerSec = MIN_PX_PER_SEC + speed * (MAX_PX_PER_SEC - MIN_PX_PER_SEC);
  const pxPerSecRef = useRef(pxPerSec);
  pxPerSecRef.current = pxPerSec;

  const onBandLayout = (e: LayoutChangeEvent) => setBandWidth(e.nativeEvent.layout.width);
  const onContentLayout = (e: LayoutChangeEvent) => setContentHeight(e.nativeEvent.layout.height);

  // Rompe el ciclo startLeg <-> handleLegFinished sin depender del orden de declaración.
  const startLegRef = useRef<(fromValue: number) => void>(() => {});

  const handleLegFinished = useCallback(() => {
    if (!isPlayingRef.current) return;
    translateY.value = height;
    startLegRef.current(height);
  }, [height, translateY]);

  const startLeg = useCallback(
    (fromValue: number) => {
      if (contentHeight <= 0) return;
      const distance = fromValue + contentHeight;
      if (distance <= 0) return;
      const durationMs = (distance / pxPerSecRef.current) * 1000;
      translateY.value = withTiming(
        -contentHeight,
        { duration: durationMs, easing: Easing.linear },
        (finished) => {
          if (finished) runOnJS(handleLegFinished)();
        }
      );
    },
    [contentHeight, handleLegFinished, translateY]
  );
  startLegRef.current = startLeg;

  const play = useCallback(() => {
    isPlayingRef.current = true;
    setIsPlaying(true);
    if (contentHeight > 0) startLeg(translateY.value);
  }, [contentHeight, startLeg, translateY]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    cancelAnimation(translateY);
  }, [translateY]);

  const reset = useCallback(() => {
    cancelAnimation(translateY);
    translateY.value = height;
    if (isPlayingRef.current) startLeg(height);
  }, [height, startLeg, translateY]);

  useImperativeHandle(ref, () => ({ play, pause, reset }), [play, pause, reset]);

  // El layout recién midió el contenido: si ya se había pedido reproducir, arranca ahora.
  useEffect(() => {
    if (contentHeight > 0 && isPlayingRef.current) startLeg(translateY.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentHeight]);

  // Cambiar la velocidad no reinicia la posición: retoma desde donde iba con la nueva duración.
  useEffect(() => {
    if (isPlayingRef.current && contentHeight > 0) {
      cancelAnimation(translateY);
      startLeg(translateY.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pxPerSec]);

  // El guion cambió: vuelve al inicio.
  useEffect(() => {
    cancelAnimation(translateY);
    translateY.value = height;
    if (isPlayingRef.current) startLeg(height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  const pan = Gesture.Pan()
    .onStart(() => {
      cancelAnimation(translateY);
    })
    .onChange((e) => {
      translateY.value = clamp(translateY.value + e.changeY, -contentHeight, height);
    })
    .onFinalize(() => {
      runOnJS(pause)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const displayText = script.trim().length > 0 ? script : t('teleprompter.placeholder');

  return (
    <View style={[styles.band, { height }]} onLayout={onBandLayout}>
      <View style={[styles.indicator, { backgroundColor: accentColor }]} />

      <GestureDetector gesture={pan}>
        <View style={styles.clip}>
          <Animated.View
            style={[styles.content, animatedStyle, { width: bandWidth || undefined }]}
            onLayout={onContentLayout}
          >
            <Text
              style={[
                styles.text,
                { fontSize: FONT_SIZES[fontSize], lineHeight: FONT_SIZES[fontSize] * 1.5 },
              ]}
            >
              {displayText}
            </Text>
          </Animated.View>
        </View>
      </GestureDetector>

      <LinearGradient
        colors={[colors.overlayTeleprompter, 'transparent']}
        style={[styles.fade, styles.fadeTop]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', colors.overlayTeleprompter]}
        style={[styles.fade, styles.fadeBottom]}
        pointerEvents="none"
      />

      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={reset} hitSlop={8}>
          <RotateCcw size={14} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={styles.controlButton}
          onPress={() => (isPlaying ? pause() : play())}
          hitSlop={8}
        >
          {isPlaying ? (
            <Pause size={14} color={colors.textPrimary} strokeWidth={2} />
          ) : (
            <Play size={14} color={colors.textPrimary} strokeWidth={2} />
          )}
        </Pressable>
      </View>
    </View>
  );
});

export default TeleprompterOverlay;

const styles = StyleSheet.create({
  band: {
    width: '96%',
    left: '2%',
    backgroundColor: colors.overlayTeleprompter,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    borderRadius: 20,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    opacity: 0.85,
    zIndex: 2,
  },
  clip: { flex: 1, overflow: 'hidden' },
  content: { position: 'absolute', paddingHorizontal: 30 },
  text: {
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  fade: { position: 'absolute', left: 0, right: 0, height: 46 },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
  controls: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
    zIndex: 3,
  },
  controlButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.overlayGlass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
