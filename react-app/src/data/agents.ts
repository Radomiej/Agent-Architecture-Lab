import type { Agent, Phase, PresetCategory } from '../types'

export const AD: Agent[] = [
  // STRATEGIA
  {
    cat: 'STRATEGIA', id: 'orchestrator', name: 'Orkiestrator', icon: '⚔️', color: 'am',
    model: 'opus', load: 50, phase: 'strategy' as Phase,
    role: 'Centralny punkt decyzyjny calego systemu agentow. Analizuje zadanie, dekomponuje na podzadania i deleguje do specjalistow...',
    tools: 'Agent, Read/Write, Bash, TaskCreate',
    prompt: 'ROLA: Jestes Master Orkiestratorem - centralnym punktem decyzyjnym systemu agentow...',
  },
  {
    cat: 'STRATEGIA', id: 'synthesizer', name: 'Synthesizer', icon: '🔮', color: 'vi',
    model: 'opus', load: 40, phase: 'strategy' as Phase,
    role: 'Laczy wyniki wszystkich agentow w spojny, kompletny output. Usuwa sprzecznosci i duplikaty...',
    tools: 'Read/Write, Agent',
    prompt: 'ROLA: Jestes Synthesizerem - ekspertem od integracji i syntezy wynikow wieloagentowych...',
  },
  // PLANOWANIE
  {
    cat: 'PLANOWANIE', id: 'analyst', name: 'Analityk', icon: '📊', color: 'bl',
    model: 'sonnet', load: 30, phase: 'strategy' as Phase,
    role: 'Dekomponuje problem na mierzalne komponenty. Identyfikuje zaleznosci i ryzyka...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes Analitykiem - specjalista od dekompozycji i analizy wymagan...',
  },
  {
    cat: 'PLANOWANIE', id: 'planner', name: 'Planner', icon: '🗺️', color: 'bl',
    model: 'sonnet', load: 25, phase: 'strategy' as Phase,
    role: 'Tworzy plan fazowy projektu. Definiuje kamienie milowe, zalenosci i optymalny workflow...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Plannerem - ekspertem od planowania i roadmap projektowych...',
  },
  // RESEARCH
  {
    cat: 'RESEARCH', id: 'res_tech', name: 'Tech Researcher', icon: '💻', color: 'cy',
    model: 'haiku', load: 20, phase: 'research' as Phase,
    role: 'Researches technical documentation, APIs, frameworks and best practices...',
    tools: 'WebSearch, Read/Write',
    prompt: 'ROLA: Jestes Tech Researcherem - specjalista od researchu technicznego...',
  },
  {
    cat: 'RESEARCH', id: 'res_ux', name: 'UX Researcher', icon: '🎨', color: 'ro',
    model: 'haiku', load: 20, phase: 'research' as Phase,
    role: 'Bada wzorce UX, trendy designu, best practices dostepnosci i doswiadczenia uzytkownika...',
    tools: 'WebSearch, Read/Write',
    prompt: 'ROLA: Jestes UX Researcherem - specjalista od wzorcow interfejsow uzytkownika...',
  },
  {
    cat: 'RESEARCH', id: 'res_reddit', name: 'Reddit Researcher', icon: '💬', color: 'am',
    model: 'haiku', load: 15, phase: 'research' as Phase,
    role: 'Przeszukuje Reddit i fora spolecznosciowe w poszukiwaniu opinii uzytkownikow...',
    tools: 'WebSearch',
    prompt: 'ROLA: Jestes Reddit Researcherem - specjalista od analizy opinii spolecznosciowych...',
  },
  {
    cat: 'RESEARCH', id: 'res_x', name: 'X/Twitter Researcher', icon: '🐦', color: 'cy',
    model: 'haiku', load: 15, phase: 'research' as Phase,
    role: 'Monitoruje dyskusje na X/Twitter w poszukiwaniu trendow i opinii ekspertow...',
    tools: 'WebSearch',
    prompt: 'ROLA: Jestes X Researcherem - specjalista od analizy trendow na platformach spolecznosciowych...',
  },
  {
    cat: 'RESEARCH', id: 'res_github', name: 'GitHub Researcher', icon: '🔗', color: 'am',
    model: 'haiku', load: 15, phase: 'research' as Phase,
    role: 'Analizuje repozytoria GitHub, issues, PRy i dyskusje spolecznosci open source...',
    tools: 'WebSearch, Bash',
    prompt: 'ROLA: Jestes GitHub Researcherem - specjalista od analizy ekosystemu open source...',
  },
  {
    cat: 'RESEARCH', id: 'res_forums', name: 'Forums Researcher', icon: '🗣️', color: 'bl',
    model: 'haiku', load: 15, phase: 'research' as Phase,
    role: 'Przeszukuje fora techniczne (Stack Overflow, HN, Dev.to) w poszukiwaniu rozwizan...',
    tools: 'WebSearch',
    prompt: 'ROLA: Jestes Forums Researcherem - specjalista od researchu na forach technicznych...',
  },
  {
    cat: 'RESEARCH', id: 'res_docs', name: 'Docs Researcher', icon: '📚', color: 'bl',
    model: 'haiku', load: 20, phase: 'research' as Phase,
    role: 'Analizuje oficjalna dokumentacje, RFC, specyfikacje i changelogi...',
    tools: 'WebSearch, Read/Write',
    prompt: 'ROLA: Jestes Docs Researcherem - specjalista od analizy oficjalnej dokumentacji...',
  },
  {
    cat: 'RESEARCH', id: 'res_critic', name: 'Research Critic', icon: '🔍', color: 'ro',
    model: 'sonnet', load: 25, phase: 'research' as Phase,
    role: 'Krytycznie ocenia wyniki innych researcherow. Identyfikuje luki, sprzecznosci i bias...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Research Criticiem - ekspertem od walidacji i krytycznej oceny researchu...',
  },
  // BUILD
  {
    cat: 'BUILD', id: 'backend', name: 'Backend Dev', icon: '🖥️', color: 'cy',
    model: 'sonnet', load: 60, phase: 'build' as Phase,
    role: 'Implementuje logike serwera, API, bazy danych i integracje backendowe...',
    tools: 'Read/Write, Bash, Agent',
    prompt: 'ROLA: Jestes Backend Developerem - ekspertem od implementacji logiki serwera...',
  },
  {
    cat: 'BUILD', id: 'frontend', name: 'Frontend Dev', icon: '🌐', color: 'bl',
    model: 'sonnet', load: 60, phase: 'build' as Phase,
    role: 'Implementuje interfejs uzytkownika, komponenty React i integracje z API...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes Frontend Developerem - ekspertem od implementacji interfejsow uzytkownika...',
  },
  {
    cat: 'BUILD', id: 'feature', name: 'Feature Dev', icon: '✨', color: 'vi',
    model: 'sonnet', load: 50, phase: 'build' as Phase,
    role: 'Implementuje konkretne funkcjonalnosci i integruje nowe cechy do istniejacego kodu...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes Feature Developerem - specjalista od implementacji nowych funkcjonalnosci...',
  },
  {
    cat: 'BUILD', id: 'designer', name: 'Designer', icon: '🎭', color: 'ro',
    model: 'sonnet', load: 35, phase: 'build' as Phase,
    role: 'Projektuje UI/UX, tworzy design system, komponenty wizualne i style...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Designerem - ekspertem od projektowania interfejsow i doswiadczenia uzytkownika...',
  },
  {
    cat: 'BUILD', id: 'integrator', name: 'Integrator', icon: '🔗', color: 'cy',
    model: 'sonnet', load: 45, phase: 'build' as Phase,
    role: 'Laczy wszystkie komponenty systemu. Zapewnia spojnosc interfejsow i komunikacje miedzy modulami...',
    tools: 'Read/Write, Bash, Agent',
    prompt: 'ROLA: Jestes Integratorem - specjalista od laczenia komponentow i integracji systemow...',
  },
  {
    cat: 'BUILD', id: 'writer', name: 'Writer', icon: '✍️', color: 'am',
    model: 'sonnet', load: 30, phase: 'build' as Phase,
    role: 'Tworzy dokumentacje techniczna, README, komentarze i tresci dla uzytkownikow...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Writerem - ekspertem od tworzenia dokumentacji i tresci technicznych...',
  },
  // QA
  {
    cat: 'QA', id: 'qa_security', name: 'QA Security', icon: '🔒', color: 'ro',
    model: 'sonnet', load: 40, phase: 'qa' as Phase,
    role: 'Przeprowadza audyt bezpieczenstwa kodu. Identyfikuje podatnosci, XSS, SQL injection...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes QA Security - ekspertem od audytu bezpieczenstwa aplikacji...',
  },
  {
    cat: 'QA', id: 'qa_quality', name: 'QA Quality', icon: '✅', color: 'cy',
    model: 'sonnet', load: 40, phase: 'qa' as Phase,
    role: 'Testuje jakosc kodu, pokrycie testami, edge cases i regresje...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes QA Quality - ekspertem od zapewnienia jakosci i testowania...',
  },
  {
    cat: 'QA', id: 'qa_perf', name: 'QA Performance', icon: '⚡', color: 'am',
    model: 'sonnet', load: 35, phase: 'qa' as Phase,
    role: 'Profiluje wydajnosc aplikacji. Identyfikuje bottlenecki i optymalizuje kluczowe sciezki...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes QA Performance - ekspertem od testowania i optymalizacji wydajnosci...',
  },
  {
    cat: 'QA', id: 'qa_manager', name: 'QA Manager', icon: '📋', color: 'bl',
    model: 'haiku', load: 25, phase: 'qa' as Phase,
    role: 'Koordynuje prace QA, kompiluje raporty z testow i wydaje rekomendacje GO/NO-GO...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes QA Managerem - koordynatorem procesu zapewnienia jakosci...',
  },
  // FIVE MINDS
  {
    cat: 'FIVE MINDS', id: 'expert_pragmatist', name: 'Pragmatist', icon: '🔧', color: 'am',
    model: 'sonnet', load: 30, phase: 'debate1' as Phase,
    role: 'Reprezentuje perspektywe praktyczna i wykonalna. "Czy to da sie zrobic w rozumnym czasie?"',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Pragmatystem w debacie Five Minds - ekspertem od oceny wykonalnosci...',
  },
  {
    cat: 'FIVE MINDS', id: 'expert_innovator', name: 'Innovator', icon: '💡', color: 'cy',
    model: 'sonnet', load: 30, phase: 'debate1' as Phase,
    role: 'Representuje perspektywe innowacyjna i kreatywna. Proponuje niekonwencjonalne rozwiazania...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Innowatorem w debacie Five Minds - ekspertem od kreatywnych rozwiazania...',
  },
  {
    cat: 'FIVE MINDS', id: 'expert_analyst', name: 'Analyst Expert', icon: '📈', color: 'bl',
    model: 'sonnet', load: 30, phase: 'debate1' as Phase,
    role: 'Reprezentuje perspektywe analityczna i danych. Wymaga dowodow i mierzalnych wynikow...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Analitykiem Eksperckim w debacie Five Minds - ekspertem od analizy...',
  },
  {
    cat: 'FIVE MINDS', id: 'expert_user', name: 'User Advocate', icon: '👤', color: 'ro',
    model: 'sonnet', load: 30, phase: 'debate1' as Phase,
    role: 'Reprezentuje perspektywe uzytkownika koncowego. Zadaje: "Czy to rozwieze problem uzytkownika?"',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Adwokatem Uzytkownika w debacie Five Minds...',
  },
  {
    cat: 'FIVE MINDS', id: 'expert_devil', name: "Devil's Advocate", icon: '😈', color: 'ro',
    model: 'opus', load: 35, phase: 'debate2' as Phase,
    role: 'Aktywnie kontestuje wszystkie propozycje. Szuka dziur, sprzecznosci i ukrytych zalozen...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Devils Advocate - krytycznym przeciwnikiem kazdej propozycji...',
  },
  // HITL
  {
    cat: 'HITL', id: 'decision_presenter', name: 'Decision Presenter', icon: '🎯', color: 'mu',
    model: 'haiku', load: 10, phase: 'hitl' as Phase,
    role: 'Prezentuje opcje decyzyjne uzytkownikowi w ustrukturyzowany sposob. Zbiera wybory HITL...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Decision Presenterem - specjalista od prezentacji opcji decyzyjnych...',
  },
  // V32.6: 7 new built-in agents
  {
    cat: 'BUILD', id: 'db_architect', name: 'DB Architect', icon: '🗄️', color: 'bl',
    model: 'sonnet', load: 45, phase: 'build' as Phase,
    role: 'Projektuje schematy baz danych, indeksy i migracje. Specjalista od zero-downtime migrations...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes DB Architektem - ekspertem od projektowania i optymalizacji baz danych...',
  },
  {
    cat: 'BUILD', id: 'observability_engineer', name: 'Observability Eng.', icon: '📡', color: 'cy',
    model: 'sonnet', load: 40, phase: 'build' as Phase,
    role: 'Implementuje observability (metrics, logs, traces). Definiuje SLI/SLO i alerty...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes Observability Engineerem - ekspertem od trzech filarow obserwowalnosci...',
  },
  {
    cat: 'BUILD', id: 'gtm_strategist', name: 'GTM Strategist', icon: '📣', color: 'ro',
    model: 'sonnet', load: 30, phase: 'build' as Phase,
    role: 'Tworzy strategie go-to-market. Definiuje ICP, pozycjonowanie, pricing i plan launchu...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes GTM Strategistem - ekspertem od strategii wejscia na rynek...',
  },
  {
    cat: 'BUILD', id: 'statistician', name: 'Statistician', icon: '📊', color: 'vi',
    model: 'sonnet', load: 25, phase: 'build' as Phase,
    role: 'Projektuje eksperymenty statystyczne. Wybiera testy, oblicza power i analizuje wyniki...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes Statystykiem - ekspertem od projektowania eksperymentow i analizy statystycznej...',
  },
  {
    cat: 'BUILD', id: 'eda_analyst', name: 'EDA Analyst', icon: '🔬', color: 'cy',
    model: 'sonnet', load: 45, phase: 'build' as Phase,
    role: 'Przeprowadza exploratory data analysis. Profiluje dane, wykrywa anomalie i korelacje...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes EDA Analitykiem - ekspertem od eksploracyjnej analizy danych...',
  },
  {
    cat: 'BUILD', id: 'control_mapper', name: 'Control Mapper', icon: '🗺️', color: 'am',
    model: 'sonnet', load: 35, phase: 'build' as Phase,
    role: 'Mapuje wymagania compliance (GDPR, SOC2, ISO27001, HIPAA) na kontrole i luki...',
    tools: 'Read/Write',
    prompt: 'ROLA: Jestes Control Mapperem - ekspertem od mapowania wymagan compliance...',
  },
  {
    cat: 'BUILD', id: 'telemetry_surfer', name: 'Telemetry Surfer', icon: '🌊', color: 'am',
    model: 'sonnet', load: 35, phase: 'build' as Phase,
    role: 'Surfuje po telemetrii produkcyjnej. Pisze reprodukowalne PromQL/LogQL queries...',
    tools: 'Read/Write, Bash',
    prompt: 'ROLA: Jestes Telemetry Surferem - ekspertem od analizy telemetrii produkcyjnej...',
  },
]

export const AD_MAP = new Map<string, Agent>(AD.map(a => [a.id, a]))

export const PHASES = [
  { id: 'strategy', label: 'Strategia', color: '#5B8DEF' },
  { id: 'research', label: 'Research', color: '#22C4E6' },
  { id: 'debate1', label: 'Debata #1', color: '#A78BFA' },
  { id: 'build', label: 'Build', color: '#34D399' },
  { id: 'debate2', label: 'Debata #2', color: '#A78BFA' },
  { id: 'qa', label: 'QA', color: '#F87171' },
  { id: 'hitl', label: 'HITL', color: '#FBBF24' },
]

export const PCAT: PresetCategory[] = [
  { name: 'MICRO (2-3)', ids: ['solo', 'quick_fix', 'recon', 'trio', 'reflect'] },
  { name: 'SREDNIE (4-8)', ids: ['bug_hunt', 'content', 'plan_exec', 'perf_boost', 'startup', 'cascade', 'test_suite', 'a11y', 'ab_test_lab', 'tech_writing_pipe', 'perf_squad'] },
  { name: 'DUZE (9-12)', ids: ['security', 'review', 'design_sys', 'api_modern', 'ui_overhaul', 'feature_sprint', 'standard', 'data_pipe', 'research', 'legacy', 'saas', 'deep_research_swarm_pro', 'migration_crew', 'fullstack_premium', 'security_multi_vector', 'prd_to_launch', 'kb_constructor', 'soc2_sweep', 'data_analysis_pipe', 'incident_war_room'] },
  { name: 'ENTERPRISE (13+)', ids: ['microservices', 'full', 'deep', 'five_minds', 'deep_five_minds', 'five_minds_strategic'] },
]
