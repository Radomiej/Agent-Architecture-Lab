# Product Roadmap — Agent Architecture Designer

**Current version:** React MVP (post-v32.16 HTML → React migration)
**Live at:** <https://radomiej.github.io/Agent-Architecture-Lab/>
**Updated:** 2026-04-12

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Shipped |
| 🚧 | In progress |
| 🎯 | Next up (planned) |
| 💡 | Idea / backlog |
| ❌ | Dropped |

---

## Milestone 0 — React Migration (SHIPPED)

**Goal:** Migrate from 27 000-line monolithic HTML to a maintainable React + TypeScript application.

| Item | Status |
|------|--------|
| Vite + React 19 scaffold | ✅ |
| 35 agents ported to `src/data/agents.ts` | ✅ |
| 42 presets ported to `src/data/presets.ts` | ✅ |
| 6 Zustand stores (canvas, simulation, llm, ui, cost, preset) | ✅ |
| Visual canvas with drag-and-drop, zoom, pan, minimap | ✅ |
| Agent & preset palette sidebar | ✅ |
| Cost Command Center (HUD + 5-tab modal) | ✅ |
| Mermaid export modal | ✅ |
| LLM integration (CometAPI + OpenRouter, streaming SSE) | ✅ |
| Debug panel for LLM calls | ✅ |
| Live simulation + Dialog Timeline | ✅ |
| HITL decision gates (3 checkpoints) | ✅ |
| Custom Agent Creator Pro | ✅ |
| Dark / light theme | ✅ |
| PL / EN bilingual UI | ✅ |
| WCAG 2.2 (ARIA, focus-visible, reduced-motion) | ✅ |
| Playwright E2E test suite (59 tests) | ✅ |
| GitHub Actions CI: tests + deploy to GitHub Pages | ✅ |

---

## Milestone 1 — Quality & Observability (v0.2.x)

**Goal:** Make the codebase easier to maintain and give contributors clear quality gates.

### 1.1 Unit / Integration Tests

- [ ] Add Vitest for unit tests of pure store logic (canvasStore, costStore)
- [ ] Add React Testing Library tests for key components (CanvasNode, CostModal, Sidebar)
- [ ] Reach ≥ 60% code coverage on `src/store/` and `src/data/`
- [ ] Integrate coverage report into GitHub Actions CI

### 1.2 Performance

- [ ] Code-split heavy encyclopedia data (`agentKnowledge.ts`) with `React.lazy` + `Suspense`
- [ ] Virtualise palette list (react-window or Tanstack Virtual) — currently renders all 35+42 items
- [ ] Profile and reduce unnecessary re-renders on canvas drag (canvas store selectors)
- [ ] Audit and reduce bundle size (target < 400 KB gzipped)

### 1.3 Error Handling

- [ ] Add React Error Boundary around canvas and simulation panels
- [ ] Add toast notification system for LLM errors (stream interrupts, auth failures)
- [ ] Graceful degradation when `localStorage` is unavailable (private browsing)

---

## Milestone 2 — EN Encyclopedia Parity (v0.3.x)

**Goal:** Give English-first users the same depth as Polish users.

| Item | Status |
|------|--------|
| PL encyclopedia for all 35 agents (18 fields each) | ✅ |
| EN encyclopedia translation scaffold (`I18N_EN`) | ✅ |
| EN inline infographics (agent flow diagrams, cost charts) | 🎯 |
| EN-only onboarding tour (first-visit overlay, 5 steps) | 🎯 |
| Community feedback collection (GitHub Discussions) | 🎯 |

---

## Milestone 3 — Collaboration & Sharing (v0.4.x)

**Goal:** Let users share and re-use canvas configurations.

- [ ] **Export canvas as JSON** — downloadable snapshot of nodes + connections + models
- [ ] **Import canvas from JSON** — drag-and-drop or file picker
- [ ] **Shareable URL** — encode canvas state as a compressed URL hash (no server required)
- [ ] **Preset submission** — GitHub Issues template for "propose a new preset" with structured fields
- [ ] **localStorage migration UX banner** — notify user on first load after version bump, show diff of changes

---

## Milestone 4 — Claude Code Plugin Marketplace (v0.5.x)

**Goal:** Make the tool discoverable and installable from within Claude Code.

- [ ] Verify current `plugin.json` schema against Anthropic docs
- [ ] Update `plugin.json` version to `0.5.0`
- [ ] Submit to Claude Code marketplace (formal Anthropic submission)
- [ ] Document install flow in README (one-command install via `claude code install`)
- [ ] Test `.claude/skills/five-minds` and `.claude/skills/hitl-pipeline` against latest Claude Code SDK

---

## Milestone 5 — Real-Time Multi-Tab Sync (v0.6.x)

**Goal:** Allow multiple browser tabs (or team members on the same machine) to collaborate on the same canvas.

- [ ] BroadcastChannel API for cross-tab canvas sync
- [ ] Conflict resolution strategy (last-write-wins with timestamp)
- [ ] "Other tab is active" indicator in topbar
- [ ] Optional: WebRTC peer-to-peer sync (stretch goal)

---

## Milestone 6 — Mobile & Touch (v0.7.x)

**Goal:** Make the canvas usable on tablets and large phones.

- [ ] Touch events for drag, pinch-to-zoom, tap-to-select
- [ ] Responsive sidebar (slide-in drawer on narrow screens)
- [ ] Minimum touch target 44 × 44 px for all interactive elements
- [ ] Test suite coverage for touch events (Playwright mobile viewport)

---

## Milestone 7 — File System & Deep Integrations (v1.0.x)

**Goal:** Bridge the designer with actual Claude Code project folders.

- [ ] **File System Access API** — import `EXECUTION_REPORT.json` from a Claude Code run and overlay results on the canvas (which agents ran, latency, token counts)
- [ ] **`.claude/agents/` round-trip** — export canvas as a set of individual agent `.md` files; import existing agent folder back into canvas
- [ ] **GitHub integration** — detect `plugin.json` in a linked repo and auto-populate the canvas
- [ ] **OpenTelemetry export** — emit canvas simulation events as OTEL spans for external observability tools

---

## Backlog / Ideas

- 💡 AI-assisted preset suggestion ("describe your use case in plain text → get a suggested preset")
- 💡 Agent dependency graph validator (warn on cycles, disconnected nodes, missing orchestrator)
- 💡 Cost forecast comparison across presets (side-by-side p50/p90 bar chart)
- 💡 Animated tutorial walkthrough via the Agent Encyclopedia ("learn by doing" mode)
- 💡 VS Code extension companion showing the designer in a side panel

---

## What We Dropped

| Item | Reason |
|------|--------|
| 5 000-LOC hard cap | Educational mission (encyclopedias, bilingual) required more; retired in v32.14 |
| Separate version HTML files | Replaced by React component architecture |
| PNG icon mode (Imagen 4 base64) | Too heavy (4.5 MB); SVG icons cover all needs |

---

*Maintained by: Radomiej · Last updated: 2026-04-12*
