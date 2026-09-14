import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../theme';

type Props = {
  value: number; // 0..1, 0.5 es el centro/neutral
  onChange: (v: number) => void;
  accentColor?: string;
};

const THUMB = 18;
const CENTER = 0.5;
// Limita cuántas veces por segundo el arrastre escribe al estado global (React re-renderiza
// toda la pantalla en cada commit). Sin esto, un swipe rápido dispara ~60 updates/seg y puede
// saturar el árbol de renders (cámara + teleprompter animado escuchando el mismo valor).
const COMMIT_INTERVAL_MS = 80;

export default function Slider({ value, onChange, accentColor = colors.accent }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(value);
  const lastCommitAt = useSharedValue(0);
  // Mientras el dedo sigue en la pantalla, el prop `value` que llega desde afuera va
  // atrasado (el commit está limitado a cada 80ms) — sincronizar contra ese valor viejo
  // en medio de un arrastre activo es lo que causaba el temblor: el thumb saltaba hacia
  // atrás cada vez que React reenviaba una posición que el gesto ya había superado.
  const isDragging = useSharedValue(false);

  // Mantén el valor animado sincronizado si cambia desde afuera, pero nunca mientras
  // el usuario está arrastrando activamente (ver isDragging arriba).
  React.useEffect(() => {
    if (isDragging.value) return;
    progress.value = value;
  }, [value]);

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  const setProgress = (v: number) => onChange(Math.min(1, Math.max(0, v)));

  const pan = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onChange((e) => {
      if (trackWidth <= 0) return;
      const next = Math.min(1, Math.max(0, progress.value + e.changeX / trackWidth));
      progress.value = next;
      const now = Date.now();
      if (now - lastCommitAt.value >= COMMIT_INTERVAL_MS) {
        lastCommitAt.value = now;
        runOnJS(setProgress)(next);
      }
    })
    .onFinalize(() => {
      // Commit final exacto: la última posición siempre llega, sin importar el throttle.
      runOnJS(setProgress)(progress.value);
      progress.value = withSpring(progress.value, { damping: 20, stiffness: 200 });
      isDragging.value = false;
    });

  const tap = Gesture.Tap().onEnd((e) => {
    if (trackWidth <= 0) return;
    const next = Math.min(1, Math.max(0, e.x / trackWidth));
    progress.value = withSpring(next, { damping: 20, stiffness: 200 });
    runOnJS(setProgress)(next);
  });

  const gesture = Gesture.Race(pan, tap);

  // Barra bidireccional: crece desde el centro (neutral) hacia el lado que corresponda,
  // en vez de rellenar siempre desde el borde izquierdo. Izquierda del centro reduce el
  // valor, derecha lo aumenta.
  const fillStyle = useAnimatedStyle(() => {
    const from = Math.min(CENTER, progress.value);
    const to = Math.max(CENTER, progress.value);
    return {
      left: `${from * 100}%`,
      width: `${(to - from) * 100}%`,
    };
  });

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
    transform: [{ translateX: -THUMB / 2 }, { translateY: -THUMB / 2 }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.hitArea}>
        <View style={styles.track} onLayout={onLayout}>
          <View style={styles.centerTick} />
          <Animated.View style={[styles.fill, fillStyle, { backgroundColor: accentColor }]} />
        </View>
        <Animated.View
          style={[styles.thumb, thumbStyle, { backgroundColor: accentColor }]}
          pointerEvents="none"
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hitArea: { justifyContent: 'center', paddingVertical: 14 },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bgElevated2,
    overflow: 'hidden',
  },
  centerTick: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.textTertiary,
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    borderColor: colors.bgElevated,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
