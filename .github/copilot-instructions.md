# GitHub Copilot Instructions — Agent Architecture Designer

> These instructions are loaded automatically by GitHub Copilot (and compatible tools) from
> `.github/copilot-instructions.md`. They apply to every Copilot suggestion in this repository.

---

## Project Summary

**Agent Architecture Designer** is a visual, browser-based tool for designing multi-agent Claude Code
teams. Users drag-and-drop agents onto a canvas, connect them, assign models, run cost estimates,
simulate communication, and export a ready-to-paste Claude Code system prompt.

**Key facts:**
- React 19 + TypeScript + Vite 8 in `react-app/`
- State management: Zustand 5 (6 stores)
- i18n: react-i18next, two locales — `pl` (primary) and `en`
- Tests: Playwright E2E only (59 tests, `react-app/e2e/`)
- CI/CD: GitHub Actions → GitHub Pages
- Zero external UI dependencies — pure CSS variables + inline styles
- No backend — all logic runs in the browser

---

## File Locations

```
react-app/
├── src/
│   ├── App.tsx               # Root component; keyboard shortcuts registered here
│   ├── components/
│   │   ├── canvas/           # CanvasView, CanvasNode, ConnectionLine, Minimap
│   │   ├── debug/            # LLM debug panel (toggle with D key)
│   │   ├── layout/           # Topbar, Sidebar (palettes), ControlBar
│   │   ├── modals/           # CostModal, MermaidModal, SettingsModal, …
│   │   └── primitives/       # Reusable atoms
│   ├── data/
│   │   ├── agents.ts         # AgentDef[] — 35 agent definitions
│   │   ├── presets.ts        # PresetDef[] — 42 presets (index-based connections)
│   │   ├── agentKnowledge.ts # Encyclopedia entries (PL)
│   │   ├── agentColors.ts    # AGENT_COLORS_DARK / AGENT_COLORS_LIGHT maps
│   │   ├── agentSvg.ts       # AGENT_SVG + CUSTOM_ICONS (159 icons total)
│   │   └── agentTokens.ts    # AGENT_TOKENS input/output estimates
│   ├── store/
│   │   ├── canvasStore.ts    # nodes, connections, selection, zoom, pan
│   │   ├── simulationStore.ts# sim state machine, speech bubbles, HITL gates
│   │   ├── llmStore.ts       # provider, apiKey, modelIDs, debug log
│   │   ├── uiStore.ts        # activeModal, sidebar, theme
│   │   ├── costStore.ts      # cost calculations, what-if sliders
│   │   └── presetStore.ts    # custom agents, localStorage migration chain
│   ├── services/
│   │   └── llmService.ts     # CometAPI / OpenRouter streaming SSE
│   ├── hooks/                # Custom hooks (useKeyboard, useDrag, …)
│   ├── types/                # Shared TS interfaces (CanvasNode, Connection, …)
│   └── i18n.ts               # react-i18next init
└── e2e/                      # Playwright E2E tests
    ├── app.spec.ts
    ├── canvas-interactions.spec.ts
    ├── llm.spec.ts
    └── modals.spec.ts
```

---

## Code Conventions

### TypeScript

- Use `const` by default; `let` only when reassignment is necessary; never `var`.
- Prefer explicit return types on exported functions and hooks.
- Use `interface` for data shapes (agent, preset, node); `type` for unions and aliases.
- No `any` — use `unknown` with runtime checks or proper generics.
- Keep data files (`agents.ts`, `presets.ts`, `agentKnowledge.ts`) as pure `const` exports; no
  side-effects.

### React

- Functional components only — no class components.
- Each component in its own file; file name matches component name.
- Extract complex render logic into named helpers inside the file, not anonymous JSX expressions.
- Avoid `useEffect` for derived state — use Zustand selectors or `useMemo` instead.
- Use `React.memo` only with a measurable performance reason; don't wrap everything.

### Zustand stores

- One concern per store file.
- All state mutations happen inside store actions — never mutate from components directly.
- Selectors should be narrow (pick only the slice they need) to minimise re-renders.
- localStorage persistence lives in the store, not in components.
  - Current localStorage key for custom agents: `acV32_16_custom`
  - Maintain the migration chain when bumping the key.

### CSS / Styling

- All colours via CSS custom properties defined in `:root` / `[data-theme=light]`.
- Phase colours: `--ph-strategy`, `--ph-research`, `--ph-debate`, `--ph-build`, `--ph-qa`, `--ph-hitl`
- Model colours: `--mc-opus` (gold), `--mc-sonnet` (violet), `--mc-haiku` (green)
- Okabe-Ito CVD-safe palette — do not swap phase colours without checking CVD contrast.
- No external CSS libraries or utility frameworks (no Tailwind, no Bootstrap).
- Use `clsx`-style conditional class strings; no inline style objects for colours (use CSS vars).
- `prefers-reduced-motion` must gate all animations that last > 80 ms.

### i18n

- All user-visible strings must go through `t('key')` from `react-i18next`.
- Polish (`pl`) is the primary locale and is always the source of truth.
- English strings live in `src/locales/en/` (or `I18N_EN` constant for data).
- Never hardcode Polish or English strings in JSX — always use `t()`.
- Keys use dot notation: `modal.cost.title`, `agent.orchestrator.tagline`, etc.

### Security

- Never set `innerHTML` to user-supplied or localStorage-sourced values without first calling
  `escHtml()` (defined in `src/utils/`).
- CSV export: use `escCsv()` — prepend `'` to cells starting with `=`, `+`, `-`, `@` (formula injection).
- Mermaid labels: use `sanitizeMermaidLabel()` — strip `["|\]<>\`` from agent names.
- API keys must never leave the browser. They are stored in `localStorage` only and sent directly
  to the provider (CometAPI / OpenRouter) from the browser — never proxy through a server.

---

## Adding a New Agent

1. Add the `AgentDef` entry to `src/data/agents.ts` (id, name, phase, model, category, icon, prompt).
2. Add dark/light colours to `AGENT_COLORS_DARK` and `AGENT_COLORS_LIGHT` in `src/data/agentColors.ts`.
3. Add an SVG icon to `AGENT_SVG` in `src/data/agentSvg.ts` (stroke-width:2, fill:none, viewBox 0 0 24 24).
4. Add token estimates to `AGENT_TOKENS` in `src/data/agentTokens.ts`.
5. Add a knowledge entry to `agentKnowledge.ts` (PL) and the matching EN entry.
6. Update `src/data/presets.ts` if the agent should appear in any preset.

## Adding a New Preset

1. Add the `PresetDef` entry to `src/data/presets.ts` (id, name, category, agents array, connections
   as index pairs).
2. Add `PRESET_KNOWLEDGE`, `PRESET_GREEN_PL`, `PRESET_RED_PL`, `PRESET_LONG_PL`, `PRESET_MID_PL`
   entries (PL + EN).
3. Add an icon entry to `PRESET_SVG` and colours to `PRESET_COLORS_DARK` / `PRESET_COLORS_LIGHT`.

---

## Running the Project

```bash
# Development
cd react-app && npm install && npm run dev   # → http://localhost:5173

# Production build
cd react-app && npm run build               # → dist/

# Lint
cd react-app && npm run lint

# E2E tests (needs Chromium installed)
cd react-app
npx playwright install --with-deps chromium
npm run test:e2e
```

CI runs `npm run build` + `npm run test:e2e` on every PR and push to `master`.

---

## Testing Guidelines

- All new user-facing features need at least one Playwright E2E test.
- Tests live in `react-app/e2e/`; group by feature area (see existing 4 files).
- Tests use `page.goto('/')` — the Vite dev server is started automatically via `webServer` in
  `playwright.config.ts` (port 5174).
- Extract magic strings to `const` — avoid inline string literals for selectors and expected values.
- Do NOT remove or modify existing tests unless the feature they cover has changed.

---

## What Copilot Should Not Do

- Do not add external UI libraries (MUI, Shadcn, Radix, Tailwind, etc.).
- Do not add a backend, server, or serverless function — this is a purely client-side app.
- Do not store API keys server-side or log them anywhere.
- Do not break the localStorage migration chain in `presetStore.ts`.
- Do not replace CSS variables with hardcoded hex values.
- Do not skip `escHtml()` / `escCsv()` / `sanitizeMermaidLabel()` for user-facing data.
- Do not add `any` types.

---

*Maintained by: Radomiej · Last updated: 2026-04-12*
