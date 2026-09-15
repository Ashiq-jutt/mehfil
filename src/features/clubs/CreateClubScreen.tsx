import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Chip, CloseButton, Icon, LoadingState, Panel, Screen, TextField } from '../../components';
import { useClubCategories, useCountries } from '../../hooks/useCatalog';
import { useClub, useCreateClub, useUpdateClub } from '../../hooks/useClubs';
import type { MainStackScreenProps } from '../../navigation/types';
import { colors, moderateScale, radius, spacing } from '../../theme';
import { CountryPickerDialog } from '../shared/CountryPickerDialog';

const LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Pashto', 'Sindhi', 'Hindi', 'Bengali', 'Arabic', 'Turkish', 'Other'];

/** Create a club, or edit one when route.params.publicId is present (owner/admin). */
export function CreateClubScreen({ route, navigation }: MainStackScreenProps<'CreateClub'>) {
  const editingId = route.params?.publicId ?? null;
  const existing = useClub(editingId);
  const categories = useClubCategories();
  const countries = useCountries();
  const create = useCreateClub();
  const update = useUpdateClub(editingId ?? '');

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [language, setLanguage] = useState('English');
  const [announcement, setAnnouncement] = useState('');
  const [countryPicker, setCountryPicker] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (editingId && existing.data && !seeded) {
      setName(existing.data.name);
      setCategoryId(existing.data.categoryId);
      setCountryCode(existing.data.countryCode ?? null);
      setLanguage(existing.data.language);
      setAnnouncement(existing.data.announcement ?? '');
      setSeeded(true);
    }
  }, [editingId, existing.data, seeded]);

  useEffect(() => {
    if (!editingId && categoryId === null && categories.data?.length) {
      setCategoryId(categories.data[0].id);
    }
  }, [editingId, categoryId, categories.data]);

  const country = useMemo(() => countries.data?.find(c => c.code === countryCode) ?? null, [countries.data, countryCode]);
  const trimmed = name.trim();
  const nameError = trimmed.length > 0 && (trimmed.length < 3 || trimmed.length > 48) ? 'Use 3–48 characters.' : undefined;
  const valid = trimmed.length >= 3 && trimmed.length <= 48 && categoryId !== null && announcement.length <= 500;
  const busy = create.isPending || update.isPending;

  const submit = () => {
    if (!valid || categoryId === null) {
      return;
    }
    const body = { name: trimmed, categoryId, countryCode, language, announcement: announcement.trim() || null };
    if (editingId) {
      update.mutate(body, { onSuccess: () => navigation.goBack() });
    } else {
      create.mutate(body, { onSuccess: club => navigation.replace('ClubInfo', { publicId: club.id }) });
    }
  };

  if (editingId && existing.isLoading && !existing.data) {
    return (
      <Screen variant="flat">
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen variant="flat">
      <View style={styles.topBar}>
        <AppText variant="title" color="textGold" shadow>
          {editingId ? 'Edit club' : 'Create a club'}
        </AppText>
        <CloseButton onPress={() => navigation.goBack()} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Panel variant="magenta" style={styles.panel}>
            <TextField label="Club name" value={name} onChangeText={setName} maxLength={48} placeholder="e.g. Gentle talk" error={nameError} containerStyle={styles.field} />

            <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
              Category
            </AppText>
            <View style={styles.chips}>
              {(categories.data ?? []).map(c => (
                <Chip key={c.id} label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
              ))}
            </View>

            <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
              Country
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => setCountryPicker(true)} style={styles.countryButton}>
              <AppText variant="bodyStrong">{country ? `${country.flagEmoji} ${country.name}` : '🌐 Global (no country)'}</AppText>
              <Icon name="chevronRight" size={moderateScale(16)} color={colors.textSecondary} />
            </Pressable>

            <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
              Language
            </AppText>
            <View style={styles.chips}>
              {LANGUAGES.map(l => (
                <Chip key={l} label={l} active={language === l} onPress={() => setLanguage(l)} />
              ))}
            </View>

            <TextField
              label="Announcement"
              value={announcement}
              onChangeText={setAnnouncement}
              maxLength={500}
              multiline
              placeholder="Welcome message shown in the room"
              containerStyle={styles.field}
              style={styles.announcement}
            />
            <AppText variant="tiny" color="textMuted" align="right">
              {announcement.length}/500
            </AppText>
          </Panel>

          <Button label={editingId ? 'Save changes' : 'Create club'} size="lg" disabled={!valid} loading={busy} onPress={submit} style={styles.submit} />
          {!editingId ? (
            <AppText variant="caption" color="textMuted" align="center" style={styles.hint}>
              You can add a cover photo from the club page after creating it.
            </AppText>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerDialog
        visible={countryPicker}
        includeGlobal
        selectedCode={countryCode ?? 'GLOBAL'}
        onClose={() => setCountryPicker(false)}
        onSelect={c => {
          setCountryCode(c.code === 'GLOBAL' ? null : c.code);
          setCountryPicker(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  panel: {},
  field: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: moderateScale(46),
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  announcement: {
    height: 96,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  submit: {
    marginTop: spacing.lg,
  },
  hint: {
    marginTop: spacing.sm,
  },
});
