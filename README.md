# nearcade App

The official cross-platform client for [nearcade](https://nearcade.cn) — discover arcade
gaming venues, follow campus & region rankings, and browse university rhythm-game
communities — built as **one React Native codebase** running natively on **Android**,
**iOS**, and as a **static web app**.

> Data comes live from the nearcade API (`https://nearcade.cn/api`, configurable in-app).
> This app is maintained by the nearcade team alongside the
> [nearcade server project](https://github.com/Naptie/nearcade).

---

## Features

### Location-based discovery (`Discover` tab)
- One-tap GPS location via `expo-location`; manual lat/lng picker fallback (great on desktop web)
- Search radius chips: 1 / 2 / 5 / 10 / 20 / 30 km (server clamps to 0–30)
- Multi-select game-title filter (maimai DX, CHUNITHM, SDVX, IIDX, Taiko, … 27+ titles)
- Results sorted by walking distance with density-coded cards ("playing now" totals,
  open/closed badges computed from shop opening hours + timezone, game chips)
- In-app map: **Apple Maps (MapKit)** on iOS; a featherweight OSM tile map on
  Android/web — no bundled map SDK, so the APK stays tiny and works on
  GMS-less Chinese OEM ROMs

### Shop details (`shop/[id]`)
- Games tab: machines grouped by title with quantity, cost, version and live attendance counts
- Comments tab: markdown comments with author avatars and vote counts
- Changelog tab: paginated community edit history (created / game_modified / photo_uploaded …)
- Opening hours (whole-week or per-weekday formats), claimed/locked badges
- Directions hand-off to the system map app: `maps://` (Apple Maps) on iOS;
  `geo:` → AMap → Google fallback chain on Android (works with 高德/百度/腾讯地图)

### Rankings (`Rankings` tab)
- Campus leaderboard: sort by shops / machines / any game title, radius filter (2/5/10/30 km),
  985 / 211 / Double-First-Class tags, shop/machine/density metrics per radius
- Region leaderboard: country → province → city → county levels with area density metrics
- Cursor-based infinite scroll (`after=<rank>` pagination), cache freshness indicator

### Community (`Community` tab)
- University search (Atlas-search backed `q` endpoint) with 985/211/双一流 badges
- Club browser with search + host-university filtering, member counts
- University detail: posts feed + club list; Club detail: starred arcades + posts

### Posts & interaction (`post/[id]`)
- Markdown rendering (headings, lists, quotes, fenced code, links, images)
- Upvote/downvote toggle voting with optimistic invalidation (signed-in users)
- Flat comment thread with reply targeting and compose bar (auth-gated)

### Account (`Me` tab → Sign in)
- **QR login**: scan the session-handoff QR shown at `nearcade.cn/auth/handoff`, or paste
  the one-time token from its URL (`?t=…`). The app redeems it against Better Auth's
  `one-time-token/verify` endpoint and stores the resulting session cookie.
- Session cookie jar persisted in **SecureStore** (native) / localStorage (web)
- Profile stats, frequenting arcades, university membership, unread-notification badge (60 s polling)

### Notifications
- Paginated inbox with type icons, read/unread state, "mark all read"

### Preferences (`Settings`)
- Server URL override (self-hosted instances) with connectivity test
- Language: English / 中文 / 日本語 (+ follow system)
- Theme: system / light / dark — the website's emerald (light) & forest (dark) palettes

---

## Tech stack & practices

| Concern | Choice |
|---|---|
| Framework | Expo SDK 57 · React Native 0.86 · React 19.2 |
| Navigation | expo-router v57 (file-based, native Stack + bottom Tabs, modal screens) |
| Data fetching | TanStack Query v5 — typed query keys, infinite queries, optimistic invalidation |
| State | Zustand v5 + persisted stores (settings, session cookie jar) |
| Secure storage | expo-secure-store (Keychain/Keystore) on native, localStorage on web |
| Styling | **NativeWind 4** (Tailwind) with daisyUI's `emerald`/`forest` palettes ported from the nearcade website — CSS-variable theming, safe-area-aware primitives |
| i18n | Tiny type-safe dictionary layer (`en` / `zh` / `ja`) mirroring nearcade locales |
| Maps | Apple Maps via react-native-maps on iOS (OS-provided MapKit); custom OSM tile renderer (`src/components/map/TileMap.tsx`) on Android/web — react-native-maps is excluded from the Android build |
| Types | Strict TypeScript; API DTOs mirror the server's Zod-validated response shapes |

**API layer** (`src/api/client.ts`) is a single typed class over `fetch`: base-URL
normalization, timeouts, cookie replay, `{ message }` error mapping into `ApiError`.
Endpoint paths/shapes are validated by `scripts/smoke-api.mjs` against production.

## Project layout

```
app/                  # expo-router routes
  _layout.tsx         #   providers + root stack
  (tabs)/             #   Discover · Rankings · Community · Me
  shop/[id]           #   arcade detail
  university/[id]     #   campus detail (posts/clubs tabs)
  club/[id]           #   club detail (starred arcades/posts)
  post/[id]           #   post detail w/ votes + comments
  notifications       #   inbox (modal)
  login               #   QR/token sign-in (modal)
  settings            #   preferences (modal)
src/
  api/                # typed REST client + DTOs + react-query hooks
  components/         # AppMap (platform split), TileMap, MarkdownView, PostRow, daisyUI-style kit
  i18n/ theme/ stores/ utils/
scripts/
  gen-assets.mjs      # PNG icon/splash generator (zero deps)
  smoke-api.mjs       # live contract test against the API
```

---

## Getting started

Prereqs: Node ≥ 20.19, npm (or pnpm/yarn).

```bash
npm install
npm run gen:assets     # already committed; regenerates icons if you tweak the script

# Dev servers
npm start              # Expo dev server → press a (Android) / i (iOS) / w (web)

# Typecheck & export
npm run typecheck
npm run export:web     # static site in dist/
```

The first launch uses Shanghai as fallback origin so the app is usable immediately;
tap the locate button to grant geolocation permission.

### Android (native APK)

```bash
# Easiest: Expo Go or a dev build during development
npx expo run:android            # debug build on a connected device/emulator

# Release APK (requires JDK 17 + Android SDK)
npx expo prebuild -p android    # generates android/ (gitignored)
cd android && ./gradlew assembleRelease
```

Or cloud-build without local toolchains: `npx eas build -p android --profile preview`.

### iOS (requires macOS + Xcode)

```bash
npx expo run:ios                # dev build
npx eas build -p ios            # cloud build / TestFlight via EAS
```

### Web (static hosting)

```bash
npm run export:web
npx serve dist                  # local preview with clean-URL rewriting
```

Deploy `dist/` to any static host. For clean URLs like `/rankings`, add SPA rewrites:

```jsonc
// Netlify (_redirects): /* /index.html 200
// Vercel (vercel.json): { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
// nginx: try_files $uri $uri/index.html /index.html;
```

### What about Windows?

Expo officially targets iOS/Android/web. Two supported paths for Windows:

1. **Recommended:** ship the exported web bundle as an installable PWA (wrap `dist/`
   behind your reverse proxy of choice).
2. [react-native-windows](https://microsoft.github.io/react-native-windows/) can consume
   this JS codebase via a Brownfield/native setup — add `windows/` targets manually
   (`npx install-expo-modules` in an RNW shell). No Windows-specific code paths exist
   today beyond what react-native-web covers.

### Server configuration

Default API base URL is `https://nearcade.cn` (override in Settings → Server).
Auth requires a nearcade account: sign in on the website, open **Profile → Session
handoff**, then scan/paste the code in this app (see `login` screen). Writes (votes,
comments, check-ins) additionally require a bound phone number on the server side —
read-only browsing works anonymously thanks to the API's permissive CORS policy.

## Verification performed

- `tsc --noEmit` strict — clean
- `expo export --platform web` — 17 static routes bundled
- `node scripts/smoke-api.mjs` — **23/23 live checks pass** (discover, shops chain,
  attendance, changelog, photos, both ranking endpoints incl. cursors, universities →
  clubs → posts → post-detail chain, clubs list/detail/arcades, auth gate)
- Static export served locally: index/bundles/deep-link HTML all HTTP 200

## Roadmap ideas

- Attendance check-in flow (session mode) & machine queue viewer
- Photo gallery uploads (NDJSON progress streaming)
- Push notifications via FCM token registration
- Offline snapshot cache of last discovery results

## License

MIT. Game titles and data belong to their respective owners; arcade data is community-
maintained by nearcade (sources documented in the
[nearcade repository](https://github.com/Naptie/nearcade)).
