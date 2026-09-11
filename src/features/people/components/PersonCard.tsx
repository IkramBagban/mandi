import { useTranslation } from 'react-i18next';

import { ListRow, PersonAvatar } from '@/components';
import type { PersonType } from '@/lib/database.types';

import type { Person } from '../types';

type TypeLabelKey =
  | 'people.typeFarmer'
  | 'people.typeBuyer'
  | 'people.typeSeller'
  | 'people.typeTransporter'
  | 'people.typeOther';

/**
 * Legacy DB rows may carry `trader`/`labour` (pre-feature check values);
 * show them under the closest current role instead of raw codes.
 */
function typeLabelKey(type: PersonType): TypeLabelKey {
  switch (type) {
    case 'farmer':
      return 'people.typeFarmer';
    case 'buyer':
    case 'trader':
      return 'people.typeBuyer';
    case 'seller':
      return 'people.typeSeller';
    case 'transporter':
      return 'people.typeTransporter';
    case 'labour':
    case 'other':
    default:
      return 'people.typeOther';
  }
}

/**
 * One row in the people list: photo first, name + role/village/phone in two
 * compact lines. Built on the shared `ListRow` — one tap opens the person.
 */
export function PersonCard({ person, onPress }: { person: Person; onPress: () => void }) {
  const { t } = useTranslation();
  const meta = [t(typeLabelKey(person.type)), person.village, person.phone]
    .filter(Boolean)
    .join(' · ');
  return (
    <ListRow
      avatar={<PersonAvatar name={person.name} photoUrl={person.photo_url} size={40} />}
      title={person.name}
      subtitle={meta || null}
      chevron
      onPress={onPress}
      testID={`person-card-${person.id}`}
    />
  );
}
