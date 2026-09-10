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

## Stubs for the next workers

| Area     | Stub location                                            | Build next                                                 |
| -------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| People   | `app/(tabs)/people.tsx`, `features/people`               | Search + photo grid + add-person sheet                     |
| Khata    | `app/(tabs)/khata.tsx`, `features/khata`                 | Person picker → balance → entry form                       |
| Sales    | `app/(tabs)/records.tsx`, `features/records`             | Wizard: commodity → weight → rate → expenses → photo → net |
| Auth OTP | `features/auth`, `lib/sms.ts`, `functions/send-sms-hook` | Login screens (phone → code), deploy hook, MSG91 secrets   |
| WhatsApp | — (no code yet)                                          | Share via `expo-sharing` / deep link                       |
| Photos   | `lib/upload.ts` (`uploadPhoto` TODO)                     | Wire `expo-image-picker` + session-scoped paths            |

## Commit conventions

Conventional Commits, small scoped commits: `feat:`, `fix:`, `chore:`,
`docs:`. Feature branches under the session namespace; PRs link their issue.
