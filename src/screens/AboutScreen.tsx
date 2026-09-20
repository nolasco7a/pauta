import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Video } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme';
import { useTranslation } from '../i18n';
import pkg from '../../package.json';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export default function AboutScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={18} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[type.title, styles.topTitle]}>{t('about.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconBadge}>
          <Video size={32} color={colors.accent} strokeWidth={1.75} />
        </View>

        <Text style={[type.display, styles.appName]}>Pauta</Text>
        <Text style={[type.caption, styles.version]}>
          {t('about.version', { version: pkg.version })}
        </Text>

        <Text style={[type.bodyRegular, styles.body]}>{t('about.body')}</Text>

        <Text style={[type.body, styles.credit]}>
          {t('about.creditPrefix')}{' '}
          <Text
            style={styles.creditLink}
            onPress={() => Linking.openURL('mailto:allanmejia.dev@gmail.com')}
          >
            Allan Mejia
          </Text>
        </Text>
      </ScrollView>
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
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, alignItems: 'center' },
  iconBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231,169,76,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: spacing.md,
  },
  appName: { color: colors.textPrimary, marginTop: spacing.md },
  version: { color: colors.textTertiary, marginTop: 2 },
  body: {
    color: colors.textSecondary,
    marginTop: spacing.xl,
    lineHeight: 22,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  credit: { color: colors.accent, marginTop: spacing.lg, alignSelf: 'stretch' },
  creditLink: { textDecorationLine: 'underline' },
});
