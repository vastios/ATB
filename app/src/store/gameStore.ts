// ============================================================
// ATB RPG Combat Simulator - Zustand Store
// ============================================================

import { create } from 'zustand';
import {
  SavedPG, SavedMonster, PG, Monster, CombatState, CombatLogEntry,
  DamageResolution, CharacteristicKey
} from '@/lib/types';
import {
  initializePGForCombat, initializeMonsterForCombat,
  placeEnemyTokens, placeBossATBRow, resolveTick, cleanupRound,
  applyStandardDamageMilling, applyStandardDamageWound, generateId
} from '@/lib/gameEngine';

interface GameStore {
  // --- Saved Data ---
  savedPGs: SavedPG[];
  savedMonsters: SavedMonster[];

  // --- Combat State ---
  combatPGs: PG[];
  combatMonster: Monster | null;
  combatState: CombatState;

  // --- PG Management ---
  addPG: (pg: SavedPG) => void;
  removePG: (id: string) => void;
  loadPGs: () => void;

  // --- Monster Management ---
  addMonster: (monster: SavedMonster) => void;
  removeMonster: (id: string) => void;
  loadMonsters: () => void;

  // --- Combat Management ---
  startCombat: (pgIds: string[], monsterId: string) => void;
  endCombat: () => void;

  // Planning Phase
  playCardsForPG: (pgId: string, selectedCardIds: string[], faceUpCardIds: string[]) => void;
  placeEnemyTokensAction: () => void;
  placeBossATBAction: (powerLevel: number) => void;

  // Resolution Phase
  advanceTick: () => void;
  resolveDamage: (resolution: DamageResolution, choice: 'milling' | 'wound', woundCharacteristic?: CharacteristicKey) => void;

  // Cleanup
  performCleanup: () => void;

  // Combat Log
  addLogEntry: (entry: CombatLogEntry) => void;
  clearLog: () => void;

  // Active PG tracking for planning
  currentPlanningPgIndex: number;
  setNextPlanningPg: () => void;
}

const initialCombatState: CombatState = {
  phase: 'setup',
  round: 0,
  currentTick: 0,
  maxTick: 0,
  selectedPgIds: [],
  selectedMonsterId: null,
  combatLog: [],
  pendingDamageResolutions: [],
  activePgId: null,
  enemyTokensPlaced: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  savedPGs: [],
  savedMonsters: [],
  combatPGs: [],
  combatMonster: null,
  combatState: { ...initialCombatState },
  currentPlanningPgIndex: 0,

  // --- PG Management ---
  addPG: (pg: SavedPG) => {
    const newPGs = [...get().savedPGs, pg];
    set({ savedPGs: newPGs });
    if (typeof window !== 'undefined') {
      localStorage.setItem('atb-saved-pgs', JSON.stringify(newPGs));
    }
  },

  removePG: (id: string) => {
    const newPGs = get().savedPGs.filter(p => p.id !== id);
    set({ savedPGs: newPGs });
    if (typeof window !== 'undefined') {
      localStorage.setItem('atb-saved-pgs', JSON.stringify(newPGs));
    }
  },

  loadPGs: () => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('atb-saved-pgs');
      if (data) {
        try {
          set({ savedPGs: JSON.parse(data) });
        } catch {
          set({ savedPGs: [] });
        }
      }
    }
  },

  // --- Monster Management ---
  addMonster: (monster: SavedMonster) => {
    const newMonsters = [...get().savedMonsters, monster];
    set({ savedMonsters: newMonsters });
    if (typeof window !== 'undefined') {
      localStorage.setItem('atb-saved-monsters', JSON.stringify(newMonsters));
    }
  },

  removeMonster: (id: string) => {
    const newMonsters = get().savedMonsters.filter(m => m.id !== id);
    set({ savedMonsters: newMonsters });
    if (typeof window !== 'undefined') {
      localStorage.setItem('atb-saved-monsters', JSON.stringify(newMonsters));
    }
  },

  loadMonsters: () => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('atb-saved-monsters');
      if (data) {
        try {
          set({ savedMonsters: JSON.parse(data) });
        } catch {
          set({ savedMonsters: [] });
        }
      }
    }
  },

  // --- Combat Management ---
  startCombat: (pgIds: string[], monsterId: string) => {
    const { savedPGs, savedMonsters } = get();

    const selectedPGs = pgIds
      .map(id => savedPGs.find(p => p.id === id))
      .filter((p): p is SavedPG => p !== undefined)
      .map(p => initializePGForCombat(p));

    const savedMonster = savedMonsters.find(m => m.id === monsterId);
    if (!savedMonster || selectedPGs.length === 0) return;

    const monster = initializeMonsterForCombat(savedMonster);

    set({
      combatPGs: selectedPGs,
      combatMonster: monster,
      combatState: {
        ...initialCombatState,
        phase: 'planning',
        round: 1,
        selectedPgIds: pgIds,
        selectedMonsterId: monsterId,
        combatLog: [{
          id: generateId(),
          round: 1,
          tick: 0,
          timestamp: Date.now(),
          message: `Combattimento iniziato! Round 1 - Fase di Pianificazione`,
          type: 'info',
        }],
      },
      currentPlanningPgIndex: 0,
    });
  },

  endCombat: () => {
    set({
      combatPGs: [],
      combatMonster: null,
      combatState: { ...initialCombatState },
      currentPlanningPgIndex: 0,
    });
  },

  // --- Planning Phase ---
  playCardsForPG: (pgId: string, selectedCardIds: string[], faceUpCardIds: string[]) => {
    const { combatPGs } = get();

    const pgIndex = combatPGs.findIndex(p => p.id === pgId);
    if (pgIndex === -1) return;

    const pg = combatPGs[pgIndex];
    const updatedPg = { ...pg, atbRow: [], hand: [...pg.hand], vitalityDeck: [...pg.vitalityDeck], discardPile: [...pg.discardPile] };

    let position = 0;

    for (const cardId of selectedCardIds) {
      const cardIndex = updatedPg.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) continue;

      const card = { ...updatedPg.hand[cardIndex] };
      const isFaceUp = faceUpCardIds.includes(cardId);
      card.faceUp = isFaceUp;

      updatedPg.atbRow.push({
        position,
        card,
        source: 'pg',
        sourceId: pg.id,
        faceUp: isFaceUp,
        resolved: false,
      });

      updatedPg.hand.splice(cardIndex, 1);
      position++;
    }

    // Refill hand
    const cardsNeeded = 5 - updatedPg.hand.length;
    for (let i = 0; i < cardsNeeded; i++) {
      if (updatedPg.vitalityDeck.length === 0) {
        const nextHeart = updatedPg.hearts.find(h => !h.wounded);
        if (nextHeart) {
          updatedPg.hearts = updatedPg.hearts.map(h =>
            h.index === nextHeart.index ? { ...h, wounded: true } : h
          );
        }
        updatedPg.isFainted = true;
        if (updatedPg.hearts.every(h => h.wounded)) {
          updatedPg.isAlive = false;
        }
        break;
      }
      const drawnCard = updatedPg.vitalityDeck.shift()!;
      updatedPg.hand.push(drawnCard);
    }

    const newCombatPGs = [...combatPGs];
    newCombatPGs[pgIndex] = updatedPg;

    const { combatState, currentPlanningPgIndex } = get();
    const nextIndex = currentPlanningPgIndex + 1;

    const allAlivePGs = newCombatPGs.filter(p => p.isAlive && !p.isFainted);

    if (nextIndex >= allAlivePGs.length) {
      set({
        combatPGs: newCombatPGs,
        combatState: {
          ...combatState,
          phase: 'enemy_phase',
          combatLog: [...combatState.combatLog, {
            id: generateId(),
            round: combatState.round,
            tick: 0,
            timestamp: Date.now(),
            message: 'Fase Nemico - il Master posiziona i token',
            type: 'info',
          }],
        },
        currentPlanningPgIndex: 0,
      });
    } else {
      set({
        combatPGs: newCombatPGs,
        currentPlanningPgIndex: nextIndex,
      });
    }
  },

  placeEnemyTokensAction: () => {
    const { combatMonster, combatState, combatPGs } = get();
    if (!combatMonster) return;

    const updatedMonster = placeEnemyTokens(combatMonster);

    const maxTick = Math.max(
      updatedMonster.atbRow.length,
      ...combatPGs.map(pg => pg.atbRow.length)
    ) - 1;

    set({
      combatMonster: updatedMonster,
      combatState: {
        ...combatState,
        phase: 'resolution',
        currentTick: 0,
        maxTick,
        enemyTokensPlaced: true,
        combatLog: [...combatState.combatLog, {
          id: generateId(),
          round: combatState.round,
          tick: 0,
          timestamp: Date.now(),
          message: 'Token nemici posizionati! Inizio risoluzione...',
          type: 'info',
        }],
      },
    });
  },

  placeBossATBAction: (powerLevel: number) => {
    const { combatMonster, combatState, combatPGs } = get();
    if (!combatMonster) return;

    const updatedMonster = placeBossATBRow(combatMonster, powerLevel);

    const maxTick = Math.max(
      updatedMonster.atbRow.length,
      ...combatPGs.map(pg => pg.atbRow.length)
    ) - 1;

    set({
      combatMonster: updatedMonster,
      combatState: {
        ...combatState,
        phase: 'resolution',
        currentTick: 0,
        maxTick,
        enemyTokensPlaced: true,
        combatLog: [...combatState.combatLog, {
          id: generateId(),
          round: combatState.round,
          tick: 0,
          timestamp: Date.now(),
          message: `Boss gioca Potere ${powerLevel}! Inizio risoluzione...`,
          type: 'info',
        }],
      },
    });
  },

  // --- Resolution Phase ---
  advanceTick: () => {
    const { combatPGs, combatMonster, combatState } = get();
    if (!combatMonster) return;

    const { currentTick, round } = combatState;

    const result = resolveTick(combatPGs, combatMonster, currentTick, round);

    const newLog = [...combatState.combatLog, ...result.logEntries];

    if (result.pendingResolutions.length > 0) {
      set({
        combatPGs: result.updatedPgs,
        combatMonster: result.updatedMonster,
        combatState: {
          ...combatState,
          combatLog: newLog,
          pendingDamageResolutions: result.pendingResolutions,
        },
      });
      return;
    }

    const monsterDefeated = result.updatedMonster.currentPf <= 0;
    const allPGsDead = result.updatedPgs.every(pg => !pg.isAlive);

    if (monsterDefeated) {
      set({
        combatPGs: result.updatedPgs,
        combatMonster: result.updatedMonster,
        combatState: {
          ...combatState,
          phase: 'victory',
          combatLog: newLog,
        },
      });
      return;
    }

    if (allPGsDead) {
      set({
        combatPGs: result.updatedPgs,
        combatMonster: result.updatedMonster,
        combatState: {
          ...combatState,
          phase: 'defeat',
          combatLog: newLog,
        },
      });
      return;
    }

    const nextTick = currentTick + 1;
    if (nextTick > combatState.maxTick) {
      set({
        combatPGs: result.updatedPgs,
        combatMonster: result.updatedMonster,
        combatState: {
          ...combatState,
          phase: 'cleanup',
          combatLog: newLog,
        },
      });
      return;
    }

    set({
      combatPGs: result.updatedPgs,
      combatMonster: result.updatedMonster,
      combatState: {
        ...combatState,
        currentTick: nextTick,
        combatLog: newLog,
      },
    });
  },

  resolveDamage: (resolution: DamageResolution, choice: 'milling' | 'wound', woundCharacteristic?: CharacteristicKey) => {
    const { combatPGs, combatState } = get();

    const pgIndex = combatPGs.findIndex(p => p.id === resolution.pgId);
    if (pgIndex === -1) return;

    let updatedPg = combatPGs[pgIndex];

    if (resolution.damageType === 'standard') {
      if (choice === 'milling') {
        updatedPg = applyStandardDamageMilling(updatedPg, resolution.damageAmount);
      } else if (choice === 'wound' && woundCharacteristic) {
        updatedPg = applyStandardDamageWound(updatedPg, woundCharacteristic);
      }
    }

    const newPGs = [...combatPGs];
    newPGs[pgIndex] = updatedPg;

    const logEntry: CombatLogEntry = {
      id: generateId(),
      round: combatState.round,
      tick: combatState.currentTick,
      timestamp: Date.now(),
      message: `${updatedPg.name} sceglie: ${choice === 'milling' ? 'Milling (scarta carte)' : `Ferita a ${woundCharacteristic}`}`,
      type: 'damage',
    };

    set({
      combatPGs: newPGs,
      combatState: {
        ...combatState,
        pendingDamageResolutions: [],
        combatLog: [...combatState.combatLog, logEntry],
      },
    });
  },

  // --- Cleanup Phase ---
  performCleanup: () => {
    const { combatPGs, combatState } = get();

    const cleanedPGs = cleanupRound(combatPGs);
    const newRound = combatState.round + 1;

    set({
      combatPGs: cleanedPGs,
      combatState: {
        ...combatState,
        phase: 'planning',
        round: newRound,
        currentTick: 0,
        maxTick: 0,
        enemyTokensPlaced: false,
        pendingDamageResolutions: [],
        activePgId: null,
        combatLog: [...combatState.combatLog, {
          id: generateId(),
          round: newRound,
          tick: 0,
          timestamp: Date.now(),
          message: `Round ${newRound} - Fase di Pianificazione`,
          type: 'info',
        }],
      },
      currentPlanningPgIndex: 0,
    });
  },

  // --- Combat Log ---
  addLogEntry: (entry: CombatLogEntry) => {
    set(state => ({
      combatState: {
        ...state.combatState,
        combatLog: [...state.combatState.combatLog, entry],
      },
    }));
  },

  clearLog: () => {
    set(state => ({
      combatState: {
        ...state.combatState,
        combatLog: [],
      },
    }));
  },

  setNextPlanningPg: () => {
    const { currentPlanningPgIndex, combatPGs } = get();
    const allAlivePGs = combatPGs.filter(p => p.isAlive && !p.isFainted);
    const nextIndex = currentPlanningPgIndex + 1;
    if (nextIndex < allAlivePGs.length) {
      set({ currentPlanningPgIndex: nextIndex });
    }
  },
}));
