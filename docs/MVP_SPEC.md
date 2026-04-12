# MVP Specification — Agent Architecture Designer

**Version:** React MVP (post-v32.16)
**Date:** 2026-04-12
**Status:** React migration complete; MVP feature-complete and live

---

## 1. Product Overview

**Agent Architecture Designer** is a visual, browser-based tool for designing, understanding and
generating prompts for multi-agent Claude Code teams. It is primarily an educational and
developer tool — not a production orchestrator.

**Live URL:** <https://radomiej.github.io/Agent-Architecture-Lab/>
**Tech stack:** React 19 + TypeScript + Vite 8 · Zustand 5 · react-i18next · Playwright E2E

---

## 2. MVP Goal

Enable a developer using Claude Code to:

1. **Understand** what each agent type does (and does not do), its costs, and its failure modes —
   without reading papers or prompts from scratch.
2. **Design** a custom multi-agent team visually on a canvas, assign models, and generate a
   ready-to-paste Claude Code system prompt.
3. **Budget** the team before spending a single token (p50/p90 cost estimate, context window load).
4. **Simulate** the team in a dry-run to spot bottlenecks and HITL gates.
5. **Invoke** real LLM calls directly from the browser via CometAPI or OpenRouter.

---

## 3. Core Feature Set (shipped in MVP)

### 3.1 Visual Canvas

| Feature | Status |
|---------|--------|
| Drag-and-drop 35 agent nodes | ✅ shipped |
| Draw connections between nodes | ✅ shipped |
| Marquee multi-select + group move | ✅ shipped |
| Zoom / pan | ✅ shipped |
| Snap-to-grid | ✅ shipped |
| Delete selected nodes (`Del`) | ✅ shipped |
| Auto-place with connection suggestions | ✅ shipped |
| Minimap | ✅ shipped |

### 3.2 Agent & Preset Encyclopedias

| Feature | Status |
|---------|--------|
| 35 agents with 10-section bento encyclopedia | ✅ shipped |
| 42 presets with verdict panel (green/red) | ✅ shipped |
| Full PL / EN bilingual parity (~1 700 translated fields) | ✅ shipped |
| Research-backed v28 prompts (ROLA/INPUT/OUTPUT/ZASADY/…) | ✅ shipped |

### 3.3 Cost Command Center (keyboard `K`)

| Feature | Status |
|---------|--------|
| Topbar HUD: cost range p50-p90, token bar, model mix chips | ✅ shipped |
| 5-tab modal: Overview / Breakdown / What-if / Export / Context | ✅ shipped |
| Per-agent context budget with severity coloring | ✅ shipped |
| What-if sliders (input/output multiplier, cache hit rate) | ✅ shipped |
| Export: Markdown / CSV / JSON | ✅ shipped |

### 3.4 Live Simulation

| Feature | Status |
|---------|--------|
| Agent-to-agent animated speech bubbles | ✅ shipped |
| Dialog Timeline log | ✅ shipped |
| HITL Decision Gates (3 checkpoints, 120 s countdown) | ✅ shipped |
| Live Monitor full-screen dashboard | ✅ shipped |
| Five Minds Debate Arena (3 rounds) | ✅ shipped |

### 3.5 LLM Integration (CometAPI / OpenRouter)

| Feature | Status |
|---------|--------|
| Settings modal (`,`): provider, API key, model IDs | ✅ shipped |
| Right-click → "Run with LLM" per agent node | ✅ shipped |
| Streaming SSE responses | ✅ shipped |
| Debug panel (`D`): status, tokens, latency, raw JSON copy | ✅ shipped |
| Web search tool integration | ✅ shipped |
| API key stored in `localStorage` only (never leaves browser) | ✅ shipped |

### 3.6 Export / Code Generation

| Feature | Status |
|---------|--------|
| System prompt generator (per canvas state) | ✅ shipped |
| Mermaid flowchart export (`M`) | ✅ shipped |
| Custom Agent Creator Pro (clone, icon picker, wizard, mock test) | ✅ shipped |

### 3.7 UX / Quality

| Feature | Status |
|---------|--------|
| Dark / light theme toggle | ✅ shipped |
| WCAG 2.2: ARIA, focus-visible, skip link, SR announcer | ✅ shipped |
| Okabe-Ito CVD-safe phase palette | ✅ shipped |
| APCA-compliant ink tokens | ✅ shipped |
| `prefers-reduced-motion` support | ✅ shipped |
| Playwright E2E test suite (59 tests) | ✅ shipped |
| GitHub Actions CI/CD → GitHub Pages | ✅ shipped |

---

## 4. Out of Scope for MVP

The following items are explicitly deferred:

- **Backend / server** — zero backend; all logic runs in the browser.
- **Real-time collaboration** — BroadcastChannel multi-tab sync is a future milestone.
- **Unit / integration tests** — only E2E Playwright tests in MVP.
- **localStorage migration UX banner** — migration chain exists programmatically; no user-facing upgrade UI yet.
- **Claude Code marketplace submission** — `plugin.json` exists but formal Anthropic marketplace submission is pending.
- **EN inline infographics** — infographics currently ship only in PL encyclopedia; EN parity is post-MVP.
- **Mobile / touch optimisation** — canvas drag requires pointer device.

---

## 5. Architecture (React MVP)

```
react-app/
├── src/
│   ├── App.tsx               # Root: layout, keyboard shortcuts, global handlers
│   ├── components/
│   │   ├── canvas/           # CanvasView, CanvasNode, ConnectionLine, Minimap
│   │   ├── debug/            # LLM debug panel
│   │   ├── layout/           # Topbar, Sidebar (agent/preset palettes), ControlBar
│   │   ├── modals/           # CostModal, MermaidModal, SettingsModal, SimulationModal, …
│   │   └── primitives/       # Reusable atoms (buttons, badges, tooltips)
│   ├── data/
│   │   ├── agents.ts         # 35 agent definitions
│   │   ├── presets.ts        # 42 preset definitions (index-based connections)
│   │   ├── agentKnowledge.ts # Encyclopedia data (PL)
│   │   ├── agentColors.ts    # Dark/light color maps per agent
│   │   ├── agentSvg.ts       # 159-icon SVG library
│   │   └── agentTokens.ts    # Token estimates per agent
│   ├── store/                # 6 Zustand stores (see below)
│   ├── services/
│   │   └── llmService.ts     # CometAPI / OpenRouter streaming SSE
│   ├── hooks/                # Custom React hooks
│   ├── types/                # Shared TypeScript interfaces
│   └── i18n.ts               # react-i18next setup (PL/EN)
└── e2e/                      # Playwright E2E (59 tests, 4 files)
```

### Zustand stores

| Store | Responsibility |
|-------|----------------|
| `canvasStore` | Nodes, connections, selection, zoom/pan |
| `simulationStore` | Sim state machine, step/stop/speech bubbles |
| `llmStore` | LLM config (provider, key, model IDs), debug log |
| `uiStore` | Active modal, sidebar state, theme |
| `costStore` | Cost calculations, what-if sliders |
| `presetStore` | Custom agents (localStorage `acV32_16_custom`) |

---

## 6. Local Development

```bash
git clone https://github.com/Radomiej/Agent-Architecture-Lab.git
cd Agent-Architecture-Lab/react-app
npm install
npm run dev           # → http://localhost:5173
npm run build         # → dist/ (GitHub Pages)
npm run lint          # ESLint
npm run test:e2e      # Playwright (headless Chromium)
```

---

## 7. Success Criteria for MVP

| Metric | Target | Current |
|--------|--------|---------|
| E2E test pass rate | 100% | ✅ 59/59 |
| Build with 0 TypeScript errors | Yes | ✅ |
| Live URL accessible | Yes | ✅ |
| 35 agents with full encyclopedia | Yes | ✅ |
| 42 presets selectable from palette | Yes | ✅ |
| Cost estimate visible on canvas load | Yes | ✅ |
| LLM call completes without error | Yes | ✅ |
| Lighthouse a11y score ≥ 85 | ≥ 85 | ~88 |
| First Contentful Paint | < 2 s | < 1.5 s |

---

*Maintained by: Radomiej · Last updated: 2026-04-12*
