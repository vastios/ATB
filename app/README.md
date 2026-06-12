# ATB Combat Simulator

Applicazione web per simulare incontri di combattimento del sistema ATB (Active Time Battle).

## Sezioni

1. **Creazione PG** — Crea personaggi distribuendo 10 punti tra le 4 Caratteristiche (Istinto, Analisi, Evasione, Risonanza)
2. **Creazione Mostri** — Crea nemici di 3 tier (Base, Elite, Epico) con attacchi, tratti e attacchi speciali
3. **Tavolo di Gioco** — Simula il combattimento con Cintura ATB, pesca automatica, posizionamento carte e risoluzione

## Installazione

```bash
cd app
npm install
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`.

## Tecnologie

- Next.js 16
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand (state management)

## Struttura

```
src/
├── app/              # Next.js pages
├── components/       # React components
│   ├── ui/           # shadcn/ui components
│   ├── PGCreator.tsx
│   ├── MonsterCreator.tsx
│   ├── CombatSimulator.tsx
│   ├── ATBBelt.tsx
│   ├── CardDisplay.tsx
│   └── CombatLog.tsx
├── lib/              # Game logic
│   ├── types.ts      # Type definitions
│   ├── gameData.ts   # Constants & data
│   ├── gameEngine.ts # Combat engine
│   └── utils.ts      # Utility functions
└── store/            # State management
    └── gameStore.ts  # Zustand store
```
