import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, type } from '../theme';
import { useScript, type ScriptEntry } from '../state/ScriptContext';
import RecentScriptCard from '../components/RecentScriptCard';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'AllScripts'>;

export default function AllScriptsScreen({ navigation }: Props) {
  const { scripts, openScript, deleteScript } = useScript();
  const { t } = useTranslation();

  const handleOpen = (item: ScriptEntry) => {
    openScript(item);
    navigation.navigate('ScriptEditor');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={18} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[type.title, styles.topTitle]}>{t('allScripts.title')}</Text>
      </View>

      <FlatList
        data={scripts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RecentScriptCard
            item={item}
            onPress={() => handleOpen(item)}
            onDelete={() => deleteScript(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={[type.bodyRegular, styles.empty]}>{t('allScripts.empty')}</Text>
        }
      />
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
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  empty: { color: colors.textTertiary, textAlign: 'center', marginTop: 40 },
});
