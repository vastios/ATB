'use client';

import { useState, useEffect } from 'react';
import { Characteristics, CHARACTERISTIC_COLORS, CHARACTERISTIC_KEYS, SavedPG } from '@/lib/types';
import { getDeckComposition, validateCharacteristics, TOTAL_CHARACTERISTIC_POINTS, MIN_CHARACTERISTIC_VALUE, MAX_CHARACTERISTIC_VALUE } from '@/lib/gameData';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function generateId(): string {
  return `pg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function PGCreator() {
  const { savedPGs, addPG, removePG, loadPGs } = useGameStore();
  const [name, setName] = useState('');
  const [characteristics, setCharacteristics] = useState<Characteristics>({
    istinto: 1,
    analisi: 1,
    evasione: 1,
    risonanza: 1,
  });

  useEffect(() => {
    loadPGs();
  }, [loadPGs]);

  const validation = validateCharacteristics(characteristics);
  const deckComp = getDeckComposition(characteristics);
  const totalCards = deckComp.reduce((sum, dc) => sum + dc.totalCards, 0);

  function handleCharacteristicChange(key: keyof Characteristics, value: number) {
    const newChars = { ...characteristics, [key]: value };
    const total = Object.values(newChars).reduce((a, b) => a + b, 0);
    if (total > TOTAL_CHARACTERISTIC_POINTS) return;
    setCharacteristics(newChars);
  }

  function handleSave() {
    if (!name.trim()) return;
    if (!validation.valid) return;

    const pg: SavedPG = {
      id: generateId(),
      name: name.trim(),
      characteristics: { ...characteristics },
      createdAt: Date.now(),
    };

    addPG(pg);
    setName('');
    setCharacteristics({ istinto: 1, analisi: 1, evasione: 1, risonanza: 1 });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Creator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧙 Creazione Personaggio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="text-sm font-medium mb-1 block">Nome del PG</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Inserisci il nome..."
              className="w-full"
            />
          </div>

          {/* Characteristic Sliders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Caratteristiche</h3>
              <Badge variant={validation.valid ? 'default' : 'destructive'}>
                Punti: {validation.total}/{TOTAL_CHARACTERISTIC_POINTS}
                {validation.remaining !== 0 && ` (${validation.remaining > 0 ? `${validation.remaining} rimasti` : 'troppi!'})`}
              </Badge>
            </div>

            {CHARACTERISTIC_KEYS.map(key => {
              const colors = CHARACTERISTIC_COLORS[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1">
                      {colors.emoji} {colors.label}
                    </label>
                    <span className={`text-lg font-bold ${colors.text}`}>
                      {characteristics[key]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => handleCharacteristicChange(key, Math.max(MIN_CHARACTERISTIC_VALUE, characteristics[key] - 1))}
                      disabled={characteristics[key] <= MIN_CHARACTERISTIC_VALUE}
                    >
                      -
                    </Button>
                    <Slider
                      value={[characteristics[key]]}
                      min={MIN_CHARACTERISTIC_VALUE}
                      max={MAX_CHARACTERISTIC_VALUE}
                      step={1}
                      onValueChange={([v]) => handleCharacteristicChange(key, v)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => handleCharacteristicChange(key, Math.min(MAX_CHARACTERISTIC_VALUE, characteristics[key] + 1))}
                      disabled={characteristics[key] >= MAX_CHARACTERISTIC_VALUE || validation.remaining <= 0}
                    >
                      +
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hearts Display */}
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <span className="text-sm font-medium">Cuori:</span>
            <span className="text-lg">❤️ ❤️ ❤️</span>
            <span className="text-xs text-muted-foreground">(3 Cuori, feriti in ordine 1→2→3)</span>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !validation.valid}
            className="w-full"
            size="lg"
          >
            💾 Salva PG
          </Button>

          {!validation.valid && (
            <p className="text-xs text-destructive text-center">
              Distribuisci esattamente {TOTAL_CHARACTERISTIC_POINTS} punti tra le caratteristiche
            </p>
          )}
        </CardContent>
      </Card>

      {/* Right: Deck Composition & Saved PGs */}
      <div className="space-y-4">
        {/* Deck Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              🃏 Composizione Mazzo Vitalità
              <Badge variant="outline">{totalCards}/60 carte</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deckComp.map(dc => {
                const colors = CHARACTERISTIC_COLORS[dc.characteristic];
                return (
                  <div key={dc.characteristic} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-1">
                        {colors.emoji} {colors.label} ({dc.value})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dc.totalCards} carte
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {(['T1', 'T2', 'T3', 'T4', 'T5'] as const).map(t => {
                        const count = dc.timeDistribution[t];
                        const tc = parseInt(t.replace('T', ''));
                        return (
                          <div
                            key={t}
                            className={`
                              text-center p-1 rounded text-xs border
                              ${count > 0 ? colors.border + ' ' + (dc.characteristic === 'istinto' ? 'bg-red-50' : dc.characteristic === 'analisi' ? 'bg-yellow-50' : dc.characteristic === 'evasione' ? 'bg-blue-50' : 'bg-green-50') : 'border-gray-200 bg-gray-50 text-gray-400'}
                            `}
                          >
                            <div className="font-bold">{t}</div>
                            <div className={count > 0 ? 'font-semibold' : ''}>
                              {count}×6={count * 6}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-0.5 h-3">
                      {(['T1', 'T2', 'T3', 'T4', 'T5'] as const).map(t => {
                        const count = dc.timeDistribution[t];
                        const tc = parseInt(t.replace('T', ''));
                        const barColors: Record<number, string> = {
                          1: 'bg-red-400',
                          2: 'bg-orange-400',
                          3: 'bg-yellow-400',
                          4: 'bg-blue-400',
                          5: 'bg-purple-400',
                        };
                        return (
                          <div
                            key={t}
                            className={`${barColors[tc]} rounded-sm`}
                            style={{ width: `${(count * 6 / Math.max(dc.totalCards, 1)) * 100}%`, minWidth: count > 0 ? '4px' : '0' }}
                            title={`${t}: ${count * 6} carte`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Saved PGs List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              📋 PG Salvati ({savedPGs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savedPGs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nessun PG salvato. Crea il tuo primo personaggio!
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedPGs.map(pg => (
                  <div
                    key={pg.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div>
                      <div className="text-sm font-semibold">{pg.name}</div>
                      <div className="flex gap-2 text-xs">
                        {CHARACTERISTIC_KEYS.map(key => {
                          const colors = CHARACTERISTIC_COLORS[key];
                          return (
                            <span key={key} className={colors.text}>
                              {colors.emoji} {pg.characteristics[key]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePG(pg.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
