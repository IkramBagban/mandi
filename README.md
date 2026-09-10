# Mandi

Simple khata + sale-record app for mandi traders and farmers who are not very
app-literate. **UX simplicity is the top priority**: big 48dp+ touch targets,
icon + photo first, large numerals, high contrast, one primary action per
screen.

React Native (Expo SDK 57, TypeScript strict, Expo Router).

## Run it

Prerequisites: Node 20+, the **Expo Go** app on your phone (same Wi-Fi as your
machine).

```sh
npm install
npx expo start
```

Then press `a` (Android), `i` (iOS simulator, macOS only), `w` (web), or scan
the QR code with Expo Go. No native build, no Supabase project, and no `.env`
needed to explore the UI — data layers are stubs (see below).

## Env setup (only needed for live Supabase work)

```sh
cp .env.example .env
```

| Variable                        | Where to get it                                          |
| ------------------------------- | -------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase Dashboard → Project Settings → API              |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Same page (anon/public key — never the service role key) |

`.env` is gitignored. Never commit secrets; `.env.example` holds placeholders.

## Scripts

| Script                            | What it does                         |
| --------------------------------- | ------------------------------------ |
| `npm start`                       | Start the dev server (`expo start`)  |
| `npm run android` / `ios` / `web` | Start targeting a platform           |
| `npm run typecheck`               | `tsc --noEmit` (strict)              |
| `npm run lint` / `lint:fix`       | ESLint (expo flat config + prettier) |
| `npm run format` / `format:check` | Prettier write / check               |

Quality gate before every push: `npm run typecheck && npm run lint`.

## Folder map

```text
app/
  _layout.tsx            Root: locale bootstrap (stored → device → Hindi),
                         RTL flags, i18n init, splash gate, Stack
  (tabs)/
    _layout.tsx          5 tabs: Home · People · Khata · Sales · Settings
    index.tsx            Home — greeting + 3 giant job buttons (shell)
    people.tsx           People shell → TODO(feature:people-list)
    khata.tsx            Khata shell → TODO(feature:khata-ledger)
    records.tsx          Sales shell → TODO(feature:sale-entry)
    settings.tsx         Language switcher (en/hi/mr/ur) + about
src/
  components/            Reusable UI only: Screen, BigButton, AmountInput,
                         PersonAvatar, EmptyState
  features/
    people/              types + repository stub
    khata/               types + repository stub + computeBalance (real)
    records/             types + repository stub + computeTotal/Net (real)
  i18n/                  i18next setup, RTL helpers, locales/en|hi|mr|ur.json
  lib/
    supabase.ts          Typed client (anon key, AsyncStorage session)
    database.types.ts    Hand-written row types (mirror migrations.sql)
    upload.ts            compress-then-upload photo pipeline (Storage stub)
    validation.ts        Amount / Indian-phone / quantity validators
    format.ts            INR / kg / date formatting per language
  store/
    settings.ts          Zustand+persist: language (default Hindi)
  theme/
    tokens.ts            Colors, spacing, type scale, touch targets — one place
supabase/
  migrations.sql         people, khata_entries, sale_records + RLS + storage notes
```

## Decisions (brief)

- **Expo SDK 57 + Expo Router** (latest stable at scaffold time). Routes live in
  `app/`; `typedRoutes` experiment is on.
- **i18n: i18next + react-i18next + expo-localization.** All UI strings are keys
  (`t('…')`) — no hardcoded strings in components. Default language **Hindi**;
  device language is used only if supported and no choice is stored. Urdu sets
  `I18nManager.forceRTL(true)`; RN applies it fully after **one restart**
  (settings screen says so).
- **State: Zustand only.** It holds the persisted language setting. TanStack
  Query is deliberately **not** installed — there are no live queries yet
  (repositories are stubs); add it when sync/ledger fetching lands.
- **Supabase: schema file + typed client + stubs.** No live project required.
  RLS-first: every table forces `owner_id = auth.uid()`; the app uses the anon
  key only. Regenerate `database.types.ts` via `supabase gen types` once linked.
- **Auth: phone OTP only, WhatsApp-first.** Login uses `signInWithOtp({ phone })`
  with channel order WhatsApp → SMS (see `src/features/auth/`). Delivery is
  server-side through a Supabase **Send SMS Hook**
  (`supabase/functions/send-sms-hook/`) that tries WhatsApp first and falls
  back to **MSG91 SMS** (`src/lib/sms.ts` provider contract). MSG91 keys live
  in Edge Function secrets — never in the app.
- **Photos: compress on-device first** (`expo-image-manipulator` current
  contextual API — `manipulate().resize().renderAsync()`), max 1024px / JPEG
  0.7. Recognizable is enough; keeps mandi-network uploads fast.
- **Validation:** amounts accept Devanagari/Arabic-Indic digits (normalized),
  Indian mobiles validated as 10 digits starting 6–9; money is `numeric`, never
  float.

## People + Khata (built)

- **People tab** (`app/(tabs)/people.tsx`): photo-first list (72dp avatars),
  search by name/phone/village, add-person form (camera/gallery photo via
  `expo-image-picker`, name, +91 phone validation, role chips
  farmer/buyer/seller/transporter/other, village, notes).
- **Person detail** (`app/person/[id].tsx`): big photo + name, call/WhatsApp
  buttons, lifetime balance header, full ledger, delete person.
- **Khata tab** (`app/(tabs)/khata.tsx`): face picker → big green/red balance
  → add entry (gave/took/settled × AmountInput × cash/UPI/udhaar × day
  stepper × note) → date-wise history with edit/delete → WhatsApp share of
  a translated khata summary (`wa.me` deep link).
- **Data**: repositories (`src/features/people|khata/repository.ts`) are
  Supabase-first and offline-safe — no config/session/network falls back to
  an AsyncStorage mirror, and screens show friendly retry states instead of
  crashing. Person roles were widened to
  farmer/buyer/seller/transporter (+ legacy trader/labour still readable);
  if a Supabase project was already provisioned from the old migration,
  widen its `people.type` check to match `supabase/migrations.sql`.
- **Verify in Expo Go** (no `.env` needed): `npm install && npx expo start`,
  scan the QR → People → Add person (take/choose photo, save) → open the
  person → New entry (try all 3 kinds) → check the balance colour flips →
  History edit/delete → Share on WhatsApp. Switch language in Settings and
  re-check every screen (en/hi/mr/ur, zero hardcoded strings).
- **TODOs for integration**: confirm the `payment` balance sign with real
  traders before money moves on it; add server sync for rows created offline
  (local ids are `person_*`/`entry_*`); resolve private-bucket photo URLs
  with signed URLs once buckets go live; wire the auth OTP flow so RLS
  `owner_id` rows sync to Supabase.

## Stubs for the next workers

| Area     | Stub location                                            | Build next                                                 |
| -------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| People   | `app/(tabs)/people.tsx`, `features/people`               | ✅ Done (this branch) — photo list + search + add-person   |
| Khata    | `app/(tabs)/khata.tsx`, `features/khata`                 | ✅ Done (this branch) — picker → balance → entries → share |
| Sales    | `app/(tabs)/records.tsx`, `features/records`             | Wizard: commodity → weight → rate → expenses → photo → net |
| Auth OTP | `features/auth`, `lib/sms.ts`, `functions/send-sms-hook` | Login screens (phone → code), deploy hook, MSG91 secrets   |
| WhatsApp | `features/khata/share.ts` (+ `KhataLedger` share button) | ✅ Khata summary share done — more share surfaces later    |
| Photos   | `lib/upload.ts` + `features/people/photo.ts`             | ✅ Person photos wired — signed URLs + record photos later |

## Sale records + Udhaari dashboard

- **New sale** (`app/record/new.tsx`): person search → day stepper → commodity
  chips (mosambi 1no default) → weight / crates / rate → expenses (hamali,
  tolai, commission % auto-derived, transport, other) → optional receipt photo
  (image picker + `uploadPhoto` compression) → live bill (`CalcCard`) →
  confirm sheet → one `saveSaleWithKhata()` call.
- **Single-writer flow** (no double entry, no orphans): `saveSaleWithKhata`
  (`src/features/records/saveSale.ts`) inserts the `sale_records` row first,
  then `postSaleToKhata` (`src/features/khata/autoPost.ts`) posts exactly one
  mirror entry (`kind: 'debit'` — I owe the farmer the net, `method: 'udhaar'`).
  If the mirror post fails, the sale row is deleted (compensating rollback).
  No other module may post khata rows for sales. Walk-in (`person_id` null)
  and zero-net sales post nothing.
- **Dashboard** (Home tab): `summarizeUdhaari` (`src/features/khata/udhaari.ts`)
  computes to-collect / to-pay / today's collection / top debtors purely from
  `khata_entries` (+ people for avatars). Khata screens remain another
  worker's lane — reuse `listEntries` / `listAllEntries` / `addEntry`.
- **Money math** lives in one place: `calculateSale` (`records/calculations`);
  `total = qty × rate`, `commission = total × % / 100`,
  `net = total − (hamali+tolai+commission+transport+other)`.
- **Demo mode**: with no Supabase env vars and an empty people list, the first
  `searchPeople` call runs the at-most-once `seedDemoData`
  (`records/demo.ts`, flag-guarded in AsyncStorage): sample people, sales saved
  through the real `saveSaleWithKhata` (so khata mirrors post normally), and
  one cash collection today. Seeded rows live in the same offline caches as
  real rows — editable, deletable, never reseeded — and never run once env
  vars exist. Date keys (`todayKey`/`shiftDateKey`) and person filtering
  (`filterPeople`) are reused from the people-khata lane, not duplicated.
- **i18n**: new `sale.*`, `commodities.*`, `home.udhaari*`, `records.*` keys in
  all four locales (en/hi/mr/ur share the exact same key set — verify by
  flattening each JSON file and diffing the key lists before push).

## Commit conventions

Conventional Commits, small scoped commits: `feat:`, `fix:`, `chore:`,
`docs:`. Feature branches under the session namespace; PRs link their issue.
