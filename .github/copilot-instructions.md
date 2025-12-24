# Copilot Instructions for ns-simulator

- **Purpose**: Electron desktop app with React renderer that simulates network scenarios; main process hosts windows and IPC, renderer builds a resizable multi-pane UI.
- **Entry points**: Main process in [src/main/index.ts](src/main/index.ts); preload bridge in [src/preload/index.ts](src/preload/index.ts); renderer bootstraps from [src/renderer/src/main.tsx](src/renderer/src/main.tsx) into [src/renderer/index.html](src/renderer/index.html).
- **IPC contracts**: Channels use the `nssimulator:*` namespace. Preload exposes `window.nssimulator.saveScenario(data)`, `loadScenario()`, `runSimulation(config)`; main process currently logs the payloads. Keep context isolation intact by wiring new IPC methods in both preload and main. Validate input in preload before sending.
- **Window lifecycle**: BrowserWindow created in `createWindow` with `webPreferences.preload` set to the built preload bundle; HMR/production loading toggled by `ELECTRON_RENDERER_URL`. DevTools shortcuts managed via `@electron-toolkit/utils`.
- **Renderer layout**: The app renders `MainLayout` (not `App`). It composes multiple `PanelGroup`/`Panel` instances with `react-resizable-panels` and `autoSaveId` to persist sizes. Pane toggles (left/right/bottom) live in [src/renderer/src/components/layout/MainLayout.tsx](src/renderer/src/components/layout/MainLayout.tsx) and [CommandBar](src/renderer/src/components/layout/CommandBar.tsx); follow this pattern when adding panes so persistence and accessibility remain intact.
- **UI components**: Canvas, sidebars, and telemetry shells live under [src/renderer/src/components/layout/](src/renderer/src/components/layout/). Styling uses Tailwind classes in component markup plus global styles from [src/renderer/src/assets/main.css](src/renderer/src/assets/main.css) (imports base.css).
- **Accessibility**: Resize handles and toggle buttons already carry ARIA roles, labels, and focus states. Preserve these when altering layout controls; new controls should mirror the same patterns.
- **IPC usage example**: Renderer code calls `window.nssimulator.saveScenario("test ns simulator ipc bridge")` (see [src/renderer/src/App.tsx](src/renderer/src/App.tsx)) to demonstrate the bridge. Prefer using the preload API rather than `ipcRenderer` directly in the renderer.
- **Error handling**: Preload guards `saveScenario` against empty/non-string/oversized payloads and wraps `loadScenario` with `.catch` logging. Mirror this defensive validation for new IPC APIs.
- **Build and run**: Install with `npm install`; dev via `npm run dev` (electron-vite). Type checks: `npm run typecheck` (node+web). Lint with `npm run lint`. Platform builds: `npm run build:mac|win|linux` (uses electron-builder after electron-vite build).
- **Tooling**: Tailwind, ESLint (react/react-hooks/react-refresh rules via @electron-toolkit config), Prettier. Main TS config extends @electron-toolkit/tsconfig; renderer uses separate tsconfig.web.json. Prefer matching existing paths/configs rather than introducing new toolchains.
- **Packaging outputs**: Built main/preload/renderer emit to `out/`; electron-builder consumes that along with [build/entitlements.mac.plist](build/entitlements.mac.plist) and [resources/](resources) assets.
- **Asset loading**: App icon bundled via `icon.png?asset` in [src/main/index.ts](src/main/index.ts). Keep static assets under `resources/` to align with electron-vite bundling.
- **State and persistence**: Layout sizes persist automatically through `autoSaveId` keys. When adding new PanelGroups, supply unique `autoSaveId` to avoid collisions.
- **Platform notes**: `autoHideMenuBar` is enabled; window open handler denies new windows and delegates URLs to the external browser. Keep this security posture when adding navigation.
- **Adding IPC**: Register listeners/handlers in main, export matching functions in preload, and consume via `window.nssimulator.*`. Do not import Electron modules directly in React code.
- **Unused component**: `App` exists but renderer bootstraps `MainLayout`. Update bootstrap if you repurpose `App`, or remove to avoid confusion.
- **Coding style**: Functional React components with TypeScript, minimal state, Tailwind utility classes. Keep files ASCII. Add concise comments only where logic is non-obvious.
- **Testing**: No automated tests present; when adding logic-heavy modules, prefer keeping side effects behind IPC or isolated helpers to ease future testing.

If anything is unclear or missing, call it out so we can refine these instructions.
