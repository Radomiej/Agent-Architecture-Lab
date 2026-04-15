/**
 * simulationStore — backward-compat barrel.
 *
 * The original God Store has been split into four focused stores:
 *   orchestrationStore    — phase/agent tracking + tool group resolution
 *   mockSimulationStore   — step-by-step demo state machine
 *   pipelineStore         — real LLM pipeline execution
 *   executionHistoryStore — messages, LLM logs, tool calls, debug panel
 *
 * Prefer importing from the specific stores. This file exists only for
 * backward compatibility while consumers are migrated.
 */

export { useOrchestrationStore } from './orchestrationStore'
export { useMockSimulationStore } from './mockSimulationStore'
export { usePipelineStore } from './pipelineStore'
export { useExecutionHistoryStore } from './executionHistoryStore'
