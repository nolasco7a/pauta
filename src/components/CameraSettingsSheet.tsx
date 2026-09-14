import React, { forwardRef, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { HardDrive, Moon, Sun, Waves } from 'lucide-react-native';
import { colors, radii, type } from '../theme';
import Slider from './Slider';
import { useTranslation } from '../i18n';
import { CAMERA_QUALITY_PRESETS, type CameraQuality } from '../state/cameraQuality';
import type { StabilizationMode } from '../state/ScriptContext';

type Props = {
  quality: CameraQuality;
  onQualityChange: (v: CameraQuality) => void;
  stabilization: StabilizationMode;
  onStabilizationChange: (v: StabilizationMode) => void;
  exposureNormalized: number;
  onExposureChange: (v: number) => void;
  supportsExposure: boolean;
  lowLightBoost: boolean;
  onLowLightBoostChange: (v: boolean) => void;
  supportsLowLightBoost: boolean;
  setIsOpen: (value: boolean) => void;
};

const QUALITY_ORDER: CameraQuality[] = ['saver', 'balanced', 'max'];
const STABILIZATION_ORDER: StabilizationMode[] = ['off', 'standard', 'cinematic'];

const CameraSettingsSheet = forwardRef<BottomSheetModal, Props>(
  (
    {
      quality,
      onQualityChange,
      stabilization,
      onStabilizationChange,
      exposureNormalized,
      onExposureChange,
      supportsExposure,
      lowLightBoost,
      onLowLightBoostChange,
      supportsLowLightBoost,
      setIsOpen,
    },
    ref
  ) => {
    const { t } = useTranslation();

    const callbackIsOpen = useCallback((value: number) => {
      if (value >= 0) setIsOpen(true);
      else setIsOpen(false);
    }, []);

    const preset = CAMERA_QUALITY_PRESETS[quality];

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        enablePanDownToClose={false}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
        enableContentPanningGesture={false}
        onChange={(value) => callbackIsOpen(value)}
      >
        <BottomSheetView style={styles.content}>
          <Text style={[type.title, styles.title]}>{t('cameraSettingsSheet.title')}</Text>

          {/* Calidad / almacenamiento */}
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <View style={styles.rowLabel}>
                <HardDrive size={15} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[type.body, styles.rowLabelText]}>
                  {t('cameraSettingsSheet.quality')}
                </Text>
              </View>
            </View>

            <View style={styles.optionsList}>
              {QUALITY_ORDER.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => onQualityChange(key)}
                  style={[styles.option, quality === key && styles.optionActive]}
                >
                  <Text style={[styles.optionText, quality === key && styles.optionTextActive]}>
                    {t(`cameraSettingsSheet.presets.${key}.label`)}
                  </Text>
                  <Text
                    style={[styles.optionCaption, quality === key && styles.optionCaptionActive]}
                  >
                    {t(`cameraSettingsSheet.presets.${key}.caption`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.footnote}>
              {t('cameraSettingsSheet.estimate', { mb: preset.mbPerMinute })}
            </Text>
          </View>

          {/* Estabilización */}
          <View style={[styles.row, styles.rowBordered]}>
            <View style={styles.rowHeader}>
              <View style={styles.rowLabel}>
                <Waves size={15} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[type.body, styles.rowLabelText]}>
                  {t('cameraSettingsSheet.stabilization')}
                </Text>
              </View>
              <View style={styles.segmented}>
                {STABILIZATION_ORDER.map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => onStabilizationChange(key)}
                    style={[styles.segment, stabilization === key && styles.segmentActive]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        stabilization === key && styles.segmentTextActive,
                      ]}
                    >
                      {t(`cameraSettingsSheet.stabilizationModes.${key}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Exposición */}
          {supportsExposure && (
            <View style={[styles.row, styles.rowBordered]}>
              <View style={styles.rowHeader}>
                <View style={styles.rowLabel}>
                  <Sun size={15} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[type.body, styles.rowLabelText]}>
                    {t('cameraSettingsSheet.exposure')}
                  </Text>
                </View>
              </View>
              <Slider value={exposureNormalized} onChange={onExposureChange} />
              <View style={styles.sliderCaptions}>
                <Text style={styles.captionText}>{t('cameraSettingsSheet.darker')}</Text>
                <Text style={styles.captionText}>{t('cameraSettingsSheet.brighter')}</Text>
              </View>
            </View>
          )}

          {/* Modo noche */}
          {supportsLowLightBoost && (
            <View style={[styles.row, styles.rowBordered]}>
              <View style={styles.rowHeader}>
                <View style={styles.rowLabel}>
                  <Moon size={15} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[type.body, styles.rowLabelText]}>
                    {t('cameraSettingsSheet.lowLightBoost')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onLowLightBoostChange(!lowLightBoost)}
                  style={[styles.toggle, lowLightBoost && styles.toggleActive]}
                >
                  <View style={[styles.toggleKnob, lowLightBoost && styles.toggleKnobActive]} />
                </Pressable>
              </View>
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

CameraSettingsSheet.displayName = 'CameraSettingsSheet';
export default CameraSettingsSheet;

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.bgElevated, borderRadius: radii.xl },
  handle: { backgroundColor: '#2E2E34', width: 40 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 6, paddingBottom: 150, gap: 22 },
  title: { color: colors.textPrimary },
  row: {},
  rowBordered: { borderTopWidth: 1, borderColor: colors.borderSubtle, paddingTop: 20 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabelText: { color: colors.textPrimary },
  optionsList: { marginTop: 14, gap: 8 },
  option: {
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bgElevated2,
    gap: 2,
  },
  optionActive: { backgroundColor: colors.accent },
  optionText: { fontFamily: 'Manrope_700Bold', fontSize: 14, color: colors.textPrimary },
  optionTextActive: { color: colors.accentText },
  optionCaption: { fontFamily: 'Manrope_500Medium', fontSize: 12, color: colors.textTertiary },
  optionCaptionActive: { color: colors.accentText, opacity: 0.85 },
  footnote: {
    marginTop: 12,
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  sliderCaptions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  captionText: { fontFamily: 'Manrope_500Medium', fontSize: 11, color: colors.textTertiary },
  segmented: { flexDirection: 'row', gap: 6 },
  segment: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.bgElevated2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { fontFamily: 'Manrope_700Bold', fontSize: 11, color: colors.textSecondary },
  segmentTextActive: { color: colors.accentText, fontFamily: 'Manrope_800ExtraBold' },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bgElevated2,
    justifyContent: 'center',
    padding: 3,
  },
  toggleActive: { backgroundColor: colors.accent },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textPrimary,
  },
  toggleKnobActive: { transform: [{ translateX: 18 }] },
});
