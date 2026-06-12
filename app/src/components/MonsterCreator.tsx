'use client';

import { useState, useEffect } from 'react';
import {
  MonsterTier, MonsterAttack, MonsterTrait, MonsterSpecialAttack,
  SavedMonster, DamageType, TraitType, SpecialAttackType,
  CHARACTERISTIC_KEYS, CharacteristicKey, CardTag
} from '@/lib/types';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

function generateId(): string {
  return `mon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const TIER_LABELS: Record<MonsterTier, string> = {
  base: 'Base',
  elite: 'Elite',
  epico: 'Epico (Boss)',
};

const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  standard: 'Standard',
  direct_characteristic: 'Diretto Caratteristica',
  direct_heart: 'Diretto Cuore',
  anatema: 'Anatema',
};

const TRAIT_TYPE_LABELS: Record<TraitType, string> = {
  armatura_fissa: 'Armatura Fissa',
  resistenza: 'Resistenza/Immunità',
  ritorsione: 'Ritorsione',
  sconfitta_alternativa: 'Sconfitta Alternativa',
};

const SPECIAL_ATTACK_LABELS: Record<SpecialAttackType, string> = {
  colpo_mirato: 'Colpo Mirato',
  squarcio_anima: 'Squarcio dell\'Anima',
  distruzione_risorse: 'Distruzione Risorse',
  modifica_atb: 'Modifica ATB',
};

export default function MonsterCreator() {
  const { savedMonsters, addMonster, removeMonster, loadMonsters } = useGameStore();

  const [name, setName] = useState('');
  const [tier, setTier] = useState<MonsterTier>('base');
  const [pf, setPf] = useState(10);
  const [attacks, setAttacks] = useState<MonsterAttack[]>([]);
  const [traits, setTraits] = useState<MonsterTrait[]>([]);
  const [specialAttacks, setSpecialAttacks] = useState<MonsterSpecialAttack[]>([]);
  const [tokenAttacks, setTokenAttacks] = useState(3);
  const [tokenBluffs, setTokenBluffs] = useState(2);

  // Form states
  const [attackName, setAttackName] = useState('');
  const [attackPower, setAttackPower] = useState(3);
  const [attackDamage, setAttackDamage] = useState(5);
  const [attackDamageType, setAttackDamageType] = useState<DamageType>('standard');
  const [attackTargetChar, setAttackTargetChar] = useState<CharacteristicKey>('istinto');

  const [traitType, setTraitType] = useState<TraitType>('armatura_fissa');
  const [traitName, setTraitName] = useState('');
  const [traitDesc, setTraitDesc] = useState('');
  const [traitValue, setTraitValue] = useState(2);
  const [traitResistedTag, setTraitResistedTag] = useState<CardTag>('Imposizione');
  const [traitResistedChar, setTraitResistedChar] = useState<CharacteristicKey>('istinto');

  const [specialType, setSpecialType] = useState<SpecialAttackType>('colpo_mirato');
  const [specialName, setSpecialName] = useState('');
  const [specialDesc, setSpecialDesc] = useState('');
  const [specialTargetChar, setSpecialTargetChar] = useState<CharacteristicKey>('istinto');
  const [specialDamage, setSpecialDamage] = useState(2);

  useEffect(() => {
    loadMonsters();
  }, [loadMonsters]);

  function addAttack() {
    if (!attackName.trim()) return;
    const newAttack: MonsterAttack = {
      id: generateId(),
      name: attackName.trim(),
      powerLevel: attackPower,
      damageAmount: attackDamage,
      damageType: attackDamageType,
      targetCharacteristic: attackDamageType === 'direct_characteristic' ? attackTargetChar : undefined,
    };
    setAttacks([...attacks, newAttack]);
    setAttackName('');
  }

  function removeAttack(id: string) {
    setAttacks(attacks.filter(a => a.id !== id));
  }

  function addTrait() {
    if (!traitName.trim()) return;
    const newTrait: MonsterTrait = {
      id: generateId(),
      type: traitType,
      name: traitName.trim(),
      description: traitDesc || traitName.trim(),
      value: traitType === 'armatura_fissa' ? traitValue : undefined,
      resistedTag: traitType === 'resistenza' ? traitResistedTag : undefined,
      resistedCharacteristic: traitType === 'resistenza' ? traitResistedChar : undefined,
      resistanceAmount: traitType === 'resistenza' ? traitValue : undefined,
      destroyed: false,
    };
    setTraits([...traits, newTrait]);
    setTraitName('');
    setTraitDesc('');
  }

  function removeTrait(id: string) {
    setTraits(traits.filter(t => t.id !== id));
  }

  function addSpecialAttack() {
    if (!specialName.trim()) return;
    const newSpecial: MonsterSpecialAttack = {
      id: generateId(),
      type: specialType,
      name: specialName.trim(),
      description: specialDesc || specialName.trim(),
      targetCharacteristic: specialType === 'colpo_mirato' ? specialTargetChar : undefined,
      damageAmount: specialDamage,
    };
    setSpecialAttacks([...specialAttacks, newSpecial]);
    setSpecialName('');
    setSpecialDesc('');
  }

  function removeSpecialAttack(id: string) {
    setSpecialAttacks(specialAttacks.filter(s => s.id !== id));
  }

  function handleSave() {
    if (!name.trim() || attacks.length === 0) return;

    const monster: SavedMonster = {
      id: generateId(),
      name: name.trim(),
      tier,
      pf,
      attacks,
      traits: tier !== 'base' ? traits : [],
      specialAttacks: tier === 'epico' ? specialAttacks : [],
      tokenConfig: {
        total: tokenAttacks + tokenBluffs,
        attacks: tokenAttacks,
        bluffs: tokenBluffs,
      },
      createdAt: Date.now(),
    };

    addMonster(monster);
    setName('');
    setPf(10);
    setTier('base');
    setAttacks([]);
    setTraits([]);
    setSpecialAttacks([]);
    setTokenAttacks(3);
    setTokenBluffs(2);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Creator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👹 Creazione Mostro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome mostro..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tier</label>
              <Select value={tier} onValueChange={v => setTier(v as MonsterTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIER_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">PF (Punti Ferita)</label>
              <Input type="number" value={pf} onChange={e => setPf(parseInt(e.target.value) || 0)} min={1} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Token Config</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Attacchi</label>
                  <Input type="number" value={tokenAttacks} onChange={e => setTokenAttacks(parseInt(e.target.value) || 0)} min={0} max={5} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Bluff</label>
                  <Input type="number" value={tokenBluffs} onChange={e => setTokenBluffs(parseInt(e.target.value) || 0)} min={0} max={5} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Attacks Section */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              ⚔️ Attacchi
              <Badge variant="outline">{attacks.length}</Badge>
            </h3>
            <div className="space-y-2">
              <Input value={attackName} onChange={e => setAttackName(e.target.value)} placeholder="Nome attacco..." />
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Potere (1-9)</label>
                  <Input type="number" value={attackPower} onChange={e => setAttackPower(Math.max(1, Math.min(9, parseInt(e.target.value) || 1)))} min={1} max={9} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Danno</label>
                  <Input type="number" value={attackDamage} onChange={e => setAttackDamage(parseInt(e.target.value) || 0)} min={0} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Tipo Danno</label>
                  <Select value={attackDamageType} onValueChange={v => setAttackDamageType(v as DamageType)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DAMAGE_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {attackDamageType === 'direct_characteristic' && (
                  <div>
                    <label className="text-[10px] text-muted-foreground">Bersaglio</label>
                    <Select value={attackTargetChar} onValueChange={v => setAttackTargetChar(v as CharacteristicKey)}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CHARACTERISTIC_KEYS.map(k => (
                          <SelectItem key={k} value={k}>{k}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Button onClick={addAttack} size="sm" disabled={!attackName.trim()} className="w-full">
                + Aggiungi Attacco
              </Button>
            </div>

            {/* Attack List */}
            {attacks.length > 0 && (
              <div className="mt-2 space-y-1">
                {attacks.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-muted p-1.5 rounded text-xs">
                    <span>
                      <strong>{a.name}</strong> — Pot:{a.powerLevel} Dmg:{a.damageAmount} ({DAMAGE_TYPE_LABELS[a.damageType]})
                      {a.targetCharacteristic && ` → ${a.targetCharacteristic}`}
                    </span>
                    <Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeAttack(a.id)}>✕</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Traits Section (Elite+) */}
          {tier !== 'base' && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  🛡️ Tratti <Badge variant="outline">{traits.length}</Badge>
                  <span className="text-xs text-muted-foreground font-normal">(Elite+)</span>
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Tipo</label>
                      <Select value={traitType} onValueChange={v => setTraitType(v as TraitType)}>
                        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TRAIT_TYPE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Nome</label>
                      <Input value={traitName} onChange={e => setTraitName(e.target.value)} placeholder="Nome tratto..." />
                    </div>
                  </div>
                  <Input value={traitDesc} onChange={e => setTraitDesc(e.target.value)} placeholder="Descrizione..." />
                  {traitType === 'armatura_fissa' && (
                    <div>
                      <label className="text-[10px] text-muted-foreground">Riduzione Danno</label>
                      <Input type="number" value={traitValue} onChange={e => setTraitValue(parseInt(e.target.value) || 0)} min={0} />
                    </div>
                  )}
                  {traitType === 'resistenza' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Tag Resistito</label>
                        <Select value={traitResistedTag} onValueChange={v => setTraitResistedTag(v as CardTag)}>
                          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Imposizione', 'Opposizione', 'Istinto', 'Analisi', 'Evasione', 'Risonanza'].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Riduzione (0=Immune)</label>
                        <Input type="number" value={traitValue} onChange={e => setTraitValue(parseInt(e.target.value) || 0)} min={0} />
                      </div>
                    </div>
                  )}
                  <Button onClick={addTrait} size="sm" disabled={!traitName.trim()} className="w-full">
                    + Aggiungi Tratto
                  </Button>
                </div>

                {traits.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {traits.map(t => (
                      <div key={t.id} className="flex items-center justify-between bg-muted p-1.5 rounded text-xs">
                        <span>
                          <strong>{t.name}</strong> ({TRAIT_TYPE_LABELS[t.type]})
                          {t.value !== undefined && ` - Val:${t.value}`}
                        </span>
                        <Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeTrait(t.id)}>✕</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Special Attacks (Epico only) */}
          {tier === 'epico' && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  💀 Attacchi Speciali <Badge variant="outline">{specialAttacks.length}</Badge>
                  <span className="text-xs text-muted-foreground font-normal">(Solo Epico)</span>
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Tipo</label>
                      <Select value={specialType} onValueChange={v => setSpecialType(v as SpecialAttackType)}>
                        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(SPECIAL_ATTACK_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Nome</label>
                      <Input value={specialName} onChange={e => setSpecialName(e.target.value)} placeholder="Nome attacco speciale..." />
                    </div>
                  </div>
                  <Input value={specialDesc} onChange={e => setSpecialDesc(e.target.value)} placeholder="Descrizione..." />
                  <div className="grid grid-cols-2 gap-2">
                    {specialType === 'colpo_mirato' && (
                      <div>
                        <label className="text-[10px] text-muted-foreground">Caratteristica Bersaglio</label>
                        <Select value={specialTargetChar} onValueChange={v => setSpecialTargetChar(v as CharacteristicKey)}>
                          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CHARACTERISTIC_KEYS.map(k => (
                              <SelectItem key={k} value={k}>{k}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] text-muted-foreground">Quantità</label>
                      <Input type="number" value={specialDamage} onChange={e => setSpecialDamage(parseInt(e.target.value) || 0)} min={0} />
                    </div>
                  </div>
                  <Button onClick={addSpecialAttack} size="sm" disabled={!specialName.trim()} className="w-full">
                    + Aggiungi Attacco Speciale
                  </Button>
                </div>

                {specialAttacks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {specialAttacks.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-muted p-1.5 rounded text-xs">
                        <span>
                          <strong>{s.name}</strong> ({SPECIAL_ATTACK_LABELS[s.type]})
                          {s.damageAmount && ` - Dmg:${s.damageAmount}`}
                        </span>
                        <Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeSpecialAttack(s.id)}>✕</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Save Button */}
          <Button onClick={handleSave} disabled={!name.trim() || attacks.length === 0} className="w-full" size="lg">
            💾 Salva Mostro
          </Button>
        </CardContent>
      </Card>

      {/* Right: Saved Monsters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            📋 Mostri Salvati ({savedMonsters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedMonsters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nessun mostro salvato. Crea il tuo primo nemico!
            </p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {savedMonsters.map(m => (
                <div key={m.id} className="p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{m.name}</span>
                      <Badge variant={m.tier === 'epico' ? 'destructive' : m.tier === 'elite' ? 'default' : 'secondary'}>
                        {TIER_LABELS[m.tier]}
                      </Badge>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => removeMonster(m.id)}>
                      🗑️
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>PF: {m.pf} | Token: {m.tokenConfig.attacks} ATK + {m.tokenConfig.bluffs} BLF</div>
                    <div>Attacchi: {m.attacks.map(a => a.name).join(', ')}</div>
                    {m.traits.length > 0 && <div>Tratti: {m.traits.map(t => t.name).join(', ')}</div>}
                    {m.specialAttacks.length > 0 && <div>Speciali: {m.specialAttacks.map(s => s.name).join(', ')}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
