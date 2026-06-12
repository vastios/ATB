'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CHARACTERISTIC_COLORS, CHARACTERISTIC_KEYS, CharacteristicKey, DamageResolution } from '@/lib/types';
import { getCurrentCharacteristicValue } from '@/lib/gameEngine';
import { getPower } from '@/lib/gameData';
import ATBBelt from './ATBBelt';
import CombatLog from './CombatLog';
import CardDisplay from './CardDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export default function CombatSimulator() {
  const {
    savedPGs, savedMonsters, combatPGs, combatMonster, combatState,
    startCombat, endCombat, playCardsForPG, placeEnemyTokensAction,
    placeBossATBAction, advanceTick, resolveDamage, performCleanup,
    currentPlanningPgIndex,
  } = useGameStore();

  const [selectedPgIds, setSelectedPgIds] = useState<string[]>([]);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [faceUpCards, setFaceUpCards] = useState<string[]>([]);
  const [bossPowerLevel, setBossPowerLevel] = useState(3);
  const [damageDialogOpen, setDamageDialogOpen] = useState(false);
  const [currentResolution, setCurrentResolution] = useState<DamageResolution | null>(null);
  const [woundChoice, setWoundChoice] = useState<CharacteristicKey>('istinto');

  const { phase, round, currentTick, maxTick, combatLog, pendingDamageResolutions } = combatState;

  // Get the current PG that needs to plan
  const alivePGs = useMemo(() => combatPGs.filter(p => p.isAlive && !p.isFainted), [combatPGs]);
  const currentPlanningPg = alivePGs[currentPlanningPgIndex] || null;

  // Check for pending damage resolutions after advancing
  const pendingResolution = pendingDamageResolutions.length > 0 ? pendingDamageResolutions[0] : null;

  // Handle pending damage resolution
  if (pendingResolution && !damageDialogOpen) {
    setCurrentResolution(pendingResolution);
    setDamageDialogOpen(true);
  }

  function handleStartCombat() {
    if (selectedPgIds.length === 0 || !selectedMonsterId) return;
    startCombat(selectedPgIds, selectedMonsterId);
    setSelectedCards([]);
    setFaceUpCards([]);
  }

  function handlePlayCards() {
    if (!currentPlanningPg || selectedCards.length === 0) return;
    playCardsForPG(currentPlanningPg.id, selectedCards, faceUpCards);
    setSelectedCards([]);
    setFaceUpCards([]);
  }

  function handleToggleCard(cardId: string) {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
      setFaceUpCards(faceUpCards.filter(id => id !== cardId));
    } else {
      if (selectedCards.length >= 5) return; // max 5 cards
      setSelectedCards([...selectedCards, cardId]);
    }
  }

  function handleToggleFaceUp(cardId: string) {
    if (faceUpCards.includes(cardId)) {
      setFaceUpCards(faceUpCards.filter(id => id !== cardId));
    } else {
      setFaceUpCards([...faceUpCards, cardId]);
    }
  }

  function handleResolveDamage(choice: 'milling' | 'wound') {
    if (!currentResolution) return;
    resolveDamage(currentResolution, choice, woundChoice);
    setDamageDialogOpen(false);
    setCurrentResolution(null);
  }

  // --- SETUP PHASE ---
  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>⚔️ Tavolo di Gioco — Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PG Selection */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Seleziona PG (1-4)</h3>
              {savedPGs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun PG salvato. Vai a &quot;Creazione PG&quot; per crearne uno.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedPGs.map(pg => (
                    <label key={pg.id} className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedPgIds.includes(pg.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                    `}>
                      <Checkbox
                        checked={selectedPgIds.includes(pg.id)}
                        onCheckedChange={(checked) => {
                          if (checked && selectedPgIds.length < 4) {
                            setSelectedPgIds([...selectedPgIds, pg.id]);
                          } else {
                            setSelectedPgIds(selectedPgIds.filter(id => id !== pg.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{pg.name}</div>
                        <div className="flex gap-2 text-xs">
                          {CHARACTERISTIC_KEYS.map(key => {
                            const colors = CHARACTERISTIC_COLORS[key];
                            return (
                              <span key={key} className={colors.text}>
                                {colors.emoji}{pg.characteristics[key]}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Monster Selection */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Seleziona Mostro</h3>
              {savedMonsters.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun mostro salvato. Vai a &quot;Creazione Mostri&quot; per crearne uno.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedMonsters.map(m => (
                    <label key={m.id} className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedMonsterId === m.id ? 'border-destructive bg-destructive/5' : 'border-border hover:border-destructive/50'}
                    `}>
                      <Checkbox
                        checked={selectedMonsterId === m.id}
                        onCheckedChange={(checked) => {
                          setSelectedMonsterId(checked ? m.id : null);
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{m.name}</div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">
                            {m.tier === 'epico' ? 'Epico' : m.tier === 'elite' ? 'Elite' : 'Base'}
                          </Badge>
                          <span>PF: {m.pf}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleStartCombat}
              disabled={selectedPgIds.length === 0 || !selectedMonsterId}
              size="lg"
              className="w-full"
            >
              ⚔️ Inizia Combattimento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- VICTORY / DEFEAT ---
  if (phase === 'victory' || phase === 'defeat') {
    return (
      <div className="space-y-4">
        <Card className={phase === 'victory' ? 'border-amber-500' : 'border-red-500'}>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">
              {phase === 'victory' ? '🏆' : '☠️'}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {phase === 'victory' ? 'VITTORIA!' : 'SCONFITTA!'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {phase === 'victory'
                ? 'Il mostro è stato sconfitto!'
                : 'Tutti i PG sono morti...'}
            </p>
            <CombatLog entries={combatLog} />
            <Button onClick={endCombat} className="mt-4" size="lg">
              🔄 Nuovo Combattimento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- MAIN COMBAT UI ---
  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-card border rounded-lg p-3">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">Round {round}</Badge>
          <Badge variant={phase === 'resolution' ? 'default' : phase === 'planning' ? 'secondary' : 'outline'}>
            {phase === 'planning' ? '📋 Pianificazione' :
             phase === 'enemy_phase' ? '👹 Fase Nemico' :
             phase === 'resolution' ? `⚔️ Risoluzione (Tick ${currentTick + 1}/${maxTick + 1})` :
             phase === 'cleanup' ? '🧹 Cleanup' : phase}
          </Badge>
        </div>
        <Button variant="destructive" size="sm" onClick={endCombat}>
          ✕ Termina
        </Button>
      </div>

      {/* Enemy Section */}
      {combatMonster && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👹</span>
                <div>
                  <h3 className="font-bold">{combatMonster.name}</h3>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {combatMonster.tier === 'epico' ? 'Epico' : combatMonster.tier === 'elite' ? 'Elite' : 'Base'}
                    </Badge>
                    {combatMonster.traits.filter(t => !t.destroyed).map(t => (
                      <Badge key={t.id} variant="secondary" className="text-[10px]">
                        {t.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right min-w-[200px]">
                <div className="text-sm font-semibold">
                  PF: {combatMonster.currentPf}/{combatMonster.maxPf}
                </div>
                <Progress
                  value={(combatMonster.currentPf / combatMonster.maxPf) * 100}
                  className="h-3 mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ATB Belt */}
      <ATBBelt
        pgs={combatPGs}
        monster={combatMonster}
        currentTick={currentTick}
        maxTick={maxTick}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PG Areas */}
        <div className="lg:col-span-2 space-y-3">
          {/* Planning Phase UI */}
          {phase === 'planning' && currentPlanningPg && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  📋 Pianificazione: {currentPlanningPg.name}
                  <Badge variant="outline">{currentPlanningPgIndex + 1}/{alivePGs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Seleziona 1-5 carte dalla mano. Ogni carta può essere scoperta (azione) o coperta (fatica/costo tempo).
                </p>

                {/* Hand Cards */}
                <div className="flex flex-wrap gap-2">
                  {currentPlanningPg.hand.map(card => {
                    const isSelected = selectedCards.includes(card.id);
                    const isFaceUp = faceUpCards.includes(card.id);
                    const charValue = getCurrentCharacteristicValue(currentPlanningPg, card.characteristic);
                    const power = getPower(charValue, card.timeCost);

                    return (
                      <div key={card.id} className="relative">
                        <CardDisplay
                          card={card}
                          charValue={charValue}
                          selected={isSelected}
                          onClick={() => handleToggleCard(card.id)}
                        />
                        {isSelected && (
                          <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
                            <button
                              className={`
                                text-[10px] px-2 py-0.5 rounded-full border
                                ${isFaceUp ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-100 border-gray-400 text-gray-600'}
                              `}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFaceUp(card.id);
                              }}
                            >
                              {isFaceUp ? '↑ Scoperta' : '↓ Coperta'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedCards.length > 0 && (
                  <div className="flex items-center gap-3 mt-4">
                    <div className="text-xs text-muted-foreground">
                      Selezionate: {selectedCards.length} carte |
                      Scoperte: {faceUpCards.length} |
                      Coperte: {selectedCards.length - faceUpCards.length}
                    </div>
                    <Button onClick={handlePlayCards} size="sm" className="ml-auto">
                      ✓ Gioca Carte
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Enemy Phase UI */}
          {phase === 'enemy_phase' && (
            <Card className="border-red-200">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">👹 Fase Nemico</h3>
                <p className="text-xs text-muted-foreground">
                  Il Master posiziona i token nella Cintura ATB.
                </p>
                {combatMonster?.tier === 'epico' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Livello Potere Boss (1-9):</label>
                    <div className="flex items-center gap-2">
                      <Select value={String(bossPowerLevel)} onValueChange={v => setBossPowerLevel(parseInt(v))}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <SelectItem key={n} value={String(n)}>Potere {n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => placeBossATBAction(bossPowerLevel)}>
                        Gioca Potere {bossPowerLevel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={placeEnemyTokensAction} className="w-full">
                    🎲 Posiziona Token ({combatMonster?.tokenConfig.attacks} ATK + {combatMonster?.tokenConfig.bluffs} BLF)
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resolution Phase UI */}
          {phase === 'resolution' && (
            <Card className="border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">
                      ⚔️ Risoluzione — Tick {currentTick + 1}/{maxTick + 1}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Risolvi la colonna corrente da sinistra a destra.
                    </p>
                  </div>
                  <Button onClick={advanceTick} size="lg" className="bg-amber-600 hover:bg-amber-700">
                    ▶ Avanza
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cleanup Phase UI */}
          {phase === 'cleanup' && (
            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">🧹 Fine Round {round}</h3>
                    <p className="text-xs text-muted-foreground">
                      Tutte le carte giocate vanno agli scarti. Preparati per il prossimo round.
                    </p>
                  </div>
                  <Button onClick={performCleanup} size="lg">
                    ▶ Prossimo Round
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PG Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {combatPGs.map(pg => {
              const isCurrentPlanning = phase === 'planning' && currentPlanningPg?.id === pg.id;
              return (
                <Card key={pg.id} className={`${isCurrentPlanning ? 'ring-2 ring-amber-500' : ''} ${!pg.isAlive ? 'opacity-50' : ''}`}>
                  <CardContent className="p-3 space-y-2">
                    {/* PG Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{pg.name}</span>
                        {!pg.isAlive && <Badge variant="destructive" className="text-[9px]">MORTO</Badge>}
                        {pg.isFainted && pg.isAlive && <Badge variant="secondary" className="text-[9px]">SVENUTO</Badge>}
                      </div>
                    </div>

                    {/* Hearts */}
                    <div className="flex gap-1">
                      {pg.hearts.map(h => (
                        <span key={h.index} className={`text-sm ${h.wounded ? 'grayscale opacity-50' : ''}`}>
                          {h.wounded ? '🖤' : '❤️'}
                        </span>
                      ))}
                    </div>

                    {/* Characteristics */}
                    <div className="grid grid-cols-4 gap-1">
                      {CHARACTERISTIC_KEYS.map(key => {
                        const colors = CHARACTERISTIC_COLORS[key];
                        const current = getCurrentCharacteristicValue(pg, key);
                        const max = pg.characteristics[key];
                        const wounded = current < max;
                        return (
                          <div key={key} className={`text-center p-1 rounded text-xs ${wounded ? 'bg-red-50 border border-red-200' : 'bg-muted'}`}>
                            <div className="text-[10px]">{colors.emoji}</div>
                            <div className={`font-bold ${wounded ? 'text-red-600 line-through' : colors.text}`}>
                              {current}
                            </div>
                            {wounded && <div className="text-[9px] text-red-400">/{max}</div>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Deck Info */}
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>🎲 Mazzo: {pg.vitalityDeck.length}</span>
                      <span>✋ Mano: {pg.hand.length}</span>
                      <span>🗑️ Scarti: {pg.discardPile.length}</span>
                    </div>

                    {/* Hand (compact, not during planning for current PG) */}
                    {!(isCurrentPlanning && phase === 'planning') && pg.hand.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pg.hand.slice(0, 5).map(card => (
                          <CardDisplay
                            key={card.id}
                            card={card}
                            charValue={getCurrentCharacteristicValue(pg, card.characteristic)}
                            compact
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Combat Log */}
        <div>
          <CombatLog entries={combatLog} />
        </div>
      </div>

      {/* Damage Resolution Dialog */}
      <Dialog open={damageDialogOpen} onOpenChange={setDamageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>💥 Risoluzione Danno</DialogTitle>
          </DialogHeader>
          {currentResolution && (() => {
            const pg = combatPGs.find(p => p.id === currentResolution.pgId);
            return pg ? (
              <div className="space-y-4">
                <p className="text-sm">
                  <strong>{pg.name}</strong> subisce <strong>{currentResolution.damageAmount}</strong> danni{' '}
                  {currentResolution.perfectBlock && <span className="text-blue-600">(Blocco Perfetto!)</span>}
                  {currentResolution.mitigated && <span className="text-blue-600">(Mitigato! Riduzione: {currentResolution.mitigationReduction})</span>}
                </p>

                <div className="bg-muted p-3 rounded-md space-y-2">
                  <h4 className="text-sm font-semibold">Scegli come assorbire il danno:</h4>

                  {/* Option A: Milling */}
                  <button
                    onClick={() => handleResolveDamage('milling')}
                    className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-semibold text-sm">Opzione A — Milling (La Stanchezza)</div>
                    <div className="text-xs text-muted-foreground">
                      Scarta {currentResolution.damageAmount} carte dalla cima del Mazzo Vitalità.
                      {pg.vitalityDeck.length < currentResolution.damageAmount && (
                        <span className="text-red-600 font-bold"> ⚠️ Il mazzo non basta! Ferita Cuore + Svenimento!</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Mazzo: {pg.vitalityDeck.length} carte | Scarti: {pg.discardPile.length}
                    </div>
                  </button>

                  {/* Option B: Wound */}
                  <button
                    onClick={() => {
                      if (woundChoice) handleResolveDamage('wound');
                    }}
                    className="w-full text-left p-3 border rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <div className="font-semibold text-sm">Opzione B — Ferita (Il Sacrificio)</div>
                    <div className="text-xs text-muted-foreground">
      Ferisci UNA Caratteristica a tua scelta. Assorbe TUTTO il danno ma il valore scende di 1.
                    </div>
                    <div className="mt-2">
                      <label className="text-xs font-medium">Scegli Caratteristica da ferire:</label>
                      <div className="flex gap-1 mt-1">
                        {CHARACTERISTIC_KEYS.map(key => {
                          const colors = CHARACTERISTIC_COLORS[key];
                          const current = getCurrentCharacteristicValue(pg, key);
                          const max = pg.characteristics[key];
                          const canWound = current > 0;
                          return (
                            <button
                              key={key}
                              disabled={!canWound}
                              onClick={(e) => {
                                e.stopPropagation();
                                setWoundChoice(key);
                              }}
                              className={`
                                px-2 py-1 rounded text-xs border transition-colors
                                ${woundChoice === key ? 'border-primary bg-primary/10' : 'border-border'}
                                ${!canWound ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                              `}
                            >
                              {colors.emoji} {colors.label} ({current}/{max})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : null;
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDamageDialogOpen(false)}>
              Annulla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
