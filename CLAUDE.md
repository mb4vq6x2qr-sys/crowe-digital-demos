# Website Builder — Crowe Digital

## Verzeichnis-Struktur
```
websites/
├── _styles/
│   ├── haustechnik/     → Styles für Handwerk, Sanitär, Heizung
│   ├── massagesalon/    → Styles für Massage, Spa, Wellness
│   └── restaurant/      → Styles für Gastronomie, Café, Take-away
├── _templates/
│   ├── haustechnik/     → Sektions-Templates für Handwerksbetriebe
│   ├── massagesalon/    → Sektions-Templates für Massage & Spa ✓ vorhanden
│   └── restaurant/      → Sektions-Templates für Gastronomie
├── _snippets/
│   └── <name>/          → Je ein Ordner pro Snippet
│       ├── snippet.html → Fertiger Vanilla HTML/CSS/JS Code
│       └── info.md      → Beschreibung, Verwendungszweck, Branchen
└── clients/             → Pro Kunde ein Ordner mit index.html etc.
```

---

## TSX/JSX Komponenten konvertieren

Wenn Dani eine TSX- oder JSX-Komponente einfügt (z.B. von Aceternity UI):
1. Komponente zu Vanilla HTML/CSS/JS konvertieren (kein React, kein Build-Tool)
2. Als `snippet.html` in neuem Ordner unter `_snippets/<name>/` speichern
3. `info.md` erstellen mit: Was, Typ, Passt für, Ideal für, Stimmung, Nicht ideal für, Anpassen

---

## Snippets auswählen beim Bauen

Vor dem Bauen einer Seite:
1. Alle `_snippets/*/info.md` lesen
2. Passende Snippets anhand von Branche, Stimmung und Verwendungszweck auswählen
3. Immer `modal-system` einbinden wenn `impressum-ch`, `datenschutz-ch` oder `stornierung` verwendet werden

---

## Briefings

Projekt-Briefings liegen im Developer Vault, **nicht** im clients-Ordner:
```
~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Developer-Vault/Machine/Privat/Kunden/<projektname>/BRIEFING.md
```

Dani gibt beim Start den Pfad an (z.B. `lies Machine/Privat/Kunden/crystalthaispa/BRIEFING.md`).
Falls kein Briefing vorhanden: zuerst Briefing erstellen, dann bauen.

---

## Branchen-Zuordnung

| Branche | Style | Templates |
|---|---|---|
| Haustechnik, Sanitär, Heizung, Elektro, Reinigung | `_styles/haustechnik/` | `_templates/haustechnik/` |
| Massage, Spa, Wellness, Kosmetik, Coiffeur | `_styles/massagesalon/` | `_templates/massagesalon/` |
| Restaurant, Café, Catering, Take-away, Bar | `_styles/restaurant/` | `_templates/restaurant/` |

Snippets sind branchen-unabhängig — Auswahl via `info.md`.
Wenn ein Style/Template-Ordner leer ist: selbst erstellen und speichern.

---

## Vorgehen bei jedem Projekt

1. Lies Briefing aus Developer-Vault: `Machine/Privat/Kunden/<projektname>/BRIEFING.md`
2. Lies alle `_snippets/*/info.md` und wähle passende Snippets
3. Prüfe ob Demo oder echte Website (steht im Briefing)
4. Crawle bestehende Website falls im Briefing angegeben
5. Wähle passende Templates und Style gemäss Branche
6. Baue Seite für Seite — beginne immer mit `index.html`

---

## Demo vs. echte Website

### Beides gleich
- Styles, Templates, Snippets voll verwenden
- Kontaktdaten übernehmen wenn vorhanden, sonst Platzhalter (061 000 00 00 / info@beispiel.ch)
- Bilder: Unsplash-URLs als Platzhalter mit Kommentar `<!-- Foto ersetzen -->`

### Nur auf der echten Website
- SEO: `meta-seo` Snippet verwenden
- Google Analytics oder andere Tracking-Skripte
- Echtes Kontaktformular via Formspree (echter Endpoint)
- Echtes Impressum und echte Datenschutzerklärung
- Cookie-Banner (`cookie-banner` Snippet) — nur wenn Tracking vorhanden
- Social-Media-Links (echte URLs)

### Nur auf der Demo
- `demo-banner` Snippet ganz oben
- Mock-Kontaktformular: zeigt beim Absenden nur Alert „Danke – dies ist eine Demo"
- Mock-Impressum/Datenschutz: Platzhaltertext mit [FIRMENNAME], [ADRESSE]
- Social-Media-Links nur als `#`

---

## Regeln (immer)

- Kein Framework, kein Build-Tool – Vanilla HTML / CSS / JS only
- Mobile-first, immer
- Sprache: Deutsch (Schweiz) – kein „ß"
- Keine externen Abhängigkeiten ausser Google Fonts

---

## Neue Demo starten

Wenn Dani sagt „bau mir eine Demo für [Firmenname]":

1. Erstelle Briefing: `Developer-Vault/Machine/Privat/Kunden/<projektname>/BRIEFING.md`
2. Frage nach fehlenden Angaben (Leistungen, Ort, Farb-Präferenz)
3. Dani ergänzt in Obsidian, dann weiter mit Schritt 3 (Vorgehen oben)

---

## Bestehende Demos

| Ordner | Branche | Status |
|---|---|---|
| haustec-demo | Heizung & Sanitär | fertig |
| baanthai-demo | Thai-Massage | fertig |
| crystalthaispa_V1 | Thai-Spa | fertig |
| crystalthaispa_V2 | Thai-Spa | fertig |
| john-haustechnik-demo | Haustechnik | fertig |
| laufentaler-reinigung | Reinigung | fertig |
| ristorante-arcade | Restaurant | fertig |
| angebot | Angebotsseite | fertig |
| trapez | — | fertig |
