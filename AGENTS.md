# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds extension code split by runtime:
  - `src/background/` Chrome extension service worker and message relay.
  - `src/offscreen/` offscreen document used for recording tasks.
  - `src/engine/` core recording logic (see `recorder.js`).
  - `src/ui/` popup UI (e.g., `main.js`).
- `public/` contains static assets copied into the build.
- `manifest.json` defines the Chrome extension.
- `dist/` is the Vite build output (generated).

## Build, Test, and Development Commands
- `pnpm dev` (or `npm run dev`): start the Vite dev server for local UI work.
- `pnpm build` (or `npm run build`): produce the production build in `dist/`.
- `pnpm preview` (or `npm run preview`): serve the `dist/` build locally.

## Coding Style & Naming Conventions
- JavaScript uses ES modules (`type: module`).
- Indentation is 4 spaces in existing files, with semicolons and single quotes.
- Prefer descriptive, lowercase file names in `src/` (e.g., `main.js`, `recorder.js`).
- Tailwind CSS is available; keep utility classes tidy and consistent.

## Testing Guidelines
- No automated tests are configured yet.
- If adding tests, introduce a `tests/` or `__tests__/` directory and document the runner in `package.json`.

## Commit & Pull Request Guidelines
- Recent commits use a short prefix like `Fix:` or `Docs:` followed by a concise summary and version tag (example: `Fix: Swap Start(Y) and Stop(U) shortcuts in v1.0.13`).
- Keep PRs small and focused. Include:
  - a brief description of the change,
  - linked issue (if applicable),
  - screenshots or screen recordings for UI or UX changes.

## Security & Configuration Tips
- Extension shortcuts are documented in `README.md`; keep them in sync with `manifest.json` and UI labels.
- When changing recording behavior, verify background/offscreen message types remain compatible.
