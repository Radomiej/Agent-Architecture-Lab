# Domain Model — Agent Architecture Designer (v33)

> Modele domenowe: encje, ich pola, relacje oraz maszyna stanów symulacji.

---

## 1. Model encji głównych

```mermaid
classDiagram
    class Agent {
        +id: string
        +name: string
        +cat: string
        +icon: string
        +color: string
        +model: ModelType
        +load: number
        +phase: Phase
        +role: string
        +tools: string
        +prompt: string
        +isCustom?: boolean
        +iconRef?: string
        +tier?: string
    }

    class CanvasNode {
        +id: string
        +agentId: string
        +x: number
        +y: number
        +connections: string[]
    }

    class Connection {
        +from: string
        +to: string
    }

    class PresetDef {
        +id: string
        +name: string
        +cat: string
        +desc: string
        +nodes: PresetNode[]
        +tier?: string
        +source?: string
    }

    class PresetNode {
        +id: string
        +x: number
        +y: number
        +c?: number[]
        +m?: ModelType
    }

    class SavedConfig {
        +name: string
        +data.nodes: CanvasNode[]
        +data.connections: Connection[]
        +data.version: string
    }

    class CustomAgent {
        +isCustom: true
    }

    Agent <|-- CustomAgent : extends
    CanvasNode "1" --> "1" Agent : agentId references
    CanvasNode "1" --> "*" Connection : participates via id
    SavedConfig "1" *-- "*" CanvasNode : contains
    SavedConfig "1" *-- "*" Connection : contains
    PresetDef "1" *-- "*" PresetNode : defines structure
    PresetNode --> Agent : id references
```

---

## 2. Typy wyliczeniowe (Enums)

```mermaid
classDiagram
    class Phase {
        <<enumeration>>
        strategy
        research
        debate1
        debate2
        build
        qa
        hitl
    }

    class ModelType {
        <<enumeration>>
        opus
        sonnet
        haiku
    }

    class LLMProvider {
        <<enumeration>>
        cometapi
        openrouter
    }

    class SidebarTab {
        <<enumeration>>
        agents
        presets
        saved
    }

    class Theme {
        <<enumeration>>
        dark
        light
    }

    Agent --> Phase : phase
    Agent --> ModelType : model
    LLMConfig --> LLMProvider : provider
    UiState --> SidebarTab : sidebarTab
    UiState --> Theme : theme
```

---

## 3. Model konfiguracji LLM

```mermaid
classDiagram
    class LLMConfig {
        +provider: LLMProvider
        +apiKey: string
        +baseUrl: string
        +modelMap: Record~ModelType, string~
        +debugMode: boolean
    }

    class WebSearchConfig {
        +enabled: boolean
        +provider: WebSearchProvider
        +apiKey: string
        +model: SonarModelId
    }

    class ProviderConfigMap {
        +cometapi: ProviderLLMConfig
        +openrouter: ProviderLLMConfig
    }

    class ProviderLLMConfig {
        +apiKey: string
        +baseUrl: string
        +modelMap: Record~ModelType, string~
    }

    LLMConfig --> LLMProvider
    ProviderConfigMap "1" *-- "2" ProviderLLMConfig
```

---

## 4. Model symulacji i logów LLM

```mermaid
classDiagram
    class SimMessage {
        +agentId: string
        +text: string
        +timestamp: number
        +phase?: string
    }

    class LLMCallLog {
        +id: string
        +nodeId: string
        +agentId: string
        +agentName: string
        +model: string
        +status: LLMCallStatus
        +startedAt: number
        +finishedAt?: number
        +promptTokens: number
        +completionTokens: number
        +result?: string
        +error?: string
    }

    class LLMCallStatus {
        <<enumeration>>
        pending
        running
        done
        error
    }

    class ToolCall {
        +id: string
        +agentId: string
        +tool: ToolType
        +input: Record~string, unknown~
        +output?: string
        +timestamp: number
    }

    class ToolType {
        <<enumeration>>
        Read
        Write
        Edit
        Bash
        Glob
        Grep
        LS
        WebSearch
        WebFetch
        Agent
        TodoRead
        TodoWrite
        TaskCreate
    }

    LLMCallLog --> LLMCallStatus
    ToolCall --> ToolType
    SimMessage --> Agent : agentId references
```

---

## 5. Model wirtualnego systemu plików (VFS)

```mermaid
classDiagram
    class VfsFile {
        +path: string
        +content: string
        +createdBy: string
        +modifiedAt: number
        +type: VfsFileType
    }

    class VfsFileType {
        <<enumeration>>
        file
        dir
    }

    class VfsStore {
        +files: Map~string, VfsFile~
        +readFile(path) string|null
        +writeFile(path, content, agentId) void
        +editFile(path, oldStr, newStr, agentId) boolean
        +mkdir(path, agentId?) void
        +listDir(path) string[]
        +glob(pattern) string[]
        +grep(query, pathPattern?) GrepResult[]
        +deleteFile(path) boolean
        +reset() void
        +seedProject() void
    }

    VfsStore "1" *-- "*" VfsFile : files map
    VfsFile --> VfsFileType
```

---

## 6. Model MCP (Model Context Protocol)

```mermaid
classDiagram
    class McpConfig {
        +gatewayUrl: string
        +bearerToken: string
        +enabled: boolean
    }

    class McpToolDef {
        +name: string
        +description: string
        +inputSchema: object
    }

    class McpToolGroup {
        +id: string
        +name: string
        +toolNames: string[]
    }

    class McpCallResult {
        +content: string
        +isError: boolean
    }

    class McpStore {
        +config: McpConfig
        +status: McpStatus
        +tools: McpToolDef[]
        +toolGroups: McpToolGroup[]
        +agentToolOverrides: Record~string, string[]~
        +connect() Promise~void~
        +disconnect() Promise~void~
        +callTool(name, args) Promise~McpCallResult~
    }

    class McpStatus {
        <<enumeration>>
        disconnected
        connecting
        connected
        error
    }

    McpStore "1" --> "1" McpConfig
    McpStore "1" --> "*" McpToolDef
    McpStore "1" *-- "*" McpToolGroup
    McpStore --> McpStatus
    McpToolGroup "1" --> "*" McpToolDef : toolNames reference
```

---

## 7. Maszyna stanów symulacji

```mermaid
stateDiagram-v2
    [*] --> Idle : initial

    Idle --> Running : start()
    Running --> Paused : pause()
    Paused --> Running : resume()
    Running --> Idle : stop()
    Paused --> Idle : stop()

    Running --> PipelineRunning : runPipelineLLM()
    PipelineRunning --> PipelineRunning : agent N done → agent N+1
    PipelineRunning --> Running : all agents done
    PipelineRunning --> Running : stopPipeline() / abort

    Running --> StepMode : nextStep()
    StepMode --> StepMode : nextStep()
    StepMode --> Idle : stop()

    note right of PipelineRunning
        isPipelineRunning = true
        agentResults accumulate
        LLM calls via llmService
        VFS writes per agent output
    end note

    note right of Idle
        messages = []
        completedPhases = []
        step = 0
    end note
```

---

## 8. Cykl życia scenariusza

```mermaid
stateDiagram-v2
    [*] --> EmptyCanvas

    EmptyCanvas --> PopulatedCanvas : addNode() (drag from sidebar)
    PopulatedCanvas --> PopulatedCanvas : moveNode() / addConnection() / removeNode()

    PopulatedCanvas --> PopulatedCanvas : replaceGraph()\n← via scenarioStore only

    PopulatedCanvas --> SavedScenario : saveScenario(name)\n→ presetStore.saveConfig()

    SavedScenario --> PopulatedCanvas : restoreScenario(name)\n→ canvasStore.replaceGraph()

    SavedScenario --> [*] : deleteScenario(name)

    EmptyCanvas --> PopulatedCanvas : loadPresetScenario(preset)\npresetToGraph() → replaceGraph()

    PopulatedCanvas --> EmptyCanvas : clearCanvas()

    note right of SavedScenario
        Persisted in localStorage
        key: acV33_custom
        includes: nodes, connections, version
    end note
```

---

## 9. Model kosztów i kontekstu

```mermaid
classDiagram
    class CostResult {
        +p50: number
        +p90: number
        +tokIn: number
        +tokOut: number
    }

    class CtxResult {
        +used: number
        +window: number
        +pct: number
    }

    class ModelCosts {
        +i: number
        +o: number
        +cr: number
        +cw: number
    }

    class CostSummary {
        +p50: number
        +p90: number
        +p50Fmt: string
        +p90Fmt: string
        +tokIn: number
        +tokOut: number
        +modelMix: Record~ModelType, number~
        +severity: CostSeverity
        +perAgent: AgentCostEntry[]
    }

    class CtxSummary {
        +maxPct: number
        +maxAgentId: string
        +overTargetCount: number
        +avgPct: number
        +severity: CostSeverity
        +perAgent: AgentCtxEntry[]
    }

    class CostSeverity {
        <<enumeration>>
        safe
        warn
        high
        danger
    }

    CostSummary --> CostSeverity
    CtxSummary --> CostSeverity
    CostSummary "1" *-- "*" AgentCostEntry
    CtxSummary "1" *-- "*" AgentCtxEntry
    ModelCosts --> ModelType
```

---

## 10. Powiązania między warstwami danych a domeną

```mermaid
erDiagram
    AGENT_DEF {
        string id PK
        string name
        string phase
        string model
        string category
        string icon
        string prompt
    }

    CANVAS_NODE {
        string id PK
        string agentId FK
        number x
        number y
    }

    CONNECTION {
        string from FK
        string to FK
    }

    SAVED_CONFIG {
        string name PK
        string version
    }

    PRESET_DEF {
        string id PK
        string name
        string cat
        string tier
    }

    CUSTOM_AGENT {
        string id PK
        boolean isCustom
        string iconRef
    }

    AGENT_DEF ||--o{ CANVAS_NODE : "instantiated as"
    CANVAS_NODE ||--o{ CONNECTION : "source of"
    CANVAS_NODE ||--o{ CONNECTION : "target of"
    SAVED_CONFIG ||--o{ CANVAS_NODE : "snapshots"
    SAVED_CONFIG ||--o{ CONNECTION : "snapshots"
    PRESET_DEF ||--o{ CANVAS_NODE : "generates via presetToGraph"
    CUSTOM_AGENT ||--o| AGENT_DEF : "extends"
```
