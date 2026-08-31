import React, { useCallback, useMemo } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { File } from 'expo-file-system';
import { ArrowLeft, Save, Video as VideoIcon, X } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme';
import { useScript } from '../state/ScriptContext';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ScriptEditor'>;

const WORDS_PER_MINUTE = 140; // ritmo de lectura promedio, usado para estimar duración

export default function ScriptEditorScreen({ navigation }: Props) {
  const { title, setTitle, script, setScript, saveScript, currentVideos, removeVideoFromCurrentScript } =
    useScript();
  const { t } = useTranslation();

  // Al volver a esta pantalla, purga tags cuya copia local ya no existe (p. ej. se limpió
  // el almacenamiento). Es una comprobación de archivo síncrona, no toca Fotos ni permisos.
  useFocusEffect(
    useCallback(() => {
      currentVideos.forEach((video) => {
        if (!new File(video.uri).exists) removeVideoFromCurrentScript(video.uri);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentVideos])
  );

  const handleDeleteVideo = async (video: { uri: string; assetId: string | null }) => {
    try {
      new File(video.uri).delete();
    } catch (error) {
      console.warn('No se pudo borrar la copia local del video', error);
    }
    if (video.assetId) {
      try {
        const { status } = await requestPermissionsAsync();
        if (status === 'granted') await Asset.delete([new Asset(video.assetId)]);
      } catch {
        // El usuario canceló el diálogo nativo, o el asset ya no existe en Fotos.
      }
    }
    removeVideoFromCurrentScript(video.uri);
  };

  const { wordCount, seconds } = useMemo(() => {
    const words = script.trim().length ? script.trim().split(/\s+/) : [];
    const count = words.length;
    return { wordCount: count, seconds: Math.round((count / WORDS_PER_MINUTE) * 60) };
  }, [script]);

  const canRecord = script.trim().length > 0;

  const handleSave = () => {
    saveScript();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={18} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <TextInput
          style={[type.title, styles.topTitle]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('scriptEditor.titlePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Pressable style={styles.flex} onPress={Keyboard.dismiss}>
            <Text style={[type.label, styles.label]}>{t('scriptEditor.scriptLabel')}</Text>
            <TextInput
              style={styles.input}
              value={script}
              onChangeText={setScript}
              multiline
              autoFocus
              placeholder={t('scriptEditor.scriptPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              textAlignVertical="top"
              scrollEnabled={false}
            />
          </Pressable>
        </ScrollView>

        {currentVideos.length > 0 && (
          <View style={styles.videosSection}>
            <Text style={[type.label, styles.videosLabel]}>
              {t('scriptEditor.recordedVideos', { count: currentVideos.length })}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videosRow}>
              {currentVideos.map((video, index) => (
                <View key={video.uri} style={styles.videoChipWrap}>
                  <Pressable
                    style={styles.videoChip}
                    onPress={() => navigation.navigate('VideoPlayer', video)}
                  >
                    <VideoIcon size={14} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.videoChipText}>
                      {t('scriptEditor.videoLabel', { index: index + 1 })}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.videoChipDelete}
                    onPress={() => handleDeleteVideo(video)}
                    hitSlop={8}
                  >
                    <X size={10} color={colors.textPrimary} strokeWidth={3} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Meta + CTA */}
        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <Text style={[type.caption, styles.metaText]}>
              {t('scriptEditor.wordCount', { count: wordCount })}
            </Text>
            <Text style={[type.caption, styles.metaText]}>
              {t('scriptEditor.readingTime', { count: seconds })}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              disabled={!canRecord}
              style={({ pressed }) => [
                styles.saveButton,
                !canRecord && styles.ctaDisabled,
                pressed && canRecord && styles.saveButtonPressed,
              ]}
              onPress={handleSave}
            >
              <Save size={17} color={colors.textPrimary} strokeWidth={2.2} />
              <Text style={[type.title, styles.saveButtonText]}>{t('scriptEditor.save')}</Text>
            </Pressable>

            <Pressable
              disabled={!canRecord}
              style={({ pressed }) => [
                styles.cta,
                !canRecord && styles.ctaDisabled,
                pressed && canRecord && styles.ctaPressed,
              ]}
              onPress={() => navigation.navigate('Camera')}
            >
              <VideoIcon size={19} color={colors.accentText} strokeWidth={2.2} />
              <Text style={[type.title, styles.ctaText]}>{t('scriptEditor.record')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 18,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { color: colors.textPrimary, flex: 1 },
  flex: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 6 },
  label: { color: colors.textTertiary, marginBottom: 14 },
  input: {
    ...type.script,
    color: colors.textPrimary,
    padding: 0,
    minHeight: 140,
  },
  videosSection: { paddingHorizontal: spacing.xl, paddingBottom: 4 },
  videosLabel: { color: colors.textTertiary, marginBottom: 10 },
  videosRow: { gap: 12, paddingRight: 4, paddingTop: 4 },
  videoChipWrap: { position: 'relative' },
  videoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoChipText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: colors.textSecondary },
  videoChipDelete: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textTertiary,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: 16,
    gap: 10,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaText: { color: colors.textTertiary },
  actionsRow: { flexDirection: 'row', gap: 10 },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: radii.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButtonPressed: { opacity: 0.85 },
  saveButtonText: { color: colors.textPrimary },
  cta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: radii.lg,
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  ctaDisabled: { opacity: 0.35 },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  ctaText: { color: colors.accentText },
});
