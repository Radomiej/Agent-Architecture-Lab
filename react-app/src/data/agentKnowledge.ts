import type { AgentKnowledge, PresetKnowledge } from '../types'

export const AGENT_KNOWLEDGE: Record<string, AgentKnowledge> = {
  orchestrator: {
    who: 'Master Orkiestrator - centralny punkt decyzyjny calego systemu agentow',
    analogy: 'Jak dyrygent orkiestry - nie gra na zadnym instrumencie, ale decyduje o wszystkim',
    does: [
      'Dekomponuje zadanie na podzadania',
      'Deleguje prace do specjalistow',
      'Kontroluje bramy miedzy fazami (GO/NO-GO)',
      'Rozwiazuje konflikty miedzy agentami',
    ],
    doesNot: [
      'Nie generuje tresci bezposrednio',
      'Nie wykonuje kodu samodzielnie',
      'Nie zastepuje specjalistow',
    ],
    antiPatterns: [
      'Mikrozarzadzanie - kazda decyzja przez orchestratora spowalnia pipeline',
      'Brak GO/NO-GO - bez bram kontrolnych pipeline sie rozjeznie',
    ],
    facts: [
      'Uzywa modelu Opus dla najlepszego rozumowania',
      'Jedyny agent z dostepem do TaskCreate',
      'Kosztuje ~$0.37 per run (p50)',
    ],
  },
  synthesizer: {
    who: 'Synthesizer - ekspert od integracji i syntezy wynikow wieloagentowych',
    analogy: 'Jak redaktor naczelny - bierze artykuly od dziennikarzy i tworzy spojny magazyn',
    does: [
      'Laczy wyniki wszystkich agentow',
      'Usuwa sprzecznosci i duplikaty',
      'Tworzy spolny finalny output',
      'Waliduje spojnosc narracyjna',
    ],
    doesNot: [
      'Nie generuje nowej tresci od zera',
      'Nie zastepuje specjalistycznych agentow',
      'Nie przeprowadza researchu',
    ],
    antiPatterns: [
      'Uzywanie synthesizera zamiast specjalisty',
      'Brak wyjatku Opus - synteza wymaga najlepszego rozumowania',
    ],
    facts: [
      'Najwieksze okno kontekstowe - 80k tokenow input',
      'Zawsze Opus - nie oszczedzaj na syntezie',
      'Kosztuje ~$0.65 per run (p50)',
    ],
  },
  analyst: {
    who: 'Analityk - specjalista od dekompozycji i analizy wymagan',
    analogy: 'Jak inzynier wymagań - zamienia mglisty cel w mierzalne komponenty',
    does: [
      'Dekomponuje problem na komponenty',
      'Identyfikuje zaleznosci i ryzyka',
      'Tworzy macierz wymagan',
      'Definiuje kryteria sukcesu',
    ],
    doesNot: [
      'Nie pisze kodu',
      'Nie przeprowadza researchu rynkowego',
      'Nie podejmuje decyzji architekturalnych',
    ],
    antiPatterns: [
      'Zbyt szczegolowa analiza - paralysis by analysis',
      'Pomijanie ryzyk technicznych',
    ],
    facts: [
      'Uzywa Sonnet - balans miedzy jakoscia a kosztem',
      'Input 50k tokenow - czyta caly kontekst projektu',
    ],
  },
  planner: {
    who: 'Planner - ekspert od planowania i roadmap projektowych',
    analogy: 'Jak kierownik projektu - zamienia analize w wykonywalny plan',
    does: [
      'Tworzy plan fazowy projektu',
      'Definiuje kamienie milowe',
      'Optymalizuje kolejnosc zadan',
      'Identyfikuje sciezke krytyczna',
    ],
    doesNot: [
      'Nie szacuje budzetu finansowego',
      'Nie zarzadza zasobami ludzkimi',
      'Nie pisze kodu',
    ],
    antiPatterns: [
      'Waterfall zamiast iteracyjnego planowania',
      'Zbyt duzo faz - overhead komunikacji',
    ],
    facts: [
      'Output 8k tokenow - szczegolowe plany fazowe',
      'Uzywa Sonnet - wystarczajacy dla planowania',
    ],
  },
  res_tech: {
    who: 'Tech Researcher - specjalista od researchu technicznego i dokumentacji',
    analogy: 'Jak bibliotekarz techniczny - znajdzie dokumentacje do kazdej technologii',
    does: [
      'Przeszukuje dokumentacje techniczna',
      'Analizuje API i frameworki',
      'Zbiera best practices',
      'Raportuje ze wskazaniem pewnosci [CERTAIN/PROBABLE/SPECULATION]',
    ],
    doesNot: [
      'Nie ocenia biznesowej wartosci technologii',
      'Nie testuje kodu',
      'Nie porownuje technologii miedzy soba (to rola res_critic)',
    ],
    antiPatterns: [
      'Brak isolation - researchers nie powinni widziec swoich wynikow',
      'Spekulowanie bez wskazania [SPECULATION]',
    ],
    facts: [
      'Uzywa Haiku - szybki i tani dla researchu',
      'Input 35k - wystarczajacy dla kontekstu projektu',
    ],
  },
}

export const PRESET_KNOWLEDGE: Record<string, PresetKnowledge> = {
  solo: {
    who: 'Solo + Validator - najprostszy pipeline: jeden worker z petla walidacyjna',
    analogy: 'Jak freelancer z code review - robi wszystko sam, ale sprawdza swoja prace',
    whenToUse: [
      'Proste, dobrze zdefiniowane zadania',
      'Szybkie prototypy i eksperymenty',
      'Kiedy budzet jest kluczowy',
    ],
    whenNotToUse: [
      'Zlozzone systemy wymagajace specjalizacji',
      'Zadania wymagajace researchu rynkowego',
      'Projekty z wieloma interesariuszami',
    ],
    keyFeatures: [
      'Orkiestrator + jeden worker',
      'Wbudowana petla walidacyjna',
      'Najnizszy koszt ze wszystkich presetow',
    ],
  },
  deep_five_minds: {
    who: 'Deep Five Minds Ultimate - najciezszy preset: deep research + podwojna debata Five Minds',
    analogy: 'Jak think tank z wariantem adversarialnym - 24 agentow, 5 punktow HITL',
    whenToUse: [
      'Krytyczne decyzje architekturalne',
      'Projekty o wysokim ryzyku i duzym budzecie',
      'Kiedy potrzebujesz najlepszeej mozliwej analizy',
    ],
    whenNotToUse: [
      'Szybkie zadania - narzut jest ogromny',
      'Maly budzet',
      'Jasno zdefiniowane zadania bez niejednoznacznosci',
    ],
    keyFeatures: [
      '24 agentow w 5 fazach',
      'Podwojna debata Five Minds',
      '5 bram HITL',
      'Najwyzszy koszt - tylko dla krytycznych decyzji',
    ],
  },
}
