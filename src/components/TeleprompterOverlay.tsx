import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
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
import { Pause, Play, RotateCcw, X } from 'lucide-react-native';
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
  onClose: () => void;
  isRecording: boolean;
  recordingLabel: string;
  // Con el sheet de ajustes de cámara abierto se oculta todo salvo el botón de cerrar,
  // que se queda visible y usable para poder salir de la cámara sin cerrar el sheet antes.
  minimized?: boolean;
};

const FONT_SIZES: Record<Props['fontSize'], number> = { S: 16, M: 19, L: 23 };
// ponytail: "1x" = ritmo de lectura comodo, valor de partida ajustable a ojo. speed=0.5
// (centro del slider) siempre equivale a 1x, sin importar este numero.
const BASE_PX_PER_SEC = 25;

function clamp(v: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, v));
}

const TeleprompterOverlay = forwardRef<TeleprompterHandle, Props>(function TeleprompterOverlay(
  {
    script,
    speed,
    fontSize,
    accentColor = colors.accent,
    height = 240,
    onClose,
    isRecording,
    recordingLabel,
    minimized = false,
  },
  ref
) {
  const { t } = useTranslation();
  const [bandWidth, setBandWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const translateY = useSharedValue(height);
  const isPlayingRef = useRef(false);

  // speed 0..1, con 0.5 = centro = 1x. El piso evita durationMs infinito al llegar a 0.
  const pxPerSec = Math.max(1, speed * 2 * BASE_PX_PER_SEC);
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

  const marginTopAndroid = Platform.OS === 'android' ? 12 : 'auto';

  return (
    <View
      style={[styles.band, { height, marginTop: marginTopAndroid }, minimized && styles.bandMinimized]}
      onLayout={onBandLayout}
      pointerEvents={minimized ? 'box-none' : 'auto'}
    >
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
          <X size={16} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>

        {!minimized && (
          <>
            <View style={styles.headerCenter}>
              {isRecording && (
                <View style={styles.recPill}>
                  <View style={styles.recDot} />
                  <Text style={styles.recText}>{recordingLabel}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
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
          </>
        )}
      </View>

      {!minimized && (
        <View style={styles.scrollArea}>
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
        </View>
      )}
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
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    borderRadius: 25,
  },
  bandMinimized: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
    zIndex: 4,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { flexDirection: 'row', gap: 6 },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.overlayGlass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: colors.overlayGlass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
  },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.record },
  recText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  scrollArea: { flex: 1 },
  clip: { flex: 1, overflow: 'hidden' },
  content: { position: 'absolute', paddingHorizontal: 30 },
  text: {
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  fade: { position: 'absolute', left: 0, right: 0, height: 100 },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
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
