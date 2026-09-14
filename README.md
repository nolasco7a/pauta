# Pauta

**Teleprompter + cámara para grabar guiones sin distracciones, en un solo lugar.**
**Teleprompter + camera to record scripts distraction-free, in one place.**

App de Expo / React Native (iOS, con soporte de Android planeado en `app.json`) para escribir un guion, ajustarlo a tu ritmo de lectura y grabarte leyéndolo — con el texto scrolleando sobre la cámara mientras grabas.
Expo / React Native app (iOS, with Android support scaffolded in `app.json`) to write a script, tune it to your reading pace, and record yourself reading it — with the text scrolling over the camera feed while you record.

---

## Tabla de contenido / Table of contents

- [Qué hace / What it does](#qué-hace--what-it-does)
- [Stack técnico / Tech stack](#stack-técnico--tech-stack)
- [Estructura del proyecto / Project structure](#estructura-del-proyecto--project-structure)
- [Puesta en marcha / Getting started](#puesta-en-marcha--getting-started)
- [Scripts de npm/pnpm / npm/pnpm scripts](#scripts-de-npmpnpm--npmpnpm-scripts)
- [Cómo funciona por dentro / How it works internally](#cómo-funciona-por-dentro--how-it-works-internally)
- [Internacionalización / Internationalization](#internacionalización--internationalization)
- [Decisiones y limitaciones conocidas / Decisions and known limitations](#decisiones-y-limitaciones-conocidas--decisions-and-known-limitations)
- [Licencia / License](#licencia--license)

---

## Qué hace / What it does

**Español.** Pauta resuelve un flujo concreto: escribes un guion, lo grabas leyéndolo en cámara, y el teleprompter te ayuda a no perder el hilo. No es un editor de video ni una app de cámara profesional — es una herramienta enfocada en una sola tarea, hecha bien.

Funcionalidades principales:

- **Guiones**: crear, editar, listar y borrar guiones de texto (`Dashboard`, `AllScripts`, `ScriptEditor`).
- **Teleprompter**: overlay de texto que scrollea sobre la cámara, con velocidad y tamaño de letra ajustables, arrastre manual con el dedo para reposicionarlo, y controles de play/pause/reset.
- **Cámara con ajustes reales**: calidad de grabación (con estimado de espacio en disco), estabilización, exposición y modo noche — todo condicionado a lo que el hardware del teléfono realmente soporta, más flash y zoom por pellizco.
- **Reproducción y galería**: cada video grabado se guarda dentro de la app y se refleja en la galería del sistema (Fotos).
- **Todo local**: guiones y ajustes se guardan en una base SQLite en el propio dispositivo — no hay backend, cuenta de usuario, ni sincronización en la nube.
- **Bilingüe**: interfaz completa en español e inglés, con español como idioma maestro.

**English.** Pauta solves one concrete workflow: you write a script, record yourself reading it on camera, and the teleprompter keeps you on track. It's not a video editor or a pro camera app — it's a tool focused on doing one job well.

Main features:

- **Scripts**: create, edit, list, and delete text scripts (`Dashboard`, `AllScripts`, `ScriptEditor`).
- **Teleprompter**: a scrolling text overlay on top of the camera feed, with adjustable speed and font size, manual drag-to-reposition, and play/pause/reset controls.
- **Camera with real settings**: recording quality (with an on-screen storage estimate), stabilization, exposure, and night mode — all gated by what the phone's hardware actually supports, plus flash and pinch-to-zoom.
- **Playback and gallery**: every recorded video is kept inside the app and mirrored to the system Photos gallery.
- **Fully local**: scripts and settings live in an on-device SQLite database — no backend, no account, no cloud sync.
- **Bilingual**: full Spanish and English UI, with Spanish as the master locale.

---

## Stack técnico / Tech stack

| Área / Area | Elección / Choice |
|---|---|
| Framework | [Expo](https://expo.dev) 57 + React Native 0.86 (New Architecture / Nitro modules) |
| Lenguaje / Language | TypeScript |
| Navegación / Navigation | `@react-navigation/native` (native stack) |
| Cámara / Camera | `react-native-vision-camera` v5 (Nitro) |
| Video / Video | `expo-video` |
| Animaciones / Animations | `react-native-reanimated` + `react-native-gesture-handler` |
| Bottom sheets | `@gorhom/bottom-sheet` |
| Persistencia / Persistence | `expo-sqlite` (base local en el dispositivo / on-device local database) |
| Íconos / Icons | `lucide-react-native` |
| i18n | `i18n-js` + `expo-localization`, sincronizado con `lingosync` (DeepL) |
| Tipografía / Typography | Manrope (`@expo-google-fonts/manrope`) |

---

## Estructura del proyecto / Project structure

```
pauta/
├── App.tsx                  # Punto de entrada, providers (Script, Locale) / Entry point, providers
├── src/
│   ├── screens/              # Una pantalla por archivo / One screen per file
│   │   ├── DashboardScreen.tsx
│   │   ├── ScriptEditorScreen.tsx
│   │   ├── AllScriptsScreen.tsx
│   │   ├── CameraScreen.tsx       # Cámara + teleprompter + ajustes / Camera + teleprompter + settings
│   │   └── VideoPlayerScreen.tsx
│   ├── components/
│   │   ├── TeleprompterOverlay.tsx   # Texto que scrollea sobre la cámara / Scrolling text over the camera
│   │   ├── SettingsSheet.tsx         # Bottom sheet: velocidad y tamaño de letra / speed & font size
│   │   ├── CameraSettingsSheet.tsx   # Bottom sheet: calidad, estabilización, exposición, modo noche
│   │   ├── Slider.tsx                # Slider bidireccional reutilizable / reusable bidirectional slider
│   │   └── RecentScriptCard.tsx
│   ├── state/
│   │   ├── ScriptContext.tsx    # Estado global de la app (guion, ajustes) / global app state
│   │   ├── cameraQuality.ts     # Presets de calidad de video / video quality presets
│   │   └── db.ts                # SQLite: guiones + tabla key-value de ajustes / SQLite: scripts + settings
│   ├── navigation/
│   ├── i18n/                    # Contexto de idioma / locale context
│   └── theme/                   # Colores, tipografía, radios / colors, typography, radii
├── locales/
│   ├── es.json                  # Idioma maestro / master locale
│   └── en.json                  # Generado con lingosync + DeepL / generated via lingosync + DeepL
├── plugins/                     # Config plugins de Expo propios del proyecto / project's own Expo config plugins
├── ios/, android/                # Generados por `expo prebuild`, NO están en git / generated, gitignored
└── modules/                      # Módulos nativos locales de Expo (si existen) / local Expo native modules (if any)
```

> `ios/` y `android/` se regeneran con `expo prebuild` (o automáticamente al correr `expo run:ios`/`run:android`) y no están versionados. Si cambias de branch y ves errores de build raros (referencias a módulos que ya no existen, etc.), corre `pod install` dentro de `ios/` o vuelve a correr `pnpm ios`.
>
> `ios/` and `android/` are regenerated by `expo prebuild` (or automatically when running `expo run:ios`/`run:android`) and are not checked into git. If you switch branches and hit odd build errors (stale references to modules that no longer exist, etc.), run `pod install` inside `ios/` or just re-run `pnpm ios`.

---

## Puesta en marcha / Getting started

### Requisitos / Prerequisites

- Node.js y pnpm
- Xcode + CocoaPods (para iOS)
- Un iPhone físico o simulador (la cámara real solo funciona en dispositivo físico)
  A physical iPhone or simulator (the real camera only works on a physical device)

### Instalación / Installation

```bash
pnpm install
```

### Correr en desarrollo / Run in development

```bash
pnpm ios              # Simulador / simulator
pnpm ios:device       # Selecciona un dispositivo físico conectado / pick a connected physical device
```

Esto compila la app nativa (development build) y levanta Metro. Necesario la primera vez y cada vez que cambie código nativo (nuevos módulos, permisos, `app.json`).
This builds the native app (development build) and starts Metro. Needed the first time, and any time native code changes (new modules, permissions, `app.json`).

### Modo release en un dispositivo / Release mode on a device

```bash
pnpm ios --device --configuration Release
```

En este modo la app no se conecta a Metro — el JS queda empaquetado dentro del binario. Útil para probar rendimiento real o antes de distribuir.
In this mode the app doesn't connect to Metro — the JS is bundled inside the binary. Useful for testing real-world performance or before distributing.

---

## Scripts de npm/pnpm / npm/pnpm scripts

| Comando / Command | Qué hace / What it does |
|---|---|
| `pnpm start` | Levanta el bundler de Metro / Starts the Metro bundler |
| `pnpm ios` | Compila y corre en iOS (simulador por defecto) / Builds and runs on iOS (simulator by default) |
| `pnpm ios:device` | Igual, pero eligiendo un dispositivo físico / Same, picking a physical device |
| `pnpm android` | Compila y corre en Android / Builds and runs on Android |
| `pnpm lint` | Corre el linter de Expo / Runs the Expo linter |

---

## Cómo funciona por dentro / How it works internally

### Estado y persistencia / State and persistence

**Español.** Todo el estado compartido de la app (el guion actual, la velocidad del teleprompter, el tamaño de letra, los ajustes de cámara) vive en un único `ScriptContext` (`src/state/ScriptContext.tsx`), consumido con el hook `useScript()`. No hay Redux ni librerías externas de estado — el árbol de la app es lo bastante chico como para que Context alcance.

La persistencia es 100% local, vía `expo-sqlite` (`src/state/db.ts`):

- Tabla `scripts`: guiones (título, cuerpo, videos asociados).
- Tabla `settings`: un key-value genérico (`getSetting`/`setSetting`) donde se guardan velocidad, tamaño de letra, calidad de cámara, estabilización, exposición y modo noche. Se eligió key-value en vez de columnas fijas para no tener que migrar el esquema cada vez que se agrega un ajuste nuevo.

Los ajustes que cambian en tiempo real (por ejemplo, arrastrar el slider de exposición) se guardan con un pequeño debounce (`usePersistedState` dentro de `ScriptContext.tsx`) para no escribir a disco en cada frame del gesto.

**English.** All of the app's shared state (the current script, teleprompter speed, font size, camera settings) lives in a single `ScriptContext` (`src/state/ScriptContext.tsx`), consumed via the `useScript()` hook. No Redux or external state library — the app tree is small enough that Context is sufficient.

Persistence is 100% local, via `expo-sqlite` (`src/state/db.ts`):

- `scripts` table: scripts (title, body, associated videos).
- `settings` table: a generic key-value store (`getSetting`/`setSetting`) holding speed, font size, camera quality, stabilization, exposure, and night mode. Key-value was chosen over fixed columns so adding a new setting later never requires a schema migration.

Settings that change in real time (e.g. dragging the exposure slider) are saved with a small debounce (`usePersistedState` inside `ScriptContext.tsx`) so dragging doesn't write to disk on every animation frame.

### Cámara / Camera

**Español.** `CameraScreen.tsx` usa `react-native-vision-camera` directamente (sin capa propia de abstracción). Los ajustes de cámara se agrupan en `CameraSettingsSheet.tsx`, un bottom sheet con:

- **Calidad**: tres presets (`saver` / `balanced` / `max`, definidos en `src/state/cameraQuality.ts`) que fijan resolución y bitrate de grabación juntos — con un estimado de MB por minuto para que la relación calidad/espacio sea explícita.
- **Estabilización**: apagada / estándar / cinemática, vía `constraints={[{ videoStabilizationMode }]}`.
- **Exposición**: un slider (-EV a +EV) calibrado contra el rango real del dispositivo (`device.minExposureBias`/`maxExposureBias`) — solo aparece si `device.supportsExposureBias` es `true`.
- **Modo noche**: `enableLowLightBoost`, solo visible si `device.supportsLowLightBoost` es `true`.
- **Flash** y **zoom por pellizco** están fuera del sheet, como controles directos en la pantalla de cámara.

Mientras cualquier bottom sheet de ajustes está abierto, el teleprompter se desvanece (`Animated.View` + `withTiming`) para no encimarse visualmente con los controles del sheet.

**English.** `CameraScreen.tsx` uses `react-native-vision-camera` directly (no custom abstraction layer on top). Camera settings are grouped in `CameraSettingsSheet.tsx`, a bottom sheet with:

- **Quality**: three presets (`saver` / `balanced` / `max`, defined in `src/state/cameraQuality.ts`) that set resolution and recording bitrate together — with an estimated MB-per-minute so the quality/storage tradeoff is explicit.
- **Stabilization**: off / standard / cinematic, via `constraints={[{ videoStabilizationMode }]}`.
- **Exposure**: a slider (-EV to +EV) calibrated against the device's real range (`device.minExposureBias`/`maxExposureBias`) — only shown if `device.supportsExposureBias` is `true`.
- **Night mode**: `enableLowLightBoost`, only visible if `device.supportsLowLightBoost` is `true`.
- **Flash** and **pinch-to-zoom** live outside the sheet, as direct controls on the camera screen.

While any settings bottom sheet is open, the teleprompter fades out (`Animated.View` + `withTiming`) so it doesn't visually collide with the sheet's own controls.

### El slider reutilizable / The reusable slider

**Español.** `src/components/Slider.tsx` es un slider bidireccional: el relleno nace desde el centro (0.5 normalizado = valor neutral) y crece hacia el lado que arrastres, en vez de llenar siempre desde el borde izquierdo. Se usa tanto para la velocidad del teleprompter como para la exposición de la cámara. Corre en el hilo de UI vía Reanimated + Gesture Handler, con un throttle de 80ms para el commit al estado de React (evitar saturar renders) y un flag `isDragging` que evita que ese throttle "pise" la posición visual mientras el usuario sigue arrastrando.

**English.** `src/components/Slider.tsx` is a bidirectional slider: the fill grows from the center (normalized 0.5 = neutral value) outward toward whichever side you drag, instead of always filling from the left edge. It's used for both teleprompter speed and camera exposure. It runs on the UI thread via Reanimated + Gesture Handler, with an 80ms throttle on commits to React state (to avoid flooding renders) and an `isDragging` flag that stops that throttle from fighting the live visual position while the user is still dragging.

---

## Internacionalización / Internationalization

**Español.** El español (`locales/es.json`) es el idioma maestro. El inglés (`locales/en.json`) se genera automáticamente con [lingosync](https://www.npmjs.com/package/lingosync) usando la API de DeepL (variable de entorno `DEEPL_API_KEY`, ver `.env`). Para agregar o cambiar textos:

1. Edita `locales/es.json`.
2. Corre la sincronización de lingosync para regenerar `en.json` (o tradúcelo a mano si no tienes la API key configurada).
3. Usa el string con `useTranslation()` → `t('seccion.clave')` (ver `src/i18n/index.tsx`).

**English.** Spanish (`locales/es.json`) is the master locale. English (`locales/en.json`) is auto-generated via [lingosync](https://www.npmjs.com/package/lingosync) using the DeepL API (`DEEPL_API_KEY` env var, see `.env`). To add or change copy:

1. Edit `locales/es.json`.
2. Run lingosync's sync to regenerate `en.json` (or translate it by hand if you don't have the API key set up).
3. Use the string via `useTranslation()` → `t('section.key')` (see `src/i18n/index.tsx`).

---

## Decisiones y limitaciones conocidas / Decisions and known limitations

**Español.**

- **No hay overlay flotante del teleprompter sobre otras apps.** Se exploró usar Picture-in-Picture nativo de iOS (`AVPictureInPictureController` con contenido custom vía `AVSampleBufferDisplayLayer`) para poder ver el guion mientras se graba con otra app de cámara (ej. DJI). Funcionó como prueba de concepto, pero se descartó: la ventana de PiP en iOS es siempre opaca (no hay overlay tipo HUD transparente), se comporta y se ve como un reproductor de video pase lo que pase, y no hay garantía de que siga ejecutándose en segundo plano sin una sesión de audio activa. Es una limitación de la plataforma, no de la implementación.
- **La app no tiene controles de cámara al nivel de una app nativa profesional** (tipo DJI): eso requeriría acceso manual a ISO/velocidad de obturador y un pipeline de renderizado propio (Metal/shaders) para "filtros" — fuera del alcance de `react-native-vision-camera` y de esta app.
- **Sin backend.** Todo vive en el dispositivo. Si se borra la app, se pierden guiones, videos y ajustes.

**English.**

- **No floating teleprompter overlay over other apps.** Native iOS Picture-in-Picture (`AVPictureInPictureController` with custom content via `AVSampleBufferDisplayLayer`) was explored to keep the script visible while recording with another camera app (e.g. DJI). It worked as a proof of concept but was dropped: iOS's PiP window is always opaque (no transparent HUD-style overlay), it always looks and behaves like a video player no matter what, and there's no guarantee it keeps running in the background without an active audio session. This is a platform limitation, not an implementation one.
- **The app doesn't have pro-camera-app-level controls** (DJI-style): that would require manual ISO/shutter-speed access and a custom rendering pipeline (Metal/shaders) for "filters" — out of scope for `react-native-vision-camera` and for this app.
- **No backend.** Everything lives on the device. Deleting the app loses scripts, videos, and settings.

---

## Licencia / License

Ver [`LICENSE`](./LICENSE).
See [`LICENSE`](./LICENSE).
