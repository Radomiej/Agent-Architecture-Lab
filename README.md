# Agent Architecture Designer

> Wizualny projektant systemów wieloagentowych dla Claude Code — zbudowany po to, żeby pomóc developerom **zrozumieć jak każdy agent myśli, co robi i jak zespoły ze sobą współpracują**.

<p align="center">
  <img src="docs/Animation.gif" alt="Agent Architecture Designer - demo symulacji na żywo" width="800">
</p>

<p align="center">
  <a href="https://radomiej.github.io/Agent-Architecture-Lab/"><img src="https://img.shields.io/badge/🌐_live_demo-GitHub_Pages-7C3AED.svg" alt="Live Demo"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://github.com/Radomiej/Agent-Architecture-Lab/actions/workflows/tests.yml"><img src="https://github.com/Radomiej/Agent-Architecture-Lab/actions/workflows/tests.yml/badge.svg" alt="E2E Tests"></a>
  <img src="https://img.shields.io/badge/version-v32.16-F59E0B.svg" alt="v32.16">
  <img src="https://img.shields.io/badge/agents-35-818CF8.svg" alt="35 Agents">
  <img src="https://img.shields.io/badge/presets-42-34D399.svg" alt="42 Presets">
  <img src="https://img.shields.io/badge/languages-PL_EN-06B6D4.svg" alt="PL/EN">
  <img src="https://img.shields.io/badge/stack-React_+_Vite_+_TypeScript-61DAFB.svg" alt="React + Vite + TypeScript">
</p>

---

## 🌐 Aplikacja na żywo

### **[https://radomiej.github.io/Agent-Architecture-Lab/](https://radomiej.github.io/Agent-Architecture-Lab/)**

Hostowana na GitHub Pages, deployowana automatycznie z brancha `master` przez GitHub Actions. Po każdym pushu aktualizuje się w ciągu ~2 minut.

---

## Po co to jest

Agent Architecture Designer to **przede wszystkim narzędzie edukacyjne i deweloperskie**. Nie jest to orkiestrator produkcyjny — to miejsce, gdzie możesz zwolnić i studiować systemy wieloagentowe tak jak złożoną maszynę: część po części.

Po korzystaniu z niego powinieneś umieć:

- **Zrozumieć co każdy agent naprawdę robi** — jego rolę, wejścia, wyjścia, antypatterny i tryby awaryjne
- **Zrozumieć jak agenci rozmawiają ze sobą** — kto komu przekazuje pałeczkę, w których fazach żyją, gdzie jest tarcie
- **Zrozumieć dlaczego dany preset wygląda tak jak wygląda** — dlaczego ma 7 agentów a nie 12, dlaczego debata Five Minds siedzi w środku, dlaczego brama HITL jest gdzie jest
- **Zrozumieć koszt i budżet kontekstu** systemu wieloagentowego zanim wydasz choć jeden token

---

## Co możesz z tym zrobić

1. **Ucz się.** Kliknij dowolnego z 35 agentów lub 42 presetów i przeczytaj pełny wpis encyklopedyczny. To jest główny przypadek użycia.
2. **Projektuj.** Przeciągaj agentów na płótno, łącz ich, przypisuj modele (Opus / Sonnet / Haiku) i generuj gotowy prompt systemowy dla Claude Code.
3. **Symuluj.** Uruchom symulację na żywo — agenci wymieniają animowane wiadomości i przechodzą przez bramy decyzyjne HITL.
4. **Budżetuj.** Otwórz Cost Command Center żeby zobaczyć szacunki kosztów per agent / per faza, obciążenie okna kontekstu i scenariusze what-if.
5. **Eksportuj.** Skopiuj prompt systemowy, diagram Mermaid, raport Markdown, CSV lub JSON.
6. **Uruchamiaj z prawdziwym LLM.** Podaj klucz CometAPI w ustawieniach (⚙ lub klawisz `,`), włącz Debug Mode i kliknij prawym na dowolny węzeł agenta → "Run with LLM".

---

## Jak uruchomić lokalnie

```bash
git clone https://github.com/Radomiej/Agent-Architecture-Lab.git
cd Agent-Architecture-Lab/react-app
npm install
npm run dev
# → http://localhost:5173
```

Produkcja:

```bash
npm run build   # → dist/ (to trafia na GitHub Pages)
```

Testy E2E:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

---

## Integracja z prawdziwym LLM — CometAPI

Aplikacja obsługuje wywoływanie prawdziwych modeli LLM poprzez **[CometAPI](https://cometapi.com)** — agregator 500+ modeli (GPT-5, Claude, Gemini i inne) z OpenAI-kompatybilnym API. Żadnego backendu nie potrzebujesz — wywołania idą bezpośrednio z przeglądarki.

### Konfiguracja

1. Kliknij **⚙** w górnym pasku (lub naciśnij `,`)
2. Wklej swój klucz CometAPI (format: `sk-…`) — pobierz go z [cometapi.com](https://cometapi.com)
3. Opcjonalnie zmień Base URL lub ID modeli per tier (Opus / Sonnet / Haiku)
4. Włącz **Debug Mode**
5. Kliknij **Test Connection** żeby zweryfikować klucz
6. Kliknij **Save**

Po zapisaniu klucza w nagłówku aplikacji pojawi się zielona etykieta **LLM ✓**.

### Uruchamianie agentów

- Prawym klikiem na węzeł agenta na płótnie → **Run with LLM**
- Agent wywołuje CometAPI ze swoim promptem systemowym + kontekstem z płótna (faza, połączeni agenci upstream/downstream)
- Odpowiedź strumieniowana jest na żywo do panelu debugowania i do loga dialogów

### Panel debugowania (🐛)

Przełącz klawiszem `D` lub ikoną 🐛 w górnym pasku (widoczna gdy Debug Mode jest włączony).

Każdy wpis logu pokazuje:

| Pole | Opis |
|------|------|
| Status | 🟡 pending / 🔵 streaming / 🟢 done / 🔴 error |
| Agent | Nazwa agenta i użyty model (np. `claude-sonnet-4-5`) |
| Tokeny | Wejście → wyjście |
| Latencja | Czas odpowiedzi w ms |
| Odpowiedź | Pierwsze 200 znaków, rozwijalne do pełnej treści |
| Kopiowanie | Surowy JSON wywołania (przycisk 📋) |

Klucz API nigdy nie opuszcza przeglądarki — przechowywany wyłącznie w `localStorage`.

---

## Klawisze skrótów

| Klawisz | Akcja |
|---------|-------|
| `,` | Ustawienia LLM (CometAPI) |
| `K` | Cost Command Center |
| `M` | Eksport diagramu Mermaid |
| `D` | Przełącz panel debugowania LLM |
| `Del` | Usuń zaznaczone węzły |
| `Esc` | Zamknij modal |

---

## Kluczowe funkcje

- **Płótno wizualne** — drag & drop 35 agentów, rysowanie połączeń, zaznaczanie grupowe, snap do siatki
- **Encyklopedia agentów** — każdy z 35 agentów ma 10-sekcyjną kartę bento: kim jestem, analogia, jak działam fazowo, co robię, czego NIE robię, przykład z życia, kiedy zawodzę, ciekawostki
- **Encyklopedia presetów** — każdy z 42 presetów ma dwukolumnowy panel verdict (zielony / czerwony), flow faz i listę agentów z podpowiedziami modeli
- **Integracja CometAPI** — wywoływanie prawdziwych modeli LLM bezpośrednio z przeglądarki, streaming SSE, panel debugowania z pełnym logiem wywołań
- **Symulacja na żywo** — agenci wymieniają animowane wiadomości wzdłuż połączeń; Dialog Timeline loguje wszystko
- **Five Minds Protocol** — ustrukturyzowana debata 4 ekspertów domenowych + Devil's Advocate dająca Gold Solution; 3 bramy HITL między fazami
- **Cost Command Center** — szacunki kosztów per agent / faza, zakres p50–p90, obciążenie okna kontekstu, suwaki what-if, eksport do Markdown / CSV / JSON
- **Custom Agent Creator Pro** — klon z istniejącego agenta, podgląd na żywo z oceną jakości, picker 159 ikon, tryb wizard, mock testing
- **Mermaid Export** — generuje diagram flowchart TD z kolorowymi classDefs per faza, gotowy do wklejenia
- **Ciemny / jasny motyw** — kompletny system CSS variables, kontrast APCA, paleta Okabe-Ito CVD-safe
- **Dwujęzyczny PL/EN** — każdy string UI, każdy wpis encyklopedyczny, każda etykieta modalu kosztów
- **WCAG 2.2** — ARIA, prefers-reduced-motion, nawigacja klawiaturą, focus-visible, skip link, SR announcer

---

## Stack techniczny

| Warstwa | Technologia |
|---------|-------------|
| UI framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| State | Zustand 5 (6 store'ów: canvas, simulation, llm, ui, cost, preset) |
| Routing / i18n | react-i18next (PL/EN) |
| LLM | CometAPI — OpenAI-compatible, streaming SSE |
| Testy | Playwright E2E (59 testów) |
| CI/CD | GitHub Actions → build → GitHub Pages |
| Style | Zero external UI deps — czyste CSS variables + inline styles |

---

## Co jest na płótnie

### 35 agentów

| Kategoria | Agenci | Faza | Model |
|-----------|--------|------|-------|
| **Orkiestracja** | Orkiestrator, Synthesizer | strategy | Opus |
| **Planowanie** | Analityk, Planner | strategy | Sonnet |
| **Research** | Tech, UX, Reddit, X/Twitter, GitHub, Forums, Docs (7×) + Research Critic | research | Haiku / Sonnet |
| **Build** | Backend, Frontend, Feature, Designer, Integrator, Writer | build | Sonnet |
| **QA** | QA Security, QA Quality, QA Performance, QA Manager | qa | Haiku / Sonnet |
| **Five Minds** | Pragmatyk, Innowator, Analityk Danych, Rzecznik Użytkownika, Cień | debate | Sonnet |
| **HITL** | Decision Presenter | hitl | Haiku |
| **Data / Ops / Produkt** | DB Architect, Observability Engineer, GTM Strategist, Statistician, EDA Analyst, Control Mapper, Telemetry Surfer | build/data | Sonnet |

Każdy agent ma prompt badawczo-wspierany (v28) w strukturze: ROLA / INPUT / OUTPUT / OBOWIĄZKI / ZASADY / CZEGO NIE ROBISZ / FORMAT RAPORTU.

### 42 presety (zgrupowane według rozmiaru)

| Rozmiar | Przykłady |
|---------|-----------|
| **Micro (2–3)** | Solo + Validator, Quick Fix, Recon Squad, Classic Trio |
| **Małe (4–6)** | Bug Hunter, Content Pipeline, Plan & Execute, Perf Boost |
| **Średnie (6–9)** | Security Hardening, Feature Sprint, Standard Dev, Data Pipeline |
| **Duże (9–12)** | Full-Stack SaaS, Deep Research+Build, SOC2 Sweep, Incident War Room |
| **Enterprise (12–27)** | Full Hierarchy, Five Minds Strategic, **Deep Five Minds Ultimate** (27 agentów, 2× Five Minds, 3× HITL) |

---

## Integracja z Claude Code

Projekt zawiera umiejętności Claude Code w `.claude/skills/`:

- **`/five-minds`** — przeprowadź debatę Five Minds Protocol na temat projektowy (4 ekspertów + Devil's Advocate + Gold Solution)
- **`/hitl-pipeline`** — uruchom pipeline z bramami decyzyjnymi HITL między fazami

`plugin.json` w korzeniu repozytorium sprawia, że projekt jest wykrywalny jako plugin Claude Code.

---

## Licencja

[MIT](LICENSE)
