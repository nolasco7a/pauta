import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { FileText, Trash } from 'lucide-react-native';
import { colors, radii, type } from '../theme';
import type { ScriptEntry } from '../state/ScriptContext';

type Props = {
  item: ScriptEntry;
  onPress: () => void;
  onDelete: () => void;
};

function formatRelativeDate(ts: number) {
  const diffDays = Math.floor((Date.now() - ts) / 86_400_000);
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
}

export default function RecentScriptCard({ item, onPress, onDelete }: Props) {
  const videoCount = item.videos.length;
  const meta = `${formatRelativeDate(item.updatedAt)} · ${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`;

  const confirmDelete = () => {
    Alert.alert('¿Borrar guion?', `Se eliminará "${item.title}". Los videos ya grabados no se tocan.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
        <View style={styles.cardIcon}>
          <FileText size={17} color={colors.textSecondary} strokeWidth={2} />
        </View>
        <View style={styles.cardText}>
          <Text style={[type.body, styles.cardTitle]} numberOfLines={1}>
            {item.title}
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
