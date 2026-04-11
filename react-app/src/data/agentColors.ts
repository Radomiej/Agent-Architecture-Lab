export const AGENT_COLORS_DARK: Record<string, string> = {
  orchestrator: '#FBBF24', synthesizer: '#A78BFA',
  analyst: '#818CF8', planner: '#60A5FA',
  res_tech: '#22D3EE', res_ux: '#F472B6', res_reddit: '#FB923C', res_x: '#38BDF8',
  res_github: '#A3E635', res_forums: '#818CF8', res_docs: '#94A3B8', res_critic: '#F87171',
  backend: '#34D399', frontend: '#60A5FA', feature: '#C084FC', designer: '#F472B6',
  integrator: '#2DD4BF', writer: '#FCD34D',
  qa_security: '#F87171', qa_quality: '#34D399', qa_perf: '#FB923C', qa_manager: '#818CF8',
  expert_pragmatist: '#FBBF24', expert_innovator: '#22D3EE', expert_analyst: '#60A5FA',
  expert_user: '#F472B6', expert_devil: '#EF4444',
  decision_presenter: '#E879F9',
  db_architect: '#60A5FA', observability_engineer: '#22D3EE', gtm_strategist: '#F472B6',
  statistician: '#A78BFA', eda_analyst: '#22D3EE', control_mapper: '#FBBF24', telemetry_surfer: '#FB923C',
}

export const AGENT_COLORS_LIGHT: Record<string, string> = {
  orchestrator: '#B45309', synthesizer: '#7C3AED',
  analyst: '#4F46E5', planner: '#2563EB',
  res_tech: '#0891B2', res_ux: '#DB2777', res_reddit: '#C2410C', res_x: '#0284C7',
  res_github: '#65A30D', res_forums: '#4F46E5', res_docs: '#64748B', res_critic: '#DC2626',
  backend: '#059669', frontend: '#2563EB', feature: '#9333EA', designer: '#DB2777',
  integrator: '#0D9488', writer: '#A16207',
  qa_security: '#DC2626', qa_quality: '#059669', qa_perf: '#C2410C', qa_manager: '#4F46E5',
  expert_pragmatist: '#B45309', expert_innovator: '#0891B2', expert_analyst: '#2563EB',
  expert_user: '#DB2777', expert_devil: '#B91C1C',
  decision_presenter: '#A21CAF',
  db_architect: '#2563EB', observability_engineer: '#0891B2', gtm_strategist: '#DB2777',
  statistician: '#7C3AED', eda_analyst: '#0891B2', control_mapper: '#B45309', telemetry_surfer: '#C2410C',
}

export const PRESET_COLORS_DARK: Record<string, string> = {
  solo: '#60A5FA', quick_fix: '#FB923C', recon: '#22D3EE', trio: '#34D399', reflect: '#A78BFA',
  bug_hunt: '#F87171', content: '#FCD34D', plan_exec: '#818CF8', perf_boost: '#FB923C',
  startup: '#FBBF24', cascade: '#2DD4BF', test_suite: '#F87171', a11y: '#C084FC',
  security: '#EF4444', review: '#60A5FA', design_sys: '#F472B6', api_modern: '#22D3EE',
  ui_overhaul: '#A78BFA', feature_sprint: '#34D399', standard: '#818CF8', data_pipe: '#2DD4BF',
  research: '#38BDF8', legacy: '#94A3B8', saas: '#60A5FA', microservices: '#C084FC',
  full: '#FBBF24', deep: '#22D3EE', five_minds: '#FCD34D', deep_five_minds: '#FBBF24',
  deep_research_swarm_pro: '#22D3EE', migration_crew: '#60A5FA', fullstack_premium: '#34D399',
  security_multi_vector: '#EF4444', perf_squad: '#FB923C', prd_to_launch: '#FBBF24',
  ab_test_lab: '#C084FC', kb_constructor: '#38BDF8', tech_writing_pipe: '#FCD34D',
  five_minds_strategic: '#FBBF24', soc2_sweep: '#2DD4BF', data_analysis_pipe: '#A78BFA',
  incident_war_room: '#F87171',
}

export const PRESET_COLORS_LIGHT: Record<string, string> = {
  solo: '#2563EB', quick_fix: '#C2410C', recon: '#0891B2', trio: '#059669', reflect: '#7C3AED',
  bug_hunt: '#DC2626', content: '#A16207', plan_exec: '#4F46E5', perf_boost: '#C2410C',
  startup: '#B45309', cascade: '#0D9488', test_suite: '#DC2626', a11y: '#9333EA',
  security: '#B91C1C', review: '#2563EB', design_sys: '#DB2777', api_modern: '#0891B2',
  ui_overhaul: '#7C3AED', feature_sprint: '#059669', standard: '#4F46E5', data_pipe: '#0D9488',
  research: '#0284C7', legacy: '#64748B', saas: '#2563EB', microservices: '#9333EA',
  full: '#B45309', deep: '#0891B2', five_minds: '#A16207', deep_five_minds: '#B45309',
  deep_research_swarm_pro: '#0891B2', migration_crew: '#2563EB', fullstack_premium: '#059669',
  security_multi_vector: '#B91C1C', perf_squad: '#C2410C', prd_to_launch: '#B45309',
  ab_test_lab: '#9333EA', kb_constructor: '#0284C7', tech_writing_pipe: '#A16207',
  five_minds_strategic: '#B45309', soc2_sweep: '#0D9488', data_analysis_pipe: '#7C3AED',
  incident_war_room: '#DC2626',
}

export const CUSTOM_COLOR_MAP: Record<string, { dark: string; light: string; name: string }> = {
  am: { dark: '#FBBF24', light: '#B45309', name: 'Gold' },
  cy: { dark: '#22D3EE', light: '#0891B2', name: 'Cyan' },
  bl: { dark: '#60A5FA', light: '#2563EB', name: 'Blue' },
  vi: { dark: '#A78BFA', light: '#7C3AED', name: 'Violet' },
  ro: { dark: '#F87171', light: '#DC2626', name: 'Red' },
  mu: { dark: '#E879F9', light: '#A21CAF', name: 'Magenta' },
}

export const CUSTOM_DEFAULT_SVG = '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'

export function getAgentColor(id: string, theme: 'dark' | 'light'): string {
  const map = theme === 'light' ? AGENT_COLORS_LIGHT : AGENT_COLORS_DARK
  return map[id] ?? (theme === 'light' ? '#4F46E5' : '#818CF8')
}

export function getPresetColor(id: string, theme: 'dark' | 'light'): string {
  const map = theme === 'light' ? PRESET_COLORS_LIGHT : PRESET_COLORS_DARK
  return map[id] ?? (theme === 'light' ? '#4F46E5' : '#818CF8')
}
