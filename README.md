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

## Phone OTP auth

Login is phone-OTP only: `app/(auth)/` (phone → 6-digit code) gated by the
root layout — logged-out users see the auth stack only. The session
persists in AsyncStorage, so users stay logged in across restarts; logout
lives in Settings → Account. Delivery is WhatsApp-first with MSG91 SMS
fallback, routed server-side through the Send SMS Hook
(`supabase/functions/send-sms-hook/`, which imports the shared adapter in
`src/lib/sms.ts`). MSG91 secrets live in Edge Function secrets — never in
the app bundle, never in `EXPO_PUBLIC_*` vars.

### Test OTPs for dev (no real numbers in the repo)

Use your own device/SIM number with a fixed code — never commit a real
number. On self-hosted / `supabase start` local dev, map test numbers to
fixed codes so no SMS is sent and only the mapped code verifies:

```sh
SMS_TEST_OTP=<your-own-10-digit-number>:123456
# wired to GOTRUE_SMS_TEST_OTP in docker-compose.yml
```

Flow: enter your number → Supabase skips delivery → type the mapped code →
logged in. For hosted projects, use a personal test SIM on the staging
project and remove test numbers before production. See
`docs/truecaller-eval.md` for why Truecaller 1-tap was evaluated and
rejected (paid, no Expo path, doesn't plug into Supabase Auth).

### Going live: MSG91 + hook checklist

1. **MSG91 account** (control.msg91.com) with an Indian route.
2. **DLT registration** (India regulatory, required for SMS): register your
   business + headers (sender IDs) on the DLT portal (Jio/Vodafone/Idea
   Videocon/Airtel — any one), create an OTP flow/template in MSG91 using
   the approved header, note the Flow ID.
3. **WhatsApp Business Account**: connect a number in MSG91 → WhatsApp,
   complete Meta business verification, create an authentication template
   with an OTP body variable (e.g. `mandi_otp_hi`), get it approved, sync
   templates into MSG91.
4. **Hook secrets** (never in git):
   ```sh
   supabase secrets set MSG91_AUTHKEY=xxxx MSG91_SMS_FLOW_ID=xxxx \
     MSG91_SENDER_ID=xxxx MSG91_WHATSAPP_NUMBER=91xxxxxxxxxx \
     MSG91_WHATSAPP_TEMPLATE=mandi_otp_hi
   # optional: MSG91_SMS_OTP_VAR (default OTP), MSG91_WHATSAPP_LANG (default hi)
   ```
5. **Deploy + enable**: `supabase functions deploy send-sms-hook`, then
   Dashboard → Authentication → Hooks → enable the Send SMS Hook (V2).
6. **Supabase Auth settings**: enable Phone provider, set OTP expiry
   (~5 min) and SMS frequency limits; the app adds its own 30s resend
   cooldown and stops guessing after 5 wrong codes (resend resets it).

Security notes: the OTP is never logged on client or server; hook errors
are sanitized; Supabase enforces its own per-number rate limits on top.

## Scripts

| Script                            | What it does                         |
| --------------------------------- | ------------------------------------ |
| `npm start`                       | Start the dev server (`expo start`)  |
| `npm run android` / `ios` / `web` | Start targeting a platform           |
| `npm run typecheck`               | `tsc --noEmit` (strict)              |
| `npm test`                        | Jest unit tests, single CI run       |
| `npm run lint` / `lint:fix`       | ESLint (expo flat config + prettier) |
| `npm run format` / `format:check` | Prettier write / check               |

Quality gate before every push: `npm test && npm run typecheck && npm run lint`.

## Testing

Runner: **Jest + `jest-expo`** (pinned to SDK 57: `jest@^29` + `jest-expo@~57`,
the pair Expo supports for this SDK). Config is `jest.config.js`
(`jest-expo` preset, `@/` → `src/` alias, `tests/setup.ts` loaded first);
`babel.config.js` (`babel-preset-expo`) is required for the Jest transform.
`npm test` runs `jest --ci` — one non-watch run, CI-friendly.

- Tests live in **`tests/unit/`**, mirroring `src/` loosely
  (`validation.test.ts` → `src/lib/validation.ts`, …). One file per module,
  self-contained mocks — no order dependence, no network, fast (~seconds).
- Only **pure logic** is tested. `expo-*` native modules and Supabase are
  mocked at the boundary (`jest.mock('expo-image-manipulator')`,
  `jest.mock('@/lib/supabase')`); `tests/setup.ts` swaps AsyncStorage for its
  official in-memory mock. No device/RN-render tests, no Detox/Maestro.
- Suite rule: reset only your own mocks in `beforeEach`
  (`mockFn.mockReset()`), never `jest.resetAllMocks()` — a global reset wipes
  the shared AsyncStorage mock and breaks every offline-mirror test.
- Adding a suite: drop `tests/unit/<area>.test.ts` next to the others and run
  `npm test`. Reserved next: sale math (`features/records`) and OTP/phone
  helpers (`features/auth`) once those branches land — extend, don't restructure.

## Folder map

```text
app/
  _layout.tsx            Root: locale bootstrap (stored → device → Hindi),
                         RTL flags, i18n init, splash gate, auth route gate, Stack
  (auth)/
    index.tsx            Phone entry (+91 fixed, Indian-mobile validation)
    verify.tsx           6-box OTP, 30s resend cooldown, attempt limits
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
tests/
  setup.ts               Global Jest setup (in-memory AsyncStorage mock)
  unit/                  Unit suites mirroring src/ (validation, format,
                         i18n-parity, khata, offline, people-repository, upload)
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
- **Auth: phone+password primary, OTP behind a flag (default OFF).** Login
  is password-only unless `EXPO_PUBLIC_OTP_ENABLED=true` (central switch in
  `src/lib/authFlags.ts` — unset/anything-else means OFF and no OTP code
  path can execute, so zero SMS is ever spent). Flag OFF: signup is phone +
  set-password directly via `signUpWithPassword`; forgot-password shows an
  explanatory message instead of a dead button. Flag ON: the full OTP flows
  (Login OTP tab, signup/recovery OTP verify → set password via `updateUser`
  on the OTP session, see `src/features/auth/`). Password rule is minimal:
  6+ characters, numeric PIN allowed. Delivery is server-side through a
  Supabase **Send SMS Hook** (`supabase/functions/send-sms-hook/`) that
  tries WhatsApp first and falls back to **MSG91 SMS** (`src/lib/sms`
  provider contract). MSG91 keys live in Edge Function secrets — never in
  the app.
  - Flip the flag: set `EXPO_PUBLIC_OTP_ENABLED=true` in `.env`, then
    restart `npx expo start` (dev) or rebuild (production — `EXPO_PUBLIC_*`
    vars bake in at build time).
  - REQUIRED dashboard match: Supabase Dashboard → Authentication →
    Providers → Phone → **Confirm phone must be OFF while the flag is off**
    (else direct signup cannot issue a session and users see
    `auth.errorSignupUnavailable`). Turn confirmations ON only together with
    the flag AND the MSG91 hook live.
  - Future upgrade path: move the flag to a remote `app_config` table (one
    row, `otp_enabled` boolean, public-read RLS) read at boot when we want
    no-rebuild flips — the call sites already go through `isOtpEnabled()`,
    so only that function needs to consult the table with an env fallback.
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

| Area     | Stub location                                            | Build next                                                                                                                                            |
| -------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| People   | `app/(tabs)/people.tsx`, `features/people`               | ✅ Done (this branch) — photo list + search + add-person                                                                                              |
| Khata    | `app/(tabs)/khata.tsx`, `features/khata`                 | ✅ Done (this branch) — picker → balance → entries → share                                                                                            |
| Sales    | `app/(tabs)/records.tsx`, `features/records`             | Wizard: commodity → weight → rate → expenses → photo → net                                                                                            |
| Auth OTP | `features/auth`, `lib/sms.ts`, `functions/send-sms-hook` | ✅ Built: password-primary login tabs, signup + forgot via one OTP, session gate, providers + hook. Remaining: deploy hook, set secrets, test numbers |
| WhatsApp | `features/khata/share.ts` (+ `KhataLedger` share button) | ✅ Khata summary share done — more share surfaces later                                                                                               |
| Photos   | `lib/upload.ts` + `features/people/photo.ts`             | ✅ Person photos wired — signed URLs + record photos later                                                                                            |

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
  Seeded people use `farmer`/`seller`/`other` — the current `PersonFormType`
  set (pre-khata `trader`/`labour` rows stay valid in the DB, but new drafts
  can't use them).
- **i18n**: new `sale.*`, `commodities.*`, `home.udhaari*`, `records.*` keys in
  all four locales (en/hi/mr/ur share the exact same key set — verify by
  flattening each JSON file and diffing the key lists before push).

## CI/CD

Patterns copied from the sibling Expo apps (`yaadora`, `snap-mind`):
same action majors (`actions/checkout@v4`, `actions/setup-node@v4` with
Node 20, `expo/expo-github-action@v8`), same lint → typecheck gate before
any EAS build, same `development` / `preview` (APK, internal) /
`production` profile shape in `eas.json`. Deliberate differences: mandi is
plain npm (no bun/pnpm, so `npm ci` + `cache: npm`), CI runs on **every**
push + PR (siblings filter to main/develop/staging — mandi is one small
app, so the gate is cheap), and production builds trigger on `v*` tags
(siblings build preview on a staging-branch push).

| Workflow                            | Trigger                                                                | What it does                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `CI` (`.github/workflows/ci.yml`)   | every `push` + `pull_request`                                          | `npm ci` → `npm run lint` → `npm run typecheck` → `npm test` → `npx expo export --platform web` (build proof). Steps are sequential, so the first failure stops the job (fail-fast). |
| `EAS builds` (`eas-deploy.yml`)     | manual (`Actions` → `EAS builds` → `Run workflow`, pick profile/platform) or pushing a `v*` tag | lint + typecheck gate, then `eas build --non-interactive`. Tags always build `production` / `android` (Play Store `.aab`); manual runs default to `preview` / `android` (installable `.apk`). |

### Triggering builds

```sh
# Preview APK (installable, internal distribution) — or use the Actions UI:
gh workflow run "EAS builds" --ref <branch> -f profile=preview -f platform=android

# Production build (Play Store bundle):
git tag v1.0.0 && git push origin v1.0.0
```

### Secrets setup checklist (names only — never commit values)

GitHub repo → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`:

| Secret                          | Required for              | Notes                                                                                       |
| ------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `EXPO_TOKEN`                    | any EAS build             | Expo access token (`https://expo.dev/settings/access-tokens`). Also authenticates the Expo GitHub Action. |
| `EXPO_PUBLIC_SUPABASE_URL`      | builds that need live data | Same value as `.env`. If unset, the build still succeeds — the app falls back to offline stubs. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | builds that need live data | Anon/public key only — never the service role key. Same fallback behaviour as above.          |

One-time EAS linking (needs no secret in the repo): `npx eas-cli init`
(or `eas init`) writes the Expo project ID into `app.json`
(`extra.eas.projectId`) — commit that file. Until it exists, EAS builds
fail at "project not linked", which is expected.

### OTA updates: deliberately NOT enabled

Neither sibling repo configures `expo-updates`, and mandi doesn't either —
this is a money-adjacent ledger app, so updates ship as versioned builds
(`v*` tags → production) with a reviewable binary, not silent JS pushes.
To enable OTA later: `npx expo install expo-updates`, add an
`updates.url` + runtime-version policy in `app.json`, map EAS profiles to
channels (`preview`/`production`), and publish with `eas update --channel …`.
That needs its own channel/release discipline — don't bolt it on silently.

## Commit conventions

Conventional Commits, small scoped commits: `feat:`, `fix:`, `chore:`,
`docs:`. Feature branches under the session namespace; PRs link their issue.
