# Expo vs Bare Workflow (Decision Guide)

This project currently uses **Expo managed workflow**.

## Why Expo Was Chosen Here

- fastest onboarding for beginner teams,
- fewer local setup failures before hackathon,
- enough for current MVP features (API-driven screens + state + routing).

## When Expo Is Enough

Stay on Expo if your features are mostly:

- forms and lists,
- API calls,
- local storage,
- standard camera/media/file pickers,
- normal navigation and UI.

## When Bare Is Better

Move to bare workflow when you need deep native control:

- long-running background services,
- advanced accessibility hooks,
- custom Android overlays,
- direct low-level native integrations.

## Safe Migration Path

You do not need to rewrite app to switch.

From `mobile/`:

```bash
npx expo prebuild
```

This generates `android/` and `ios/` folders.

Then run:

```bash
npx expo run:android
npx expo run:ios
```

## Team Recommendation

For this hackathon:

- keep Expo for speed and reliability.

After hackathon:

- prebuild/migrate to bare only if native-heavy roadmap items are confirmed.
