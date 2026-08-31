import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Video } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme';
import { useScript, type ScriptEntry } from '../state/ScriptContext';
import RecentScriptCard from '../components/RecentScriptCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const { scripts, startNewScript, openScript, deleteScript } = useScript();

  const handleStartNew = () => {
    startNewScript();
    navigation.navigate('ScriptEditor');
  };

  const handleOpen = (item: ScriptEntry) => {
    openScript(item);
    navigation.navigate('ScriptEditor');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Marca */}
      <View style={styles.brandRow}>
        <Video size={20} color={colors.accent} strokeWidth={2} />
        <Text style={[type.title, styles.brandText]}>Pauta</Text>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.iconBadge}>
          <Video size={32} color={colors.accent} strokeWidth={1.75} />
        </View>

        <View style={styles.heroCopy}>
          <Text style={[type.display, styles.heroTitle]}>Crea tu próximo video</Text>
          <Text style={[type.bodyRegular, styles.heroSubtitle]}>
            Escribe el guion, ajusta el ritmo del teleprompter y graba sin distracciones.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={handleStartNew}
        >
          <Plus size={19} color={colors.accentText} strokeWidth={2.4} />
          <Text style={[type.title, styles.ctaText]}>Iniciar Proyecto</Text>
        </Pressable>
      </View>

      {/* Guiones recientes */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={[type.label, styles.recentLabel]}>Guiones recientes</Text>
          {scripts.length > 0 && (
            <Pressable onPress={() => navigation.navigate('AllScripts')} hitSlop={8}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </Pressable>
          )}
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {scripts.map((item) => (
            <RecentScriptCard
              key={item.id}
              item={item}
              onPress={() => handleOpen(item)}
              onDelete={() => deleteScript(item.id)}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  brandText: { color: colors.textPrimary, letterSpacing: 0.2 },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    paddingHorizontal: 34,
  },
  iconBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231,169,76,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroCopy: { alignItems: 'center', gap: 8 },
  heroTitle: { color: colors.textPrimary, textAlign: 'center' },
  heroSubtitle: { color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  cta: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
    paddingHorizontal: 30,
    borderRadius: radii.lg,
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  ctaText: { color: colors.accentText },
  recentSection: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, maxHeight: 220 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recentLabel: { color: colors.textTertiary },
  seeAllText: { fontFamily: 'Manrope_700Bold', fontSize: 12, color: colors.accent },
});
