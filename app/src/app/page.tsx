'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PGCreator from '@/components/PGCreator';
import MonsterCreator from '@/components/MonsterCreator';
import CombatSimulator from '@/components/CombatSimulator';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <div>
                <h1 className="text-lg font-bold tracking-tight">ATB Combat Simulator</h1>
                <p className="text-xs text-muted-foreground">Active Time Battle — RPG Card System</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">🔴 Istinto</span>
              <span className="hidden sm:inline">🟡 Analisi</span>
              <span className="hidden sm:inline">🔵 Evasione</span>
              <span className="hidden sm:inline">🟢 Risonanza</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <Tabs defaultValue="combat" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pg" className="text-sm">
              🧙 Creazione PG
            </TabsTrigger>
            <TabsTrigger value="monster" className="text-sm">
              👹 Creazione Mostri
            </TabsTrigger>
            <TabsTrigger value="combat" className="text-sm">
              ⚔️ Tavolo di Gioco
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pg">
            <PGCreator />
          </TabsContent>

          <TabsContent value="monster">
            <MonsterCreator />
          </TabsContent>

          <TabsContent value="combat">
            <CombatSimulator />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-3 text-center text-xs text-muted-foreground">
          ATB Combat Simulator — Strumento di playtest per il sistema di combattimento ATB
        </div>
      </footer>
    </div>
  );
}
