import type { PersonInsert, PersonRow, PersonType } from '@/lib/database.types';

export type Person = PersonRow;
export type { PersonType };

/** Fields the add-person form collects. `owner_id` is attached in the repo. */
export interface PersonDraft {
  name: string;
  photo_url?: string | null;
  phone?: string | null;
  type: PersonType;
  village?: string | null;
  notes?: string | null;
}

export type { PersonInsert };
