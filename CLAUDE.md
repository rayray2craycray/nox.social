# Nox Nightlife App — Claude Code Instructions

## Project Overview
Nox is a nightlife social app (venues, events, videos, performers).
- **App name:** Nox Nightlife
- **Platform:** iOS, Android, Web (React Native + Expo)

## Tech Stack
| Layer | Library | Version |
|---|---|---|
| Framework | Expo | 53.0.27 |
| Navigation | Expo Router | ~5.1.11 |
| Language | TypeScript | ~5.9.2 |
| React / RN | React / React Native | 19.0.0 / 0.79.6 |
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

### DO NOT use expo-video
`expo-video` causes a TurboModule crash (`EXC_CRASH SIGABRT`) on iOS. Do not install,
import, or reference it. This was the root cause of 29 consecutive failed TestFlight builds.

### Context provider order is load-bearing
The 18 context providers nested in `app/_layout.tsx` must remain in their current order.
Reordering them can cause initialization crashes on real devices. Do not restructure
the provider tree without incremental TestFlight testing after each change.

### Frontend uses mock data — not connected to backend yet
All contexts currently read from `mocks/`. The frontend is not yet wired to the backend API.
Do not write logic that assumes live API responses unless you are explicitly integrating a
specific context as part of that task.

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

## Current Status (~70% complete)
- ✅ Full UI across all screens
- ✅ Backend API (50+ endpoints, live on Heroku)
- ✅ Input validation (Zod) and sanitization utilities
- ✅ Global error boundary, API service layer, extracted constants
- ✅ Testing infrastructure (Jest + React Testing Library configured)
- ❌ Frontend not connected to backend (mock data in all contexts)
- ❌ Real OAuth not implemented (TODOs in `contexts/ToastContext.tsx`)
- ❌ Sentry DSN not configured (error tracking inactive)
- ❌ Test coverage incomplete (~70% target not yet reached)
- ❌ CI/CD pipeline not set up

## Remaining Work (priority order)
1. Wire all contexts to the real backend API (replace mock imports)
2. Implement real OAuth flow in `ToastContext.tsx`
3. Configure Sentry DSN for error tracking
4. Achieve 70%+ test coverage
5. Security audit + load testing
6. CI/CD pipeline (GitHub Actions)
