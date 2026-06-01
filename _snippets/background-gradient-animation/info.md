# Background Gradient Animation

**Was:** Vollbild-Hintergrund mit 5 animierten Farbblobs die durch einen SVG-Goo-Filter ineinander verschmelzen. 6. Blob folgt dem Cursor (optional). Farbgebung vollständig via CSS-Variablen steuerbar.
**Typ:** Hintergrund-Effekt / Hero-Sektion
**Passt für:** alle Branchen — Farben anpassen
**Ideal für:** Hero-Hintergrund, Splash-Screen, Landingpage-Einstieg, auffällige Sektionen
**Stimmung:** dramatisch, lebendig, modern, futuristisch — je nach Farben auch sanft/elegant
**Nicht ideal für:** dezente Seiten, lange Textseiten, wenn Performance kritisch ist (viele Filter)
**Anpassen:** `--bga-bg-start`/`--bga-bg-end` für Hintergrund, `--bga-c1` bis `--bga-c5` (RGB-Werte ohne Klammern!), `--bga-pointer` für Cursor-Blob, `--bga-blend` für Blend-Mode (hard-light / screen / overlay), `data-interactive="false"` um Cursor-Blob zu deaktivieren
**Beispiel Spa Gold:** --bga-bg-start: rgb(15,13,10); --bga-bg-end: rgb(34,28,20); --bga-c1: 201,169,110; --bga-c2: 168,132,74; --bga-c3: 232,213,176; --bga-c4: 120,90,40; --bga-c5: 247,242,234;
**Hinweis:** Safari verwendet vereinfachten Blur (kein SVG-Filter) — automatisch erkannt.
