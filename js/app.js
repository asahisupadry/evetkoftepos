/* Evet Kofte POS — app.js
   Bootstraps the app: role select -> cashier login / admin PIN -> hands off
   to Cashier or Admin modules, which own their own screens from there. */

const App = (() => {

  const state = { screen: "roleSelect" };

  function init() {
    // A scanned receipt QR lands here with ?receipt=... — show that
    // standalone printable page instead of the normal cashier/admin app.
    const receiptParam = new URLSearchParams(location.search).get("receipt");
    if (receiptParam) {
      Receipt.renderStandalonePage(receiptParam);
      return;
    }
    updateClocks();
    setInterval(updateClocks, 1000);
    render();
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
      });
    }
  }

  function updateClocks() {
    const now = new Date();
    Utils.qsa('[data-clock="time-short"]').forEach(el => el.textContent = Utils.fmtTimeShort(now));
    Utils.qsa('[data-clock="time-full"]').forEach(el => el.textContent = Utils.fmtTime(now));
    Utils.qsa('[data-clock="date"]').forEach(el => el.textContent = Utils.fmtDate(now));
    Utils.qsa('[data-clock="date-short"]').forEach(el => el.textContent = Utils.fmtDateShort(now));
  }
  function tickClock() { updateClocks(); }

  function goRoleSelect() { state.screen = "roleSelect"; render(); }

  function render() {
    const app = document.getElementById("app");
    if (state.screen === "roleSelect") return renderRoleSelect(app);
    if (state.screen === "cashierLogin") return renderCashierLogin(app);
    if (state.screen === "adminPin") return renderAdminPin(app);
  }

  function renderRoleSelect(app) {
    const settings = DB.getSettings();
    app.innerHTML = `
      <div class="centered-screen">
        <div class="card auth-card card-pad">
          <div class="auth-logo">EK</div>
          <div class="auth-title">${Utils.escapeHtml(settings.restaurantName || "Evet Kofte")}</div>
          <div class="auth-sub">Point of Sale</div>
          <div class="role-grid">
            <button class="role-btn" id="role-cashier">
              ${Icons.wallet}
              <b>Cashier</b>
              <span>Take orders, manage tabs, close out sales</span>
            </button>
            <button class="role-btn" id="role-admin">
              ${Icons.gear}
              <b>Admin</b>
              <span>Menu, reports, expenses, settings</span>
            </button>
          </div>
        </div>
      </div>`;
    document.getElementById("role-cashier").onclick = () => { state.screen = "cashierLogin"; render(); };
    document.getElementById("role-admin").onclick = () => { state.screen = "adminPin"; render(); };
  }

  function renderCashierLogin(app) {
    const recents = (DB.getSettings().cashierNames || []).slice(-8).reverse();
    app.innerHTML = `
      <div class="centered-screen">
        <div class="card auth-card card-pad">
          <div class="auth-logo">${Icons.wallet}</div>
          <div class="auth-title">Cashier Login</div>
          <div class="auth-sub">Who's operating the register?</div>
          <div class="spacer-24"></div>
          <div class="field"><label>Your Name</label><input id="cashier-name" placeholder="e.g. Maria" autocomplete="off"></div>
          ${recents.length ? `
            <div class="row gap-sm" style="flex-wrap:wrap;margin:-4px 0 14px;">
              ${recents.map(n => `<button class="btn btn-sm btn-soft" data-chip="${Utils.escapeHtml(n)}">${Utils.escapeHtml(n)}</button>`).join("")}
            </div>` : ""}
          <button class="btn btn-primary btn-block btn-lg" id="cashier-continue">${Icons.arrowRight} Continue</button>
          <button class="btn btn-ghost btn-block" id="cashier-back" style="margin-top:8px;">Back</button>
        </div>
      </div>`;
    const input = document.getElementById("cashier-name");
    input.focus();
    Utils.qsa("[data-chip]", app).forEach(c => c.onclick = () => { input.value = c.dataset.chip; input.focus(); });
    document.getElementById("cashier-back").onclick = goRoleSelect;
    const go = () => {
      const name = input.value.trim();
      if (!name) { Utils.toast("Enter your name to continue.", "error"); return; }
      state.screen = null;
      Cashier.mount(name);
    };
    document.getElementById("cashier-continue").onclick = go;
    input.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  }

  function renderAdminPin(app) {
    let entered = "";
    app.innerHTML = `
      <div class="centered-screen">
        <div class="card auth-card card-pad">
          <div class="auth-logo">${Icons.lock}</div>
          <div class="auth-title">Admin Access</div>
          <div class="auth-sub">Enter the 4-digit PIN</div>
          <div class="pin-dots" id="pin-dots">
            <span class="d"></span><span class="d"></span><span class="d"></span><span class="d"></span>
          </div>
          <div class="error-text" id="pin-error"></div>
          <div class="keypad">
            <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button>
            <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button>
            <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button>
            <button data-k="back">⌫</button><button data-k="0">0</button><button data-k="go">${Icons.check}</button>
          </div>
          <button class="btn btn-ghost btn-block" id="admin-back" style="margin-top:14px;">Back</button>
        </div>
      </div>`;
    const dots = Utils.qsa(".d", document.getElementById("pin-dots"));
    const errEl = document.getElementById("pin-error");
    function paint() { dots.forEach((d, i) => d.classList.toggle("filled", i < entered.length)); }
    function tryUnlock() {
      const pin = DB.getSettings().adminPin || "1234";
      if (entered === pin) { state.screen = null; Admin.mount(); }
      else { errEl.textContent = "Incorrect PIN. Try again."; entered = ""; paint(); }
    }
    Utils.qsa("[data-k]", app).forEach(b => b.onclick = () => {
      const k = b.dataset.k;
      errEl.textContent = "";
      if (k === "back") entered = entered.slice(0, -1);
      else if (k === "go") { if (entered.length === 4) tryUnlock(); return; }
      else if (entered.length < 4) entered += k;
      paint();
      if (entered.length === 4) setTimeout(tryUnlock, 120);
    });
    document.getElementById("admin-back").onclick = goRoleSelect;
  }

  return { init, goRoleSelect, tickClock };
})();

document.addEventListener("DOMContentLoaded", App.init);

window.App = App;
