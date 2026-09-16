/* Evet Kofte POS — utils.js
   Small dependency-free helpers shared across the app. */

const Utils = (() => {

  function uid(prefix) {
    return (prefix ? prefix + "_" : "") + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function peso(amount) {
    const n = Number(amount) || 0;
    return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pesoPlain(amount) {
    const n = Number(amount) || 0;
    return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtDate(d) {
    d = d ? new Date(d) : new Date();
    return d.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  function fmtDateShort(d) {
    d = d ? new Date(d) : new Date();
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  }

  function fmtTime(d) {
    d = d ? new Date(d) : new Date();
    return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  }

  function fmtTimeShort(d) {
    d = d ? new Date(d) : new Date();
    return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  function dateKey(d) {
    d = d ? new Date(d) : new Date();
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  let toastTimer = null;
  function toast(msg, type) {
    const old = qs(".toast");
    if (old) old.remove();
    const t = el(`<div class="toast ${type || ""}">${escapeHtml(msg)}</div>`);
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3200);
  }

  function openOverlay(html, opts) {
    closeOverlay();
    const wrap = el(`<div class="overlay" id="active-overlay"></div>`);
    wrap.innerHTML = html;
    document.body.appendChild(wrap);
    if (!(opts && opts.persistent)) {
      wrap.addEventListener("mousedown", (e) => { if (e.target === wrap) closeOverlay(); });
    }
    return wrap;
  }

  function closeOverlay() {
    const o = document.getElementById("active-overlay");
    if (o) o.remove();
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function startClock(cb) {
    cb();
    return setInterval(cb, 1000);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function num(v, d) {
    const n = parseFloat(v);
    return isNaN(n) ? (d || 0) : n;
  }

  // UTF-8 safe base64 (handles accented names, peso signs, emoji, etc.)
  // — plain btoa/atob only support Latin1 and will throw on anything else.
  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  function base64ToUtf8(b64) {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return {
    uid, peso, pesoPlain, fmtDate, fmtDateShort, fmtTime, fmtTimeShort, dateKey,
    escapeHtml, el, qs, qsa, toast, openOverlay, closeOverlay, debounce, startClock,
    downloadBlob, num, utf8ToBase64, base64ToUtf8
  };
})();

window.Utils = Utils;
