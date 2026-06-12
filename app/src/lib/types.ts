// ============================================================
// ATB RPG Combat Simulator - Type Definitions
// ============================================================

// --- Core Characteristics ---
export type CharacteristicKey = 'istinto' | 'analisi' | 'evasione' | 'risonanza';

export interface Characteristics {
  istinto: number;
  analisi: number;
  evasione: number;
  risonanza: number;
}

// --- Card Types ---
export type TimeCost = 1 | 2 | 3 | 4 | 5;

export type CardTag =
  // Utilizzo (mandatory)
  | 'Imposizione'
  | 'Opposizione'
  // Combo
  | 'Apertura'
  | 'Sviluppo'
  | 'Chiusura'
  | 'Culmine'
  // Caratteristica Secondaria
  | 'Istinto'
  | 'Analisi'
  | 'Evasione'
  | 'Risonanza'
  // Strumento
  | 'Strumento'
  // Ferita
  | 'Ferita'
  // Reazione (Perfect Block only)
  | 'Contrattacco'
  | 'Intercettazione'
  | 'Immolazione'
  // Protezione
  | 'Protezione'
  // Cura
  | 'Cura'
  | 'Recupero'
  // Alterazione
  | 'Accelerazione'
  | 'Rallentamento'
  | 'Rivelazione'
  | 'Premonizione'
  // Economia
  | 'Fulmineo';

export interface VitalityCard {
  id: string;
  characteristic: CharacteristicKey;
  timeCost: TimeCost;
  tags: CardTag[];
  name: string;
  faceUp: boolean; // true = action, false = fatigue (face-down)
}

// --- Character (PG) ---
export interface Heart {
  index: number; // 0, 1, 2
  wounded: boolean;
}

export interface CharacteristicWound {
  characteristic: CharacteristicKey;
  currentValue: number;
  maxValue: number;
  woundedCards: number; // how many cards flipped (each = -1 value)
}

export interface PG {
  id: string;
  name: string;
  characteristics: Characteristics;
  hearts: Heart[];
  // Runtime combat state
  vitalityDeck: VitalityCard[];
  hand: VitalityCard[];
  discardPile: VitalityCard[];
  atbRow: ATBSlot[];
  characteristicWounds: Record<CharacteristicKey, number>; // wounds per characteristic (0 = full, maxValue = zeroed)
  isAlive: boolean;
  isFainted: boolean;
}

// --- ATB Slot ---
export interface ATBSlot {
  position: number; // 0-indexed position in the ATB row
  card: VitalityCard | null;
  source: 'pg' | 'enemy';
  sourceId: string; // PG id or enemy id
  faceUp: boolean;
  resolved: boolean;
}

// --- Monster Types ---
export type MonsterTier = 'base' | 'elite' | 'epico';

export type DamageType = 'standard' | 'direct_characteristic' | 'direct_heart' | 'anatema';

export interface MonsterAttack {
  id: string;
  name: string;
  powerLevel: number; // 1-9
  damageAmount: number;
  damageType: DamageType;
  targetCharacteristic?: CharacteristicKey; // for direct_characteristic
}

export type TraitType = 'armatura_fissa' | 'resistenza' | 'ritorsione' | 'sconfitta_alternativa';

export interface MonsterTrait {
  id: string;
  type: TraitType;
  name: string;
  description: string;
  value?: number; // for armatura_fissa (damage reduction)
  resistedTag?: CardTag; // for resistenza
  resistedCharacteristic?: CharacteristicKey;
  resistanceAmount?: number; // for resistenza (0 = immune)
  destroyed: boolean;
}

export type SpecialAttackType = 'colpo_mirato' | 'squarcio_anima' | 'distruzione_risorse' | 'modifica_atb';

export interface MonsterSpecialAttack {
  id: string;
  type: SpecialAttackType;
  name: string;
  description: string;
  targetCharacteristic?: CharacteristicKey; // for colpo_mirato
  damageAmount?: number;
}

export interface EnemyToken {
  position: number;
  isAttack: boolean;
  isRevealed: boolean;
  attackId?: string; // reference to attack if isAttack
  specialAttackId?: string; // reference to special attack
}

export interface Monster {
  id: string;
  name: string;
  tier: MonsterTier;
  pf: number; // Punti Ferita (hit points)
  maxPf: number;
  attacks: MonsterAttack[];
  traits: MonsterTrait[];
  specialAttacks: MonsterSpecialAttack[];
  tokenConfig: {
    total: number; // default 5
    attacks: number; // how many are attacks
    bluffs: number; // how many are bluffs
  };
  // Runtime combat state
  atbRow: EnemyToken[];
  currentPf: number;
}

// --- Combat State ---
export type CombatPhase = 'setup' | 'planning' | 'enemy_phase' | 'resolution' | 'cleanup' | 'victory' | 'defeat';

export interface CombatLogEntry {
  id: string;
  round: number;
  tick: number;
  timestamp: number;
  message: string;
  type: 'info' | 'damage' | 'defense' | 'combo' | 'heal' | 'death' | 'victory' | 'defeat' | 'warning';
}

export interface DamageResolution {
  pgId: string;
  damageType: DamageType;
  damageAmount: number;
  mitigated: boolean;
  perfectBlock: boolean;
  mitigationReduction: number;
  targetCharacteristic?: CharacteristicKey;
  choice?: 'milling' | 'wound'; // player choice for standard damage
  resolved: boolean;
}

export interface CombatState {
  phase: CombatPhase;
  round: number;
  currentTick: number; // current position being resolved
  maxTick: number; // maximum tick in this round
  selectedPgIds: string[];
  selectedMonsterId: string | null;
  combatLog: CombatLogEntry[];
  pendingDamageResolutions: DamageResolution[];
  activePgId: string | null; // PG currently choosing
  enemyTokensPlaced: boolean;
}

// --- Store Types ---
export interface SavedPG {
  id: string;
  name: string;
  characteristics: Characteristics;
  createdAt: number;
}

export interface SavedMonster {
  id: string;
  name: string;
  tier: MonsterTier;
  pf: number;
  attacks: MonsterAttack[];
  traits: MonsterTrait[];
  specialAttacks: MonsterSpecialAttack[];
  tokenConfig: {
    total: number;
    attacks: number;
    bluffs: number;
  };
  createdAt: number;
}

// --- Deck Composition Display ---
export interface DeckComposition {
  characteristic: CharacteristicKey;
  value: number;
  totalCards: number;
  timeDistribution: {
    T1: number;
    T2: number;
    T3: number;
    T4: number;
    T5: number;
  };
}

// --- Helper for characteristic colors ---
export const CHARACTERISTIC_COLORS: Record<CharacteristicKey, { bg: string; border: string; text: string; emoji: string; label: string }> = {
  istinto: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500', emoji: '🔴', label: 'Istinto' },
  analisi: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500', emoji: '🟡', label: 'Analisi' },
  evasione: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', emoji: '🔵', label: 'Evasione' },
  risonanza: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', emoji: '🟢', label: 'Risonanza' },
};

export const CHARACTERISTIC_KEYS: CharacteristicKey[] = ['istinto', 'analisi', 'evasione', 'risonanza'];
