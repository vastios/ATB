'use client';

import { VitalityCard, CHARACTERISTIC_COLORS } from '@/lib/types';
import { getPower } from '@/lib/gameData';

interface CardDisplayProps {
  card: VitalityCard;
  charValue?: number;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  showPower?: boolean;
  inATB?: boolean;
}

export default function CardDisplay({
  card,
  charValue,
  selected = false,
  onClick,
  compact = false,
  showPower = true,
  inATB = false,
}: CardDisplayProps) {
  const colors = CHARACTERISTIC_COLORS[card.characteristic];
  const power = charValue ? getPower(charValue, card.timeCost) : 0;

  const borderColorClass = {
    istinto: 'border-red-500',
    analisi: 'border-yellow-500',
    evasione: 'border-blue-500',
    risonanza: 'border-green-500',
  }[card.characteristic];

  const bgColorClass = {
    istinto: 'bg-red-50',
    analisi: 'bg-yellow-50',
    evasione: 'bg-blue-50',
    risonanza: 'bg-green-50',
  }[card.characteristic];

  const tagBgClass = {
    istinto: 'bg-red-100 text-red-800',
    analisi: 'bg-yellow-100 text-yellow-800',
    evasione: 'bg-blue-100 text-blue-800',
    risonanza: 'bg-green-100 text-green-800',
  }[card.characteristic];

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`
          relative rounded border-2 ${borderColorClass} ${bgColorClass} p-1
          cursor-pointer transition-all select-none
          ${selected ? 'ring-2 ring-offset-1 ring-amber-500 scale-105' : 'hover:scale-102'}
          ${inATB && !card.faceUp ? 'opacity-70' : ''}
        `}
        style={{ minWidth: '60px', minHeight: '80px' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold">{colors.emoji}</span>
          <span className="text-xs font-mono bg-black/10 rounded px-1">T{card.timeCost}</span>
        </div>
        {!card.faceUp ? (
          <div className="flex items-center justify-center h-12">
            <span className="text-gray-400 text-lg">⏳</span>
          </div>
        ) : (
          <>
            <div className="text-[9px] font-medium truncate mt-0.5">{card.name}</div>
            {showPower && charValue && (
              <div className="text-[10px] font-bold text-center mt-0.5">
                ⚔️ {power}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-lg border-2 ${borderColorClass} ${bgColorClass} p-2
        cursor-pointer transition-all select-none w-28
        ${selected ? 'ring-2 ring-offset-2 ring-amber-500 scale-105 shadow-lg' : 'hover:shadow-md'}
        ${inATB && !card.faceUp ? 'opacity-70' : ''}
      `}
    >
      {/* Header: characteristic emoji + time cost */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">{colors.emoji}</span>
        <span className="text-xs font-mono bg-black/10 rounded px-1.5 py-0.5 font-bold">
          T{card.timeCost}
        </span>
      </div>

      {!card.faceUp ? (
        <div className="flex items-center justify-center h-16">
          <span className="text-gray-400 text-2xl">⏳</span>
        </div>
      ) : (
        <>
          {/* Card name */}
          <div className="text-xs font-semibold truncate mb-1">{card.name}</div>

          {/* Tags */}
          <div className="flex flex-wrap gap-0.5 mb-1">
            {card.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className={`text-[8px] px-1 py-0.5 rounded ${tagBgClass} leading-tight`}>
                {tag}
              </span>
            ))}
            {card.tags.length > 3 && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-gray-100 text-gray-600 leading-tight">
                +{card.tags.length - 3}
              </span>
            )}
          </div>

          {/* Power value */}
          {showPower && charValue !== undefined && (
            <div className="text-sm font-bold text-center bg-black/5 rounded py-0.5">
              ⚔️ {power}
            </div>
          )}
        </>
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px]">✓</span>
        </div>
      )}
    </div>
  );
}

// --- Card for ATB display ---
export function CardATBDisplay({
  card,
  faceUp,
  resolved,
  isCurrentTick,
}: {
  card: VitalityCard | null;
  faceUp: boolean;
  resolved: boolean;
  isCurrentTick: boolean;
}) {
  if (!card) {
    return (
      <div className={`
        w-16 h-20 rounded border-2 border-dashed border-gray-300
        flex items-center justify-center
        ${isCurrentTick ? 'border-amber-500 bg-amber-50' : 'bg-gray-50'}
        ${resolved ? 'opacity-40' : ''}
      `}>
        <span className="text-gray-300 text-xs">—</span>
      </div>
    );
  }

  const borderColorClass = {
    istinto: 'border-red-500',
    analisi: 'border-yellow-500',
    evasione: 'border-blue-500',
    risonanza: 'border-green-500',
  }[card.characteristic];

  const bgColorClass = {
    istinto: faceUp ? 'bg-red-50' : 'bg-gray-100',
    analisi: faceUp ? 'bg-yellow-50' : 'bg-gray-100',
    evasione: faceUp ? 'bg-blue-50' : 'bg-gray-100',
    risonanza: faceUp ? 'bg-green-50' : 'bg-gray-100',
  }[card.characteristic];

  const emoji = CHARACTERISTIC_COLORS[card.characteristic].emoji;

  return (
    <div className={`
      w-16 h-20 rounded border-2 ${faceUp ? borderColorClass : 'border-gray-400'}
      ${bgColorClass} p-1 transition-all
      ${isCurrentTick ? 'ring-2 ring-amber-500 scale-105' : ''}
      ${resolved ? 'opacity-40' : ''}
    `}>
      {faceUp ? (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px]">{emoji}</span>
            <span className="text-[9px] font-mono font-bold">T{card.timeCost}</span>
          </div>
          <div className="text-[8px] font-medium truncate flex-1 flex items-center">{card.name}</div>
          {card.tags.includes('Imposizione') && (
            <span className="text-[7px] bg-red-200 text-red-800 rounded px-0.5 self-start">ATK</span>
          )}
          {card.tags.includes('Opposizione') && (
            <span className="text-[7px] bg-blue-200 text-blue-800 rounded px-0.5 self-start">DEF</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-lg text-gray-400">⏳</span>
          <span className="text-[8px] text-gray-500">T{card.timeCost}</span>
        </div>
      )}
    </div>
  );
}
