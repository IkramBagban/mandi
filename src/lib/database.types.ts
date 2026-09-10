/**
 * Hand-written row types mirroring `supabase/migrations.sql`.
 *
 * Regenerate with the Supabase CLI (`supabase gen types`) once the project is
 * linked — until then keep these in sync with the migration file by hand.
 *
 * NOTE: rows are `type` aliases (not `interface`) on purpose — only object
 * literal types get an implicit index signature, which the Supabase client's
 * `Record<string, unknown>` generics require.
 */

export type PersonType =
  'farmer' | 'buyer' | 'seller' | 'transporter' | 'trader' | 'labour' | 'other';
export type KhataKind = 'credit' | 'debit' | 'payment';
export type PayMethod = 'cash' | 'upi' | 'udhaar';

export type PersonRow = {
  id: string;
  owner_id: string;
  name: string;
  photo_url: string | null;
  phone: string | null;
  type: PersonType;
  village: string | null;
  notes: string | null;
  created_at: string;
};

export type PersonInsert = Omit<PersonRow, 'id' | 'created_at'> & {
  id?: string;
};

export type KhataEntryRow = {
  id: string;
  owner_id: string;
  person_id: string;
  date: string;
  kind: KhataKind;
  amount: number;
  method: PayMethod;
  note: string | null;
  created_at: string;
};

export type KhataEntryInsert = Omit<KhataEntryRow, 'id' | 'created_at'> & {
  id?: string;
};

export type SaleExpenses = {
  hamali?: number;
  tolai?: number;
  commission?: number;
  transport?: number;
  /** Any other deduction (e.g. bardana, grading). Added for the sale form. */
  other?: number;
};

export type SaleRecordRow = {
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
};

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
        Relationships: [];
      };
      khata_entries: {
        Row: KhataEntryRow;
        Insert: KhataEntryInsert;
        Update: Partial<KhataEntryInsert>;
        Relationships: [];
      };
      sale_records: {
        Row: SaleRecordRow;
        Insert: SaleRecordInsert;
        Update: Partial<SaleRecordInsert>;
        Relationships: [];
      };
    };
    // Empty Views/Functions so the shape satisfies the client's
    // GenericSchema (same as `supabase gen types` output).
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
