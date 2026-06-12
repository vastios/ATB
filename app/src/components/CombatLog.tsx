'use client';

import { CombatLogEntry } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CombatLogProps {
  entries: CombatLogEntry[];
}

const typeIcons: Record<string, string> = {
  info: 'ℹ️',
  damage: '💥',
  defense: '🛡️',
  combo: '🔗',
  heal: '💚',
  death: '💀',
  victory: '🏆',
  defeat: '☠️',
  warning: '⚠️',
};

const typeColors: Record<string, string> = {
  info: 'text-gray-600',
  damage: 'text-red-600',
  defense: 'text-blue-600',
  combo: 'text-purple-600',
  heal: 'text-green-600',
  death: 'text-red-800',
  victory: 'text-amber-600',
  defeat: 'text-red-900',
  warning: 'text-orange-600',
};

export default function CombatLog({ entries }: CombatLogProps) {
  return (
    <div className="bg-card border rounded-lg">
      <div className="p-3 border-b">
        <h3 className="text-sm font-bold flex items-center gap-2">
          📜 Registro di Combattimento
          <span className="text-xs font-normal text-muted-foreground">
            ({entries.length} eventi)
          </span>
        </h3>
      </div>
      <ScrollArea className="h-64">
        <div className="p-2 space-y-1">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nessun evento ancora...
            </p>
          )}
          {entries.map(entry => (
            <div
              key={entry.id}
              className={`
                text-xs p-1.5 rounded ${typeColors[entry.type] || 'text-gray-600'}
                ${entry.type === 'victory' ? 'bg-amber-50 font-bold' : ''}
                ${entry.type === 'defeat' ? 'bg-red-50 font-bold' : ''}
                ${entry.type === 'combo' ? 'bg-purple-50' : ''}
              `}
            >
              <span className="mr-1">{typeIcons[entry.type]}</span>
              <span className="text-muted-foreground mr-1">
                [R{entry.round}T{entry.tick}]
              </span>
              {entry.message}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
