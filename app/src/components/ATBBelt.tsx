'use client';

import { PG, Monster, EnemyToken, ATBSlot, CHARACTERISTIC_COLORS } from '@/lib/types';
import { CardATBDisplay } from './CardDisplay';
import { VitalityCard } from '@/lib/types';

interface ATBBeltProps {
  pgs: PG[];
  monster: Monster | null;
  currentTick: number;
  maxTick: number;
}

export default function ATBBelt({ pgs, monster, currentTick, maxTick }: ATBBeltProps) {
  const totalSlots = Math.max(maxTick + 1, 5);

  return (
    <div className="bg-gray-900 rounded-xl p-4 text-white">
      {/* ATB Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg font-bold">⚔️ Cintura ATB</span>
        <span className="text-sm text-gray-400">
          Tick: {currentTick}/{maxTick}
        </span>
      </div>

      {/* Tick indicators */}
      <div className="flex mb-2" style={{ paddingLeft: '100px' }}>
        {Array.from({ length: totalSlots }, (_, i) => (
          <div
            key={i}
            className={`
              w-16 text-center text-xs font-mono mr-1
              ${i === currentTick ? 'text-amber-400 font-bold' : 'text-gray-500'}
            `}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Current tick indicator */}
      <div className="flex mb-1" style={{ paddingLeft: '100px' }}>
        {Array.from({ length: totalSlots }, (_, i) => (
          <div key={i} className="w-16 mr-1 flex justify-center">
            {i === currentTick && (
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-amber-400" />
            )}
          </div>
        ))}
      </div>

      {/* Enemy Row */}
      {monster && (
        <div className="flex items-center mb-2">
          <div className="w-[100px] flex-shrink-0 text-xs font-semibold text-red-400 truncate pr-2">
            👹 {monster.name}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalSlots }, (_, i) => {
              const token = monster.atbRow.find(t => t.position === i);
              return (
                <div key={i} className="mr-1">
                  {token ? (
                    <EnemyTokenDisplay
                      token={token}
                      isCurrentTick={i === currentTick}
                      attacks={monster.attacks}
                    />
                  ) : (
                    <div className={`
                      w-16 h-20 rounded border-2 border-dashed border-red-900/50
                      flex items-center justify-center
                      ${i === currentTick ? 'border-amber-500 bg-amber-900/20' : 'bg-gray-800/50'}
                    `}>
                      <span className="text-gray-600 text-xs">—</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PG Rows */}
      {pgs.map(pg => {
        const colors = CHARACTERISTIC_COLORS[pg.characteristics.istinto >= pg.characteristics.analisi &&
          pg.characteristics.istinto >= pg.characteristics.evasione &&
          pg.characteristics.istinto >= pg.characteristics.risonanza ? 'istinto' :
          pg.characteristics.analisi >= pg.characteristics.evasione &&
          pg.characteristics.analisi >= pg.characteristics.risonanza ? 'analisi' :
          pg.characteristics.evasione >= pg.characteristics.risonanza ? 'evasione' : 'risonanza'];

        return (
          <div key={pg.id} className="flex items-center mb-2">
            <div className="w-[100px] flex-shrink-0 text-xs font-semibold truncate pr-2">
              <div className="flex items-center gap-1">
                <span className={pg.isAlive ? (pg.isFainted ? 'text-gray-500' : 'text-green-400') : 'text-red-600'}>
                  {pg.isAlive ? (pg.isFainted ? '😵' : '🟢') : '💀'}
                </span>
                <span className={pg.isAlive ? 'text-white' : 'text-gray-500 line-through'}>
                  {pg.name}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalSlots }, (_, i) => {
                const slot = pg.atbRow.find(s => s.position === i);
                return (
                  <div key={i} className="mr-1">
                    {slot?.card ? (
                      <CardATBDisplay
                        card={slot.card}
                        faceUp={slot.faceUp}
                        resolved={slot.resolved}
                        isCurrentTick={i === currentTick}
                      />
                    ) : (
                      <div className={`
                        w-16 h-20 rounded border-2 border-dashed border-gray-700
                        flex items-center justify-center
                        ${i === currentTick ? 'border-amber-500 bg-amber-900/20' : 'bg-gray-800/30'}
                      `}>
                        <span className="text-gray-600 text-xs">—</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Enemy Token Display ---
function EnemyTokenDisplay({
  token,
  isCurrentTick,
  attacks,
}: {
  token: EnemyToken;
  isCurrentTick: boolean;
  attacks: { id: string; name: string; powerLevel: number; damageAmount: number }[];
}) {
  if (!token.isRevealed) {
    return (
      <div className={`
        w-16 h-20 rounded border-2 border-red-700 bg-red-900/40
        flex flex-col items-center justify-center
        ${isCurrentTick ? 'ring-2 ring-amber-500' : ''}
      `}>
        <span className="text-2xl">❓</span>
        <span className="text-[8px] text-red-400 mt-1">Token</span>
      </div>
    );
  }

  if (token.isAttack && token.attackId) {
    const attack = attacks.find(a => a.id === token.attackId);
    return (
      <div className={`
        w-16 h-20 rounded border-2 border-red-500 bg-red-900/60
        flex flex-col items-center justify-center p-1
        ${isCurrentTick ? 'ring-2 ring-amber-500' : ''}
      `}>
        <span className="text-sm">⚔️</span>
        <span className="text-[7px] text-red-300 text-center leading-tight">
          {attack?.name || 'Attacco'}
        </span>
        {attack && (
          <span className="text-[8px] text-red-400 font-bold">
            {attack.damageAmount} dmg
          </span>
        )}
      </div>
    );
  }

  // Bluff
  return (
    <div className={`
      w-16 h-20 rounded border-2 border-gray-500 bg-gray-700/40
      flex flex-col items-center justify-center
      ${isCurrentTick ? 'ring-2 ring-amber-500' : ''}
    `}>
      <span className="text-sm">🃏</span>
      <span className="text-[7px] text-gray-400 mt-1">Bluff!</span>
    </div>
  );
}
