# Builds — Deliverable PDF

Questa directory contiene i PDF ufficiali del Manuale del Giocatore (e futuri deliverable), sempre sincronizzati con GitHub.

## File presenti

| File | Descrizione | Pagina di aggiornamento |
|------|-------------|-------------------------|
| `ATB_Manuale_Giocatore_Parte_I.pdf` | Parte I — Fondamenti (Frontespizio + Cap.1–3) | Ogni volta che si completano nuovi capitoli |

## Come rigenerare

Il PDF è prodotto dallo script `../scripts/build_mg_pdf.py`, che legge i JSON sorgente da `../docs/00_manuale_giocatore/` e produce HTML + PDF.

```bash
# 1. Genera l'HTML
python3 ../scripts/build_mg_pdf.py

# 2. Converti in PDF (richiede Node + Playwright)
node /path/to/html2pdf-next.js ATB_Manuale_Giocatore_Parte_I.html ATB_Manuale_Giocatore_Parte_I.pdf --nopaged

# 3. Copia il PDF qui dentro
cp /path/to/output/ATB_Manuale_Giocatore_Parte_I.pdf .

# 4. Commit + push
git add builds/ && git commit -m "[BUILD] Aggiornamento PDF Parte I" && git push
```

## Convenzione sui nomi

- `ATB_Manuale_Giocatore_Parte_<I|II|III...>.pdf` — una Parte completa
- `ATB_Manuale_Giocatore_COMPLETO.pdf` — manuale integrale (quando tutte le Parti sono pronte)

Quando si aggiorna un PDF, sostituire il file esistente (non accumulare versioni datate — la storia è in git).
