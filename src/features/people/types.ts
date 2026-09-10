import type { PersonInsert, PersonRow, PersonType } from '@/lib/database.types';

export type Person = PersonRow;
export type { PersonType };

/**
 * Person roles shown as big photo-first chips in the add-person form.
 * `trader`/`labour` stay valid for rows written before this feature
 * (see `supabase/migrations.sql`) but the form only offers the five below.
 */
export const PERSON_TYPES = ['farmer', 'buyer', 'seller', 'transporter', 'other'] as const;

export type PersonFormType = (typeof PERSON_TYPES)[number];

/** Fields the add-person form collects. `owner_id` is attached in the repo. */
export interface PersonDraft {
  name: string;
  photo_url?: string | null;
  phone?: string | null;
  type: PersonFormType;
  village?: string | null;
  notes?: string | null;
}

export type { PersonInsert };

/**
 * Search across name + phone + village. Digits are normalised first so a
 * Hindi-keyboard query still matches an ASCII phone number and vice versa.
 */
export function filterPeople(people: Person[], rawQuery: string): Person[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return people;
  const digits = query.replace(/[^\d]/g, '');
  return people.filter((person) => {
    if (person.name.toLowerCase().includes(query)) return true;
    if (person.village && person.village.toLowerCase().includes(query)) return true;
    if (person.phone && person.phone.includes(digits.length > 0 ? digits : query)) return true;
    return false;
  });
}
