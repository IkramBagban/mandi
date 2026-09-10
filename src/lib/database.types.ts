/**
 * Hand-written row types mirroring `supabase/migrations.sql`.
 *
 * Regenerate with the Supabase CLI (`supabase gen types`) once the project is
 * linked — until then keep these in sync with the migration file by hand.
 */

export type PersonType = 'farmer' | 'trader' | 'labour' | 'other';
export type KhataKind = 'credit' | 'debit' | 'payment';
export type PayMethod = 'cash' | 'upi' | 'udhaar';

export interface PersonRow {
  id: string;
  owner_id: string;
  name: string;
  photo_url: string | null;
  phone: string | null;
  type: PersonType;
  village: string | null;
  notes: string | null;
  created_at: string;
}

export type PersonInsert = Omit<PersonRow, 'id' | 'created_at'> & {
  id?: string;
};

export interface KhataEntryRow {
  id: string;
  owner_id: string;
  person_id: string;
  date: string;
  kind: KhataKind;
  amount: number;
  method: PayMethod;
  note: string | null;
  created_at: string;
}

export type KhataEntryInsert = Omit<KhataEntryRow, 'id' | 'created_at'> & {
  id?: string;
};

export interface SaleExpenses {
  hamali?: number;
  tolai?: number;
  commission?: number;
  transport?: number;
}

export interface SaleRecordRow {
  id: string;
  owner_id: string;
  person_id: string | null;
  date: string;
  commodity: string;
  variety: string | null;
  qty_kg: number;
  crates: number | null;
  rate_per_kg: number;
  total: number;
  expenses: SaleExpenses;
  net: number;
  photo_url: string | null;
  created_at: string;
}

export type SaleRecordInsert = Omit<SaleRecordRow, 'id' | 'created_at'> & {
  id?: string;
};

/** Minimal `Database` shape for the typed Supabase client. */
export interface Database {
  public: {
    Tables: {
      people: {
        Row: PersonRow;
        Insert: PersonInsert;
        Update: Partial<PersonInsert>;
      };
      khata_entries: {
        Row: KhataEntryRow;
        Insert: KhataEntryInsert;
        Update: Partial<KhataEntryInsert>;
      };
      sale_records: {
        Row: SaleRecordRow;
        Insert: SaleRecordInsert;
        Update: Partial<SaleRecordInsert>;
      };
    };
  };
}
