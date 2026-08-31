import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { File } from 'expo-file-system';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, type } from '../theme';
import { useScript } from '../state/ScriptContext';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoPlayer'>;

export default function VideoPlayerScreen({ navigation, route }: Props) {
  const { uri, assetId } = route.params;
  const insets = useSafeAreaInsets();
  const { removeVideoFromCurrentScript } = useScript();
  const { t } = useTranslation();

  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });

  const handleDelete = async () => {
    try {
      new File(uri).delete();
    } catch (error) {
      console.warn('No se pudo borrar la copia local del video', error);
    }
    if (assetId) {
      try {
        const { status } = await requestPermissionsAsync();
        if (status === 'granted') await Asset.delete([new Asset(assetId)]);
      } catch {
        // El usuario canceló el diálogo nativo, o el asset ya no existe en Fotos.
      }
    }
    removeVideoFromCurrentScript(uri);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" />

      <View style={styles.topBar}>
        <View style={[styles.topBarActions, {top: insets.top}]}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} hitSlop={8}>
            <ArrowLeft size={18} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={[type.title, styles.topTitle]}>{t('videoPlayer.title')}</Text>
          <Pressable style={styles.iconButton} onPress={handleDelete} hitSlop={8}>
            <Trash2 size={18} color={colors.record} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    top: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  topBarActions: {flexDirection: 'row', alignItems: 'center', gap: 12},
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
  topTitle: {
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    backgroundColor: colors.overlayGlass,
    padding: 8,
    borderRadius: 15,
    width: 50,
    maxWidth: 100
  },
});
