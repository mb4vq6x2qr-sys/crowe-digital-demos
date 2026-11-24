/* Crowe Digital – Digital-Check: Formular
   Ablauf: Willkommen → Bereiche wählen → ein Bereich pro Seite → Schluss → Prüfen → Absenden
   Speichert laufend im Browser und auf dem Server (Zwischenstand für mehrere Geräte). */
"use strict";

const API = window.DC_API || "";
const TOKEN = new URLSearchParams(location.hash.slice(1)).get("k") || "";
const LS_KEY = "dc-check-" + TOKEN;

let FB = null;                 // Fragebogen (Fragen)
let S = { antworten: {}, aktiv: null, schritt: 0, gespeichert: 0 };
let speicherTimer = null;

/* ---------- kleine Helfer ---------- */
function h(tag, attrs, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v; // nur für eigene, feste Texte
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kinder.flat()) {
    if (k == null || k === false) continue;
    el.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return el;
}
const A = () => S.antworten;
const wert = (id) => A()[id];
function setze(id, v) {
  if (v === "" || v == null || (Array.isArray(v) && !v.length)) delete A()[id];
  else A()[id] = v;
  merken();
}

/* Bedingung: {frage, hat:[...]} oder {frage, nicht:[...]} oder Liste davon (alle müssen stimmen) */
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

/* ---------- Speichern ---------- */
function merken() {
  S.gespeichert = Math.floor(Date.now() / 1000);
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
  status("Wird gespeichert …");
  clearTimeout(speicherTimer);
  speicherTimer = setTimeout(serverSpeichern, 1200);
}
async function serverSpeichern() {
  try {
    const r = await fetch(API + "/api/entwurf/" + TOKEN, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(S),
    });
    if (!r.ok) throw 0;
    const zeit = new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
    status("✓ Gespeichert " + zeit);
  } catch (e) {
    status("Nur auf diesem Gerät gespeichert (keine Verbindung)");
  }
}
function status(t) { const el = document.getElementById("speicher-status"); if (el) el.textContent = t; }

/* ---------- Schritte ---------- */
function bereiche() { return FB.bereiche.filter((b) => (S.aktiv || []).includes(b.id)); }
function schritte() {
  return ["willkommen", "auswahl", ...bereiche().map((b) => "b:" + b.id), "schluss", "pruefen"];
}
function geheZu(i) {
  const n = schritte().length;
  S.schritt = Math.max(0, Math.min(i, n - 1));
  merken();
  zeichnen();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  const t = document.querySelector("#app h1, #app h2");
  if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }
}

/* ---------- Bausteine für Fragen ---------- */
function frageKarte(f) {
  if (!erfuellt(f.wenn)) return null;
  const karte = h("section", { class: "frage" + (f.wichtig ? " wichtig" : ""), id: "q-" + f.id });
  karte.append(h("h3", { class: "frage-titel", id: "t-" + f.id }, f.frage));
  if (f.hilfe) karte.append(h("p", { class: "hilfe" }, f.hilfe));
  if (f.wichtig) karte.append(h("p", { class: "marke-wichtig" }, "Wichtig für deine Auswertung"));

  const neuZeichnen = () => { zeichnen(true); };

  if (f.typ === "single" || f.typ === "multi") {
    const multi = f.typ === "multi";
    const gruppe = h("div", { class: "optionen" + (f.optionen.length > 5 ? " viele" : ""), role: multi ? "group" : "radiogroup", "aria-labelledby": "t-" + f.id });
    const aktuell = wert(f.id);
    const liste = multi ? aktuell || [] : aktuell ? [aktuell] : [];
    const opts = [...f.optionen];
    if (f.anderes) opts.push({ id: "anderes", text: f.anderesText || "Anderes" });
    for (const o of opts) {
      const id = `${f.id}-${o.id}`;
      const inp = h("input", { type: multi ? "checkbox" : "radio", name: f.id, id, value: o.id, checked: liste.includes(o.id) });
      inp.addEventListener("change", () => {
        if (multi) {
          let neu = [...(wert(f.id) || [])];
          if (inp.checked) {
            if (o.exklusiv) neu = [o.id];
            else neu = neu.filter((x) => !(opts.find((p) => p.id === x) || {}).exklusiv).concat(o.id);
          } else neu = neu.filter((x) => x !== o.id);
          setze(f.id, neu);
        } else setze(f.id, o.id);
        neuZeichnen();
      });
      gruppe.append(h("label", { class: "option", for: id }, inp,
        h("span", { class: "option-text" }, o.text, o.unter ? h("small", {}, o.unter) : null)));
    }
    karte.append(gruppe);
    if (f.anderes && liste.includes("anderes")) karte.append(textFeld(f.id + "_anderes", f.anderesHinweis || "Was genau?", false));
  } else if (f.typ === "skala") {
    const gruppe = h("div", { class: "skala", role: "radiogroup", "aria-labelledby": "t-" + f.id });
    for (let i = f.min || 1; i <= (f.max || 5); i++) {
      const id = `${f.id}-${i}`;
      const inp = h("input", { type: "radio", name: f.id, id, value: i, checked: wert(f.id) === i });
      inp.addEventListener("change", () => { setze(f.id, i); neuZeichnen(); });
      gruppe.append(h("label", { class: "skala-punkt", for: id }, inp, h("span", {}, String(i))));
    }
    karte.append(gruppe);
    karte.append(h("div", { class: "skala-text" }, h("span", {}, f.links || ""), h("span", {}, f.rechts || "")));
  } else if (f.typ === "text") {
    karte.append(textFeld(f.id, f.platzhalter || "Stichworte reichen", f.lang !== false));
  } else if (f.typ === "zahl") {
    const inp = h("input", { type: "number", inputmode: "numeric", min: 0, class: "zahl", id: "i-" + f.id, value: wert(f.id) ?? "", "aria-labelledby": "t-" + f.id, placeholder: f.platzhalter || "" });
    inp.addEventListener("input", () => setze(f.id, inp.value === "" ? null : Number(inp.value)));
    karte.append(h("div", { class: "zahl-zeile" }, inp, f.einheit ? h("span", {}, f.einheit) : null));
  } else if (f.typ === "rang") {
    karte.append(rangFeld(f));
  }

  if (f.notiz) {
    const nid = f.id + "_notiz";
    const offen = !!wert(nid);
    const det = h("details", { class: "notiz", open: offen });
    det.append(h("summary", {}, f.notizText || "+ Etwas ergänzen (Stichworte reichen)"));
    det.append(textFeld(nid, "Stichworte reichen", true));
    karte.append(det);
  }
  return karte;
}

function textFeld(id, platzhalter, lang) {
  const el = lang
    ? h("textarea", { rows: 3, id: "i-" + id, placeholder: platzhalter })
    : h("input", { type: "text", id: "i-" + id, placeholder: platzhalter });
  el.value = wert(id) || "";
  el.addEventListener("input", () => setze(id, el.value.trim() ? el.value : null));
  return el;
}

/* Rangliste: bis zu 3 Bereiche antippen, Reihenfolge = Antippen */
function rangFeld(f) {
  const box = h("div", { class: "rang" });
  const gewaehlt = wert(f.id) || [];
  for (const b of bereiche()) {
    const pos = gewaehlt.indexOf(b.id);
    const knopf = h("button", { type: "button", class: "rang-knopf" + (pos >= 0 ? " an" : ""), "aria-pressed": pos >= 0 ? "true" : "false" },
      h("span", { class: "rang-nr" }, pos >= 0 ? String(pos + 1) : ""), b.icon + " " + b.titel);
    knopf.addEventListener("click", () => {
      let neu = [...(wert(f.id) || [])];
      if (neu.includes(b.id)) neu = neu.filter((x) => x !== b.id);
      else if (neu.length < (f.max || 3)) neu.push(b.id);
      setze(f.id, neu);
      zeichnen(true);
    });
    box.append(knopf);
  }
  return box;
}

/* Standard-Fragen am Ende jedes Bereichs */
function standardFragen(b) {
  return [
    { id: b.id + "__zeit", typ: "single", wichtig: true, frage: b.zeitFrage || "Wie viel Zeit kostet euch das pro Woche, alle zusammen?", hilfe: "Grob schätzen reicht.", optionen: FB.zeitOptionen },
    { id: b.id + "__muehsam", typ: "skala", wichtig: true, frage: "Wie mühsam ist das heute?", links: "1 = läuft gut", rechts: "5 = nervt sehr" },
    { id: b.id + "__wunsch", typ: "multi", frage: "Was würde euch am meisten helfen?", hilfe: "Mehrere Antworten möglich.", optionen: [...b.wunsch, { id: "nichts", text: "Passt so, hier muss nichts ändern", exklusiv: true }], anderes: true, anderesHinweis: "Deine Idee" },
  ];
}

/* ---------- Seiten ---------- */
function seiteWillkommen() {
  const w = FB.willkommen;
  return [
    h("p", { class: "vorzeile" }, "Für " + (FB.kunde || "")),
    h("h1", {}, w.titel),
    ...w.absaetze.map((t) => h("p", { class: "gross" }, t)),
    h("ul", { class: "punkte" }, ...w.punkte.map((t) => h("li", {}, t))),
    frageKarte({ id: "person_name", typ: "text", lang: false, frage: "Wer füllt aus?", platzhalter: "Vorname" }),
    frageKarte({ id: "person_rolle", typ: "multi", frage: "Wer ist dabei?", hilfe: "Am besten füllt ihr es zusammen aus: Inhaber und Büro wissen verschiedene Dinge.", optionen: FB.rollen }),
    knoepfe(null, "Los geht's"),
  ];
}

function seiteAuswahl() {
  if (!S.aktiv) S.aktiv = FB.bereiche.map((b) => b.id);
  const liste = h("div", { class: "auswahl" });
  for (const b of FB.bereiche) {
    const id = "aw-" + b.id;
    const inp = h("input", { type: "checkbox", id, checked: S.aktiv.includes(b.id) });
    inp.addEventListener("change", () => {
      S.aktiv = FB.bereiche.map((x) => x.id).filter((x) => (x === b.id ? inp.checked : S.aktiv.includes(x)));
      merken();
      zeichnen(true);
    });
    liste.append(h("label", { class: "auswahl-karte", for: id }, inp,
      h("span", { class: "auswahl-icon", "aria-hidden": "true" }, b.icon),
      h("span", {}, h("strong", {}, b.titel), h("small", {}, b.kurzbeschrieb),
        b.buero ? h("em", { class: "buero-marke" }, "Weiss eher das Büro") : null)));
  }
  const n = S.aktiv.length;
  return [
    h("p", { class: "vorzeile" }, "Schritt 1"),
    h("h1", {}, "Welche Bereiche betreffen euch?"),
    h("p", { class: "gross" }, "Alles ist angekreuzt. Nimm nur weg, was bei euch gar kein Thema ist. Pro Bereich brauchst du etwa 2–3 Minuten."),
    liste,
    h("p", { class: "hinweis-zeit" }, `${n} Bereiche · ca. ${Math.max(5, Math.round(n * 2.5 + 3))} Minuten, gerne in Etappen`),
    knoepfe(0, "Weiter", n === 0),
  ];
}

function seiteBereich(b) {
  const idx = bereiche().indexOf(b);
  const fragen = b.fragen.map(frageKarte).filter(Boolean);
  const std = standardFragen(b).map(frageKarte);
  return [
    h("p", { class: "vorzeile" }, `Bereich ${idx + 1} von ${bereiche().length}`),
    h("h1", {}, h("span", { class: "titel-icon", "aria-hidden": "true" }, b.icon), b.titel),
    h("p", { class: "gross" }, b.einleitung),
    b.buero ? h("p", { class: "info" }, "Diesen Bereich kennt meist das Büro besser. Du kannst ihn einfach mit «Weiter» überspringen – Jeannine oder Sabrina füllen ihn später mit dem gleichen Link aus.") : null,
    ...fragen,
    h("h2", { class: "zwischentitel" }, "Und wie fühlt sich das an?"),
    ...std,
    frageKarte({ id: b.id + "__notiz", typ: "text", frage: "Sonst noch etwas zu diesem Bereich?", platzhalter: "Freiwillig. Stichworte reichen." }),
    knoepfe(S.schritt - 1, "Weiter"),
  ];
}

function seiteSchluss() {
  return [
    h("p", { class: "vorzeile" }, "Fast fertig"),
    h("h1", {}, "Zum Schluss"),
    ...FB.schluss.map(frageKarte).filter(Boolean),
    knoepfe(S.schritt - 1, "Weiter zur Übersicht"),
  ];
}

function seitePruefen() {
  const teile = [
    h("p", { class: "vorzeile" }, "Letzter Schritt"),
    h("h1", {}, "Alles gut so?"),
    h("p", { class: "gross" }, "Hier siehst du, was noch fehlt. Du kannst jeden Bereich nochmals öffnen. Offene Bereiche kann auch das Büro später ausfüllen – erst dann absenden. Nach dem Absenden siehst du sofort die Auswertung."),
  ];
  const liste = h("ul", { class: "uebersicht" });
  bereiche().forEach((b, i) => {
    const alle = [...b.fragen.filter((f) => erfuellt(f.wenn)), ...standardFragen(b)];
    const beantwortet = alle.filter((f) => wert(f.id) != null).length;
    const fehltWichtig = !wert(b.id + "__zeit") || !wert(b.id + "__muehsam");
    const text = beantwortet === 0 ? (b.buero ? "noch offen – fürs Büro?" : "noch offen") : fehltWichtig ? "Zeit/Mühe fehlt" : `${beantwortet}/${alle.length} ✓`;
    liste.append(h("li", {},
      h("span", {}, b.icon + " " + b.titel),
      h("span", { class: "zaehler" + (fehltWichtig ? " offen" : "") }, text),
      h("button", { type: "button", class: "link", onclick: () => geheZu(2 + i) }, "Öffnen")));
  });
  teile.push(liste);
  const fehler = h("p", { class: "fehler", role: "alert" });
  const knopf = h("button", { type: "button", class: "knopf haupt gross-knopf" }, "Absenden und Auswertung ansehen");
  knopf.addEventListener("click", async () => {
    knopf.disabled = true; knopf.textContent = "Wird gesendet …"; fehler.textContent = "";
    try {
      const r = await fetch(API + "/api/senden/" + TOKEN, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ antworten: S.antworten, aktiv: S.aktiv }),
      });
      const d = await r.json();
      if (!r.ok || !d.id) throw 0;
      S.gesendet = d.id; merken();
      location.href = "auswertung.html#" + d.id;
    } catch (e) {
      knopf.disabled = false; knopf.textContent = "Nochmals versuchen";
      fehler.textContent = "Das Senden hat nicht geklappt. Deine Antworten sind gespeichert – bitte später nochmals versuchen.";
    }
  });
  teile.push(knopf, fehler, h("div", { class: "knoepfe" }, h("button", { type: "button", class: "knopf", onclick: () => geheZu(S.schritt - 1) }, "Zurück")));
  if (S.gesendet) teile.splice(3, 0, h("p", { class: "info" }, "Du hast schon einmal abgesendet. ", h("a", { href: "auswertung.html#" + S.gesendet }, "Zur Auswertung"), ". Wenn du nochmals sendest, entsteht eine neue Auswertung."));
  return teile;
}

function knoepfe(zurueck, weiterText, gesperrt) {
  return h("div", { class: "knoepfe" },
    zurueck != null ? h("button", { type: "button", class: "knopf", onclick: () => geheZu(zurueck) }, "Zurück") : h("span"),
    h("button", { type: "button", class: "knopf haupt", disabled: !!gesperrt, onclick: () => geheZu(S.schritt + 1) }, weiterText));
}

/* ---------- Zeichnen ---------- */
function zeichnen(behalteFokus) {
  const app = document.getElementById("app");
  const aktivId = behalteFokus && document.activeElement ? document.activeElement.id : null;
  const y = window.scrollY;
  const s = schritte();
  if (S.schritt >= s.length) S.schritt = s.length - 1;
  const name = s[S.schritt];
  let inhalt;
  if (name === "willkommen") inhalt = seiteWillkommen();
  else if (name === "auswahl") inhalt = seiteAuswahl();
  else if (name === "schluss") inhalt = seiteSchluss();
  else if (name === "pruefen") inhalt = seitePruefen();
  else inhalt = seiteBereich(FB.bereiche.find((b) => "b:" + b.id === name));
  app.replaceChildren(...inhalt.filter(Boolean));
  document.getElementById("balken").style.width = Math.round((S.schritt / (s.length - 1)) * 100) + "%";
  if (behalteFokus) {
    window.scrollTo(0, y);
    if (aktivId) { const el = document.getElementById(aktivId); if (el) el.focus({ preventScroll: true }); }
  }
}

/* ---------- Start ---------- */
async function start() {
  try {
    const r = await fetch(API + "/api/fragebogen/" + TOKEN);
    if (!r.ok) throw 0;
    FB = await r.json();
  } catch (e) {
    document.getElementById("app").replaceChildren(h("h1", {}, "Link ungültig"), h("p", {}, "Dieser Link funktioniert nicht. Bitte melde dich bei Dani Crowe."));
    return;
  }
  document.getElementById("kopf-titel").textContent = "Digital-Check · " + (FB.kunde || "");
  document.title = "Digital-Check · " + (FB.kunde || "");
  let lokal = null, server = null;
  try { lokal = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {}
  try { const r = await fetch(API + "/api/entwurf/" + TOKEN); if (r.ok) server = await r.json(); } catch (e) {}
  const neuer = [lokal, server].filter((x) => x && x.antworten).sort((a, b) => (b.gespeichert || 0) - (a.gespeichert || 0))[0];
  if (neuer) S = Object.assign(S, neuer);
  if (!Array.isArray(S.aktiv)) S.aktiv = FB.bereiche.map((b) => b.id);
  if (neuer && server && neuer === server && lokal && lokal.gespeichert !== server.gespeichert) status("Zwischenstand von einem anderen Gerät geladen");
  zeichnen();
}
start();
