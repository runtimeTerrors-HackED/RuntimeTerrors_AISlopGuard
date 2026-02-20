# React Native + Expo Basics (Zero to Productive)

This guide is for developers who are completely new to React Native.

If you read this once and follow the steps, you should be able to start contributing to this project immediately.

---

## 1) What React Native Is

React Native is a way to build mobile apps using JavaScript/TypeScript and React concepts.

You write components in React style, and React Native renders them as real native UI controls on iOS and Android.

Simple mental model:

- React for web -> renders HTML in browser
- React Native -> renders native mobile UI on device

## 2) What Expo Is

Expo is a toolkit around React Native that makes setup and development easier.

Expo gives you:

- easier project setup,
- simpler run/build commands,
- better beginner developer experience,
- useful APIs and tooling.

In this project, Expo is used so the team can move fast for hackathon goals.

---

## 3) React Native vs Expo vs Bare Workflow

### React Native

- framework for writing cross-platform mobile apps.

### Expo (managed workflow)

- easiest way to build and run React Native apps quickly,
- handles lots of native setup for you.

### Bare workflow

- full native project control (`ios/`, `android/`),
- needed for advanced native features.

Current project choice:

- **Expo managed** now (faster for beginners),
- move to bare later only if native-heavy features require it.

---

## 4) How a React Native App Works (Simple)

Core idea:

1. You write components.
2. Components render UI.
3. User interacts.
4. State updates.
5. UI re-renders with new state.

In this project:

- screens render UI,
- API calls fetch results,
- state stores user settings,
- navigation switches screens.

---

## 5) Core Concepts You Must Know

## Components

A component is a reusable UI function.

Example concept:

- `HomeScreen` is a component.
- `ScanResultCard` is a component.

## Props

Props are inputs passed into a component.

Example:

- `ScanResultCard` receives `result` prop.

## State

State is data that can change while app runs.

Examples:

- current URL text input,
- loading status,
- conservative mode toggle.

## Hooks

Hooks are React functions to manage logic.

Most important hooks in this project:

- `useState` -> local component state
- `useMutation` / `useQuery` (React Query) -> API calls and server data

---

## 6) Styling in React Native

React Native uses `StyleSheet.create` and Flexbox for layout.

Most used layout rules:

- `flex: 1` -> fill available screen space
- `flexDirection: "row"` -> horizontal layout
- `justifyContent` -> main-axis alignment
- `alignItems` -> cross-axis alignment

There is no regular CSS file in this project. Styles are inside `.tsx` files.

---

## 7) Navigation (How Screens Move)

This app uses `@react-navigation/native` + native stack navigator.

Flow:

- `Home` -> user scans link
- `Result` -> user sees verdict and takes actions
- `History` -> user sees previous scans

Main file:

- `mobile/src/navigation/RootNavigator.tsx`

---

## 8) Data: React Query vs Zustand (Very Important)

Use this rule:

- data from backend API -> **React Query**
- local app settings/UI state -> **Zustand**

Why:

- React Query handles loading/error/cache/retry for server data.
- Zustand is lightweight for local persistent state.

In this app:

- API scan result/history/vote/list calls use React Query.
- `userFingerprint` and `conservativeMode` use Zustand.

---

## 9) Project Structure (Mobile)

Path: `mobile/`

Important files:

- `App.tsx` -> providers + app root
- `index.ts` -> app entry point
- `src/navigation/RootNavigator.tsx` -> screen routing
- `src/screens/HomeScreen.tsx` -> input and scan action
- `src/screens/ResultScreen.tsx` -> verdict and actions
- `src/screens/HistoryScreen.tsx` -> previous scans
- `src/api/client.ts` -> base API request helper
- `src/api/scan.ts` -> endpoint functions
- `src/store/appStore.ts` -> local persistent app state
- `src/types/api.ts` -> API request/response types

---

## 10) How This App Talks to Backend

1. User enters URL.
2. App sends `POST /api/scan`.
3. Backend returns score, verdict, and evidence.
4. App shows result.
5. User can vote or allow/block creator.

Base URL behavior:

- if `EXPO_PUBLIC_API_URL` exists, app uses it.
- otherwise:
  - Android emulator -> `http://10.0.2.2:8000`
  - iOS simulator -> `http://localhost:8000`

For real phones, always set `EXPO_PUBLIC_API_URL` to your laptop IP.

---

## 11) How to Run the Mobile App

```bash
cd mobile
npm install
npm run start
```

Then in Expo terminal:

- press `i` for iOS simulator,
- press `a` for Android emulator,
- or scan QR with Expo Go.

For physical device:

```bash
EXPO_PUBLIC_API_URL=http://<your-laptop-ip>:8000 npm run start
```

---

## 12) First Task for New Developers

Do this to become productive quickly:

1. Run app and backend locally.
2. Scan one URL and trace flow:
   - `HomeScreen` -> `scanContent()` -> backend -> `ResultScreen`
3. Add a tiny UI improvement (for practice), for example:
   - add a helper text below input.
4. Run typecheck:

```bash
cd mobile
npm run typecheck
```

---

## 13) Common Beginner Mistakes

- Running mobile app without backend running.
- Using `localhost` on physical phone.
- Mixing server data into Zustand.
- Changing API response shape but not updating `src/types/api.ts`.
- Skipping typecheck before testing.

---

## 14) Quick Glossary

- Component -> reusable UI unit
- Props -> input to component
- State -> mutable data
- Hook -> React function for state/effects/logic
- Navigator -> screen router
- Mutation -> API write action (`POST`, `PUT`, etc.)
- Query -> API read action (`GET`)
- Expo managed -> easier RN workflow with less native setup
- Bare workflow -> direct native project control

---

## 15) What to Read Next

After this basics guide, read:

1. `docs/01_MOBILE_BEGINNER_GUIDE.md`
2. `docs/00_START_HERE.md`
3. `docs/03_API_REFERENCE.md`
