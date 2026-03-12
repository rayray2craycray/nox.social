# Nox Nightlife App — Claude Code Instructions

## Project Overview
Nox is a nightlife social app (venues, events, videos, performers).
- **App name:** Nox Nightlife
- **Platform:** iOS, Android, Web (React Native + Expo)

## Tech Stack
| Layer | Library | Version |
|---|---|---|
| Framework | Expo | ^54.0.33 (SDK 54) |
| Navigation | Expo Router | ~6.0.23 |
| Language | TypeScript | ~5.9.2 |
| React / RN | React / React Native | 19.1.0 / 0.81.5 |
| State (server) | React Query | ^5.83.0 |
| State (client) | Zustand | ^5.0.2 |
| Validation | Zod | ^3.22.4 |
| Package manager | **bun** (preferred) | — |

## Package Manager
Always use `bun`, not npm or yarn.
- Install deps: `bun install` / `bun add <pkg>`
- Run scripts: `bun run <script>` or `bunx ...`
- Tests: `bun test`

## Key Commands
```bash
bun run start                                    # Dev server (tunnel via Rork)
bun run ios                                      # iOS simulator
bun test                                         # Run Jest tests
bun test:coverage                                # Coverage report
bun run lint                                     # ESLint
eas build --platform ios --profile production    # Production iOS build
eas submit --platform ios --latest               # Submit to TestFlight
eas build:list --platform ios                    # Check build status
```

## Mandatory Pre-Build Checklist
**Run all three steps before every `eas build`. Do not skip any step.**

### Step 1 — Bundle check (catches JS/import errors)
```bash
npx expo export --platform ios
```
Must complete with no errors. This caught the Build 56 duplicate identifier crash before it
hit EAS. If this fails, fix it before proceeding.

### Step 2 — TypeScript check (catches type errors)
```bash
npx tsc --noEmit
```
Must complete with zero errors. As of Build 83, all TS errors are resolved. Any new errors
must be fixed before proceeding.

### Step 3 — Physical device test (catches native/TurboModule crashes)
```bash
npx expo run:ios --device
```
Requires a physical iPhone connected via USB. This is the most important step — it catches
TurboModule crashes (like the expo-video and expo-av crashes in builds 55 and 57) before
they reach TestFlight. The iOS simulator does NOT reliably reproduce native crashes.
If no device is available, note this and proceed with extra caution.

### Step 4 — Patch verification (ensures native patches are compiled into the binary)
```bash
grep -q "iOS26Fix" node_modules/react-native/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon/RCTTurboModule.mm && echo "RN patch OK" || echo "FAIL: RN patch missing"
grep -q "disableActivityIndicatorAutoHide" node_modules/expo-splash-screen/ios/SplashScreenManager.swift && echo "FAIL: splash patch missing" || echo "Splash patch OK"
grep -q "RCT_USE_PREBUILT_RNCORE" eas.json && echo "Build-from-source OK" || echo "FAIL: RCT_USE_PREBUILT_RNCORE missing from eas.json"
```
All three must say OK. **React Native 0.81.5 ships prebuilt frameworks by default — patches
to source files are NEVER compiled unless `RCT_USE_PREBUILT_RNCORE=0` is set in eas.json.**
This was the root cause of builds 76-82 all crashing with the same unpatched binary.
If any check fails, run `npx patch-package` and verify `eas.json` has the env var.

### Step 5 — Commit check (ensures EAS builds your latest code)
```bash
git status --porcelain
```
Must return empty (no uncommitted changes). **EAS Build uses the committed git state, not the
working tree.** If there are uncommitted changes, the build will use stale code. This was the
root cause of Build 78 shipping the same binary as Build 76 — fixes were local only.
Always `git add` and `git commit` before running `eas build`.

Only after all five pass:
```bash
eas build --platform ios --profile production --non-interactive --clear-cache
eas submit --platform ios --latest --non-interactive
```

## Project Structure

### Frontend (root)
```
app/              # Expo Router screens (file-based routing)
  (tabs)/         # Tab screens: home, studio, map, etc.
  auth/           # Auth screens (sign-in, sign-up, forgot-password)
  settings/       # Settings screen + extracted sub-components
contexts/         # 18 React Context providers
components/       # Shared UI components
services/         # API service layer (venues, videos, user)
constants/        # colors.ts, app.ts (all app constants)
utils/            # validation.ts (Zod schemas), sanitization.ts
types/            # TypeScript type definitions
mocks/            # Mock data (currently used by contexts)
config/           # sentry.ts and other config
hooks/            # Custom React hooks
```

### Backend (separate server)
```
backend/          # Node.js + Express API server
```
- **Production URL:** `https://rork-api-prod-3a4b8043e7dd.herokuapp.com/api`
- **Local URL:** `http://localhost:3000`
- **Database:** MongoDB Atlas
- Start backend: `cd backend && npm run dev`

---

## Critical Warnings

### DO NOT use expo-video or expo-av
Both `expo-video` and `expo-av` cause a TurboModule crash (`EXC_CRASH SIGABRT`) on iOS.
They call void TurboModule methods at mount time that throw ObjC exceptions, killing the
process. Do not install, import, or reference either package. These were the cause of
crashes in builds 55 and 57. If video playback is needed in the future, it must be tested
on a physical device first via `npx expo run:ios --device` before submitting an EAS build.

### DO NOT call native module methods during provider initialization
Any native module method (Location, Camera, Haptics, etc.) called in a `useEffect` inside
a context provider will fire at app startup and can trigger the same TurboModule void-method
ObjC exception crash on iOS New Arch. Build 75 crashed because `FeedContext.tsx` called
`Location.requestForegroundPermissionsAsync()` in a mount-time `useEffect`. Native module
calls must be deferred to user-initiated actions or screen-level effects (after navigation).

### Context provider order is load-bearing
The 18 context providers nested in `app/_layout.tsx` must remain in their current order.
Reordering them can cause initialization crashes on real devices. Do not restructure
the provider tree without incremental TestFlight testing after each change.

### All contexts are wired to the real backend API
No mock data is used. All queries call the backend API first and fall back to AsyncStorage
as an offline cache. AsyncStorage is only used as the primary store for local user
preferences (feed filter, location settings, performer mode toggle).

### Test on device after every native change
When touching context providers, native modules, or `app.config.js` plugins, build and test
via TestFlight on a real device after each change. Do not batch multiple untested native
changes together.

---

## Patterns to Follow

### Validation
Use Zod schemas from `utils/validation.ts` for all form and input validation.
```typescript
import { createAccountSchema, safeValidateData } from '@/utils/validation';
const result = safeValidateData(createAccountSchema, { username, password });
```

### Sanitization
Use `utils/sanitization.ts` for user-facing inputs. Never write raw string manipulation
for user input.
```typescript
import { sanitizeInput } from '@/utils/sanitization';
const clean = sanitizeInput(rawValue, 'username');
```

### API calls
Use the service layer. Do not import mocks directly into components or screens.
```typescript
import { venuesService } from '@/services';
const venues = await venuesService.getVenues();
```

### Constants
All magic numbers and config values belong in `constants/app.ts`. Do not hardcode
durations, limits, or thresholds inline.

### Component size
Large screens are split into focused sub-components (see `app/(tabs)/studio/` and
`app/settings/`). Keep individual files under ~200 lines where possible.

### Performance
Use `React.memo`, `useCallback`, and `useMemo` on components that receive props or
render in lists. See `PERFORMANCE.md` for patterns.

---

## Sensitive Files
- `CREDENTIALS_AND_KEYS.md` — Apple, EAS, and API keys. Never commit, log, or expose.
- `.env` — gitignored. Copy from `.env.example` to configure locally.
- `app.config.js` — contains fallback API keys. Move all keys to env vars before production.

---

## Current Status (~80% complete)
- ✅ Full UI across all screens
- ✅ Backend API (50+ endpoints, live on Heroku)
- ✅ Input validation (Zod) and sanitization utilities
- ✅ Global error boundary, API service layer, extracted constants
- ✅ Testing infrastructure (Jest + React Testing Library, 24 suites, 442 tests)
- ✅ All contexts wired to real backend API — zero mock data (AsyncStorage used only as offline cache)
- ✅ Toast POS OAuth flow implemented (expo-web-browser + expo-secure-store)
- ✅ Sentry configured (`@sentry/browser` — avoids TurboModule crashes)
- ✅ CI/CD pipeline (`.github/workflows/frontend-ci.yml` + `security-audit.yml`)
- ✅ Security audit completed (`SECURITY_AUDIT.md`) — hardcoded keys removed, credentials cleaned
- ✅ Test coverage at ~55% (1307 tests across 56 suites — up from 21%/442 tests)
- ✅ JWT weak fallbacks removed from all backend JS files (throws if JWT_SECRET missing)
- ✅ Build 76 TurboModule crash fixed (module-scope native calls deferred)

- ✅ Backend input validation — Zod schemas + validation middleware (`backend/src/validators/`, `backend/src/middleware/validation.js`)
- ✅ Build 78 submitted to TestFlight (crash fix + all improvements)

## Remaining Work (priority order)
1. Increase test coverage (currently ~55%, target 70%) — add more screen/component tests
2. Rotate all exposed credentials (see SECURITY_AUDIT.md — Google Maps, Resend, MongoDB, Cloudinary, JWT)
3. Load testing
