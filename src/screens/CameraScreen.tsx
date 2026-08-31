import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { File, Paths } from 'expo-file-system';
import {
  Camera,
  type CameraRef,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  useVideoOutput,
  type Recorder,
} from 'react-native-vision-camera';
import { BottomSheetModalProvider, type BottomSheetModal } from '@gorhom/bottom-sheet';
import { SlidersHorizontal, SwitchCamera, X } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, type } from '../theme';
import { useScript } from '../state/ScriptContext';
import TeleprompterOverlay, { type TeleprompterHandle } from '../components/TeleprompterOverlay';
import SettingsSheet from '../components/SettingsSheet';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CameraScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { script, speed, setSpeed, fontSize, setFontSize, saveScript, addVideoToCurrentScript } =
    useScript();
  const { t } = useTranslation();

  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } =
    useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } =
    useMicrophonePermission();

  const [position, setPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(position);
  const videoOutput = useVideoOutput({
    targetResolution: CommonResolutions.FHD_16_9,
    enableAudio: true,
  });

  const cameraRef = useRef<CameraRef>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const teleprompterRef = useRef<TeleprompterHandle>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isSheetSettingsOpen, setIsSheetSettingsOpen] = useState(false)
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);

  useEffect(() => {
    if (!hasCameraPermission) requestCameraPermission();
    if (!hasMicPermission) requestMicPermission();
    requestPermissionsAsync();
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    secondsRef.current = 0;
    setSeconds(0);
    const id = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const handleToggleRecord = useCallback(async () => {
    if (!videoOutput) return;

    if (isRecording) {
      await recorderRef.current?.stopRecording();
      teleprompterRef.current?.pause();
      return;
    }

    try {
      const recorder = await videoOutput.createRecorder({});
      recorderRef.current = recorder;
      setIsRecording(true);
      teleprompterRef.current?.play();
      await recorder.startRecording(
        async (filePath) => {
          setIsRecording(false);
          recorderRef.current = null;

          // Copia propia y durable primero: reconstruir un reproductor desde un URI de
          // Fotos (PHAsset) no es confiable después del hecho, así que esa copia es la
          // única fuente de verdad para reproducir dentro de la app.
          let localUri: string | null = null;
          try {
            const source = new File(filePath);
            const destination = new File(
              Paths.document,
              `${Date.now()}-${Math.random().toString(36).slice(2)}${source.extension}`
            );
            await source.copy(destination);
            localUri = destination.uri;
          } catch (error) {
            console.warn('No se pudo guardar una copia local del video', error);
          }

          if (!localUri) {
            saveScript();
            return;
          }

          // Espejo en Fotos: solo para que aparezca en la galería del sistema, best-effort.
          let assetId: string | null = null;
          try {
            const { status } = await requestPermissionsAsync();
            if (status === 'granted') {
              const asset = await Asset.create(filePath);
              assetId = asset.id;
            }
          } catch (error) {
            console.warn('No se pudo guardar el video en la galería', error);
          }

          addVideoToCurrentScript({ uri: localUri, assetId });
          navigation.navigate('VideoPlayer', { uri: localUri, assetId });
        },
        (error) => {
          setIsRecording(false);
          recorderRef.current = null;
          teleprompterRef.current?.pause();
          console.warn('Error al grabar', error);
        }
      );
    } catch (error) {
      setIsRecording(false);
      teleprompterRef.current?.pause();
      console.warn('No se pudo iniciar la grabación', error);
    }
  }, [isRecording, videoOutput, saveScript, addVideoToCurrentScript, navigation]);

  const handleFlip = () => setPosition((p) => (p === 'front' ? 'back' : 'front'));
  const handleClose = () => navigation.goBack();
  const handleOpenSettings = () => {
    // console.log("presionando toggle para mostrar sheet settings")
    isSheetSettingsOpen
      ? sheetRef.current?.dismiss()
      : sheetRef.current?.present()
  }

  const permissionsGranted = hasCameraPermission && hasMicPermission;

  return (
    <BottomSheetModalProvider>
    <View style={styles.root}>
      {device && permissionsGranted ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          outputs={videoOutput ? [videoOutput] : []}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]} />
      )}

      {!permissionsGranted && (
        <View style={[StyleSheet.absoluteFill, styles.permissionOverlay]}>
          <Text style={[type.title, styles.permissionTitle]}>{t('camera.permissionTitle')}</Text>
          <Text style={[type.bodyRegular, styles.permissionBody]}>
            {t('camera.permissionBody')}
          </Text>
          <Pressable
            style={styles.permissionButton}
            onPress={() => {
              requestCameraPermission();
              requestMicPermission();
            }}
          >
            <Text style={[type.title, styles.permissionButtonText]}>
              {t('camera.permissionButton')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Cerrar */}
      <Pressable
        style={[styles.iconButton, styles.closeButton, { top: insets.top + 12 }]}
        onPress={handleClose}
        hitSlop={8}
      >
        <X size={16} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>

      {/* Estado */}
      <View style={[styles.statusPill, { top: insets.top + 14 }]}>
        {isRecording && <View style={styles.recDot} />}
        <Text style={styles.statusText}>
          {isRecording ? formatDuration(seconds) : t('camera.tapToRecord')}
        </Text>
      </View>

      {/* Teleprompter */}
      <View style={[styles.teleprompterWrap, { top: insets.top + 68 }]}>
        <TeleprompterOverlay
          ref={teleprompterRef}
          script={script}
          speed={speed}
          fontSize={fontSize}
        />
      </View>

      {/* Controles inferiores */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 22 }]}>
        <Pressable style={styles.controlButton} onPress={handleOpenSettings} hitSlop={8}>
          <SlidersHorizontal size={20} color={colors.textPrimary} strokeWidth={2} />
          <View style={styles.settingsDot} />
        </Pressable>

        <Pressable style={[styles.recordOuterBase, isSheetSettingsOpen ? styles.recordOuterDisabled : styles.recordOuterEnabled]} onPress={handleToggleRecord} disabled={isSheetSettingsOpen}>
          <View style={[styles.recordInnerBase,isSheetSettingsOpen ? styles.recordInnerDisabled : styles.recordInnerEnabled , isRecording && styles.recordInnerActive]} />
        </Pressable>

        <Pressable style={styles.controlButton} onPress={handleFlip} hitSlop={8}>
          <SwitchCamera size={20} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <SettingsSheet
          ref={sheetRef}
          speed={speed}
          onSpeedChange={setSpeed}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          setIsOpen={setIsSheetSettingsOpen}
      />
    </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fallback: { backgroundColor: colors.bg },
  permissionOverlay: {
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
    zIndex: 10,
  },
  permissionTitle: { color: colors.textPrimary },
  permissionBody: { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  permissionButton: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: radii.lg,
    backgroundColor: colors.accent,
  },
  permissionButtonText: { color: colors.accentText },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.overlayGlass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: { position: 'absolute', left: 16, zIndex: 3 },
  controlButton: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: colors.overlayGlass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    zIndex: 3,
  },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.record },
  statusText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  teleprompterWrap: { position: 'absolute', left: 0, right: 0, zIndex: 2 },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 30,
    paddingTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  settingsDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  recordOuterBase: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  recordOuterEnabled: {
    borderColor: colors.record,
  },
  recordOuterDisabled: {
    borderColor: 'grey',
  },
  recordInnerBase: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  recordInnerEnabled: {
    backgroundColor: colors.record,
  },
  recordInnerDisabled: {
    backgroundColor: 'grey',
  },
  recordInnerActive: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
});
