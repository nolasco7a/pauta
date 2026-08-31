import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { FileText, Trash } from 'lucide-react-native';
import { colors, radii, type } from '../theme';
import type { ScriptEntry } from '../state/ScriptContext';
import type { TranslateOptions } from 'i18n-js';
import { useTranslation } from '../i18n';

type Props = {
  item: ScriptEntry;
  onPress: () => void;
  onDelete: () => void;
};

type T = (scope: string, options?: TranslateOptions) => string;

function formatRelativeDate(ts: number, t: T) {
  const diffDays = Math.floor((Date.now() - ts) / 86_400_000);
  if (diffDays <= 0) return t('scriptCard.today');
  if (diffDays === 1) return t('scriptCard.yesterday');
  return t('scriptCard.daysAgo', { count: diffDays });
}

export default function RecentScriptCard({ item, onPress, onDelete }: Props) {
  const { t } = useTranslation();
  const videoCount = item.videos.length;
  const meta = `${formatRelativeDate(item.updatedAt, t)} · ${t('scriptCard.videoCount', { count: videoCount })}`;
  const title = item.title.trim() || t('scriptEditor.titlePlaceholder');

  const confirmDelete = () => {
    Alert.alert(
      t('scriptCard.deleteTitle'),
      t('scriptCard.deleteMessage', { title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={styles.wrap}>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
        <View style={styles.cardIcon}>
          <FileText size={17} color={colors.textSecondary} strokeWidth={2} />
        </View>
        <View style={styles.cardText}>
          <Text style={[type.body, styles.cardTitle]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[type.caption, styles.cardMeta]}>{meta}</Text>
        </View>
      </Pressable>
      <Pressable style={styles.deleteBadge} onPress={confirmDelete} hitSlop={8}>
        <Trash size={10} color={colors.textPrimary} strokeWidth={3} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    marginBottom: 9,
  },
  cardPressed: { opacity: 0.85 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgElevated2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.textPrimary },
  cardMeta: { color: colors.textTertiary, marginTop: 2 },
  deleteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textTertiary,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
