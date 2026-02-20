# Mobile Guide (React Native + Expo, Beginner Version)

This guide explains the mobile app in plain language.

If you are new to React Native itself, first read:

- `docs/09_REACT_NATIVE_EXPO_BASICS.md`

## Why This Stack

- **Expo** -> fastest setup for beginners.
- **TypeScript** -> catches many mistakes early.
- **React Navigation** -> moves between screens.
- **React Query** -> handles API calls + loading/error/cache states.
- **Zustand + AsyncStorage** -> saves local app settings and user fingerprint.

## Mobile Folder Structure

Key files you will edit most often:

- `mobile/App.tsx` -> app root + providers.
- `mobile/index.ts` -> startup entry point.
- `mobile/src/navigation/RootNavigator.tsx` -> screen routing.
- `mobile/src/screens/HomeScreen.tsx` -> link input + scan trigger.
- `mobile/src/screens/ResultScreen.tsx` -> verdict + actions.
- `mobile/src/screens/HistoryScreen.tsx` -> previous scans.
- `mobile/src/api/client.ts` -> low-level HTTP helper.
- `mobile/src/api/scan.ts` -> API endpoint functions.
- `mobile/src/store/appStore.ts` -> persistent local state.
- `mobile/src/types/api.ts` -> shared API data types.

## How App Startup Works

1. `index.ts` loads app and gesture handler.
2. `App.tsx` wraps app with:
   - `SafeAreaProvider`
   - `QueryClientProvider`
   - `NavigationContainer`
3. `RootNavigator` opens `Home` screen first.

## Screen-by-Screen Behavior

### Home Screen

File: `src/screens/HomeScreen.tsx`

User actions:

- paste URL,
- toggle conservative mode,
- tap `Scan Content`,
- open history.

What happens on scan:

- calls `scanContent({ url, userFingerprint, conservativeMode })`,
- backend response is passed to `Result` screen.

### Result Screen

File: `src/screens/ResultScreen.tsx`

Shows:

- verdict,
- score,
- confidence,
- evidence reasons.

User can:

- allow creator,
- block creator,
- submit vote (`ai`, `not_ai`, `unsure`).

### History Screen

File: `src/screens/HistoryScreen.tsx`

Loads data from:

- `GET /api/history?userFingerprint=...`

Features:

- list of previous scans,
- pull-to-refresh.

## API Layer (How Requests Are Built)

### `src/api/client.ts`

- chooses base URL,
- adds headers,
- handles non-200 errors.

Base URL rules:

- uses `EXPO_PUBLIC_API_URL` if provided,
- else Android emulator -> `http://10.0.2.2:8000`,
- else iOS simulator -> `http://localhost:8000`.

### `src/api/scan.ts`

Contains endpoint wrappers:

- `scanContent()` -> `POST /api/scan`
- `submitVote()` -> `POST /api/vote`
- `updateCreatorList()` -> `POST /api/list`
- `fetchHistory()` -> `GET /api/history`

## State Management (Very Important)

Use this rule:

- server data -> **React Query**
- local app settings -> **Zustand**

Current local store values:

- `userFingerprint` (persistent per user/device),
- `conservativeMode` (UI + backend behavior).

## How to Run Mobile Checks

Type check:

```bash
cd mobile
npm run typecheck
```

Run app:

```bash
npm run start
```

Run app on a physical phone (set backend URL):

macOS/Linux:

```bash
EXPO_PUBLIC_API_URL=http://<your-laptop-ip>:8000 npm run start
```

Windows (PowerShell):

```powershell
$env:EXPO_PUBLIC_API_URL="http://<your-laptop-ip>:8000"
npm run start
```

## How To Add a New Feature (Exact Workflow)

Example feature: "Save note on result".

1. Add type in `src/types/api.ts`.
2. Add API function in `src/api/scan.ts`.
3. Add UI control in relevant screen.
4. If persistent local value needed, add to `src/store/appStore.ts`.
5. Run typecheck.
6. Test manually in app.

## Beginner Mistakes To Avoid

- Starting mobile app before backend is running.
- Using `localhost` on physical phone.
- Putting backend data in Zustand (should be React Query).
- Editing multiple files without updating `types/api.ts`.
- Forgetting to handle loading and error states in UI.

## Expo vs Bare (for this mobile app)

Expo is currently a good fit because this MVP is mostly:

- forms,
- API requests,
- list/detail screens.

Move to bare only when you start native-heavy features like:

- deep background services,
- accessibility integrations,
- custom Android overlays.
