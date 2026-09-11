import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BigButton, BigTextField, ChipSelect, PersonAvatar } from '@/components';
import { validateIndianPhone, validateName } from '@/lib/validation';
import { colors, radii, spacing, touchTargets, typography } from '@/theme';

import { pickPersonPhoto, takePersonPhoto } from '../photo';
import { PERSON_TYPES, type PersonDraft, type PersonFormType } from '../types';

interface PersonFormProps {
  onSubmit: (draft: PersonDraft) => void;
  onCancel: () => void;
  submitting: boolean;
}

const TYPE_ICONS = {
  farmer: 'agriculture',
  buyer: 'shopping-cart',
  seller: 'store',
  transporter: 'local-shipping',
  other: 'person',
} as const satisfies Record<PersonFormType, keyof typeof MaterialIcons.glyphMap>;

/**
 * Add-person form: photo first (camera/gallery, 88dp preview), then name,
 * phone (+91), role chips, village, notes. One primary action: Save.
 * The screen owns persistence (photo upload + repository) via `onSubmit`.
 */
export function PersonForm({ onSubmit, onCancel, submitting }: PersonFormProps) {
  const { t } = useTranslation();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<PersonFormType>('farmer');
  const [village, setVillage] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function handlePhoto(kind: 'camera' | 'gallery') {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const result = kind === 'camera' ? await takePersonPhoto() : await pickPersonPhoto();
      if (result.ok) {
        setPhotoUri(result.uri);
      } else if (result.reason === 'denied') {
        setPhotoError(t('people.photoDenied'));
      }
      // 'cancelled' → stay silent; 'error' is rare and non-blocking.
    } finally {
      setPhotoBusy(false);
    }
  }

  function handleSave() {
    const trimmedName = name.trim();
    if (!validateName(trimmedName)) {
      setNameError(t('validation.nameRequired'));
      return;
    }
    setNameError(null);
    let canonicalPhone: string | null = null;
    if (phone.trim()) {
      const checked = validateIndianPhone(phone);
      if (!checked.ok) {
        setPhoneError(t(checked.errorKey as 'validation.phoneInvalid'));
        return;
      }
      canonicalPhone = checked.value;
    }
    setPhoneError(null);
    onSubmit({
      name: trimmedName,
      photo_url: photoUri,
      phone: canonicalPhone,
      type,
      village: village.trim() ? village.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
    });
  }

  return (
    <View style={styles.form}>
      <View style={styles.photoSection}>
        <PersonAvatar name={name.trim() || '?'} photoUrl={photoUri} size={88} />
        <Text style={styles.photoLabel}>{t('people.photoLabel')}</Text>
        <View style={styles.photoButtons}>
          <Pressable
            onPress={() => void handlePhoto('camera')}
            disabled={photoBusy || submitting}
            accessibilityRole="button"
            accessibilityLabel={t('people.photoTake')}
            testID="person-photo-camera"
            style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="photo-camera" size={20} color={colors.primary} />
            <Text style={styles.photoButtonLabel}>{t('people.photoTake')}</Text>
          </Pressable>
          <Pressable
            onPress={() => void handlePhoto('gallery')}
            disabled={photoBusy || submitting}
            accessibilityRole="button"
            accessibilityLabel={t('people.photoChoose')}
            testID="person-photo-gallery"
            style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="photo-library" size={20} color={colors.primary} />
            <Text style={styles.photoButtonLabel}>{t('people.photoChoose')}</Text>
          </Pressable>
        </View>
        {photoError ? <Text style={styles.error}>{photoError}</Text> : null}
      </View>

      <BigTextField
        label={t('people.nameLabel')}
        value={name}
        onChangeText={setName}
        placeholder={t('people.namePlaceholder')}
        error={nameError}
        testID="person-name"
      />
      <BigTextField
        label={t('people.phoneLabel')}
        value={phone}
        onChangeText={setPhone}
        placeholder={t('people.phonePlaceholder')}
        hint={t('common.optional')}
        prefix="+91"
        keyboardType="phone-pad"
        error={phoneError}
        testID="person-phone"
      />
      <ChipSelect
        label={t('people.typeLabel')}
        options={PERSON_TYPES.map((value) => ({
          value,
          label: t(`people.${typeKey(value)}`),
          icon: TYPE_ICONS[value],
        }))}
        selected={type}
        onSelect={setType}
        testID="person-type"
      />
      <BigTextField
        label={t('people.villageLabel')}
        value={village}
        onChangeText={setVillage}
        placeholder={t('people.villagePlaceholder')}
        hint={t('common.optional')}
        testID="person-village"
      />
      <BigTextField
        label={t('people.notesLabel')}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('people.notesPlaceholder')}
        hint={t('common.optional')}
        multiline
        testID="person-notes"
      />

      <BigButton
        label={t('people.savePerson')}
        icon="check"
        onPress={handleSave}
        disabled={submitting}
        testID="person-save"
      />
      <Pressable
        onPress={onCancel}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        testID="person-cancel"
        style={styles.cancel}
      >
        <Text style={styles.cancelLabel}>{t('common.back')}</Text>
      </Pressable>
    </View>
  );
}

type PersonTypeKey = 'typeFarmer' | 'typeBuyer' | 'typeSeller' | 'typeTransporter' | 'typeOther';

function typeKey(value: PersonFormType): PersonTypeKey {
  switch (value) {
    case 'farmer':
      return 'typeFarmer';
    case 'buyer':
      return 'typeBuyer';
    case 'seller':
      return 'typeSeller';
    case 'transporter':
      return 'typeTransporter';
    case 'other':
      return 'typeOther';
  }
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  photoSection: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  photoLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    minHeight: touchTargets.minimum,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.8,
  },
  photoButtonLabel: {
    ...typography.bodyBold,
    color: colors.primaryDark,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  cancel: {
    minHeight: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
});
