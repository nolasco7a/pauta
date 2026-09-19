import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { File, Paths } from 'expo-file-system';
import {
  Camera,
  type CameraRef,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  useVideoOutput,
  type Recorder,
} from 'react-native-vision-camera';
import { BottomSheetModalProvider, type BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  Aperture,
  Flashlight,
  FlashlightOff,
  ListEnd,
  SwitchCamera,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, type } from '../theme';
import { useScript } from '../state/ScriptContext';
import TeleprompterOverlay, { type TeleprompterHandle } from '../components/TeleprompterOverlay';
import SettingsSheet from '../components/SettingsSheet';
import CameraSettingsSheet from '../components/CameraSettingsSheet';
import { CAMERA_QUALITY_PRESETS } from '../state/cameraQuality';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const ZOOM_PRESETS = [0.5, 1, 1.5, 2] as const;

export default function CameraScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    script,
    speed,
    setSpeed,
    fontSize,
    setFontSize,
    cameraQuality,
    setCameraQuality,
    stabilization,
    setStabilization,
    exposureNormalized,
    setExposureNormalized,
    lowLightBoost,
    setLowLightBoost,
    saveScript,
    addVideoToCurrentScript,
  } = useScript();
  const { t } = useTranslation();

  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } =
    useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } =
    useMicrophonePermission();

  const [position, setPosition] = useState<'front' | 'back'>('front');
  const [torchOn, setTorchOn] = useState(false);
  const [zoomFactor, setZoomFactor] = useState<number | null>(null);
  // displayableZoomFactor / zoom es la conversión (constante por dispositivo) entre el "zoom"
  // nativo de una cámara virtual multi-lente y el factor que ve el usuario (0.5x/1x/2x, etc).
  // Solo se conoce una vez que el controller arranca, así que null = "todavía no medido".
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; ratio: number } | null>(
    null
  );
  const device = useCameraDevice(position);
  const qualityPreset = CAMERA_QUALITY_PRESETS[cameraQuality];
  const videoOutput = useVideoOutput({
    targetResolution: qualityPreset.resolution,
    targetBitRate: qualityPreset.bitRate,
    enableAudio: true,
  });

  const supportsExposure = device?.supportsExposureBias ?? false;
  const exposureBias =
    device && supportsExposure
      ? device.minExposureBias + exposureNormalized * (device.maxExposureBias - device.minExposureBias)
      : undefined;
  const supportsLowLightBoost = device?.supportsLowLightBoost ?? false;
  const supportsTorch = device?.hasTorch ?? false;

  const cameraRef = useRef<CameraRef>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const cameraSettingsSheetRef = useRef<BottomSheetModal>(null);
  const teleprompterRef = useRef<TeleprompterHandle>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isSheetSettingsOpen, setIsSheetSettingsOpen] = useState(false)
  const [isCameraSettingsOpen, setIsCameraSettingsOpen] = useState(false);
  const anySheetOpen = isSheetSettingsOpen || isCameraSettingsOpen;
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

  // Cambiar camara, flash o ajustes a mitad de una grabacion corta la grabacion sin
  // guardar el video (o revienta con un error nativo) — se deshabilitan todos mientras
  // isRecording es true, aunque el teleprompter en si no tenga ese problema, por coherencia.
  const handleFlip = () => {
    if (isRecording) return;
    setPosition((p) => (p === 'front' ? 'back' : 'front'));
    setZoomRange(null);
    setZoomFactor(null);
  };
  // onConfigured se dispara cada vez que la sesión reconecta un device (incluye el flip
  // frontal/trasera) — a diferencia de onStarted, que solo ocurre una vez al activar la
  // cámara. Se dispara antes de que el nuevo controller quede asignado al ref, así que se
  // lee en el siguiente tick para evitar quedarnos con el controller del device anterior.
  const handleCameraConfigured = () => {
    setTimeout(() => {
      try {
        const controller = cameraRef.current?.controller;
        if (controller && controller.zoom > 0) {
          setZoomRange({
            min: controller.minZoom,
            max: controller.maxZoom,
            ratio: controller.displayableZoomFactor / controller.zoom,
          });
        }
      } catch (error) {
        console.warn('No se pudo leer el rango de zoom de la cámara', error);
      }
    }, 0);
  };
  const handleZoomPreset = async (factor: number) => {
    try {
      const controller = cameraRef.current?.controller;
      if (!controller || !zoomRange) return;
      await controller.setZoom(factor / zoomRange.ratio);
      setZoomFactor(factor);
    } catch (error) {
      console.warn('No se pudo aplicar el zoom', error);
    }
  };
  // Antes de medir el rango real del dispositivo solo se ofrece 1x (el default), para no
  // mostrar opciones que ese dispositivo podría no soportar.
  const availableZoomPresets = useMemo(
    () =>
      zoomRange
        ? ZOOM_PRESETS.filter(
            (factor) =>
              factor >= zoomRange.min * zoomRange.ratio - 0.05 &&
              factor <= zoomRange.max * zoomRange.ratio + 0.05
          )
        : [1],
    [zoomRange]
  );

  // El pinch nativo mueve el zoom directo en el controller, por fuera de React — no hay
  // listener público para eso (solo addSubjectAreaChangedListener, para foco), así que se
  // sondea el valor actual y se resalta el preset más cercano. ponytail: sondeo por falta
  // de evento nativo; cambiar a listener si vision-camera lo expone más adelante.
  useEffect(() => {
    if (!zoomRange || availableZoomPresets.length < 2) return;
    const id = setInterval(() => {
      const controller = cameraRef.current?.controller;
      if (!controller) return;
      const displayable = controller.zoom * zoomRange.ratio;
      const nearest = availableZoomPresets.reduce((closest, factor) =>
        Math.abs(factor - displayable) < Math.abs(closest - displayable) ? factor : closest
      );
      setZoomFactor((current) => (current === nearest ? current : nearest));
    }, 200);
    return () => clearInterval(id);
  }, [zoomRange, availableZoomPresets]);

  const handleClose = () => navigation.goBack();
  // El sheet solo avisa "onChange" cuando termina su animación de apertura/cierre — si
  // esperamos a eso, los controles que dependen de anySheetOpen (zoom, teleprompter) se
  // quedan visibles encima del sheet mientras este sube. Se marca el estado de una vez, al
  // disparar la acción, para que desaparezcan al instante junto con el toque del usuario.
  const handleOpenSettings = () => {
    if (isRecording) return;
    if (isSheetSettingsOpen) {
      sheetRef.current?.dismiss();
      setIsSheetSettingsOpen(false);
    } else {
      sheetRef.current?.present();
      setIsSheetSettingsOpen(true);
    }
  };
  const handleOpenCameraSettings = () => {
    if (isRecording) return;
    if (isCameraSettingsOpen) {
      cameraSettingsSheetRef.current?.dismiss();
      setIsCameraSettingsOpen(false);
    } else {
      cameraSettingsSheetRef.current?.present();
      setIsCameraSettingsOpen(true);
    }
  };
  const handleToggleTorch = () => {
    if (isRecording) return;
    setTorchOn((v) => !v);
  };

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
          enableNativeZoomGesture
          onConfigured={handleCameraConfigured}
          torchMode={supportsTorch && torchOn ? 'on' : 'off'}
          exposure={exposureBias}
          enableLowLightBoost={supportsLowLightBoost ? lowLightBoost : undefined}
          constraints={[{ videoStabilizationMode: stabilization }]}
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

      {/* Teleprompter: agrupa cierre, indicador de grabación y controles del teleprompter
          en un solo panel arriba, pegado al inset superior — el cierre y el indicador se
          mantienen accesibles aunque haya un sheet de ajustes abierto; solo el texto que
          scrollea se oculta para no chocar visualmente con el sheet. */}
      <View style={[styles.teleprompterWrap, { top: insets.top }]}>
        <TeleprompterOverlay
          ref={teleprompterRef}
          script={script}
          speed={speed}
          fontSize={fontSize}
          onClose={handleClose}
          isRecording={isRecording}
          recordingLabel={formatDuration(seconds)}
          contentHidden={isCameraSettingsOpen}
        />
      </View>
5678ighjfr
      {/* Controles inferiores */}
      <View style={[styles.controlsWrap, { paddingBottom: insets.bottom + 22 }]}>
        {/* Zoom */}
        {availableZoomPresets.length > 1 && !anySheetOpen && (
          <View style={styles.zoomRow}>
            {availableZoomPresets.map((factor) => (
              <Pressable
                key={factor}
                style={[styles.zoomPill, (zoomFactor ?? 1) === factor && styles.zoomPillActive]}
                onPress={() => handleZoomPreset(factor)}
                hitSlop={4}
              >
                <Text
                  style={[
                    styles.zoomPillText,
                    (zoomFactor ?? 1) === factor && styles.zoomPillTextActive,
                  ]}
                >
                  {factor}x
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.controls}>
        <View style={styles.controlGroup}>
          <Pressable
            style={[styles.controlButton, isRecording && styles.controlButtonDisabled]}
            onPress={handleOpenSettings}
            disabled={isRecording}
            hitSlop={8}
          >
            <ListEnd size={20} color={colors.textPrimary} strokeWidth={2} />
            <View style={styles.settingsDot} />
          </Pressable>

          <Pressable
            style={[styles.controlButton, isRecording && styles.controlButtonDisabled]}
            onPress={handleOpenCameraSettings}
            disabled={isRecording}
            hitSlop={8}
          >
              <Aperture size={20} color={colors.textPrimary} strokeWidth={2} />
              <View style={styles.settingsDot} />
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.recordOuterBase,
            anySheetOpen ? styles.recordOuterDisabled : styles.recordOuterEnabled,
          ]}
          onPress={handleToggleRecord}
          disabled={anySheetOpen}
        >
          <View
            style={[
              styles.recordInnerBase,
              anySheetOpen ? styles.recordInnerDisabled : styles.recordInnerEnabled,
              isRecording && styles.recordInnerActive,
            ]}
          />
        </Pressable>

          <View style={styles.controlGroup}>
            <Pressable
              style={[styles.controlButton, isRecording && styles.controlButtonDisabled]}
              onPress={handleFlip}
              disabled={isRecording}
              hitSlop={8}
            >
              <SwitchCamera size={20} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
            <Pressable
              style={[
                styles.controlButton,
                (!supportsTorch || isRecording) && styles.controlButtonDisabled,
              ]}
              onPress={handleToggleTorch}
              disabled={!supportsTorch || isRecording}
              hitSlop={8}
            >
              {supportsTorch && torchOn ? (
                <Flashlight size={20} color={colors.accent} strokeWidth={2} />
              ) : (
                <FlashlightOff size={20} color={colors.textPrimary} strokeWidth={2} />
              )}
            </Pressable>
        </View>
        </View>
      </View>

      <SettingsSheet
          ref={sheetRef}
          speed={speed}
          onSpeedChange={setSpeed}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          setIsOpen={setIsSheetSettingsOpen}
      />

      <CameraSettingsSheet
        ref={cameraSettingsSheetRef}
        quality={cameraQuality}
        onQualityChange={setCameraQuality}
        stabilization={stabilization}
        onStabilizationChange={setStabilization}
        exposureNormalized={exposureNormalized}
        onExposureChange={setExposureNormalized}
        supportsExposure={supportsExposure}
        lowLightBoost={lowLightBoost}
        onLowLightBoostChange={setLowLightBoost}
        supportsLowLightBoost={supportsLowLightBoost}
        setIsOpen={setIsCameraSettingsOpen}
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
  controlGroup: { flexDirection: 'row', gap: 10 },
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
  controlButtonDisabled: { opacity: 0.35 },
  teleprompterWrap: { position: 'absolute', left: 0, right: 0, zIndex: 2 },
  controlsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  zoomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  zoomPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.overlayGlass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  zoomPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  zoomPillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: colors.textPrimary,
  },
  zoomPillTextActive: { color: colors.accentText },
  controls: {
    paddingHorizontal: 30,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
