/* Wo der Server mit den Antworten läuft.
   Auf demos.crowe-digital.ch (GitHub Pages) → Hetzner-Server. Lokal/direkt → gleicher Server. */
window.DC_API = /(^|\.)crowe-digital\.ch$|github\.io$/.test(location.hostname)
  ? "https://check.178-105-172-248.sslip.io"
  : "";
