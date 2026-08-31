import React, { forwardRef, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { ChevronRight, FileText, Gauge, Type } from 'lucide-react-native';
import { colors, radii, type } from '../theme';
import Slider from './Slider';

type FontSize = 'S' | 'M' | 'L';

type Props = {
  speed: number;
  onSpeedChange: (v: number) => void;
  fontSize: FontSize;
  onFontSizeChange: (v: FontSize) => void;
  setIsOpen: (value: boolean) => void
};

const SPEED_MULTIPLIER_MIN = 0.5;
const SPEED_MULTIPLIER_MAX = 3;

const SettingsSheet = forwardRef<BottomSheetModal, Props>(
  ({ speed, onSpeedChange, fontSize, onFontSizeChange, setIsOpen }, ref) => {
    const multiplier = SPEED_MULTIPLIER_MIN + speed * (SPEED_MULTIPLIER_MAX - SPEED_MULTIPLIER_MIN);

    const callbackIsOpen = useCallback((value: number) => {
      // value:0 means the bottom is open
      if (value >= 0) setIsOpen(true)
      else setIsOpen(false)
    }, [])

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
          <Text style={[type.title, styles.title]}>Ajustes de teleprompter</Text>

          {/* Velocidad */}
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <View style={styles.rowLabel}>
                <Gauge size={15} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[type.body, styles.rowLabelText]}>Velocidad</Text>
              </View>
              <View style={styles.valuePill}>
                <Text style={styles.valuePillText}>{multiplier.toFixed(1)}x</Text>
              </View>
            </View>

            <Slider value={speed} onChange={onSpeedChange} />

            <View style={styles.sliderCaptions}>
              <Text style={styles.captionText}>Lento</Text>
              <Text style={styles.captionText}>Rápido</Text>
            </View>
          </View>

          {/* Tamaño de texto */}
          <View style={[styles.row, styles.rowBordered]}>
            <View style={styles.rowHeader}>
              <View style={styles.rowLabel}>
                <Type size={15} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[type.body, styles.rowLabelText]}>Tamaño de texto</Text>
              </View>
              <View style={styles.segmented}>
                {(['S', 'M', 'L'] as FontSize[]).map((size) => (
                  <Pressable
                    key={size}
                    onPress={() => onFontSizeChange(size)}
                    style={[styles.segment, fontSize === size && styles.segmentActive]}
                  >
                    <Text
                      style={[styles.segmentText, fontSize === size && styles.segmentTextActive]}
                    >
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

SettingsSheet.displayName = 'SettingsSheet';
export default SettingsSheet;

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
  valuePill: {
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: colors.bgElevated2,
  },
  valuePillText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 12, color: colors.accent },
  sliderCaptions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  captionText: { fontFamily: 'Manrope_500Medium', fontSize: 11, color: colors.textTertiary },
  segmented: { flexDirection: 'row', gap: 6 },
  segment: {
    width: 30,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.bgElevated2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { fontFamily: 'Manrope_700Bold', fontSize: 11, color: colors.textSecondary },
  segmentTextActive: { color: colors.accentText, fontFamily: 'Manrope_800ExtraBold' },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.bgElevated2,
    borderRadius: radii.md,
  },
  editRowText: { flex: 1, color: colors.textPrimary },
});
