/* Crowe Digital – Digital-Check: Auswertung mit Spider (Netz-Grafik)
   Drei Linien pro Bereich (je 0–5):
   - Zeit:      wie viel Zeit pro Woche (aus der Antwort)
   - Mühe:      wie mühsam (1–5)
   - Potenzial: wie gut sich das automatisieren lässt
                = Grundwert des Bereichs (Recherche) × wie analog es heute läuft */
"use strict";

const API = window.DC_API || "";
// #ID = Ansicht für den Kunden, #ID&voll = Ansicht für Dani (mit Potenzial, Ideen, allen Antworten)
const ID = location.hash.slice(1).split("&")[0];
const VOLL = location.hash.includes("&voll");
const SVGNS = "http://www.w3.org/2000/svg";
const FARBE = { zeit: "#3d5afe", muehe: "#e8590c", auto: "#00a3b5" };
const GUT = 3.6, TEIL = 2.6;   // Grenzen für «gut automatisierbar» / «teilweise»
let FB, ANT, AKTIV;

function h(tag, attrs, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kinder.flat()) { if (k == null || k === false) continue; el.append(k.nodeType ? k : document.createTextNode(String(k))); }
  return el;
}
function s(tag, attrs, ...kinder) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  for (const k of kinder) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
}
const wert = (id) => ANT[id];

function erfuellt(b) {
  if (!b) return true;
  if (Array.isArray(b)) return b.every(erfuellt);
  const w = wert(b.frage);
  const liste = Array.isArray(w) ? w : w == null ? [] : [w];
  if (b.hat) return b.hat.some((x) => liste.includes(x));
  if (b.nicht) return !b.nicht.some((x) => liste.includes(x));
  if (b.beantwortet) return liste.length > 0;
  return true;
}

/* ---------- Werte berechnen ---------- */
function rechne(b) {
  const zOpt = FB.zeitOptionen.find((o) => o.id === wert(b.id + "__zeit"));
  const zeitStufe = zOpt && zOpt.stufe != null ? zOpt.stufe : null;
  const stunden = zOpt && zOpt.h != null ? zOpt.h : null;
  const muehe = wert(b.id + "__muehsam") ?? null;

  // Wie analog läuft es heute? Pro Frage die höchste «luecke» der gewählten Antworten
  // (0 = gut gelöst, 1 = Papier/Kopf), dann Durchschnitt über alle beantworteten Fragen.
  const proFrage = [];
  for (const f of b.fragen) {
    if (!f.optionen || !erfuellt(f.wenn)) continue;
    const w = wert(f.id);
    const gew = Array.isArray(w) ? w : w ? [w] : [];
    const werte = gew.map((id) => (f.optionen.find((x) => x.id === id) || {}).luecke).filter((x) => x != null);
    if (werte.length) proFrage.push(Math.max(...werte));
  }
  const leer = !proFrage.length && wert(b.id + "__zeit") == null && wert(b.id + "__muehsam") == null;
  const luecke = proFrage.length ? proFrage.reduce((a, x) => a + x, 0) / proFrage.length : 0.5;
  let auto = b.potenzial * (0.4 + 0.6 * luecke);
  const wunsch = wert(b.id + "__wunsch") || [];
  if (wunsch.includes("nichts")) auto *= 0.6;
  auto = Math.round(Math.min(5, auto) * 10) / 10;

  const z = zeitStufe ?? 0, m = muehe ?? 0;
  // Eigene Wahl des Kunden («Top 3») zählt mit: Platz 1 +1.5, Platz 2 +1, Platz 3 +0.5
  const top = (wert("schluss_top3") || []).indexOf(b.id);
  const bonus = top >= 0 ? [1.5, 1, 0.5][top] : 0;
  const prio = Math.round((((z + m) / 2) * (auto / 5) + bonus) * 100) / 100;
  if (leer) return { b, zeit: null, stunden: null, muehe: null, auto: null, prio: 0, leer };
  return { b, zeit: zeitStufe, stunden, muehe, auto, prio, leer };
}

/* ---------- Spider ---------- */
function spider(werte, voll) {
  const n = werte.length;
  const B = 760, H = 640, cx = B / 2, cy = H / 2 + 6, R = 220;
  const svg = s("svg", { viewBox: `0 0 ${B} ${H}`, role: "img", "aria-label": voll ? "Netz-Grafik: Zeit, Mühe und Automatisierungs-Potenzial pro Bereich" : "Netz-Grafik: Zeit und Mühe pro Bereich" });
  const winkel = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i, v) => [cx + Math.cos(winkel(i)) * R * (v / 5), cy + Math.sin(winkel(i)) * R * (v / 5)];

  // Ringe 1–5
  for (let r = 1; r <= 5; r++) {
    const punkte = werte.map((_, i) => pt(i, r).join(",")).join(" ");
    svg.append(s("polygon", { points: punkte, fill: r % 2 ? "#fafafb" : "#ffffff", stroke: "#dedee3", "stroke-width": 1 }));
  }
  // Achsen + Beschriftung
  werte.forEach((w, i) => {
    const [x, y] = pt(i, 5);
    svg.append(s("line", { x1: cx, y1: cy, x2: x, y2: y, stroke: "#dedee3", "stroke-width": 1 }));
    const [lx, ly] = pt(i, 6.05);
    const cos = Math.cos(winkel(i));
    const anker = Math.abs(cos) < 0.25 ? "middle" : cos > 0 ? "start" : "end";
    const hoch = voll && !w.leer && w.auto >= GUT;
    const g = s("g", {});
    const t = s("text", { x: lx, y: ly, "text-anchor": anker, "dominant-baseline": "middle", "font-size": 17, "font-weight": 700, fill: w.leer ? "#9a9aa6" : hoch ? "#007c8a" : "#17171c", "font-family": "DM Sans, system-ui, sans-serif" });
    t.append(s("tspan", {}, w.b.icon + " " + (w.b.kurz || w.b.titel)));
    g.append(t);
    if (w.leer) {
      g.append(s("text", { x: lx, y: ly + 20, "text-anchor": anker, "dominant-baseline": "middle", "font-size": 13, "font-weight": 700, fill: "#9a9aa6", "font-family": "DM Sans, system-ui, sans-serif" }, "noch offen"));
      svg.append(s("line", { x1: cx, y1: cy, x2: x, y2: y, stroke: "#c4c4cc", "stroke-width": 1.5, "stroke-dasharray": "4 4" }));
    }
    if (hoch) {
      g.append(s("text", { x: lx, y: ly + 20, "text-anchor": anker, "dominant-baseline": "middle", "font-size": 13, "font-weight": 700, fill: "#007c8a", "font-family": "DM Sans, system-ui, sans-serif" }, "gut automatisierbar"));
    }
    svg.append(g);
  });
  // Skala-Zahlen
  for (let r = 1; r <= 5; r++) svg.append(s("text", { x: cx + 4, y: cy - (R * r) / 5 - 3, "font-size": 11, fill: "#9a9aa6", "font-family": "DM Sans, sans-serif" }, String(r)));

  const alleReihen = [
    { key: "auto", name: "Automatisierungs-Potenzial", farbe: FARBE.auto, fuell: 0.16, strich: "7 5" },
    { key: "zeit", name: "Zeitaufwand", farbe: FARBE.zeit, fuell: 0.1, strich: "" },
    { key: "muehe", name: "Wie mühsam", farbe: FARBE.muehe, fuell: 0.1, strich: "" },
  ];
  const reihen = voll ? alleReihen : alleReihen.filter((x) => x.key !== "auto");
  const gruppen = {};
  for (const r of reihen) {
    const g = s("g", { "data-reihe": r.key });
    // Offene Bereiche überspringen: die Linie verbindet die Nachbarn, statt eine falsche Delle zu zeigen
    const punkte = werte.map((w, i) => (w.leer ? null : pt(i, w[r.key] ?? 0).join(","))).filter(Boolean).join(" ");
    g.append(s("polygon", { points: punkte, fill: r.farbe, "fill-opacity": r.fuell, stroke: r.farbe, "stroke-width": 3, "stroke-linejoin": "round", "stroke-dasharray": r.strich }));
    werte.forEach((w, i) => {
      if (w[r.key] == null) return;
      const [x, y] = pt(i, w[r.key]);
      const c = s("circle", { cx: x, cy: y, r: 5, fill: "#fff", stroke: r.farbe, "stroke-width": 2.5 });
      c.append(s("title", {}, `${w.b.titel} – ${r.name}: ${w[r.key]}`));
      g.append(c);
    });
    gruppen[r.key] = g;
    svg.append(g);
  }
  const legende = h("div", { class: "legende" }, ...reihen.map((r) => {
    const k = h("button", { type: "button", "aria-pressed": "true" }, h("i", { style: `border-color:${r.farbe};${r.strich ? "border-top-style:dashed" : ""}` }), r.name);
    k.addEventListener("click", () => {
      const an = k.getAttribute("aria-pressed") !== "true";
      k.setAttribute("aria-pressed", String(an));
      gruppen[r.key].style.display = an ? "" : "none";
    });
    return k;
  }));
  return h("div", { class: "spider-box" }, svg, legende,
    h("p", { class: "spider-hinweis" }, voll
      ? "Je weiter aussen, desto mehr. Antippen in der Legende blendet eine Linie aus. Bereiche in Türkis lassen sich gut automatisieren."
      : "Je weiter aussen, desto mehr Zeit bzw. Mühe. Grau = noch nicht ausgefüllt."));
}

/* ---------- Text einer Antwort ---------- */
function antwortText(f) {
  const w = wert(f.id);
  if (w == null) return null;
  if (f.typ === "single" || f.typ === "multi") {
    const opts = [...(f.optionen || []), { id: "anderes", text: "Anderes" }, { id: "nichts", text: "Passt so" }];
    const liste = (Array.isArray(w) ? w : [w]).map((id) => {
      const o = opts.find((x) => x.id === id);
      if (id === "anderes" && wert(f.id + "_anderes")) return "Anderes: " + wert(f.id + "_anderes");
      return o ? o.text : id;
    });
    return liste.join(" · ");
  }
  if (f.typ === "rang") return w.map((id, i) => `${i + 1}. ${(FB.bereiche.find((b) => b.id === id) || {}).titel || id}`).join("\n");
  return String(w);
}

/* ---------- Seite ---------- */
function zeichnen() {
  const aktiv = FB.bereiche.filter((b) => AKTIV.includes(b.id));
  const werte = aktiv.map(rechne);

  const gefuellt = werte.filter((w) => !w.leer);
  const offen = werte.filter((w) => w.leer);
  const sumStunden = gefuellt.reduce((a, w) => a + (w.stunden || 0), 0);
  const gut = gefuellt.filter((w) => w.auto >= GUT).length;
  const mueh = gefuellt.filter((w) => (w.muehe || 0) >= 4);
  const fmt = (x) => (Math.round(x * 10) / 10).toLocaleString("de-CH");
  const liste = (arr) => arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " und " + arr[arr.length - 1];

  const teile = [];
  teile.push(h("p", { class: "vorzeile" }, "Digital-Check · Aufnahme"));
  teile.push(h("h1", {}, FB.kunde || "Auswertung"));
  teile.push(h("p", { class: "gross" }, `Danke${wert("person_name") ? ", " + wert("person_name") : ""}! Hier siehst du auf einen Blick, wo bei euch heute Zeit und Nerven draufgehen – so, wie ihr es beschrieben habt.`));

  teile.push(h("div", { class: "kennzahlen" },
    h("div", { class: "kennzahl" }, h("b", {}, "≈ " + fmt(sumStunden) + " h"), h("span", {}, "pro Woche für diese Arbeiten (eure Schätzung)")),
    h("div", { class: "kennzahl" }, h("b", {}, String(mueh.length)), h("span", {}, mueh.length === 1 ? "Bereich ist sehr mühsam (4–5 von 5)" : "Bereiche sind sehr mühsam (4–5 von 5)")),
    h("div", { class: "kennzahl" }, h("b", {}, `${gefuellt.length} von ${werte.length}`), h("span", {}, "Bereichen ausgefüllt")),
    VOLL ? h("div", { class: "kennzahl" }, h("b", {}, `${gut} von ${gefuellt.length}`), h("span", {}, "gut automatisierbar (nur deine Ansicht)")) : null));
  teile.push(h("p", { class: "kleingedrucktes" }, "Grobe Schätzungen – Überschneidungen zwischen Bereichen sind möglich."));

  if (werte.length >= 3) teile.push(spider(werte, VOLL));

  // Kurze Zusammenfassung: nur eigene Angaben, keine Lösungen
  const nachZeit = gefuellt.filter((w) => w.stunden).sort((a, b) => b.stunden - a.stunden).slice(0, 3);
  const nachMuehe = [...mueh].sort((a, b) => b.muehe - a.muehe);
  const eigeneTop = (wert("schluss_top3") || []).map((id) => FB.bereiche.find((b) => b.id === id)).filter(Boolean);
  const punkte = [];
  if (nachZeit.length) punkte.push(h("li", {}, h("strong", {}, "Am meisten Zeit: "), liste(nachZeit.map((w) => `${w.b.kurz || w.b.titel} (≈ ${fmt(w.stunden)} h/Woche)`)) + "."));
  if (nachMuehe.length) punkte.push(h("li", {}, h("strong", {}, "Am mühsamsten: "), liste(nachMuehe.map((w) => w.b.kurz || w.b.titel)) + "."));
  if (eigeneTop.length) punkte.push(h("li", {}, h("strong", {}, "Deine Prioritäten: "), eigeneTop.map((b, i) => `${i + 1}. ${b.kurz || b.titel}`).join(", ")));
  if (wert("schluss_wann")) punkte.push(h("li", {}, h("strong", {}, "Zeitrahmen: "), antwortText(FB.schluss.find((f) => f.id === "schluss_wann")) + "."));
  if (offen.length) punkte.push(h("li", {}, h("strong", {}, "Noch offen: "), liste(offen.map((w) => w.b.kurz || w.b.titel)) + " – das kann gerne noch jemand aus dem Büro mit dem gleichen Link ergänzen."));
  if (punkte.length) {
    teile.push(h("section", { class: "bkarte zusammenfassung" }, h("h2", {}, "Das habe ich aufgenommen"), h("ul", {}, ...punkte)));
  }
  teile.push(h("section", { class: "dani-idee" },
    h("h2", {}, h("span", {}, "Wie geht es weiter?")),
    h("p", {}, "Ich schaue mir eure Antworten in Ruhe an und melde mich bei dir mit konkreten Vorschlägen – was sich lohnt, was es kostet und womit man am besten anfängt."),
    h("p", {}, "Die besprechen wir dann gemeinsam. Entschieden wird erst danach, und nur, was für euch Sinn macht."),
    h("p", {}, "– Dani, Crowe Digital")));

  if (!VOLL) {
    teile.push(h("div", { class: "aktionen" }, h("button", { type: "button", class: "knopf", onclick: () => window.print() }, "Als PDF speichern / drucken")));
    document.getElementById("app").replaceChildren(...teile);
    return;
  }

  // ---------- Ab hier nur Danis Ansicht ----------
  const sortiert = [...gefuellt].sort((a, b) => b.prio - a.prio);
  const top = sortiert.filter((w) => w.prio > 0).slice(0, 3);
  teile.push(h("h2", { class: "nur-dani" }, "Nur für Dani: Vorbereitung fürs Gespräch"));

  if (top.length) {
    teile.push(h("h2", {}, "Wo ich anfangen würde"));
    teile.push(h("p", { class: "gross" }, "Sortiert nach: viel Zeit, viel Mühe, gut automatisierbar – und was du selbst als wichtig angekreuzt hast. Das sind Vorschläge zum Besprechen, keine fertigen Entscheide."));
    teile.push(h("div", { class: "karten" }, ...top.map((w, i) => bereichKarte(w, i + 1, true))));
  }

  const rest = sortiert.filter((w) => !top.includes(w));
  if (rest.length) {
    teile.push(h("h2", {}, "Die anderen Bereiche"));
    teile.push(h("div", { class: "karten zwei" }, ...rest.map((w) => bereichKarte(w, null, false))));
  }

  // Gut zu wissen: alle passenden Hinweise gesammelt, ruhig am Schluss
  const hinweise = aktiv.flatMap((b) => (b.gutZuWissen || []).filter((i) => erfuellt(i.wenn)).map((i) => [b, i]));
  const hinweisBox = hinweise.length ? h("details", { class: "gutzuwissen-box" },
    h("summary", {}, `Gut zu wissen: ${hinweise.length} Punkte aus der Recherche zu eurer Branche`),
    h("p", {}, "Wenn ihr das schon geregelt habt – umso besser. Keine Rechtsberatung, im Zweifel Verband oder Treuhänder fragen."),
    h("ul", {}, ...hinweise.map(([b, i]) => h("li", {}, h("strong", {}, b.titel + ": "), i.text)))) : null;

  // Eigene Idee von Crowe Digital
  const idee = (FB.daniIdeen || []).find((d) => erfuellt(d.wenn) && (!d.bereich || AKTIV.includes(d.bereich)));
  if (idee) {
    teile.push(h("section", { class: "dani-idee" },
      h("h2", {}, h("span", {}, "Idee: "), idee.titel),
      ...idee.absaetze.map((p) => h("p", {}, p))));
  }

  // Wünsche zum Schluss
  const schlussTexte = (FB.schluss || []).map((f) => [f, antwortText(f)]).filter(([, t]) => t);
  if (schlussTexte.length) {
    teile.push(h("h2", {}, "Eure Prioritäten"));
    teile.push(h("div", { class: "bkarte" }, h("dl", {}, ...schlussTexte.flatMap(([f, t]) => [h("dt", {}, f.frage), h("dd", {}, t)]))));
  }

  if (hinweisBox) teile.push(hinweisBox);

  // Alle Antworten
  const alle = h("section", { class: "alle-antworten" }, h("h2", {}, "Alle Antworten"));
  for (const w of werte) {
    const b = w.b;
    const fragen = [...b.fragen, { id: b.id + "__wunsch", typ: "multi", frage: "Was würde helfen?", optionen: b.wunsch }, { id: b.id + "__notiz", typ: "text", frage: "Ergänzung" }];
    const zeilen = [];
    for (const f of fragen) {
      if (!erfuellt(f.wenn)) continue;
      const t = antwortText(f);
      if (t) zeilen.push(h("dt", {}, f.frage), h("dd", {}, t));
      const n = wert(f.id + "_notiz");
      if (n) zeilen.push(h("dt", {}, "Notiz"), h("dd", {}, n));
    }
    alle.append(h("details", {}, h("summary", {}, b.icon + " " + b.titel), h("dl", {}, ...zeilen)));
  }
  teile.push(alle);

  teile.push(h("div", { class: "aktionen" },
    h("button", { type: "button", class: "knopf haupt", onclick: () => window.print() }, "Als PDF speichern / drucken")));
  teile.push(h("p", { class: "kleingedrucktes" }, "Die Werte beruhen auf euren Antworten und einer Einschätzung von Crowe Digital (Branchen-Recherche). Hinweise zu Gesetzen sind keine Rechtsberatung – im Zweifel Treuhänder oder Verband fragen. Ich melde mich bei dir für ein kurzes Gespräch. – Dani"));

  document.getElementById("app").replaceChildren(...teile);
}

function bereichKarte(w, rang, gross) {
  const b = w.b;
  const ideen = (b.ideen || []).filter((i) => erfuellt(i.wenn)).slice(0, gross ? 2 : 1);
  const zeile = (name, v, farbe, text) => [h("span", {}, name), h("span", { class: "spur" }, h("i", { style: `width:${((v || 0) / 5) * 100}%;background:${farbe}` })), h("span", {}, text)];
  return h("article", { class: "bkarte" + (rang ? " top" : "") },
    h("h3", {}, h("span", {}, rang ? h("span", { class: "rangzahl" }, String(rang)) : null, b.icon + " " + b.titel),
      h("small", {}, w.leer ? "noch nicht ausgefüllt" : w.auto >= GUT ? "gut automatisierbar" : w.auto >= TEIL ? "teilweise automatisierbar" : "eher wenig")),
    h("div", { class: "balken3" },
      ...zeile("Zeit", w.zeit, FARBE.zeit, w.stunden != null ? "≈ " + w.stunden.toLocaleString("de-CH") + " h/Wo." : "–"),
      ...zeile("Mühe", w.muehe, FARBE.muehe, w.muehe != null ? w.muehe + " / 5" : "–"),
      ...zeile("Potenzial", w.auto, FARBE.auto, w.auto.toLocaleString("de-CH") + " / 5")),
    ...ideen.map((i) => h("p", { class: "idee" }, h("strong", {}, i.titel + ": "), i.text)));
}

async function start() {
  try {
    const r = await fetch(API + "/api/auswertung/" + ID);
    if (!r.ok) throw 0;
    const d = await r.json();
    FB = d.fragebogen; ANT = d.antworten || {}; AKTIV = d.aktiv || FB.bereiche.map((b) => b.id);
    FB.kunde = d.kunde || FB.kunde;
  } catch (e) {
    document.getElementById("app").replaceChildren(h("h1", {}, "Nicht gefunden"), h("p", {}, "Diese Auswertung gibt es nicht."));
    return;
  }
  document.getElementById("kopf-titel").textContent = "Auswertung · " + (FB.kunde || "");
  document.title = "Auswertung · " + (FB.kunde || "");
  zeichnen();
}
start();
