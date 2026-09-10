import type { Person, PersonDraft } from './types';

/**
 * People repository (STUB).
 *
 * TODO(feature:people-list): implement against Supabase. Every query is
 * automatically scoped to the signed-in owner by RLS
 * (`owner_id = auth.uid()` — see `supabase/migrations.sql`), so repositories
 * must never pass `owner_id` from client state; set it from the session.
 * Photos go through `uploadPhoto()` in `@/lib/upload` before insert.
 */

export async function listPeople(): Promise<Person[]> {
  throw new Error('TODO: listPeople is not implemented yet.');
}

export async function createPerson(_draft: PersonDraft): Promise<Person> {
  throw new Error('TODO: createPerson is not implemented yet.');
}

export async function deletePerson(_id: string): Promise<void> {
  throw new Error('TODO: deletePerson is not implemented yet.');
}
