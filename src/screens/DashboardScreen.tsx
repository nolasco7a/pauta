import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Info, Plus, Video } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme';
import { useScript, type ScriptEntry } from '../state/ScriptContext';
import RecentScriptCard from '../components/RecentScriptCard';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const { scripts, startNewScript, openScript, deleteScript } = useScript();
  const { t, locale, setLocale } = useTranslation();

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
        <Pressable style={styles.aboutButton} onPress={() => navigation.navigate('About')} hitSlop={8}>
          <Info size={16} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
        <View style={styles.localeSwitch}>
          {(['es', 'en'] as const).map((code) => (
            <Pressable
              key={code}
              onPress={() => setLocale(code)}
              style={[styles.localePill, locale === code && styles.localePillActive]}
              hitSlop={4}
            >
              <Text style={[styles.localePillText, locale === code && styles.localePillTextActive]}>
                {code.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 18}}>
          <View style={styles.iconBadge}>
            <Video size={32} color={colors.accent} strokeWidth={1.75} />
          </View>

          <View style={styles.heroCopy}>
            <Text style={[type.display, styles.heroTitle]}>{t('dashboard.heroTitle')}</Text>
            <Text style={[type.bodyRegular, styles.heroSubtitle]}>
              {t('dashboard.heroSubtitle')}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={handleStartNew}
        >
          <Plus size={19} color={colors.accentText} strokeWidth={2.4} />
          <Text style={[type.title, styles.ctaText]}>{t('dashboard.startProject')}</Text>
        </Pressable>
      </View>

      {/* Guiones recientes */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={[type.label, styles.recentLabel]}>{t('dashboard.recentScripts')}</Text>
          {scripts.length > 0 && (
            <Pressable onPress={() => navigation.navigate('AllScripts')} hitSlop={8}>
              <Text style={styles.seeAllText}>{t('dashboard.seeAll')}</Text>
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
  brandText: { color: colors.textPrimary, letterSpacing: 0.2, flex: 1 },
  aboutButton: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  localeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    padding: 3,
    gap: 2,
  },
  localePill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: radii.full },
  localePillActive: { backgroundColor: colors.accent },
  localePillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  localePillTextActive: { color: colors.accentText },
  hero: {
    minHeight: 320,
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 12,
    paddingVertical: 24
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
  heroCopy: { gap: 8, flexShrink: 1 },
  heroTitle: { color: colors.textPrimary },
  heroSubtitle: { color: colors.textSecondary},
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
  recentSection: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg},
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recentLabel: { color: colors.textTertiary },
  seeAllText: { fontFamily: 'Manrope_700Bold', fontSize: 12, color: colors.accent },
});
