# ⚔️ Progetto GdR Cappa e Spada — ATB System

> *Crescita, cambiamento ed erosione dell'identità dei personaggi.*

## 🔑 Unique Selling Points
- **Linea del Tempo ATB fluida e asimmetrica** — Il tempo è la risorsa primaria
- **Mazzo dei giocatori come unico indicatore di Stamina/Energia** — Nessun contatore separato
- **Nessuna scheda cartacea** — Identità, Salute ed Equipaggiamento sono interamente carte
- **Tempo = Danno** — Zero calcoli, lentezza equivale a potenza

## 📂 Struttura Documentazione

| File | Contenuto | Stato |
|------|-----------|-------|
| `00_project_metadata.json` | Metadati progetto e indice | ✅ Completo |
| `01_card_anatomy.json` | Anatomia delle carte | ✅ Completo |
| `02_vitality_engine.json` | Motore Vitalità (Stamina) | ✅ Completo |
| `03_atb_timeline.json` | Linea del Tempo ATB | ✅ Completo |
| `04_combat_math.json` | Matematica di Combattimento | ✅ Completo |
| `05_character_sheet.json` | Scheda Personaggio | ✅ Completo |
| `06_equipment_system.json` | Sistema Equipaggiamento | ✅ Completo |
| `07_enemy_system.json` | Sistema Nemici | ✅ Completo |
| `08_magic_system.json` | Sistema Magia | 🔲 Da definire |
| `09_exploration_system.json` | Esplorazione | 🔲 Da definire |
| `10_social_system.json` | Interazioni Sociali | 🔲 Da definire |
| `11_progression_system.json` | Creazione e Progressione PG | 🔲 Da definire |
| `12_lore.json` | Lore e Setting | 🔲 Da definire |
| `13_playtest_notes.json` | Note Playtest | 🔲 Da definire |

## 🎮 Combat Simulator (App Web)

L'applicazione di playtest è nella cartella `app/`. Permette di simulare incontri di combattimento per valutare le meccaniche.

```bash
cd app
npm install
npm run dev
```

**3 Sezioni:**
1. **Creazione PG** — Distribuzione 10 punti tra le 4 Caratteristiche
2. **Creazione Mostri** — 3 tier (Base, Elite, Epico) con attacchi e tratti
3. **Tavolo di Gioco** — Cintura ATB, pesca automatica, posizionamento carte, risoluzione

**⚠️ Importante:** Ogni modifica alle regole (docs/) deve essere integrata anche nell'app.

## 🔄 Protocollo di Backup
Ogni sezione completata viene committata e pushata su GitHub automaticamente.
