#!/usr/bin/env python3
"""
Build the ATB Manuale del Giocatore — Parte I PDF.
Reads 4 JSON files (Frontespizio + Cap.1-3) and produces HTML,
ready for html2pdf-next.js conversion.

Theme: light (black on white), 2cm top/bottom margins, with TOC.
"""
import json
import html
from pathlib import Path

# Path relativi alla root del repo (lo script vive in <repo>/scripts/)
REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = REPO_ROOT / "docs" / "00_manuale_giocatore"
FILES = [
    ("01_frontespizio.json", "frontespizio"),
    ("02_concetti_base.json", "cap1"),
    ("03_le_carte.json", "cap2"),
    ("04_la_cintura_atb.json", "cap3"),
]
OUTPUT_HTML = REPO_ROOT / "builds" / "ATB_Manuale_Giocatore_Parte_I.html"

PALETTE = {
    "bg":          "#ffffff",  # white
    "bg_alt":      "#fafafa",  # very light gray
    "surface":     "#f5f5f5",  # box surface
    "surface_strong": "#efefef",  # cross-refs box
    "text":        "#1a1a1a",  # near-black body text
    "text_strong": "#000000",  # black headings
    "muted":       "#666666",  # medium gray
    "accent":      "#8B4513",  # saddle brown (dark warm tone, good contrast on white)
    "accent_dim":  "#a0522d",
    "border":      "#cccccc",
    "border_dim":  "#e5e5e5",
}


def esc(s: str) -> str:
    return html.escape(s, quote=False)


def render_paragraphs(paragraphs):
    return "\n".join(f'<p class="body-text">{esc(p)}</p>' for p in paragraphs)


def render_box(box_data, css_class="recap-box"):
    """Render a box with title + items list."""
    title = box_data.get("title", "")
    items = box_data.get("items", [])
    paragraph = box_data.get("paragraph")

    parts = [f'<div class="{css_class}">']
    if title:
        parts.append(f'<div class="box-title">{esc(title)}</div>')
    if items:
        parts.append('<ul class="box-list">')
        for it in items:
            parts.append(f'<li>{esc(it)}</li>')
        parts.append('</ul>')
    if paragraph:
        parts.append(f'<p class="box-paragraph">{esc(paragraph)}</p>')
    parts.append('</div>')
    return "\n".join(parts)


def render_usp_list(usp_list):
    """Render the USP list (objects with name + description)."""
    parts = ['<div class="usp-list">']
    for i, usp in enumerate(usp_list, 1):
        parts.append(f'<div class="usp-item">')
        parts.append(f'<div class="usp-name"><span class="usp-num">{i}</span> {esc(usp["name"])}</div>')
        parts.append(f'<div class="usp-desc">{esc(usp["description"])}</div>')
        parts.append('</div>')
    parts.append('</div>')
    return "\n".join(parts)


def render_cross_refs(refs):
    """Render cross-references as a 'Vedi anche' box."""
    parts = ['<div class="cross-refs-box">']
    parts.append('<div class="cross-refs-label">Vedi anche</div>')
    parts.append('<ul class="cross-refs-list">')
    for r in refs:
        parts.append(f'<li>{esc(r)}</li>')
    parts.append('</ul>')
    parts.append('</div>')
    return "\n".join(parts)


def render_subsection(sub_key, sub_data, is_first_in_chapter=False):
    """Render a subsection (1.1, 1.2, etc.)."""
    parts = []
    title = sub_data.get("title", "")
    paragraphs = sub_data.get("paragraphs", [])

    heading_class = "subsection-title" + (" first-in-chapter" if is_first_in_chapter else "")
    parts.append(f'<h3 class="{heading_class}">{esc(title)}</h3>')
    parts.append('<div class="subsection-divider"></div>')
    parts.append(render_paragraphs(paragraphs))

    for k, v in sub_data.items():
        if k.startswith("box_") and isinstance(v, dict) and ("title" in v or "items" in v or "paragraph" in v):
            parts.append(render_box(v, css_class="recap-box"))

    if "usp_list" in sub_data:
        parts.append(render_usp_list(sub_data["usp_list"]))

    if "cross_references" in sub_data and sub_data["cross_references"]:
        parts.append(render_cross_refs(sub_data["cross_references"]))

    return "\n".join(parts)


def render_chapter(json_file, label):
    """Render a full chapter (frontespizio or cap.N)."""
    data = json.loads((SOURCE_DIR / json_file).read_text(encoding="utf-8"))
    content = data.get("content", {})

    parts = []

    chapter_title = data.get("chapter_title") or data.get("section_name", "")
    chapter_num = data.get("chapter_number")

    if label == "frontespizio":
        parts.append('<div class="chapter-header frontespizio-header">')
        parts.append('<div class="chapter-tag">Frontespizio</div>')
        parts.append(f'<h2 class="chapter-title">{esc(chapter_title)}</h2>')
        parts.append('<div class="chapter-divider"></div>')
        parts.append('</div>')
    else:
        parts.append('<div class="chapter-header">')
        parts.append(f'<div class="chapter-tag">Capitolo {chapter_num}</div>')
        parts.append(f'<h2 class="chapter-title">{esc(chapter_title)}</h2>')
        parts.append('<div class="chapter-divider"></div>')
        parts.append('</div>')

    if "intro" in content:
        intro = content["intro"]
        parts.append(f'<h3 class="intro-title">{esc(intro.get("title", ""))}</h3>')
        parts.append('<div class="subsection-divider"></div>')
        parts.append(render_paragraphs(intro.get("paragraphs", [])))

    sub_keys = [k for k in content.keys() if k != "intro" and k.startswith("sezione_")]
    if not sub_keys:
        sub_keys = [k for k in content.keys() if k != "intro"]

    for i, sk in enumerate(sub_keys):
        sv = content[sk]
        if not isinstance(sv, dict):
            continue
        parts.append(render_subsection(sk, sv, is_first_in_chapter=(i == 0)))

    if "cross_references" in data and data["cross_references"]:
        parts.append(render_cross_refs(data["cross_references"]))

    return "\n".join(parts)


def build_toc():
    """Build a TOC section listing all chapters and their subsections."""
    parts = ['<section class="toc-page">']
    parts.append('<div class="toc-header">')
    parts.append('<div class="chapter-tag">Indice</div>')
    parts.append('<h2 class="toc-title">Indice</h2>')
    parts.append('<div class="chapter-divider"></div>')
    parts.append('</div>')
    parts.append('<div class="toc-list">')

    for fname, label in FILES:
        data = json.loads((SOURCE_DIR / fname).read_text(encoding="utf-8"))
        content = data.get("content", {})
        chapter_title = data.get("chapter_title") or data.get("section_name", "")
        chapter_num = data.get("chapter_number")

        if label == "frontespizio":
            label_text = "Frontespizio"
        else:
            label_text = f"Capitolo {chapter_num}"

        parts.append('<div class="toc-entry toc-chapter">')
        parts.append(f'<span class="toc-label">{esc(label_text)}</span>')
        parts.append(f'<span class="toc-name">{esc(chapter_title)}</span>')
        parts.append('</div>')

        sub_keys = [k for k in content.keys() if k != "intro" and k.startswith("sezione_")]
        if not sub_keys:
            sub_keys = [k for k in content.keys() if k != "intro"]

        for sk in sub_keys:
            sv = content[sk]
            if not isinstance(sv, dict):
                continue
            sub_title = sv.get("title", "")
            parts.append('<div class="toc-entry toc-sub">')
            parts.append(f'<span class="toc-name">{esc(sub_title)}</span>')
            parts.append('</div>')

    parts.append('</div>')
    parts.append('</section>')
    return "\n".join(parts)


def build_html():
    chapters_html = []
    for fname, label in FILES:
        chapters_html.append(f'<section class="chapter">{render_chapter(fname, label)}</section>')

    chapters_combined = "\n".join(chapters_html)
    toc_html = build_toc()

    full_html = f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>ATB — Manuale del Giocatore · Parte I — Fondamenti</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Source+Serif+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>
@page {{
    size: A4;
    margin: 2cm 2cm 2cm 2cm;
}}
:root {{
    --c-bg:           {PALETTE['bg']};
    --c-bg-alt:       {PALETTE['bg_alt']};
    --c-surface:      {PALETTE['surface']};
    --c-surface-2:    {PALETTE['surface_strong']};
    --c-text:         {PALETTE['text']};
    --c-text-strong:  {PALETTE['text_strong']};
    --c-muted:        {PALETTE['muted']};
    --c-accent:       {PALETTE['accent']};
    --c-accent-dim:   {PALETTE['accent_dim']};
    --c-border:       {PALETTE['border']};
    --c-border-dim:   {PALETTE['border_dim']};
}}
html, body {{
    margin: 0;
    padding: 0;
    background: var(--c-bg);
    color: var(--c-text);
    font-family: 'Source Serif Pro', Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.65;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}}
@media screen {{
    html {{
        background: #e0e0e0;
        display: flex;
        justify-content: center;
    }}
    body {{
        margin: 20px auto;
        box-shadow: 0 0 40px rgba(0,0,0,0.15);
        width: 21cm;
    }}
}}

/* ==================== COVER ==================== */
.cover {{
    box-sizing: border-box;
    background: var(--c-bg);
    position: relative;
    overflow: hidden;
    break-after: page;
    padding: 1cm 0 1cm 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 24cm;
}}
.cover-top {{
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}}
.cover-badge {{
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    letter-spacing: 0.3em;
    color: var(--c-accent);
    text-transform: uppercase;
    font-weight: 600;
}}
.cover-roman {{
    font-family: 'Source Serif Pro', serif;
    font-size: 14pt;
    font-style: italic;
    color: var(--c-muted);
    letter-spacing: 0.2em;
}}
.cover-center {{
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-top: 4cm;
}}
.cover-acronym {{
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    font-size: 120pt;
    line-height: 0.85;
    letter-spacing: -0.04em;
    color: var(--c-text-strong);
    margin: 0;
}}
.cover-acronym .accent {{
    color: var(--c-accent);
}}
.cover-tagline {{
    font-family: 'Source Serif Pro', serif;
    font-style: italic;
    font-size: 14pt;
    color: var(--c-muted);
    margin-top: 24px;
    max-width: 460px;
    line-height: 1.5;
}}
.cover-title-block {{
    margin-top: 56px;
    position: relative;
}}
.cover-title-block::before {{
    content: "";
    display: block;
    width: 60px;
    height: 3px;
    background: var(--c-accent);
    margin-bottom: 22px;
}}
.cover-title {{
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 26pt;
    color: var(--c-text-strong);
    letter-spacing: -0.01em;
    margin: 0;
    line-height: 1.1;
}}
.cover-subtitle {{
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    font-size: 13pt;
    color: var(--c-muted);
    margin-top: 10px;
    letter-spacing: 0.02em;
}}
.cover-bottom {{
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 3cm;
}}
.cover-meta {{
    font-family: 'Inter', sans-serif;
    font-size: 9pt;
    color: var(--c-muted);
    letter-spacing: 0.05em;
    line-height: 1.6;
}}
.cover-meta .label {{
    color: var(--c-accent);
    text-transform: uppercase;
    font-size: 7.5pt;
    letter-spacing: 0.2em;
    display: block;
    margin-bottom: 4px;
    font-weight: 600;
}}
.cover-version {{
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    color: var(--c-muted);
    text-align: right;
    letter-spacing: 0.1em;
}}
.cover-version .v-num {{
    color: var(--c-accent);
    font-weight: 600;
    font-size: 10pt;
}}

/* ==================== TOC PAGE ==================== */
.toc-page {{
    break-before: page;
    break-after: page;
    padding: 0;
}}
.toc-header {{
    margin-bottom: 28px;
}}
.toc-title {{
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 28pt;
    color: var(--c-text-strong);
    letter-spacing: -0.02em;
    margin: 0;
    line-height: 1.1;
}}
.toc-list {{
    margin-top: 18px;
}}
.toc-entry {{
    display: flex;
    align-items: baseline;
    padding: 6px 0;
    border-bottom: 1px dotted var(--c-border-dim);
}}
.toc-entry:last-child {{
    border-bottom: none;
}}
.toc-chapter {{
    margin-top: 14px;
    padding: 10px 0;
    border-bottom: 1px solid var(--c-border);
}}
.toc-chapter:first-child {{
    margin-top: 0;
}}
.toc-label {{
    font-family: 'Inter', sans-serif;
    font-size: 9pt;
    font-weight: 600;
    color: var(--c-accent);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    width: 110px;
    flex-shrink: 0;
}}
.toc-chapter .toc-name {{
    font-family: 'Inter', sans-serif;
    font-size: 12pt;
    font-weight: 600;
    color: var(--c-text-strong);
}}
.toc-sub {{
    padding-left: 110px;
}}
.toc-sub .toc-name {{
    font-family: 'Source Serif Pro', serif;
    font-size: 10.5pt;
    font-weight: 400;
    color: var(--c-text);
}}

/* ==================== MAIN CONTENT ==================== */
.main-content {{
    padding: 0;
}}

.chapter {{
    margin-top: 0;
}}
.chapter + .chapter {{
    margin-top: 36px;
    border-top: 1px solid var(--c-border-dim);
    padding-top: 36px;
}}

.chapter-header {{
    break-after: avoid;
    break-inside: avoid;
    margin-bottom: 28px;
}}
.chapter-tag {{
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    letter-spacing: 0.3em;
    color: var(--c-accent);
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 10px;
}}
.chapter-title {{
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 28pt;
    color: var(--c-text-strong);
    letter-spacing: -0.02em;
    margin: 0;
    line-height: 1.1;
}}
.frontespizio-header .chapter-tag {{
    color: var(--c-muted);
}}
.chapter-divider {{
    height: 1px;
    background: linear-gradient(90deg, var(--c-accent) 0%, var(--c-accent) 60px, var(--c-border) 60px, var(--c-border) 100%);
    margin-top: 18px;
}}

/* ==================== SUBSECTIONS ==================== */
.subsection-title, .intro-title {{
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 14.5pt;
    color: var(--c-text-strong);
    letter-spacing: -0.005em;
    margin: 26px 0 0 0;
    line-height: 1.25;
    break-after: avoid;
}}
.subsection-title.first-in-chapter {{
    margin-top: 6px;
}}
.intro-title {{
    color: var(--c-accent);
    font-style: italic;
    font-family: 'Source Serif Pro', serif;
    font-size: 13pt;
    font-weight: 400;
}}
.subsection-divider {{
    height: 1px;
    background: var(--c-border-dim);
    margin: 8px 0 14px 0;
    width: 40px;
}}

/* ==================== BODY TEXT ==================== */
.body-text {{
    margin: 0 0 12px 0;
    color: var(--c-text);
    text-align: left;
    hyphens: auto;
    orphans: 3;
    widows: 3;
}}
.body-text + .body-text {{
    margin-top: 0;
}}

/* ==================== RECAP BOXES (in breve) ==================== */
.recap-box {{
    background: var(--c-surface);
    border-left: 3px solid var(--c-accent);
    padding: 14px 18px;
    margin: 18px 0 18px 0;
    break-inside: avoid;
    border-radius: 0 4px 4px 0;
}}
.box-title {{
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 9.5pt;
    color: var(--c-accent);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 8px;
}}
.box-list {{
    margin: 0;
    padding-left: 18px;
    color: var(--c-text);
    font-size: 10pt;
    line-height: 1.55;
}}
.box-list li {{
    margin-bottom: 5px;
}}
.box-list li:last-child {{
    margin-bottom: 0;
}}
.box-paragraph {{
    margin: 0;
    font-size: 10pt;
    color: var(--c-text);
    line-height: 1.55;
}}

/* ==================== USP LIST ==================== */
.usp-list {{
    margin: 20px 0;
}}
.usp-item {{
    background: var(--c-surface);
    border: 1px solid var(--c-border-dim);
    border-radius: 4px;
    padding: 12px 16px;
    margin-bottom: 10px;
    break-inside: avoid;
}}
.usp-name {{
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 11pt;
    color: var(--c-text-strong);
    margin-bottom: 4px;
}}
.usp-num {{
    display: inline-block;
    width: 22px;
    height: 22px;
    line-height: 22px;
    text-align: center;
    background: var(--c-accent);
    color: var(--c-bg);
    border-radius: 50%;
    font-size: 9pt;
    font-weight: 700;
    margin-right: 8px;
    vertical-align: middle;
}}
.usp-desc {{
    font-size: 10.5pt;
    color: var(--c-text);
    line-height: 1.55;
    padding-left: 30px;
}}

/* ==================== CROSS REFERENCES BOX ==================== */
.cross-refs-box {{
    background: var(--c-surface-2);
    border: 1px solid var(--c-border-dim);
    border-radius: 4px;
    padding: 12px 16px;
    margin: 16px 0 22px 0;
    break-inside: avoid;
}}
.cross-refs-label {{
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    font-weight: 600;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    margin-bottom: 8px;
}}
.cross-refs-list {{
    margin: 0;
    padding-left: 16px;
    color: var(--c-muted);
    font-size: 9.5pt;
    line-height: 1.55;
}}
.cross-refs-list li {{
    margin-bottom: 3px;
}}
.cross-refs-list li:last-child {{
    margin-bottom: 0;
}}

/* ==================== ENDING ==================== */
.ending {{
    margin-top: 40px;
    padding: 30px 0 10px 0;
    border-top: 1px solid var(--c-border-dim);
    break-before: avoid;
    break-inside: avoid;
}}
.ending-mark {{
    font-family: 'Inter', sans-serif;
    font-size: 9pt;
    color: var(--c-accent);
    text-transform: uppercase;
    letter-spacing: 0.3em;
    margin-bottom: 14px;
    font-weight: 600;
}}
.ending-text {{
    font-family: 'Source Serif Pro', serif;
    font-style: italic;
    font-size: 12pt;
    color: var(--c-muted);
    line-height: 1.6;
    max-width: 500px;
}}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
    <div class="cover-top">
        <div class="cover-badge">Canale 1 · Meccaniche pure</div>
        <div class="cover-roman">— I —</div>
    </div>
    <div class="cover-center">
        <div class="cover-acronym">A<span class="accent">T</span>B</div>
        <div class="cover-tagline">Active Time Battle. Un GdR card-based dove ogni colpo subito ti costringe a scegliere cosa cedere.</div>
        <div class="cover-title-block">
            <div class="cover-title">Manuale del Giocatore</div>
            <div class="cover-subtitle">Parte I — Fondamenti · Capitoli 1–3</div>
        </div>
    </div>
    <div class="cover-bottom">
        <div class="cover-meta">
            <span class="label">In questo volume</span>
            Frontespizio · Concetti base · Le carte · La Cintura ATB
        </div>
        <div class="cover-version">
            <div class="v-num">v1.0</div>
            <div>Luglio 2026</div>
        </div>
    </div>
</div>

<!-- TOC -->
{toc_html}

<!-- MAIN CONTENT -->
<div class="main-content">
{chapters_combined}
</div>

<!-- ENDING -->
<div class="ending">
    <div class="ending-mark">Fine della Parte I</div>
    <div class="ending-text">I Fondamenti sono conclusi. La Parte II — Creazione del Personaggio — entra nel dettaglio della costruzione del PG: point buy, Cuori Nominati, pool nominated, Area di Gioco.</div>
</div>

</body>
</html>
"""
    OUTPUT_HTML.write_text(full_html, encoding="utf-8")
    print(f"HTML written: {OUTPUT_HTML}  ({OUTPUT_HTML.stat().st_size} bytes)")


if __name__ == "__main__":
    build_html()
