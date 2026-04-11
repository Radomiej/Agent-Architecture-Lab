export const AGENT_SVG: Record<string, string> = {
  orchestrator: '<path d="M4 17l2.5-6 2.5 3.5L12 4l3 10.5 2.5-3.5L20 17"/><path d="M4 20h16"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/>',
  synthesizer: '<path d="M12 3l5 7.5H7z"/><path d="M7 10.5L3.5 19"/><path d="M12 10.5V21"/><path d="M17 10.5l3.5 8.5"/><circle cx="3.5" cy="19" r="1.5" fill="currentColor"/><circle cx="12" cy="21" r="1.5" fill="currentColor"/><circle cx="20.5" cy="19" r="1.5" fill="currentColor"/>',
  analyst: '<path d="M3 21h18"/><path d="M3 21V5"/><circle cx="7" cy="16" r="1" fill="currentColor"/><circle cx="11" cy="11" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/><circle cx="18" cy="8" r="1" fill="currentColor"/><circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="14" cy="7" r="1" fill="currentColor"/>',
  planner: '<path d="M5 20c3-3 3-6 0-9s-3-6 0-9"/><path d="M19 4c-3 3-3 6 0 9s3 6 0 9"/><circle cx="5" cy="20" r="1.5" fill="currentColor"/><circle cx="19" cy="4" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  res_tech: '<rect x="3" y="3" width="18" height="14" rx="2.5"/><path d="M7 9l3 3-3 3"/><path d="M13 14h5"/><path d="M8 20h8"/><path d="M12 17v3"/>',
  res_ux: '<path d="M2 12c0-5.5 4.5-8.5 10-8.5S22 6.5 22 12s-4.5 8.5-10 8.5S2 17.5 2 12z"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M12 3v2M12 19v2"/>',
  res_reddit: '<path d="M5 16l1.5-2h10a2.5 2.5 0 002.5-2.5V7A2.5 2.5 0 0016.5 4.5h-9A2.5 2.5 0 005 7v6"/><circle cx="9.5" cy="9" r="1.2" fill="currentColor"/><circle cx="14.5" cy="9" r="1.2" fill="currentColor"/><path d="M9.5 12a3.5 3.5 0 005 0"/>',
  res_x: '<path d="M4 4l7.5 8.5L4 21"/><path d="M20 4l-7.5 8.5L20 21"/>',
  res_github: '<circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 6v12"/><path d="M18 10v1a4 4 0 01-4 4H6"/>',
  res_forums: '<path d="M4 4h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M12 4v14"/><path d="M6 8h3M6 11h3M6 14h2M15 8h3M15 11h3M15 14h2"/><path d="M7 21h10"/>',
  res_docs: '<path d="M7 2h8l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M15 2v5h5"/><path d="M9 10h6M9 13h6M9 16h4"/>',
  res_critic: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M10.5 7.5v6M7.5 10.5h6"/>',
  backend: '<rect x="4" y="2" width="16" height="5" rx="2"/><rect x="4" y="9.5" width="16" height="5" rx="2"/><rect x="4" y="17" width="16" height="5" rx="2"/><circle cx="7.5" cy="4.5" r="1" fill="currentColor"/><circle cx="7.5" cy="12" r="1" fill="currentColor"/><circle cx="7.5" cy="19.5" r="1" fill="currentColor"/><path d="M14 4.5h3M14 12h3M14 19.5h3" opacity=".3"/>',
  frontend: '<rect x="2.5" y="3" width="19" height="17" rx="2.5"/><path d="M2.5 8h19"/><circle cx="5.5" cy="5.5" r=".8" fill="currentColor"/><circle cx="8" cy="5.5" r=".8" fill="currentColor"/><circle cx="10.5" cy="5.5" r=".8" fill="currentColor"/><rect x="5" y="11" width="6" height="6" rx="1" opacity=".3"/><path d="M14 11h5M14 14h3.5M14 17h4.5"/>',
  feature: '<line x1="4" y1="20" x2="15" y2="9"/><path d="M14 8l2-2 2 2-2 2z"/><path d="M19 4l.5 1.5L21 6l-1.5.5L19 8l-.5-1.5L17 6l1.5-.5z" fill="currentColor"/><path d="M6 4l.5 1.5L8 6l-1.5.5L6 8l-.5-1.5L4 6l1.5-.5z" fill="currentColor"/>',
  designer: '<path d="M12 3c-1 0-2 .5-2.5 1.5L4 20h3l1.5-3h7L17 20h3L14.5 4.5C14 3.5 13 3 12 3z"/><circle cx="12" cy="13" r="2.5"/><path d="M8.5 17h7"/>',
  integrator: '<path d="M10 14l4-4"/><path d="M13 6l1-1a4 4 0 015.5 5.5l-2 2"/><path d="M11 18l-1 1a4 4 0 01-5.5-5.5l2-2"/>',
  writer: '<path d="M17 3l4 4-12 12H5v-4L17 3z"/><path d="M14 6l4 4"/><path d="M5 19l1.5-1.5"/>',
  qa_security: '<path d="M12 2l8 4v5c0 5.5-3.5 10.5-8 12.5-4.5-2-8-7-8-12.5V6z"/><rect x="10" y="10" width="4" height="5" rx="1"/><circle cx="12" cy="9" r="2"/>',
  qa_quality: '<circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 3L16 9"/><path d="M12 3v1M12 20v1M3 12h1M20 12h1"/>',
  qa_perf: '<path d="M3 14a9 9 0 0118 0"/><path d="M12 14l3.5-6"/><circle cx="12" cy="14" r="2.5" fill="currentColor"/><path d="M5 18h2M17 18h2"/><path d="M7 8l1 1M17 8l-1 1"/>',
  qa_manager: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 1v4M15 1v4"/><path d="M8 10l2 2 4-4"/><path d="M9 15h6"/>',
  expert_pragmatist: '<path d="M15 3a4 4 0 00-3.5 6L3 17.5 6.5 21l8.5-8.5A4 4 0 0021 9l-3 3-3-3 3-3a4 4 0 00-3-3z"/><circle cx="5" cy="19" r=".8" fill="currentColor"/>',
  expert_innovator: '<path d="M9 21h6"/><path d="M10 18h4"/><path d="M12 2a7 7 0 00-4 12.7V18h8v-3.3A7 7 0 0012 2z"/><path d="M10 10l2 3 2-3"/>',
  expert_analyst: '<rect x="3" y="14" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/><path d="M5 12l7-5.5L19 2" stroke-dasharray="2 2" opacity=".4"/>',
  expert_user: '<circle cx="12" cy="7" r="4"/><path d="M5 21v-2c0-3 3.5-5.5 7-5.5s7 2.5 7 5.5v2"/><path d="M17 8.5l2.5 2-2.5 2" opacity=".6"/>',
  expert_devil: '<path d="M12 2c0 4-6 5.5-6 10.5a6 6 0 0012 0C18 7.5 12 6 12 2z"/><path d="M9.5 15c1.5 1.5 3.5 1.5 5 0"/><path d="M8 8.5l1.5 1M16 8.5l-1.5 1"/>',
  decision_presenter: '<path d="M3 3h18"/><path d="M12 3v6"/><circle cx="12" cy="10.5" r="2.5"/><path d="M12 13v1"/><path d="M12 14L6 21M12 14v7M12 14l6 7"/><circle cx="6" cy="21" r="1.5" fill="currentColor"/><circle cx="12" cy="21" r="1.5" fill="currentColor"/><circle cx="18" cy="21" r="1.5" fill="currentColor"/>',
  db_architect: '<ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M4 5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/><path d="M4 11v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/><path d="M4 17v2c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-2"/>',
  observability_engineer: '<path d="M3 12h3l2-6 4 12 2-8 2 4h5"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="14" r="1.5" fill="currentColor"/>',
  gtm_strategist: '<path d="M4 14l4-4 4 4 8-8"/><path d="M16 6h4v4"/><path d="M3 20h18"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/>',
  statistician: '<path d="M3 21V3"/><path d="M3 21h18"/><rect x="6" y="13" width="3" height="8"/><rect x="11" y="9" width="3" height="12"/><rect x="16" y="5" width="3" height="16"/><path d="M5 9c2-1 4-1 6 1s4 1 6-1 4-2 6-3" stroke-dasharray="2 2"/>',
  eda_analyst: '<circle cx="6" cy="6" r="1.5" fill="currentColor"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="14" cy="8" r="1.5" fill="currentColor"/><circle cx="17" cy="13" r="1.5" fill="currentColor"/><circle cx="13" cy="18" r="1.5" fill="currentColor"/><circle cx="19" cy="18" r="1.5" fill="currentColor"/><path d="M3 21V3"/><path d="M3 21h18"/>',
  control_mapper: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M6.5 7l1.5 1.5L11 5" stroke-width="1.5"/><path d="M17.5 7l1.5 1.5L22 5" stroke-width="1.5"/><path d="M6.5 18l1.5 1.5L11 16" stroke-width="1.5"/>',
  telemetry_surfer: '<path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0 2 1 2 1"/><path d="M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="5" cy="6" r="1.5" fill="currentColor"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/><circle cx="19" cy="6" r="1.5" fill="currentColor"/>',
}

export const PRESET_SVG: Record<string, string> = {
  solo: '<circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/>',
  quick_fix: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  recon: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/>',
  trio: '<circle cx="7" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><circle cx="12" cy="16" r="3"/><path d="M7 11l5 5M17 11l-5 5M10 8h4"/>',
  reflect: '<path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v6l4 2"/><path d="M6 12c0-3.3 2.7-6 6-6"/>',
  bug_hunt: '<path d="M8 2l1.5 1.5"/><path d="M14.5 3.5L16 2"/><path d="M9 7.5a5 5 0 016 0"/><path d="M12 7.5V20"/><path d="M7 11h10"/><path d="M5 15l7 2 7-2"/><circle cx="12" cy="5" r="2.5"/>',
  content: '<path d="M4 6h16M4 10h16M4 14h10M4 18h8"/><path d="M17 14l3 3-3 3"/>',
  plan_exec: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 4V2M16 4V2"/><path d="M7 13l2 2 4-4"/>',
  perf_boost: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/><path d="M5 20h14"/>',
  startup: '<path d="M12 2c-4 4-4 8 0 12s4 8 0 12"/><path d="M4 9c4-1 8-1 8 0v6c0 1-4 1-8 0"/><path d="M20 9c-4-1-8-1-8 0v6c0 1 4 1 8 0"/>',
  cascade: '<path d="M12 4v4M8 8v4M16 8v4M6 16h4M14 16h4"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/>',
  test_suite: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9l2 2 4-4"/><path d="M9 14h6"/><path d="M9 17h4"/>',
  a11y: '<circle cx="12" cy="12" r="9"/><path d="M9 12h6M12 9v6"/><path d="M6 6l3 3M18 6l-3 3M6 18l3-3M18 18l-3-3"/>',
  security: '<path d="M12 2l8 4v6c0 5-3.5 9.7-8 11.5C7.5 21.7 4 17 4 12V6z"/><path d="M9 12l2 2 4-4"/>',
  review: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/><path d="M9 16h4"/>',
  design_sys: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/>',
  api_modern: '<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M12 3v18"/><path d="M4 7l8 4 8-4"/>',
  ui_overhaul: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 8h20"/><circle cx="5" cy="5.5" r=".8" fill="currentColor"/><circle cx="8" cy="5.5" r=".8" fill="currentColor"/><path d="M8 17l3-3 2 2 3-4"/><path d="M2 17h20"/>',
  feature_sprint: '<path d="M4 15l4-8 4 5 3-3 4 6H4z"/>',
  standard: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  data_pipe: '<path d="M4 8h16"/><path d="M4 12h16"/><path d="M4 16h16"/><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="20" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="16" r="1.5" fill="currentColor"/>',
  research: '<circle cx="10" cy="10" r="7"/><path d="M15 15l5 5"/><path d="M10 7v6M7 10h6"/>',
  legacy: '<path d="M12 3v18"/><path d="M3 9h7"/><path d="M3 15h7"/><path d="M14 9h7"/><path d="M14 15h7"/>',
  saas: '<path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 15.25"/><path d="M8 16l4 4 4-4"/>',
  microservices: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h10M5 7v10M19 7v10M7 19h10"/>',
  full: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  deep: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>',
  five_minds: '<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z"/>',
  deep_five_minds: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><circle cx="12" cy="12" r="3"/>',
  deep_research_swarm_pro: '<circle cx="12" cy="12" r="2"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/><circle cx="12" cy="20" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="20" cy="12" r="1.5" fill="currentColor"/>',
  migration_crew: '<path d="M5 12h14M14 7l5 5-5 5"/><path d="M3 5v14"/>',
  fullstack_premium: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 8h20"/><path d="M8 17v4M16 17v4M5 21h14"/><path d="M7 12l2 2 4-4"/>',
  security_multi_vector: '<path d="M12 2l8 4v6c0 5-3.5 9.7-8 11.5C7.5 21.7 4 17 4 12V6z"/><circle cx="12" cy="11" r="3"/><path d="M8 19l4-4 4 4"/>',
  perf_squad: '<path d="M3 14a9 9 0 0118 0"/><path d="M12 14l3.5-6"/><circle cx="12" cy="14" r="2.5" fill="currentColor"/>',
  prd_to_launch: '<path d="M4 14l4-4 4 4 8-8"/><path d="M16 6h4v4"/><circle cx="4" cy="14" r="1.5" fill="currentColor"/>',
  ab_test_lab: '<path d="M4 20V4M20 20V4M12 4v16"/><path d="M4 10h8M12 14h8"/>',
  kb_constructor: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/><path d="M3 8h18"/>',
  tech_writing_pipe: '<path d="M12 3l4 4-12 12H0v-4L12 3z"/><path d="M9 6l4 4M18 8l4 4"/>',
  five_minds_strategic: '<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z"/><circle cx="12" cy="12" r="2"/>',
  soc2_sweep: '<path d="M12 2l8 4v6c0 5-3.5 9.7-8 11.5C7.5 21.7 4 17 4 12V6z"/><path d="M8 12l2 2 4-4"/><circle cx="12" cy="12" r="5"/>',
  data_analysis_pipe: '<path d="M4 8h16M4 12h16M4 16h16"/><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="20" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="16" r="1.5" fill="currentColor"/>',
  incident_war_room: '<path d="M12 2l8 4v10l-8 4-8-4V6z"/><path d="M12 6v10M6 9l6 3 6-3"/>',
}

export interface CustomIcon {
  id: string
  name: string
  path: string
}

export const CUSTOM_ICONS: Record<string, CustomIcon[]> = {
  strategy: [
    { id: 'crown', name: 'Crown', path: '<path d="M3 19h18"/><path d="M3 7l4 5 5-8 5 8 4-5v12H3z"/><circle cx="3" cy="7" r="1" fill="currentColor"/><circle cx="21" cy="7" r="1" fill="currentColor"/><circle cx="12" cy="4" r="1" fill="currentColor"/>' },
    { id: 'compass', name: 'Compass', path: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5L13 13l-4.5 2.5L11 11z"/><circle cx="12" cy="12" r="1" fill="currentColor"/>' },
    { id: 'roadmap', name: 'Roadmap', path: '<path d="M5 20c3-3 3-6 0-9s-3-6 0-9"/><path d="M19 4c-3 3-3 6 0 9s3 6 0 9"/><circle cx="5" cy="20" r="1.5" fill="currentColor"/><circle cx="19" cy="4" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>' },
  ],
  research: [
    { id: 'magnifier_plus', name: 'Magnifier Plus', path: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M10.5 7.5v6M7.5 10.5h6"/>' },
    { id: 'brain', name: 'Brain', path: '<path d="M12 4a3 3 0 00-3 3 3 3 0 00-3 5 3 3 0 002 5 3 3 0 004 2V4z"/><path d="M12 4a3 3 0 013 3 3 3 0 013 5 3 3 0 01-2 5 3 3 0 01-4 2V4z"/>' },
  ],
  engineering: [
    { id: 'cpu_chip', name: 'CPU Chip', path: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3"/>' },
    { id: 'wrench', name: 'Wrench', path: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>' },
  ],
}

const SVG_DEFAULTS = { size: 24, strokeWidth: 2, fill: 'none', linecap: 'round', linejoin: 'round' }

export function renderAgentSvg(id: string, size = SVG_DEFAULTS.size, color = 'currentColor'): string {
  const path = AGENT_SVG[id] ?? AGENT_SVG['analyst']
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${SVG_DEFAULTS.fill}" stroke="${color}" stroke-width="${SVG_DEFAULTS.strokeWidth}" stroke-linecap="${SVG_DEFAULTS.linecap}" stroke-linejoin="${SVG_DEFAULTS.linejoin}" aria-hidden="true">${path}</svg>`
}

export function renderPresetSvg(id: string, size = SVG_DEFAULTS.size, color = 'currentColor'): string {
  const path = PRESET_SVG[id] ?? PRESET_SVG['standard']
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${SVG_DEFAULTS.fill}" stroke="${color}" stroke-width="${SVG_DEFAULTS.strokeWidth}" stroke-linecap="${SVG_DEFAULTS.linecap}" stroke-linejoin="${SVG_DEFAULTS.linejoin}" aria-hidden="true">${path}</svg>`
}
