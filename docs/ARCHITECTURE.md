# Architecture — Agent Architecture Designer (v33)

> Opis czystości architektury, diagramy warstw, zależności między store'ami i kluczowe przepływy danych.

---

## 1. Warstwy aplikacji

```mermaid
graph TD
    subgraph PRESENTATION["Warstwa prezentacji"]
        App["App.tsx\n(root, keyboard shortcuts)"]
        subgraph LAYOUT["Layout"]
            TopBar["TopBar"]
            LeftSidebar["LeftSidebar"]
            RightSidebar["RightSidebar"]
            MobileNav["MobileNav"]
        end
        subgraph CANVAS["Canvas"]
            CanvasArea["CanvasArea"]
            AgentNode["AgentNode"]
            ConnectionLayer["ConnectionLayer"]
        end
        subgraph MODALS["Modals"]
            CostModal["CostModal"]
            MermaidModal["MermaidModal"]
            LLMSettingsModal["LLMSettingsModal"]
            SimulationReviewModal["SimulationReviewModal"]
            TaskPromptModal["TaskPromptModal"]
        end
        subgraph DEBUG["Debug"]
            DebugPanel["DebugPanel"]
            McpToolsPanel["McpToolsPanel"]
        end
    end

    subgraph STATE["Warstwa stanu (Zustand)"]
        canvasStore["canvasStore\nnodes · connections\nselection · zoom · pan"]
        scenarioStore["scenarioStore\nsave · restore · delete\n(orchestration)"]
        simulationStore["simulationStore\nstate machine + LLM pipeline"]
        presetStore["presetStore\ncustomAgents · savedConfigs\n(localStorage)"]
        uiStore["uiStore\ntheme · lang\nactiveModal · sidebarTab"]
        llmStore["llmStore\nprovider · apiKey\nmodelMap · debugMode"]
        costStore["costStore\nderived cost/ctx\n(stateless)"]
        vfsStore["vfsStore\nin-memory VFS\nagent file ops"]
        mcpStore["mcpStore\nMCP gateway\ntool groups"]
    end

    subgraph UTILS["Pure Utils"]
        scenarioSnapshot["scenarioSnapshot\ncloneGraph()\npresetToGraph()"]
        buildAgentContext["buildAgentContext\nbuild prompt from\nupstream results"]
        toolSimulator["toolSimulator\nmock tool execution"]
        bashSimulator["bashSimulator\nbash simulation"]
        resolveAgentTools["resolveAgentTools\nMCP tool names"]
    end

    subgraph SERVICES["Serwisy (External I/O)"]
        llmService["llmService\nCometAPI / OpenRouter\nSSE streaming"]
        mcpService["mcpService\nMCP protocol client"]
    end

    subgraph DATA["Dane statyczne"]
        agents_data["agents.ts\n35 AgentDef"]
        presets_data["presets.ts\n42 PresetDef"]
        agentTokens["agentTokens.ts\ntoken estimates\nMODEL_COSTS"]
        agentColors["agentColors.ts\nCOLOR_DARK / LIGHT"]
        agentSvg["agentSvg.ts\n159 SVG icons"]
    end

    PRESENTATION --> STATE
    STATE --> UTILS
    STATE --> SERVICES
    STATE --> DATA
    UTILS --> DATA
```

---

## 2. Graf zależności między store'ami

```mermaid
graph LR
    scenarioStore -->|replaceGraph| canvasStore
    scenarioStore -->|saveConfig\nloadConfig\ndeleteConfig| presetStore
    scenarioStore -->|cloneGraph\npresetToGraph| scenarioSnapshot

    simulationStore -->|reads nodes\nconnections| canvasStore
    simulationStore -->|reads apiKey\nmodelMap| llmStore
    simulationStore -->|readFile\nwriteFile| vfsStore
    simulationStore -->|callTool| mcpStore
    simulationStore -->|callAgent| llmService
    simulationStore -->|buildAgentContext| buildAgentContext

    costStore -->|AD_MAP\nAGENT_TOKENS| agents_data["agents.ts / agentTokens.ts"]

    mcpStore -->|connect\ncallTool| mcpService
    llmStore -->|constants| llmService

    uiStore -->|i18n.changeLanguage| i18n["react-i18next"]

    style scenarioStore fill:#1e3a5f,color:#90cdf4
    style canvasStore fill:#1a3a2a,color:#9ae6b4
    style presetStore fill:#3a1a1a,color:#fc8181
    style simulationStore fill:#3a2a00,color:#fbd38d
```

> **Klucz**: `scenarioStore` jest jedynym wejściem do operacji na scenariuszach — nie wolno wywoływać `canvasStore.replaceGraph` bezpośrednio z komponentów.

---

## 3. Separacja odpowiedzialności store'ów

| Store | Odpowiedzialność | localStorage |
|---|---|---|
| `canvasStore` | Prymitywy edycji canvas (add/move/remove/select nodes) | `acCanvas` |
| `scenarioStore` | Orkiestracja scenariuszy (save/restore/delete) | — (deleguje do presetStore) |
| `presetStore` | Persystencja: custom agents + saved configs | `acV33_custom` |
| `simulationStore` | State machine symulacji + LLM pipeline executor | — |
| `uiStore` | Stan UI: motyw, język, aktywny modal, zakładka sidebar | `acV32_theme`, `acV32_lang` |
| `llmStore` | Konfiguracja LLM: provider, API key, model IDs | `acLLM` |
| `costStore` | Obliczenia kosztów/kontekstu (czysto funkcyjny, stateless) | — |
| `vfsStore` | Wirtualny system plików dla agentów podczas symulacji | — (in-memory) |
| `mcpStore` | Połączenie z zewnętrznym gateway MCP, grupy narzędzi | `acMcp` |

---

## 4. Przepływ: Wczytanie presetu → Canvas

```mermaid
sequenceDiagram
    participant User
    participant LeftSidebar
    participant scenarioStore
    participant scenarioSnapshot
    participant canvasStore
    participant localStorage

    User->>LeftSidebar: klik na preset
    LeftSidebar->>scenarioStore: loadPresetScenario(preset)
    scenarioStore->>scenarioSnapshot: presetToGraph(preset)
    scenarioSnapshot-->>scenarioStore: {nodes, connections}
    scenarioStore->>canvasStore: replaceGraph(nodes, connections)
    canvasStore->>localStorage: saveCanvas({nodes, connections, zoom:1, pan:{0,0}})
    canvasStore-->>LeftSidebar: state update → re-render
```

---

## 5. Przepływ: Zapis scenariusza

```mermaid
sequenceDiagram
    participant User
    participant TopBar
    participant scenarioStore
    participant scenarioSnapshot
    participant canvasStore
    participant presetStore
    participant localStorage

    User->>TopBar: wpisuje nazwę + Enter
    TopBar->>scenarioStore: saveScenario(name)
    scenarioStore->>canvasStore: getState() → {nodes, connections}
    scenarioStore->>scenarioSnapshot: cloneGraph(nodes, connections)
    scenarioSnapshot-->>scenarioStore: SavedConfig.data
    scenarioStore->>presetStore: saveConfig(name, data)
    presetStore->>localStorage: setItem("acV33_custom", ...)
    presetStore-->>scenarioStore: done
    scenarioStore-->>TopBar: true
    TopBar->>uiStore: setSidebarTab("saved")
```

---

## 6. Przepływ: Uruchomienie symulacji LLM

```mermaid
sequenceDiagram
    participant User
    participant TopBar
    participant simulationStore
    participant canvasStore
    participant llmStore
    participant buildAgentContext
    participant vfsStore
    participant llmService

    User->>TopBar: klik "Run Pipeline"
    TopBar->>simulationStore: runPipelineLLM(task, nodes, connections)
    simulationStore->>canvasStore: getState() → nodes ordered by phase
    simulationStore->>llmStore: getState() → apiKey, modelMap

    loop dla każdego agenta (phase order)
        simulationStore->>buildAgentContext: buildAgentContext(node, results, task)
        buildAgentContext-->>simulationStore: messages[]
        simulationStore->>llmService: callAgent(messages, modelId, apiKey)
        llmService-->>simulationStore: stream → result string
        simulationStore->>vfsStore: writeFile(output, agentId)
        simulationStore->>simulationStore: agentResults[nodeId] = result
    end

    simulationStore-->>TopBar: isPipelineRunning = false
```

---

## 7. Ocena czystości architektury

| Kryterium | Ocena | Uwagi |
|---|---|---|
| Separacja warstw | ✅ PASS | Dane statyczne → Utils → Stores → Prezentacja |
| Jedna odpowiedzialność (SRP) | ✅ PASS | Każdy store ma jasno zdefiniowany zakres |
| Scenariusze odizolowane od edycji | ✅ PASS | `scenarioStore` jako jedyna bramka |
| Brak cykli zależności | ✅ PASS | Żaden store nie importuje komponentów |
| `canvasStore` bez logiki scenariuszy | ✅ PASS | `replaceGraph` to atomowe API granicy |
| `simulationStore` (God Store) | ⚠️ UWAGA | Łączy UI state (isRunning/step) z LLM pipeline executor — kandydat do podziału w przyszłości |
| Persystencja localStorage scentralizowana | ✅ PASS | `canvasStore` + `presetStore` + `llmStore` — każdy z własnym kluczem |
| Czyste funkcje testowalne | ✅ PASS | `scenarioSnapshot.ts`, `buildAgentContext.ts` — zero store deps |
| Bezpieczeństwo API keys | ✅ PASS | Klucze tylko w localStorage, nigdy proxy przez serwer |
