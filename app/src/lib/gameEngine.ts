// ============================================================
// ATB RPG Combat Simulator - Game Engine
// Combat logic, damage resolution, deck management
// ============================================================

import {
  PG, Monster, EnemyToken, VitalityCard, ATBSlot,
  CombatLogEntry, DamageResolution, CharacteristicKey,
  TimeCost, CardTag, CHARACTERISTIC_KEYS
} from './types';
import { getPower, generateVitalityDeck, MAX_HAND_SIZE, calculateMonsterDamage } from './gameData';

// --- ID Generator ---
let idCounter = 0;
export function generateId(): string {
  return `id-${Date.now()}-${idCounter++}`;
}

// --- Initialize PG for Combat ---
export function initializePGForCombat(savedPG: { id: string; name: string; characteristics: Record<CharacteristicKey, number> }): PG {
  const characteristics = savedPG.characteristics;
  const deck = generateVitalityDeck(characteristics);
  const hand = deck.splice(0, MAX_HAND_SIZE);

  return {
    id: savedPG.id,
    name: savedPG.name,
    characteristics,
    hearts: [
      { index: 0, wounded: false },
      { index: 1, wounded: false },
      { index: 2, wounded: false },
    ],
    vitalityDeck: deck,
    hand,
    discardPile: [],
    atbRow: [],
    characteristicWounds: {
      istinto: 0,
      analisi: 0,
      evasione: 0,
      risonanza: 0,
    },
    isAlive: true,
    isFainted: false,
  };
}

// --- Initialize Monster for Combat ---
export function initializeMonsterForCombat(savedMonster: Monster): Monster {
  return {
    ...savedMonster,
    currentPf: savedMonster.pf,
    atbRow: [],
    traits: savedMonster.traits.map(t => ({ ...t, destroyed: false })),
  };
}

// --- Draw Cards ---
export function drawCards(pg: PG, count: number): PG {
  const newPg = { ...pg };
  const drawn: VitalityCard[] = [];

  for (let i = 0; i < count; i++) {
    if (newPg.vitalityDeck.length === 0) {
      // Deck empty - wound heart and faint
      const nextHeart = newPg.hearts.find(h => !h.wounded);
      if (nextHeart) {
        newPg.hearts = newPg.hearts.map(h =>
          h.index === nextHeart.index ? { ...h, wounded: true } : h
        );
      }
      newPg.isFainted = true;
      // Check death
      if (newPg.hearts.every(h => h.wounded)) {
        newPg.isAlive = false;
      }
      break;
    }
    const card = newPg.vitalityDeck.shift()!;
    drawn.push(card);
  }

  newPg.hand = [...newPg.hand, ...drawn];
  return newPg;
}

// --- Play Cards to ATB Row ---
export function playCardsToATB(
  pg: PG,
  selectedCardIds: string[],
  faceUpCardIds: string[]
): PG {
  let newPg = { ...pg };
  newPg.atbRow = [];
  newPg.hand = [...pg.hand];
  newPg.vitalityDeck = [...pg.vitalityDeck];
  newPg.discardPile = [...pg.discardPile];

  let position = 0;
  const playedCards: VitalityCard[] = [];

  for (const cardId of selectedCardIds) {
    const cardIndex = newPg.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) continue;

    const card = { ...newPg.hand[cardIndex] };
    const isFaceUp = faceUpCardIds.includes(cardId);
    card.faceUp = isFaceUp;

    newPg.atbRow.push({
      position,
      card,
      source: 'pg',
      sourceId: pg.id,
      faceUp: isFaceUp,
      resolved: false,
    });

    playedCards.push(card);
    newPg.hand.splice(cardIndex, 1);
    position++;
  }

  // Refill hand to 5
  const cardsNeeded = MAX_HAND_SIZE - newPg.hand.length;
  if (cardsNeeded > 0) {
    newPg = drawCards(newPg, cardsNeeded);
  }

  return newPg;
}

// --- Enemy Token Placement ---
export function placeEnemyTokens(monster: Monster): Monster {
  const newMonster = { ...monster };
  newMonster.atbRow = [];

  const { attacks, bluffs } = monster.tokenConfig;
  const tokens: ('attack' | 'bluff')[] = [];

  // Add attack tokens
  for (let i = 0; i < attacks; i++) {
    tokens.push('attack');
  }
  // Add bluff tokens
  for (let i = 0; i < bluffs; i++) {
    tokens.push('bluff');
  }

  // Shuffle tokens
  for (let i = tokens.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
  }

  // Assign attacks from monster's attack list
  let attackIndex = 0;
  tokens.forEach((tokenType, position) => {
    const enemyToken: EnemyToken = {
      position,
      isAttack: tokenType === 'attack',
      isRevealed: false,
    };

    if (tokenType === 'attack' && monster.attacks.length > 0) {
      enemyToken.attackId = monster.attacks[attackIndex % monster.attacks.length].id;
      attackIndex++;
    }

    newMonster.atbRow.push(enemyToken);
  });

  return newMonster;
}

// --- Place Boss ATB Row (Epico) ---
export function placeBossATBRow(monster: Monster, chosenPowerLevel: number): Monster {
  const newMonster = { ...monster };
  newMonster.atbRow = [];

  // Boss plays power card: (powerLevel-1) face-down + 1 face-up action
  for (let i = 0; i < chosenPowerLevel; i++) {
    const isLast = i === chosenPowerLevel - 1;
    newMonster.atbRow.push({
      position: i,
      isAttack: isLast, // Only the last position is the actual attack
      isRevealed: !isLast, // Face-down until the last position (partial reveal)
      attackId: isLast ? monster.attacks[0]?.id : undefined,
    });
  }

  return newMonster;
}

// --- Get Current Characteristic Value (accounting for wounds) ---
export function getCurrentCharacteristicValue(pg: PG, characteristic: CharacteristicKey): number {
  const maxVal = pg.characteristics[characteristic];
  const wounds = pg.characteristicWounds[characteristic];
  return Math.max(0, maxVal - wounds);
}

// --- Calculate Card Power ---
export function calculateCardPower(pg: PG, card: VitalityCard): number {
  // Check for secondary characteristic tag
  let effectiveCharacteristic = card.characteristic;

  for (const tag of card.tags) {
    if (CHARACTERISTIC_KEYS.includes(tag as CharacteristicKey) && tag !== card.characteristic) {
      // Use secondary characteristic if it's higher
      const secondaryVal = getCurrentCharacteristicValue(pg, tag as CharacteristicKey);
      const primaryVal = getCurrentCharacteristicValue(pg, card.characteristic);
      if (secondaryVal > primaryVal) {
        effectiveCharacteristic = tag as CharacteristicKey;
      }
    }
  }

  const charValue = getCurrentCharacteristicValue(pg, effectiveCharacteristic);
  if (charValue === 0) return 0; // Zeroed characteristic = no power

  return getPower(charValue, card.timeCost);
}

// --- Defense Resolution ---
export type DefenseResult = 'perfect_block' | 'mitigated' | 'full_damage';

export function resolveDefense(
  pgAtbRow: ATBSlot[],
  attackPosition: number
): { result: DefenseResult; defenseSlot: ATBSlot | null } {
  // Check for Opposizione in same position (Perfect Block)
  const sameSlot = pgAtbRow.find(
    slot => slot.position === attackPosition && slot.faceUp && slot.card?.tags.includes('Opposizione')
  );
  if (sameSlot) {
    return { result: 'perfect_block', defenseSlot: sameSlot };
  }

  // Check for Opposizione in adjacent position (±1) (Mitigated)
  const adjacentSlot = pgAtbRow.find(
    slot =>
      (slot.position === attackPosition - 1 || slot.position === attackPosition + 1) &&
      slot.faceUp &&
      slot.card?.tags.includes('Opposizione')
  );
  if (adjacentSlot) {
    return { result: 'mitigated', defenseSlot: adjacentSlot };
  }

  return { result: 'full_damage', defenseSlot: null };
}

// --- Combo Detection ---
export interface ComboResult {
  hasCombo: boolean;
  participants: { pgId: string; card: VitalityCard; role: string }[];
  totalDamage: number;
}

export function detectCombos(
  pgs: PG[],
  tickPosition: number
): ComboResult[] {
  const combos: ComboResult[] = [];

  // Find all face-up cards at this position from different PGs
  const cardsAtPosition: { pgId: string; card: VitalityCard }[] = [];

  for (const pg of pgs) {
    const slot = pg.atbRow.find(s => s.position === tickPosition && s.faceUp && s.card);
    if (slot?.card) {
      cardsAtPosition.push({ pgId: pg.id, card: slot.card });
    }
  }

  if (cardsAtPosition.length < 2) return combos;

  // Check for combo tags
  const hasApertura = cardsAtPosition.some(c => c.card.tags.includes('Apertura'));
  const hasChiusura = cardsAtPosition.some(c => c.card.tags.includes('Chiusura') || c.card.tags.includes('Culmine'));
  const hasSviluppo = cardsAtPosition.some(c => c.card.tags.includes('Sviluppo'));

  if (hasApertura && hasChiusura) {
    // Valid combo!
    const participants = cardsAtPosition.map(c => {
      let role = 'supporto';
      if (c.card.tags.includes('Apertura')) role = 'apertura';
      else if (c.card.tags.includes('Chiusura')) role = 'chiusura';
      else if (c.card.tags.includes('Culmine')) role = 'culmine';
      else if (c.card.tags.includes('Sviluppo')) role = 'sviluppo';
      return { pgId: c.pgId, card: c.card, role };
    });

    const pgMap = new Map(pgs.map(pg => [pg.id, pg]));
    const totalDamage = cardsAtPosition.reduce((sum, c) => {
      const pg = pgMap.get(c.pgId);
      if (!pg) return sum;
      return sum + calculateCardPower(pg, c.card);
    }, 0);

    const isCulmine = cardsAtPosition.some(c => c.card.tags.includes('Culmine'));
    const finalDamage = isCulmine ? totalDamage * 2 : totalDamage;

    combos.push({
      hasCombo: true,
      participants,
      totalDamage: finalDamage,
    });
  }

  return combos;
}

// --- Apply Standard Damage to PG ---
export function applyStandardDamageMilling(pg: PG, amount: number): PG {
  const newPg = { ...pg };
  newPg.vitalityDeck = [...pg.vitalityDeck];
  newPg.discardPile = [...pg.discardPile];
  newPg.hearts = [...pg.hearts];

  // Mill cards from top of deck
  const milled = Math.min(amount, newPg.vitalityDeck.length);
  for (let i = 0; i < milled; i++) {
    const card = newPg.vitalityDeck.shift()!;
    newPg.discardPile.push(card);
  }

  // Check if deck is now empty and we still need to mill
  if (milled < amount || newPg.vitalityDeck.length === 0) {
    // Wound next heart + faint
    const nextHeart = newPg.hearts.find(h => !h.wounded);
    if (nextHeart) {
      newPg.hearts = newPg.hearts.map(h =>
        h.index === nextHeart.index ? { ...h, wounded: true } : h
      );
    }
    newPg.isFainted = true;
    if (newPg.hearts.every(h => h.wounded)) {
      newPg.isAlive = false;
    }
  }

  return newPg;
}

export function applyStandardDamageWound(pg: PG, characteristic: CharacteristicKey): PG {
  const newPg = { ...pg };
  newPg.characteristicWounds = { ...pg.characteristicWounds };

  const currentWounds = newPg.characteristicWounds[characteristic];
  const maxValue = newPg.characteristics[characteristic];

  if (currentWounds < maxValue) {
    newPg.characteristicWounds[characteristic] = currentWounds + 1;

    // Check Soglia del Vuoto
    if (newPg.characteristicWounds[characteristic] >= maxValue) {
      // Characteristic at 0 - force heart wound
      const nextHeart = newPg.hearts.find(h => !h.wounded);
      if (nextHeart) {
        newPg.hearts = newPg.hearts.map(h =>
          h.index === nextHeart.index ? { ...h, wounded: true } : h
        );
      }
      if (newPg.hearts.every(h => h.wounded)) {
        newPg.isAlive = false;
      }
    }
  }

  return newPg;
}

// --- Apply Direct Characteristic Damage ---
export function applyDirectCharacteristicDamage(
  pg: PG,
  characteristic: CharacteristicKey,
  amount: number
): PG {
  const newPg = { ...pg };
  newPg.characteristicWounds = { ...pg.characteristicWounds };
  newPg.hearts = [...pg.hearts];

  const currentWounds = newPg.characteristicWounds[characteristic];
  const maxValue = newPg.characteristics[characteristic];
  const newWounds = Math.min(currentWounds + amount, maxValue);

  newPg.characteristicWounds[characteristic] = newWounds;

  // Check Soglia del Vuoto
  if (newWounds >= maxValue) {
    const nextHeart = newPg.hearts.find(h => !h.wounded);
    if (nextHeart) {
      newPg.hearts = newPg.hearts.map(h =>
        h.index === nextHeart.index ? { ...h, wounded: true } : h
      );
    }
    if (newPg.hearts.every(h => h.wounded)) {
      newPg.isAlive = false;
    }
  }

  return newPg;
}

// --- Apply Anatema Damage (direct to hearts) ---
export function applyAnatemaDamage(pg: PG, amount: number): PG {
  const newPg = { ...pg };
  newPg.hearts = [...pg.hearts];

  for (let i = 0; i < amount; i++) {
    const nextHeart = newPg.hearts.find(h => !h.wounded);
    if (nextHeart) {
      newPg.hearts = newPg.hearts.map(h =>
        h.index === nextHeart.index ? { ...h, wounded: true } : h
      );
    }
  }

  if (newPg.hearts.every(h => h.wounded)) {
    newPg.isAlive = false;
  }

  return newPg;
}

// --- Apply Damage to Monster ---
export function applyDamageToMonster(monster: Monster, amount: number): Monster {
  const newMonster = { ...monster };
  newMonster.currentPf = Math.max(0, monster.currentPf - amount);
  return newMonster;
}

// --- Resolve a Single Tick ---
export interface TickResolutionResult {
  logEntries: CombatLogEntry[];
  updatedPgs: PG[];
  updatedMonster: Monster;
  pendingResolutions: DamageResolution[];
}

export function resolveTick(
  pgs: PG[],
  monster: Monster,
  tickPosition: number,
  round: number
): TickResolutionResult {
  const logEntries: CombatLogEntry[] = [];
  let updatedPgs = pgs.map(pg => ({ ...pg }));
  let updatedMonster = { ...monster };
  const pendingResolutions: DamageResolution[] = [];

  // 1. Reveal enemy token at this position if exists
  const enemyToken = updatedMonster.atbRow.find(t => t.position === tickPosition);
  if (enemyToken && !enemyToken.isRevealed) {
    enemyToken.isRevealed = true;
  }

  // 2. Resolve PG face-up actions
  for (let i = 0; i < updatedPgs.length; i++) {
    const pg = updatedPgs[i];
    const slot = pg.atbRow.find(s => s.position === tickPosition);

    if (!slot || slot.resolved) continue;

    slot.resolved = true;

    if (!slot.faceUp || !slot.card) {
      // Face-down card = fatigue, just discard
      if (slot.card) {
        pg.discardPile = [...pg.discardPile, slot.card];
      }
      logEntries.push({
        id: generateId(),
        round,
        tick: tickPosition,
        timestamp: Date.now(),
        message: `${pg.name}: carta coperta scartata (fatica)`,
        type: 'info',
      });
      continue;
    }

    // Face-up card - resolve action
    const card = slot.card;

    // Check if characteristic is at 0
    const charValue = getCurrentCharacteristicValue(pg, card.characteristic);
    if (charValue === 0) {
      // Can't use face-up actions with zeroed characteristic
      pg.discardPile = [...pg.discardPile, card];
      logEntries.push({
        id: generateId(),
        round,
        tick: tickPosition,
        timestamp: Date.now(),
        message: `${pg.name}: azione ${card.name} FALLITA (Caratteristica a 0)`,
        type: 'warning',
      });
      continue;
    }

    // Check for Fulmineo tag (activates even as time payment)
    if (card.tags.includes('Fulmineo')) {
      logEntries.push({
        id: generateId(),
        round,
        tick: tickPosition,
        timestamp: Date.now(),
        message: `${pg.name}: [Fulmineo] ${card.name} si attiva come pagamento!`,
        type: 'info',
      });
    }

    const power = calculateCardPower(pg, card);

    if (card.tags.includes('Imposizione')) {
      // Attack action - deal damage to monster
      const damageToMonster = calculateMonsterDamage(
        0, // not using attackPower for PG
        updatedMonster.traits,
        card.tags,
        power
      );

      if (damageToMonster > 0) {
        updatedMonster = applyDamageToMonster(updatedMonster, damageToMonster);
        logEntries.push({
          id: generateId(),
          round,
          tick: tickPosition,
          timestamp: Date.now(),
          message: `${pg.name} attacca con ${card.name} → ${damageToMonster} danni al mostro (PF: ${updatedMonster.currentPf}/${updatedMonster.maxPf})`,
          type: 'damage',
        });
      } else {
        logEntries.push({
          id: generateId(),
          round,
          tick: tickPosition,
          timestamp: Date.now(),
          message: `${pg.name} attacca con ${card.name} → 0 danni (assorbiti dall'armatura/resistenza)`,
          type: 'defense',
        });
      }
    }

    if (card.tags.includes('Opposizione')) {
      // Defense action - will be checked against enemy attacks
      logEntries.push({
        id: generateId(),
        round,
        tick: tickPosition,
        timestamp: Date.now(),
        message: `${pg.name}: ${card.name} (Opposizione) in posizione ${tickPosition}`,
        type: 'defense',
      });
    }

    // Cura/Recupero
    if (card.tags.includes('Recupero')) {
      // Self-heal: recover cards from discard to deck
      const healAmount = Math.min(power, pg.discardPile.length);
      const recovered = pg.discardPile.splice(0, healAmount);
      pg.vitalityDeck = [...pg.vitalityDeck, ...recovered];
      logEntries.push({
        id: generateId(),
        round,
        tick: tickPosition,
        timestamp: Date.now(),
        message: `${pg.name}: Recupero → ${healAmount} carte recuperate dal mazzo scarti`,
        type: 'heal',
      });
    }

    // Discard the resolved card
    pg.discardPile = [...pg.discardPile, card];
  }

  // 3. Check for enemy attack at this position
  if (enemyToken?.isAttack && enemyToken.isRevealed) {
    const attack = updatedMonster.attacks.find(a => a.id === enemyToken.attackId);
    if (attack) {
      // Apply attack to all alive PGs
      for (let i = 0; i < updatedPgs.length; i++) {
        const pg = updatedPgs[i];
        if (!pg.isAlive || pg.isFainted) continue;

        // Check defense
        const defense = resolveDefense(pg.atbRow, tickPosition);

        if (defense.result === 'perfect_block') {
          logEntries.push({
            id: generateId(),
            round,
            tick: tickPosition,
            timestamp: Date.now(),
            message: `${pg.name}: BLOCCO PERFETTO! Danno azzerato da ${defense.defenseSlot?.card?.name}`,
            type: 'defense',
          });

          // Check for Contrattacco
          if (defense.defenseSlot?.card?.tags.includes('Contrattacco')) {
            const counterPower = calculateCardPower(pg, defense.defenseSlot.card);
            updatedMonster = applyDamageToMonster(updatedMonster, counterPower);
            logEntries.push({
              id: generateId(),
              round,
              tick: tickPosition,
              timestamp: Date.now(),
              message: `${pg.name}: CONTRATTACCO! ${counterPower} danni al mostro`,
              type: 'damage',
            });
          }

          continue;
        }

        let finalDamage = attack.damageAmount;
        if (defense.result === 'mitigated') {
          // Reduced damage - halve it (simple mitigation)
          finalDamage = Math.max(1, Math.floor(attack.damageAmount / 2));
          logEntries.push({
            id: generateId(),
            round,
            tick: tickPosition,
            timestamp: Date.now(),
            message: `${pg.name}: Danno mitigato da ${defense.defenseSlot?.card?.name} (${attack.damageAmount} → ${finalDamage})`,
            type: 'defense',
          });
        } else {
          logEntries.push({
            id: generateId(),
            round,
            tick: tickPosition,
            timestamp: Date.now(),
            message: `${pg.name}: DANNO PIENO! ${attack.name} infligge ${finalDamage} danni`,
            type: 'damage',
          });
        }

        // Create damage resolution for player choice (if standard damage)
        if (attack.damageType === 'standard') {
          pendingResolutions.push({
            pgId: pg.id,
            damageType: 'standard',
            damageAmount: finalDamage,
            mitigated: defense.result === 'mitigated',
            perfectBlock: false,
            mitigationReduction: defense.result === 'mitigated' ? attack.damageAmount - finalDamage : 0,
            choice: undefined,
            resolved: false,
          });
        } else if (attack.damageType === 'direct_characteristic') {
          const targetChar = attack.targetCharacteristic || 'istinto';
          updatedPgs[i] = applyDirectCharacteristicDamage(updatedPgs[i], targetChar, finalDamage);
          logEntries.push({
            id: generateId(),
            round,
            tick: tickPosition,
            timestamp: Date.now(),
            message: `${pg.name}: Danno Diretto a ${targetChar}! ${finalDamage} ferite`,
            type: 'damage',
          });
        } else if (attack.damageType === 'anatema' || attack.damageType === 'direct_heart') {
          updatedPgs[i] = applyAnatemaDamage(updatedPgs[i], finalDamage);
          logEntries.push({
            id: generateId(),
            round,
            tick: tickPosition,
            timestamp: Date.now(),
            message: `${pg.name}: DANNO ANATEMA! ${finalDamage} Cuore/i ferito/i`,
            type: 'damage',
          });
        }
      }
    } else {
      logEntries.push({
        id: generateId(),
        round,
        tick: tickPosition,
        timestamp: Date.now(),
        message: `Token nemico in posizione ${tickPosition}: BLUFF! Nessun danno.`,
        type: 'info',
      });
    }
  } else if (enemyToken && !enemyToken.isAttack && enemyToken.isRevealed) {
    logEntries.push({
      id: generateId(),
      round,
      tick: tickPosition,
      timestamp: Date.now(),
      message: `Token nemico in posizione ${tickPosition}: BLUFF! Nessun danno.`,
      type: 'info',
    });
  }

  // 4. Check for combos at this position
  const combos = detectCombos(updatedPgs, tickPosition);
  for (const combo of combos) {
    if (combo.hasCombo) {
      const comboDamage = calculateMonsterDamage(
        0,
        updatedMonster.traits,
        combo.participants.flatMap(p => p.card.tags),
        combo.totalDamage
      );

      if (comboDamage > 0) {
        updatedMonster = applyDamageToMonster(updatedMonster, comboDamage);
        logEntries.push({
          id: generateId(),
          round,
          tick: tickPosition,
          timestamp: Date.now(),
          message: `COMBO! ${combo.participants.map(p => `${p.pgId} (${p.role})`).join(' + ')} → ${comboDamage} danni al mostro!`,
          type: 'combo',
        });
      }
    }
  }

  // 5. Check for monster death
  if (updatedMonster.currentPf <= 0) {
    logEntries.push({
      id: generateId(),
      round,
      tick: tickPosition,
      timestamp: Date.now(),
      message: `IL MOSTRO È STATO SCONFITTO!`,
      type: 'victory',
    });
  }

  // 6. Check for PG deaths
  for (const pg of updatedPgs) {
    if (!pg.isAlive) {
      logEntries.push({
        id: generateId(),
        round,
        tick: tickPosition,
        timestamp: Date.now(),
        message: `${pg.name} È MORTO! Tutti i Cuori feriti.`,
        type: 'death',
      });
    }
  }

  return {
    logEntries,
    updatedPgs,
    updatedMonster,
    pendingResolutions,
  };
}

// --- Cleanup After Round ---
export function cleanupRound(pgs: PG[]): PG[] {
  return pgs.map(pg => {
    const newPg = { ...pg };
    // Move all ATB cards to discard
    for (const slot of newPg.atbRow) {
      if (slot.card) {
        newPg.discardPile = [...newPg.discardPile, slot.card];
      }
    }
    newPg.atbRow = [];

    // If fainted but alive, unfaint for next round
    // (fainted only lasts for the round)
    // Actually per rules: fainted = incapacitated for remainder of combat
    // So we keep isFainted = true

    return newPg;
  });
}

// --- Calculate Mitigated Damage ---
export function getMitigatedDamage(originalDamage: number): number {
  return Math.max(1, Math.floor(originalDamage / 2));
}
