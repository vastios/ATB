// ============================================================
// ATB RPG Combat Simulator - Game Data, Constants & Lookups
// ============================================================

import { CharacteristicKey, Characteristics, DeckComposition, TimeCost, CHARACTERISTIC_KEYS } from './types';

// --- Power Table ---
// POWER_TABLE[charValue][timeCost] = damage
// charValue: 1-5, timeCost: 1-5
export const POWER_TABLE: Record<number, Record<TimeCost, number>> = {
  1: { 1: 1, 2: 2, 3: 4, 4: 6, 5: 9 },
  2: { 1: 1, 2: 3, 3: 5, 4: 9, 5: 14 },
  3: { 1: 2, 2: 4, 3: 7, 4: 12, 5: 19 },
  4: { 1: 2, 2: 5, 3: 9, 4: 15, 5: 24 },
  5: { 1: 2, 2: 6, 3: 11, 4: 18, 5: 30 },
};

// --- Vitality Deck Distribution ---
// Each level = 6 cards. Per-level distribution tells how many of each time cost.
// Base common levels 1-2 (shared by all characteristics)
const BASE_LEVEL_1 = { T1: 2, T2: 2, T3: 2, T4: 0, T5: 0 };
const BASE_LEVEL_2 = { T1: 2, T2: 2, T3: 1, T4: 1, T5: 0 };

// Specialization levels 3-5 per characteristic
const SPECIALIZATION: Record<CharacteristicKey, Record<number, { T1: number; T2: number; T3: number; T4: number; T5: number }>> = {
  istinto: {
    3: { T1: 2, T2: 2, T3: 0, T4: 1, T5: 1 },
    4: { T1: 2, T2: 1, T3: 0, T4: 1, T5: 2 },
    5: { T1: 2, T2: 0, T3: 0, T4: 1, T5: 3 },
  },
  analisi: {
    3: { T1: 1, T2: 2, T3: 1, T4: 1, T5: 1 },
    4: { T1: 1, T2: 1, T3: 1, T4: 2, T5: 1 },
    5: { T1: 1, T2: 0, T3: 1, T4: 2, T5: 2 },
  },
  evasione: {
    3: { T1: 3, T2: 1, T3: 1, T4: 1, T5: 0 },
    4: { T1: 1, T2: 2, T3: 2, T4: 0, T5: 1 },
    5: { T1: 1, T2: 2, T3: 1, T4: 1, T5: 1 },
  },
  risonanza: {
    3: { T1: 1, T2: 3, T3: 1, T4: 1, T5: 0 },
    4: { T1: 1, T2: 3, T3: 0, T4: 1, T5: 1 },
    5: { T1: 2, T2: 3, T3: 0, T4: 0, T5: 1 },
  },
};

// Get the cumulative distribution for a characteristic at a given value
export function getCumulativeDistribution(
  characteristic: CharacteristicKey,
  value: number
): { T1: number; T2: number; T3: number; T4: number; T5: number } {
  const result = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 };

  // Level 1 (always present for value >= 1)
  if (value >= 1) {
    result.T1 += BASE_LEVEL_1.T1;
    result.T2 += BASE_LEVEL_1.T2;
    result.T3 += BASE_LEVEL_1.T3;
    result.T4 += BASE_LEVEL_1.T4;
    result.T5 += BASE_LEVEL_1.T5;
  }

  // Level 2
  if (value >= 2) {
    result.T1 += BASE_LEVEL_2.T1;
    result.T2 += BASE_LEVEL_2.T2;
    result.T3 += BASE_LEVEL_2.T3;
    result.T4 += BASE_LEVEL_2.T4;
    result.T5 += BASE_LEVEL_2.T5;
  }

  // Levels 3-5 (specialization)
  for (let level = 3; level <= Math.min(value, 5); level++) {
    const spec = SPECIALIZATION[characteristic][level];
    if (spec) {
      result.T1 += spec.T1;
      result.T2 += spec.T2;
      result.T3 += spec.T3;
      result.T4 += spec.T4;
      result.T5 += spec.T5;
    }
  }

  return result;
}

// Get full deck composition for a character
export function getDeckComposition(characteristics: Characteristics): DeckComposition[] {
  return CHARACTERISTIC_KEYS.map((key) => {
    const value = characteristics[key];
    const dist = getCumulativeDistribution(key, value);
    return {
      characteristic: key,
      value,
      totalCards: value * 6,
      timeDistribution: dist,
    };
  });
}

// Calculate power from characteristic value and time cost
export function getPower(charValue: number, timeCost: TimeCost): number {
  return POWER_TABLE[charValue]?.[timeCost] ?? 0;
}

// --- Card Name Generation ---
const CARD_NAMES_BY_CHARACTERISTIC: Record<CharacteristicKey, Record<TimeCost, string[]>> = {
  istinto: {
    1: ['Scatto Impulsivo', 'Riflesso di Furia', 'Impeto'],
    2: ['Assalto Rapido', 'Carica Selvaggia', 'Bruciatura'],
    3: ['Colpo Furioso', 'Assalto Devastante', 'Rabbia Focosa'],
    4: ['Furia Incontenibile', 'Assalto Brutale', 'Devastazione'],
    5: ['Ira Divina', 'Furia Annientante', 'Colpo dell\'Eroe Caduto'],
  },
  analisi: {
    1: ['Calcolo Rapido', 'Osservazione', 'Deduzione Istantanea'],
    2: ['Analisi Tattica', 'Piano Preciso', 'Valutazione'],
    3: ['Strategia Profonda', 'Piano Elaborato', 'Calcolo Complesso'],
    4: ['Piano Supremo', 'Analisi Definitiva', 'Strategia Magistrale'],
    5: ['Intelletto Sovrano', 'Piano Perfetto', 'Rivelazione Analitica'],
  },
  evasione: {
    1: ['Scatto Brusco', 'Passo Leggero', 'Riflesso Evasivo'],
    2: ['Schivata Calcolata', 'Mossa Fluida', 'Balzo Agilie'],
    3: ['Evasione Tecnica', 'Danza delle Lame', 'Fluidità Combattiva'],
    4: ['Ombra Eterea', 'Danse Macabre', 'Evasione Perfetta'],
    5: ['Passo Dimensionale', 'Assenza Totale', 'Spirito Libero'],
  },
  risonanza: {
    1: ['Empatia Istantanea', 'Sensazione', 'Intuito Connessione'],
    2: ['Sintonia Rapida', 'Risonanza Condivisa', 'Comunione'],
    3: ['Parata con Scudo', 'Connessione Profonda', 'Armonia Interiore'],
    4: ['Comunione Suprema', 'Risonanza Assoluta', 'Empatia Totalizzante'],
    5: ['Il Colpo dell\'Eroe Caduto', 'Risonanza Cosmica', 'Connessione Vitale'],
  },
};

export function getCardName(characteristic: CharacteristicKey, timeCost: TimeCost, index: number): string {
  const names = CARD_NAMES_BY_CHARACTERISTIC[characteristic]?.[timeCost] ?? ['Azione'];
  return names[index % names.length] || `Azione ${characteristic} T${timeCost}`;
}

// --- Tag Assignment ---
// T1 = 1 tag, T2 = 2 tags, T3 = 3 tags, T4 = 4 tags, T5 = 5 tags
// First tag is always Imposizione or Opposizione
// For simplicity in the simulator, we assign a reasonable set of tags

import { CardTag } from './types';

function assignTags(characteristic: CharacteristicKey, timeCost: TimeCost): CardTag[] {
  const tags: CardTag[] = [];

  // Alternate between Imposizione and Opposizione for variety
  // T1-T2: 60% Imposizione, 40% Opposizione
  // T3-T5: Mix with combo and other tags

  const isImposizione = Math.random() > 0.4;
  tags.push(isImposizione ? 'Imposizione' : 'Opposizione');

  const maxTags = timeCost;

  if (maxTags >= 2) {
    // T2+: maybe add Strumento or combo tag
    if (isImposizione) {
      if (Math.random() > 0.5) tags.push('Apertura');
      else tags.push('Strumento');
    } else {
      if (Math.random() > 0.5) tags.push('Protezione');
      else tags.push('Strumento');
    }
  }

  if (maxTags >= 3) {
    // T3+: combo tags and Ferita
    if (isImposizione) {
      tags.push(Math.random() > 0.5 ? 'Sviluppo' : 'Chiusura');
    } else {
      tags.push('Sviluppo');
    }
  }

  if (maxTags >= 4) {
    // T4+: more combo + secondary characteristic
    tags.push('Ferita');
  }

  if (maxTags >= 5) {
    // T5: full suite
    if (isImposizione) {
      tags.push('Culmine');
    } else {
      tags.push('Contrattacco');
    }
  }

  return tags.slice(0, maxTags);
}

// --- Generate Vitality Deck ---
export function generateVitalityDeck(characteristics: Characteristics): VitalityCard[] {
  const deck: VitalityCard[] = [];
  let cardIndex = 0;

  CHARACTERISTIC_KEYS.forEach((key) => {
    const value = characteristics[key];
    const dist = getCumulativeDistribution(key, value);

    (['T1', 'T2', 'T3', 'T4', 'T5'] as const).forEach((tKey) => {
      const timeCost = parseInt(tKey.replace('T', '')) as TimeCost;
      const count = dist[tKey];

      for (let i = 0; i < count; i++) {
        deck.push({
          id: `card-${cardIndex++}`,
          characteristic: key,
          timeCost,
          tags: assignTags(key, timeCost),
          name: getCardName(key, timeCost, i),
          faceUp: true,
        });
      }
    });
  });

  // Shuffle the deck (Fisher-Yates)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// --- Damage Calculations ---
export function calculateMonsterDamage(
  attackPower: number,
  monsterTraits: { type: string; value?: number; resistedTag?: CardTag; resistanceAmount?: number; destroyed: boolean }[],
  cardTags: CardTag[],
  powerAmount: number
): number {
  let damage = powerAmount;

  for (const trait of monsterTraits) {
    if (trait.destroyed) continue;

    if (trait.type === 'armatura_fissa' && trait.value) {
      damage = Math.max(0, damage - trait.value);
    }

    if (trait.type === 'resistenza') {
      const hasResistedTag = trait.resistedTag && cardTags.includes(trait.resistedTag);
      const hasResistedChar = trait.resistedCharacteristic && cardTags.includes(trait.resistedCharacteristic as CardTag);
      if (hasResistedTag || hasResistedChar) {
        if (trait.resistanceAmount === 0) {
          return 0; // Immunity
        }
        damage = Math.max(0, damage - (trait.resistanceAmount ?? 0));
      }
    }
  }

  return damage;
}

// --- Validation ---
export function validateCharacteristics(chars: Characteristics): { valid: boolean; total: number; remaining: number } {
  const total = chars.istinto + chars.analisi + chars.evasione + chars.risonanza;
  return {
    valid: total === 10,
    total,
    remaining: 10 - total,
  };
}

// --- Combat Constants ---
export const MAX_HAND_SIZE = 5;
export const MAX_HEARTS = 3;
export const TOTAL_CHARACTERISTIC_POINTS = 10;
export const MIN_CHARACTERISTIC_VALUE = 1;
export const MAX_CHARACTERISTIC_VALUE = 5;
export const DEFAULT_ENEMY_TOKENS = 5;
