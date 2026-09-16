/* Evet Kofte POS — admin.js
   Reports history + custom-range export, menu editor (food & drinks CRUD),
   all-time expenses, and settings (branding, PIN, Apps Script endpoint,
   backup/restore). */

const Admin = (() => {

  const state = { view: "reports", menuTab: "food" };

  function platformTag(orderType) {
    if (orderType === "grab") return `<span class="grab-tag">GRAB</span> `;
    if (orderType === "foodpanda") return `<span class="foodpanda-tag">FOODPANDA</span> `;
    return "";
  }

  function mount() { state.view = "reports"; render(); }

  function render() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="shell">
        <div class="nav-rail" id="nav-rail"></div>
        <div class="main">
          <div class="topbar" id="topbar"></div>
          <div class="content" id="content"></div>
        </div>
      </div>`;
    renderNav();
    renderTopbar();
    if (state.view === "reports") renderReports();
    else if (state.view === "menu") renderMenu();
    else if (state.view === "inventory") renderInventory();
    else if (state.view === "expenses") renderExpensesAdmin();
    else if (state.view === "settings") renderSettings();
  }

  function renderNav() {
    const rail = document.getElementById("nav-rail");
    const items = [
      ["reports", "Reports", Icons.reports],
      ["menu", "Menu", Icons.menu],
      ["inventory", "Inventory", Icons.box],
      ["expenses", "Expenses", Icons.receipt],
      ["settings", "Settings", Icons.gear],
    ];
    rail.innerHTML = `
      <div class="nav-brand"><div class="mark">EK</div><div class="label">Admin</div></div>
      ${items.map(([v, label, ic]) => `<button class="nav-btn ${state.view === v ? "active" : ""}" data-nav="${v}"><span class="ic">${ic}</span>${label}</button>`).join("")}
      <div class="nav-spacer"></div>
      <div class="nav-clock"><b data-clock="time-short">--:--</b><span data-clock="date-short">…</span></div>
      <button class="nav-btn danger" data-nav="logout" style="margin-top:8px;"><span class="ic">${Icons.logout}</span>Exit</button>
    `;
    rail.querySelectorAll("[data-nav]").forEach(b => b.onclick = () => {
      if (b.dataset.nav === "logout") return App.goRoleSelect();
      state.view = b.dataset.nav; render();
    });
    App.tickClock();
  }

  function renderTopbar() {
    const titles = {
      reports: ["Reports", "History, date-range exports, and sends"],
      menu: ["Menu Editor", "Add, edit, or remove food & drink items"],
      inventory: ["Inventory", "Ingredients, recipes, and stock levels"],
      expenses: ["All Expenses", "Ingredients, utilities & other costs"],
      settings: ["Settings", "Branding, PIN, and auto-report delivery"],
    };
    const [title, sub] = titles[state.view];
    document.getElementById("topbar").innerHTML = `
      <div class="topbar-left"><h1>${title}</h1><div class="sub">${sub}</div></div>
      <div class="topbar-right"><span class="badge badge-closed"><span class="dot"></span>Admin Mode</span></div>`;
  }

  /* ==================================================================
     REPORTS
     ================================================================== */
  function renderReports() {
    const content = document.getElementById("content");
    const sessions = DB.getSessions().slice().sort((a, b) => new Date(b.dateStarted) - new Date(a.dateStarted));

    const now = new Date();
    const todayKey = Utils.dateKey(now);
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 6);
    const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 29);

    const sumRange = (fromD) => sessions.filter(s => new Date(s.dateStarted) >= fromD).reduce((acc, s) => {
      const t = DB.getSessionTotals(s);
      acc.gross += t.grossSales; acc.exp += t.totalExpenses; acc.profit += t.netProfit; return acc;
    }, { gross: 0, exp: 0, profit: 0 });

    const today = sumRange(new Date(todayKey + "T00:00:00"));
    const week = sumRange(weekAgo);
    const month = sumRange(monthAgo);
    const carried = DB.getCarriedTabs();

    content.innerHTML = `
      <div class="kpi-row">
        <div class="kpi"><div class="lbl">Today's Profit</div><div class="val">${Utils.peso(today.profit)}</div></div>
        <div class="kpi"><div class="lbl">7-Day Profit</div><div class="val">${Utils.peso(week.profit)}</div></div>
        <div class="kpi"><div class="lbl">30-Day Profit</div><div class="val">${Utils.peso(month.profit)}</div></div>
        <div class="kpi red"><div class="lbl">All-Time Sessions</div><div class="val">${sessions.length}</div></div>
      </div>

      ${carried.length ? `
        <div class="card card-pad" style="margin-bottom:20px;border-color:var(--amber);">
          <div class="section-title" style="color:var(--amber);">${carried.length} Regular Tab(s) Currently Running</div>
          <p class="hint" style="margin-top:-4px;">Carried over from a previous session, not yet paid.</p>
          <div class="option-list" style="margin-top:10px;">
            ${carried.map(tb => `<div class="option-row" style="cursor:default;"><div class="nm">${platformTag(tb.orderType)}${Utils.escapeHtml(tb.customerName)}</div><div class="pr">${Utils.peso(tb.total)}</div></div>`).join("")}
          </div>
        </div>
      ` : ""}

      <div class="card card-pad" style="margin-bottom:22px;">
        <div class="section-title">Generate Custom Report</div>
        <div class="row gap" style="align-items:flex-end;flex-wrap:wrap;">
          <div class="field" style="margin:0;min-width:170px;"><label>From</label><input type="date" id="rep-from"></div>
          <div class="field" style="margin:0;min-width:170px;"><label>To</label><input type="date" id="rep-to"></div>
          <button class="btn btn-primary" id="btn-gen-report">${Icons.cloud} Generate & Send</button>
        </div>
        <p class="hint" style="margin-top:10px;">Emails and/or uploads to Google Drive automatically if set up in Settings — otherwise downloads to this device.</p>
      </div>

      <div class="tabs-toolbar"><h2>Session History</h2></div>
      <div class="card" style="overflow-x:auto;">
        <table class="table">
          <thead><tr>
            <th>Date</th><th>Cashier</th><th>Status</th><th class="num">Orders</th>
            <th class="num">Gross</th><th class="num">Grab</th><th class="num">FoodPanda</th><th class="num">Expenses</th><th class="num">Profit</th><th class="num">Carried</th><th></th>
          </tr></thead>
          <tbody id="hist-body"></tbody>
        </table>
      </div>
    `;

    const from = document.getElementById("rep-from"), to = document.getElementById("rep-to");
    to.value = Utils.dateKey(now);
    from.value = Utils.dateKey(weekAgo);

    document.getElementById("btn-gen-report").onclick = async () => {
      if (!from.value || !to.value) { Utils.toast("Pick a start and end date.", "error"); return; }
      const inRange = DB.getSessionsInRange(from.value, to.value);
      if (!inRange.length) { Utils.toast("No sessions found in that date range.", "error"); return; }
      await Report.generateAndSend(inRange, { rangeLabel: `${from.value}_to_${to.value}` });
    };

    const body = document.getElementById("hist-body");
    if (!sessions.length) {
      body.innerHTML = `<tr><td colspan="11"><div class="empty-state">${Icons.reports}<p>No sessions yet. They'll show up here once the cashier starts a day.</p></div></td></tr>`;
    } else {
      body.innerHTML = sessions.map(s => {
        const t = DB.getSessionTotals(s);
        return `
          <tr>
            <td>${Utils.fmtDateShort(s.dateStarted)}</td>
            <td>${Utils.escapeHtml(s.cashierName)}</td>
            <td>${s.status === "open" ? `<span class="badge badge-open"><span class="dot"></span>Open</span>` : `<span class="badge badge-closed"><span class="dot"></span>Closed</span>`}</td>
            <td class="num">${t.tabCount}</td>
            <td class="num">${Utils.peso(t.grossSales)}</td>
            <td class="num">${Utils.peso(t.grabSales)}</td>
            <td class="num">${Utils.peso(t.foodpandaSales)}</td>
            <td class="num">${Utils.peso(t.totalExpenses)}</td>
            <td class="num strong">${Utils.peso(t.netProfit)}</td>
            <td class="num">${s.carriedOverCount ? `<span style="color:var(--amber);font-weight:700;">${s.carriedOverCount}</span>` : "—"}</td>
            <td><button class="btn btn-icon btn-ghost" data-dl="${s.id}" title="Download report">${Icons.download}</button></td>
          </tr>`;
      }).join("");
      body.querySelectorAll("[data-dl]").forEach(b => b.onclick = async () => {
        const s = DB.getSessionById(b.dataset.dl);
        await Report.generateAndSend([s], { rangeLabel: Utils.dateKey(s.dateStarted) });
      });
    }
  }

  /* ==================================================================
     MENU EDITOR
     ================================================================== */
  function renderMenu() {
    const content = document.getElementById("content");
    content.innerHTML = `
      <div class="order-menu-tabs" style="margin-bottom:16px;">
        <button class="chip-tab ${state.menuTab === "food" ? "active" : ""}" data-mtab="food">${Icons.plate} Food</button>
        <button class="chip-tab ${state.menuTab === "drinks" ? "active" : ""}" data-mtab="drinks">${Icons.cup} Drinks</button>
      </div>
      <div class="tabs-toolbar">
        <h2>${state.menuTab === "food" ? "Food Items" : "Drinks"}</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-item">${Icons.plus} Add ${state.menuTab === "food" ? "Food Item" : "Drink"}</button>
      </div>
      <div id="menu-list"></div>
    `;
    content.querySelectorAll("[data-mtab]").forEach(b => b.onclick = () => { state.menuTab = b.dataset.mtab; renderMenu(); });
    document.getElementById("btn-add-item").onclick = () => state.menuTab === "food" ? openFoodForm(null) : openDrinkForm(null);
    state.menuTab === "food" ? renderFoodList() : renderDrinksList();
  }

  function renderFoodList() {
    const list = document.getElementById("menu-list");
    const items = DB.getFood();
    if (!items.length) { list.innerHTML = `<div class="empty-state">${Icons.plate}<h3>No food items</h3><p>Add your first dish to make it available on the cashier POS.</p></div>`; return; }
    list.innerHTML = items.map(i => `
      <div class="menu-editor-item" data-row-edit="${i.id}">
        <div class="emoji">${i.emoji || "🍽️"}</div>
        <div class="info">
          <b>${Utils.escapeHtml(i.name)}</b> ${i.active ? "" : `<span class="tag-cat">Hidden</span>`}
          <div class="p">${Utils.escapeHtml(i.category || "Menu")} · Solo ${Utils.peso(i.soloPrice)}${i.allowMeal ? ` · Meal ${Utils.peso(i.mealPrice)}` : " · No meal option"} · <span class="grab-tag">GRAB</span> ${Utils.peso(i.grabSoloPrice)}${i.allowMeal ? ` / ${Utils.peso(i.grabMealPrice)}` : ""} · <span class="foodpanda-tag">FOODPANDA</span> ${Utils.peso(i.foodpandaSoloPrice)}${i.allowMeal ? ` / ${Utils.peso(i.foodpandaMealPrice)}` : ""}</div>
        </div>
        <div class="acts">
          <button class="btn btn-outline btn-sm" data-edit="${i.id}">${Icons.edit} Edit</button>
          <button class="btn btn-danger btn-sm" data-del="${i.id}">${Icons.trash} Delete</button>
        </div>
      </div>
    `).join("");
    list.querySelectorAll("[data-row-edit]").forEach(row => row.onclick = () => openFoodForm(items.find(i => i.id === row.dataset.rowEdit)));
    list.querySelectorAll("[data-edit]").forEach(b => b.onclick = (e) => { e.stopPropagation(); openFoodForm(items.find(i => i.id === b.dataset.edit)); });
    list.querySelectorAll("[data-del]").forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Remove this food item from the menu?")) { DB.deleteFood(b.dataset.del); renderFoodList(); }
    });
  }

  function openFoodForm(existing) {
    const isEdit = !!existing;
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3>${isEdit ? "Edit" : "Add"} Food Item</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <div class="row gap">
            <div class="field" style="flex:0 0 90px;"><label>Emoji</label><input id="f-emoji" maxlength="4" value="${existing ? existing.emoji || "" : "🍽️"}"></div>
            <div class="field" style="flex:1;"><label>Name</label><input id="f-name" value="${Utils.escapeHtml(existing ? existing.name : "")}" placeholder="e.g. Beef Kofte Plate"></div>
          </div>
          <div class="field"><label>Category</label><input id="f-cat" value="${Utils.escapeHtml(existing ? existing.category : "Kofte")}" placeholder="e.g. Kofte, Sides, Wraps"></div>
          <div class="row gap">
            <div class="field" style="flex:1;"><label>Solo Price (PHP)</label><input id="f-solo" type="number" inputmode="decimal" value="${existing ? existing.soloPrice : ""}"></div>
            <div class="field" style="flex:1;"><label>Meal Price (PHP)</label><input id="f-meal" type="number" inputmode="decimal" value="${existing ? existing.mealPrice : ""}"></div>
          </div>
          <div class="row gap">
            <div class="field" style="flex:1;"><label><span class="grab-tag">GRAB</span> Solo Price (PHP)</label><input id="f-grab-solo" type="number" inputmode="decimal" value="${existing ? existing.grabSoloPrice : ""}" placeholder="Same as Solo Price"></div>
            <div class="field" style="flex:1;"><label><span class="grab-tag">GRAB</span> Meal Price (PHP)</label><input id="f-grab-meal" type="number" inputmode="decimal" value="${existing ? existing.grabMealPrice : ""}" placeholder="Same as Meal Price"></div>
          </div>
          <div class="row gap">
            <div class="field" style="flex:1;"><label><span class="foodpanda-tag">FOODPANDA</span> Solo Price (PHP)</label><input id="f-foodpanda-solo" type="number" inputmode="decimal" value="${existing ? existing.foodpandaSoloPrice : ""}" placeholder="Same as Solo Price"></div>
            <div class="field" style="flex:1;"><label><span class="foodpanda-tag">FOODPANDA</span> Meal Price (PHP)</label><input id="f-foodpanda-meal" type="number" inputmode="decimal" value="${existing ? existing.foodpandaMealPrice : ""}" placeholder="Same as Meal Price"></div>
          </div>
          <p class="hint" style="margin-top:-8px;">Delivery-platform prices are what shows up when the cashier starts a Grab or FoodPanda order — leave blank to charge the same as dine-in.</p>
          <div class="field">
            <label>Meal option (adds drink upgrade picker)</label>
            <div class="pill-toggle">
              <button type="button" data-allow="1" class="${!existing || existing.allowMeal ? "active" : ""}">Yes</button>
              <button type="button" data-allow="0" class="${existing && !existing.allowMeal ? "active" : ""}">No</button>
            </div>
          </div>
          <div class="field">
            <label>Visible on cashier POS</label>
            <div class="pill-toggle">
              <button type="button" data-active="1" class="${!existing || existing.active ? "active" : ""}">Active</button>
              <button type="button" data-active="0" class="${existing && !existing.active ? "active" : ""}">Hidden</button>
            </div>
          </div>
          <div class="hr"></div>
          <div class="section-title">Recipe / Ingredients Used <span class="muted" style="font-weight:500;text-transform:none;letter-spacing:0;">(deducted from inventory each time this is ordered)</span></div>
          ${recipeEditorHtml(existing ? existing.recipe : [])}
        </div>
        <div class="modal-foot">
          ${isEdit ? `<button class="btn btn-ghost" data-delete style="color:var(--red);margin-right:auto;">${Icons.trash} Delete</button>` : ""}
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" data-save>${Icons.check} Save</button>
        </div>
      </div>
    `);
    wireRecipeEditor(wrap);
    let allowMeal = !existing || existing.allowMeal, active = !existing || existing.active;
    wrap.querySelectorAll("[data-allow]").forEach(b => b.onclick = () => { allowMeal = b.dataset.allow === "1"; wrap.querySelectorAll("[data-allow]").forEach(x => x.classList.toggle("active", x === b)); });
    wrap.querySelectorAll("[data-active]").forEach(b => b.onclick = () => { active = b.dataset.active === "1"; wrap.querySelectorAll("[data-active]").forEach(x => x.classList.toggle("active", x === b)); });
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    if (isEdit) wrap.querySelector("[data-delete]").onclick = () => {
      if (confirm("Delete this food item?")) { DB.deleteFood(existing.id); Utils.closeOverlay(); renderMenu(); }
    };
    wrap.querySelector("[data-save]").onclick = () => {
      const name = wrap.querySelector("#f-name").value.trim();
      const soloPrice = Utils.num(wrap.querySelector("#f-solo").value, NaN);
      const mealPrice = Utils.num(wrap.querySelector("#f-meal").value, soloPrice);
      if (!name) { Utils.toast("Enter a name.", "error"); return; }
      if (!(soloPrice >= 0)) { Utils.toast("Enter a valid solo price.", "error"); return; }
      const finalMealPrice = allowMeal ? mealPrice : soloPrice;
      const grabSoloPrice = Utils.num(wrap.querySelector("#f-grab-solo").value, soloPrice);
      const grabMealPrice = Utils.num(wrap.querySelector("#f-grab-meal").value, finalMealPrice);
      const foodpandaSoloPrice = Utils.num(wrap.querySelector("#f-foodpanda-solo").value, soloPrice);
      const foodpandaMealPrice = Utils.num(wrap.querySelector("#f-foodpanda-meal").value, finalMealPrice);
      DB.upsertFood({
        id: existing ? existing.id : undefined,
        name, emoji: wrap.querySelector("#f-emoji").value.trim() || "🍽️",
        category: wrap.querySelector("#f-cat").value.trim() || "Menu",
        soloPrice, mealPrice: finalMealPrice, allowMeal, active,
        grabSoloPrice, grabMealPrice: allowMeal ? grabMealPrice : grabSoloPrice,
        foodpandaSoloPrice, foodpandaMealPrice: allowMeal ? foodpandaMealPrice : foodpandaSoloPrice,
        recipe: collectRecipe(wrap)
      });
      Utils.closeOverlay(); Utils.toast("Saved.", "success"); renderMenu();
    };
  }

  function renderDrinksList() {
    const list = document.getElementById("menu-list");
    const items = DB.getDrinks();
    if (!items.length) { list.innerHTML = `<div class="empty-state">${Icons.cup}<h3>No drinks</h3><p>Add drinks for the Drinks tab and meal upgrades.</p></div>`; return; }
    const cats = [...new Set(items.map(d => d.category || "Drinks"))];
    list.innerHTML = cats.map(cat => `
      <div class="menu-cat">${Utils.escapeHtml(cat)}</div>
      ${items.filter(d => (d.category || "Drinks") === cat).map(d => `
        <div class="menu-editor-item" data-row-edit="${d.id}">
          <div class="emoji">${d.emoji || "🥤"}</div>
          <div class="info">
            <b>${Utils.escapeHtml(d.name)}</b> ${d.active ? "" : `<span class="tag-cat">Hidden</span>`}
            <div class="p">Standalone ${Utils.peso(d.standalonePrice)} · Meal upgrade ${d.mealUpgradePrice === 0 && d.availableMealUpgrade ? "Included" : (d.availableMealUpgrade ? "+" + Utils.peso(d.mealUpgradePrice) : "Not offered")} · <span class="grab-tag">GRAB</span> ${Utils.peso(d.grabStandalonePrice)} · <span class="foodpanda-tag">FOODPANDA</span> ${Utils.peso(d.foodpandaStandalonePrice)}</div>
          </div>
          <div class="acts">
            <button class="btn btn-outline btn-sm" data-edit="${d.id}">${Icons.edit} Edit</button>
            <button class="btn btn-danger btn-sm" data-del="${d.id}">${Icons.trash} Delete</button>
          </div>
        </div>
      `).join("")}
    `).join("");
    list.querySelectorAll("[data-row-edit]").forEach(row => row.onclick = () => openDrinkForm(items.find(d => d.id === row.dataset.rowEdit)));
    list.querySelectorAll("[data-edit]").forEach(b => b.onclick = (e) => { e.stopPropagation(); openDrinkForm(items.find(d => d.id === b.dataset.edit)); });
    list.querySelectorAll("[data-del]").forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Remove this drink from the menu?")) { DB.deleteDrink(b.dataset.del); renderDrinksList(); }
    });
  }

  function openDrinkForm(existing) {
    const isEdit = !!existing;
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3>${isEdit ? "Edit" : "Add"} Drink</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <div class="row gap">
            <div class="field" style="flex:0 0 90px;"><label>Emoji</label><input id="d-emoji" maxlength="4" value="${existing ? existing.emoji || "" : "🥤"}"></div>
            <div class="field" style="flex:1;"><label>Name</label><input id="d-name" value="${Utils.escapeHtml(existing ? existing.name : "")}" placeholder="e.g. Budweiser"></div>
          </div>
          <div class="field"><label>Category</label><input id="d-cat" value="${Utils.escapeHtml(existing ? existing.category : "Drinks")}" placeholder="e.g. Beer, Wine, Cocktails, Soft Drinks"></div>
          <div class="row gap">
            <div class="field" style="flex:1;"><label>Standalone Price (PHP)</label><input id="d-standalone" type="number" inputmode="decimal" value="${existing ? existing.standalonePrice : ""}"></div>
            <div class="field" style="flex:1;"><label>Meal Upgrade Price (0 = standard/free)</label><input id="d-upgrade" type="number" inputmode="decimal" value="${existing ? existing.mealUpgradePrice : "0"}"></div>
          </div>
          <div class="row gap">
            <div class="field" style="flex:1;"><label><span class="grab-tag">GRAB</span> Standalone Price (PHP)</label><input id="d-grab-standalone" type="number" inputmode="decimal" value="${existing ? existing.grabStandalonePrice : ""}" placeholder="Same as Standalone Price"></div>
            <div class="field" style="flex:1;"><label><span class="grab-tag">GRAB</span> Meal Upgrade Price (PHP)</label><input id="d-grab-upgrade" type="number" inputmode="decimal" value="${existing ? existing.grabMealUpgradePrice : ""}" placeholder="Same as Meal Upgrade Price"></div>
          </div>
          <div class="row gap">
            <div class="field" style="flex:1;"><label><span class="foodpanda-tag">FOODPANDA</span> Standalone Price (PHP)</label><input id="d-foodpanda-standalone" type="number" inputmode="decimal" value="${existing ? existing.foodpandaStandalonePrice : ""}" placeholder="Same as Standalone Price"></div>
            <div class="field" style="flex:1;"><label><span class="foodpanda-tag">FOODPANDA</span> Meal Upgrade Price (PHP)</label><input id="d-foodpanda-upgrade" type="number" inputmode="decimal" value="${existing ? existing.foodpandaMealUpgradePrice : ""}" placeholder="Same as Meal Upgrade Price"></div>
          </div>
          <p class="hint" style="margin-top:-8px;">Leave blank to charge the same as dine-in for delivery orders.</p>
          <div class="field">
            <label>Sell standalone (Drinks tab)</label>
            <div class="pill-toggle">
              <button type="button" data-standalone="1" class="${!existing || existing.availableStandalone ? "active" : ""}">Yes</button>
              <button type="button" data-standalone="0" class="${existing && !existing.availableStandalone ? "active" : ""}">No</button>
            </div>
          </div>
          <div class="field">
            <label>Offer as meal upgrade</label>
            <div class="pill-toggle">
              <button type="button" data-upg="1" class="${!existing || existing.availableMealUpgrade ? "active" : ""}">Yes</button>
              <button type="button" data-upg="0" class="${existing && !existing.availableMealUpgrade ? "active" : ""}">No</button>
            </div>
          </div>
          <div class="field">
            <label>Visible on cashier POS</label>
            <div class="pill-toggle">
              <button type="button" data-active="1" class="${!existing || existing.active ? "active" : ""}">Active</button>
              <button type="button" data-active="0" class="${existing && !existing.active ? "active" : ""}">Hidden</button>
            </div>
          </div>
          <div class="hr"></div>
          <div class="section-title">Recipe / Ingredients Used <span class="muted" style="font-weight:500;text-transform:none;letter-spacing:0;">(deducted from inventory each time this is ordered)</span></div>
          ${recipeEditorHtml(existing ? existing.recipe : [])}
        </div>
        <div class="modal-foot">
          ${isEdit ? `<button class="btn btn-ghost" data-delete style="color:var(--red);margin-right:auto;">${Icons.trash} Delete</button>` : ""}
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" data-save>${Icons.check} Save</button>
        </div>
      </div>
    `);
    wireRecipeEditor(wrap);
    let standalone = !existing || existing.availableStandalone, upg = !existing || existing.availableMealUpgrade, active = !existing || existing.active;
    wrap.querySelectorAll("[data-standalone]").forEach(b => b.onclick = () => { standalone = b.dataset.standalone === "1"; wrap.querySelectorAll("[data-standalone]").forEach(x => x.classList.toggle("active", x === b)); });
    wrap.querySelectorAll("[data-upg]").forEach(b => b.onclick = () => { upg = b.dataset.upg === "1"; wrap.querySelectorAll("[data-upg]").forEach(x => x.classList.toggle("active", x === b)); });
    wrap.querySelectorAll("[data-active]").forEach(b => b.onclick = () => { active = b.dataset.active === "1"; wrap.querySelectorAll("[data-active]").forEach(x => x.classList.toggle("active", x === b)); });
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    if (isEdit) wrap.querySelector("[data-delete]").onclick = () => {
      if (confirm("Delete this drink?")) { DB.deleteDrink(existing.id); Utils.closeOverlay(); renderMenu(); }
    };
    wrap.querySelector("[data-save]").onclick = () => {
      const name = wrap.querySelector("#d-name").value.trim();
      const standalonePrice = Utils.num(wrap.querySelector("#d-standalone").value, NaN);
      const mealUpgradePrice = Utils.num(wrap.querySelector("#d-upgrade").value, 0);
      if (!name) { Utils.toast("Enter a name.", "error"); return; }
      if (!(standalonePrice >= 0)) { Utils.toast("Enter a valid price.", "error"); return; }
      const grabStandalonePrice = Utils.num(wrap.querySelector("#d-grab-standalone").value, standalonePrice);
      const grabMealUpgradePrice = Utils.num(wrap.querySelector("#d-grab-upgrade").value, mealUpgradePrice);
      const foodpandaStandalonePrice = Utils.num(wrap.querySelector("#d-foodpanda-standalone").value, standalonePrice);
      const foodpandaMealUpgradePrice = Utils.num(wrap.querySelector("#d-foodpanda-upgrade").value, mealUpgradePrice);
      DB.upsertDrink({
        id: existing ? existing.id : undefined,
        name, emoji: wrap.querySelector("#d-emoji").value.trim() || "🥤",
        category: wrap.querySelector("#d-cat").value.trim() || "Drinks",
        standalonePrice, mealUpgradePrice,
        availableStandalone: standalone, availableMealUpgrade: upg, active,
        grabStandalonePrice, grabMealUpgradePrice,
        foodpandaStandalonePrice, foodpandaMealUpgradePrice,
        recipe: collectRecipe(wrap)
      });
      Utils.closeOverlay(); Utils.toast("Saved.", "success"); renderMenu();
    };
  }

  /* ==================================================================
     EXPENSES (all sessions)
     ================================================================== */
  function renderExpensesAdmin() {
    const content = document.getElementById("content");
    const session = DB.getCurrentSession();
    content.innerHTML = `
      <div class="tabs-toolbar">
        <h2>All Expenses</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-expense" ${session ? "" : "disabled"} title="${session ? "" : "Start a session first"}">${Icons.plus} Add Expense</button>
      </div>
      <div id="exp-admin-list"></div>
    `;
    if (!session) {
      const note = Utils.el(`<p class="hint" style="margin:-8px 0 16px;">No active session — new expenses can be added once the cashier starts one. Historical expenses are listed below.</p>`);
      document.getElementById("exp-admin-list").before(note);
    }
    document.getElementById("btn-add-expense").onclick = () => openAdminExpenseModal();

    const rows = [];
    DB.getSessions().forEach(s => s.expenses.forEach(e => rows.push({ ...e, sessionId: s.id, sessionDate: s.dateStarted })));
    rows.sort((a, b) => new Date(b.at) - new Date(a.at));

    const listEl = document.getElementById("exp-admin-list");
    if (!rows.length) {
      listEl.innerHTML = `<div class="empty-state">${Icons.receipt}<h3>No expenses recorded</h3><p>Ingredient deliveries, utilities, and other costs will appear here.</p></div>`;
      return;
    }
    const total = rows.reduce((s, r) => s + r.amount, 0);
    listEl.innerHTML = `
      <div class="card" style="overflow-x:auto;margin-bottom:16px;">
        <table class="table">
          <thead><tr><th>Date</th><th>Time</th><th>Expense</th><th>Category</th><th>Entered By</th><th class="num">Amount</th><th></th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${Utils.fmtDateShort(r.sessionDate)}</td>
                <td class="num">${Utils.fmtTimeShort(r.at)}</td>
                <td>${Utils.escapeHtml(r.name)}</td>
                <td><span class="tag-cat">${Utils.escapeHtml(r.category)}</span></td>
                <td>${Utils.escapeHtml(r.enteredBy || "")}</td>
                <td class="num">${Utils.peso(r.amount)}</td>
                <td><button class="btn btn-icon btn-ghost" data-del-exp="${r.sessionId}|${r.id}">${Icons.trash}</button></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="kpi-row" style="grid-template-columns:1fr;">
        <div class="kpi red"><div class="lbl">Total (All Time)</div><div class="val">${Utils.peso(total)}</div></div>
      </div>
    `;
    listEl.querySelectorAll("[data-del-exp]").forEach(b => b.onclick = () => {
      const [sid, eid] = b.dataset.delExp.split("|");
      if (confirm("Remove this expense?")) { DB.deleteExpense(sid, eid); renderExpensesAdmin(); }
    });
  }

  function openAdminExpenseModal() {
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3>Add Expense</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <div class="field"><label>What was it for?</label><input id="exp-name" placeholder="e.g. Charcoal delivery, LPG refill"></div>
          <div class="field">
            <label>Category</label>
            <select id="exp-cat">
              <option>Ingredients</option><option>Utilities</option><option>Supplies</option>
              <option>Maintenance</option><option>Staff</option><option>Other</option>
            </select>
          </div>
          <div class="field"><label>Amount (PHP)</label><input id="exp-amt" type="number" inputmode="decimal" placeholder="0.00"></div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" data-save>${Icons.check} Save Expense</button>
        </div>
      </div>
    `);
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-save]").onclick = () => {
      const name = wrap.querySelector("#exp-name").value.trim();
      const category = wrap.querySelector("#exp-cat").value;
      const amount = Utils.num(wrap.querySelector("#exp-amt").value, NaN);
      if (!name) { Utils.toast("Enter what the expense was for.", "error"); return; }
      if (!(amount > 0)) { Utils.toast("Enter a valid amount.", "error"); return; }
      try { DB.addExpense({ name, category, amount, enteredBy: "Admin" }); }
      catch (e) { Utils.toast(e.message, "error"); return; }
      Utils.closeOverlay(); Utils.toast("Expense logged.", "success"); renderExpensesAdmin();
    };
  }

  /* ==================================================================
     SETTINGS
     ================================================================== */
  function renderSettings() {
    const content = document.getElementById("content");
    const s = DB.getSettings();
    content.innerHTML = `
      <div class="grid" style="grid-template-columns:1fr 1fr;align-items:start;">
        <div class="card card-pad">
          <div class="section-title">Restaurant</div>
          <div class="field"><label>Restaurant Name</label><input id="s-name" value="${Utils.escapeHtml(s.restaurantName)}"></div>
          <div class="field"><label>Receipt Footer Message</label><input id="s-footer" value="${Utils.escapeHtml(s.receiptFooter || "")}"></div>

          <div class="hr"></div>
          <div class="section-title">Admin PIN</div>
          <div class="field"><label>New 4-digit PIN</label><input id="s-pin" maxlength="4" inputmode="numeric" placeholder="${"•".repeat(4)}"></div>
          <p class="hint">Leave blank to keep the current PIN.</p>

          <div class="hr"></div>
          <div class="section-title">Cashier Names</div>
          <div class="row gap-sm" style="flex-wrap:wrap;margin-bottom:10px;" id="cashier-chip-row"></div>
          <div class="row gap-sm">
            <input id="s-new-cashier" placeholder="Add a cashier name" style="flex:1;border:1.5px solid var(--border);border-radius:10px;padding:10px 12px;">
            <button class="btn btn-outline btn-sm" id="btn-add-cashier">${Icons.plus} Add</button>
          </div>

          <div class="hr"></div>
          <button class="btn btn-primary btn-block" id="btn-save-settings">${Icons.check} Save Settings</button>
        </div>

        <div>
          <div class="card card-pad" style="margin-bottom:20px;">
            <div class="section-title">Automatic Email / Google Drive Delivery</div>
            <div class="field"><label>Google Apps Script Web App URL</label><input id="s-apps-url" value="${Utils.escapeHtml(s.appsScriptUrl || "")}" placeholder="https://script.google.com/macros/s/…/exec"></div>
            <div class="field"><label>Notification Email</label><input id="s-email" value="${Utils.escapeHtml(s.notifyEmail || "")}" placeholder="owner@example.com"></div>
            <p class="hint">Reports auto-email to this address and save to Drive when a session ends or a report is generated. See the included <b>google-apps-script/Code.gs</b> + README for the 5-minute setup. Internet connection required only at report time.</p>
            <button class="btn btn-outline btn-block" id="btn-save-endpoint" style="margin-top:10px;">${Icons.cloud} Save Delivery Settings</button>
          </div>

          <div class="card card-pad">
            <div class="section-title">Backup & Restore</div>
            <p class="hint" style="margin-top:0;">All data lives on this tablet only. Export a backup regularly, especially before updates.</p>
            <div class="row gap-sm" style="margin-top:10px;">
              <button class="btn btn-outline btn-block" id="btn-export">${Icons.download} Export Backup</button>
              <button class="btn btn-outline btn-block" id="btn-import">${Icons.cloud} Restore Backup</button>
            </div>
            <input type="file" id="import-file" accept="application/json" style="display:none;">
          </div>
        </div>
      </div>
    `;

    const chipRow = document.getElementById("cashier-chip-row");
    function drawChips() {
      const names = DB.getSettings().cashierNames || [];
      chipRow.innerHTML = names.length ? names.map(n => `<span class="btn btn-sm btn-soft" data-remove-cashier="${Utils.escapeHtml(n)}">${Utils.escapeHtml(n)} ${Icons.x}</span>`).join("") : `<span class="muted" style="font-size:12.5px;">No cashiers added yet.</span>`;
      chipRow.querySelectorAll("[data-remove-cashier]").forEach(c => c.onclick = () => {
        const names = DB.getSettings().cashierNames.filter(n => n !== c.dataset.removeCashier);
        DB.saveSettings({ cashierNames: names }); drawChips();
      });
    }
    drawChips();
    document.getElementById("btn-add-cashier").onclick = () => {
      const input = document.getElementById("s-new-cashier");
      const name = input.value.trim();
      if (!name) return;
      const names = DB.getSettings().cashierNames || [];
      if (!names.includes(name)) DB.saveSettings({ cashierNames: [...names, name] });
      input.value = ""; drawChips();
    };

    document.getElementById("btn-save-settings").onclick = () => {
      const patch = {
        restaurantName: document.getElementById("s-name").value.trim() || "Evet Kofte",
        receiptFooter: document.getElementById("s-footer").value.trim()
      };
      const pin = document.getElementById("s-pin").value.trim();
      if (pin) {
        if (!/^\d{4}$/.test(pin)) { Utils.toast("PIN must be exactly 4 digits.", "error"); return; }
        patch.adminPin = pin;
      }
      DB.saveSettings(patch);
      Utils.toast("Settings saved.", "success");
      renderSettings();
    };

    document.getElementById("btn-save-endpoint").onclick = () => {
      DB.saveSettings({
        appsScriptUrl: document.getElementById("s-apps-url").value.trim(),
        notifyEmail: document.getElementById("s-email").value.trim()
      });
      Utils.toast("Delivery settings saved.", "success");
    };

    document.getElementById("btn-export").onclick = () => {
      const json = DB.exportBackup();
      const blob = new Blob([json], { type: "application/json" });
      Utils.downloadBlob(blob, `evet-kofte-backup_${Utils.dateKey()}.json`);
      Utils.toast("Backup downloaded.", "success");
    };
    const fileInput = document.getElementById("import-file");
    document.getElementById("btn-import").onclick = () => fileInput.click();
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      if (!file) return;
      if (!confirm("Restoring will overwrite all current data on this tablet. Continue?")) { fileInput.value = ""; return; }
      const reader = new FileReader();
      reader.onload = () => {
        try { DB.importBackup(reader.result); Utils.toast("Backup restored. Reloading…", "success"); setTimeout(() => location.reload(), 900); }
        catch (e) { Utils.toast("Couldn't read that backup file.", "error"); }
      };
      reader.readAsText(file);
    };
  }

  /* ==================================================================
     RECIPE EDITOR — shared by the food/drink forms and the meal-side
     recipe, so an item's inventory deduction is set up right next to
     everything else about that item.
     ================================================================== */
  function ingredientOptionsHtml(selectedId) {
    const list = DB.getInventory();
    if (!list.length) return `<option value="">No ingredients yet</option>`;
    return list.map(i => `<option value="${i.id}" ${i.id === selectedId ? "selected" : ""}>${Utils.escapeHtml(i.name)} (${i.unit})</option>`).join("");
  }

  function recipeRowHtml(row) {
    return `
      <div class="recipe-row" data-recipe-row>
        <select class="recipe-ing-select">${ingredientOptionsHtml(row ? row.ingredientId : null)}</select>
        <input class="recipe-qty-input" type="number" inputmode="decimal" value="${row ? row.qty : 1}" placeholder="Qty" step="any">
        <button type="button" class="btn btn-icon btn-ghost recipe-remove-row">${Icons.x}</button>
      </div>`;
  }

  function recipeEditorHtml(recipe) {
    const hasIngredients = DB.getInventory().length > 0;
    const rows = (recipe || []).map(recipeRowHtml).join("");
    return `
      <div class="recipe-editor">
        <div class="recipe-rows">${rows}</div>
        ${hasIngredients
          ? `<button type="button" class="btn btn-outline btn-sm recipe-add-row" style="margin-top:8px;">${Icons.plus} Add Ingredient</button>`
          : `<p class="hint" style="margin-top:6px;">Add ingredients in Admin → Inventory first, then come back here to set what this item uses.</p>`}
      </div>`;
  }

  function wireRecipeEditor(root) {
    function bindRemove(row) { row.querySelector(".recipe-remove-row").onclick = () => row.remove(); }
    root.querySelectorAll("[data-recipe-row]").forEach(bindRemove);
    const addBtn = root.querySelector(".recipe-add-row");
    if (addBtn) addBtn.onclick = () => {
      const row = Utils.el(recipeRowHtml(null));
      root.querySelector(".recipe-rows").appendChild(row);
      bindRemove(row);
    };
  }

  function collectRecipe(root) {
    return Utils.qsa("[data-recipe-row]", root)
      .map(row => ({
        ingredientId: row.querySelector(".recipe-ing-select").value,
        qty: Utils.num(row.querySelector(".recipe-qty-input").value, 0)
      }))
      .filter(r => r.ingredientId && r.qty > 0);
  }

  /* ==================================================================
     INVENTORY
     ================================================================== */
  function renderInventory() {
    const content = document.getElementById("content");
    const inventory = DB.getInventory();
    const low = DB.getLowStockIngredients();

    content.innerHTML = `
      ${low.length ? `
        <div class="card card-pad" style="margin-bottom:20px;border-color:var(--red);background:var(--red-soft);">
          <div class="section-title" style="color:var(--red);">${Icons.warning} ${low.length} Ingredient(s) Low on Stock</div>
          <div class="option-list" style="margin-top:10px;">
            ${low.map(i => `<div class="option-row" style="cursor:default;border-color:var(--red-softer);"><div class="nm">${Utils.escapeHtml(i.name)}</div><div class="pr plus">${i.stock} ${Utils.escapeHtml(i.unit)} left (threshold ${i.threshold})</div></div>`).join("")}
          </div>
        </div>
      ` : ""}

      <div class="tabs-toolbar">
        <h2>Ingredients</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-ingredient">${Icons.plus} Add Ingredient</button>
      </div>
      <div id="ingredient-list"></div>

      <div class="spacer-24"></div>
      <div class="card card-pad">
        <div class="section-title">Meal Side Recipe — French Fries</div>
        <p class="hint" style="margin-top:0;">Every Meal order automatically deducts this too, on top of the dish's own recipe — since every meal comes with a side of fries.</p>
        <div id="meal-side-recipe-editor">${recipeEditorHtml(DB.getMealSideRecipe())}</div>
        <button class="btn btn-primary btn-sm" id="btn-save-meal-side" style="margin-top:14px;">${Icons.check} Save Meal Side Recipe</button>
      </div>
    `;

    renderIngredientList();
    document.getElementById("btn-add-ingredient").onclick = () => openIngredientForm(null);

    const mealSideRoot = document.getElementById("meal-side-recipe-editor");
    wireRecipeEditor(mealSideRoot);
    document.getElementById("btn-save-meal-side").onclick = () => {
      DB.saveMealSideRecipe(collectRecipe(mealSideRoot));
      Utils.toast("Meal side recipe saved.", "success");
    };
  }

  function renderIngredientList() {
    const list = document.getElementById("ingredient-list");
    const inventory = DB.getInventory();
    if (!inventory.length) {
      list.innerHTML = `<div class="empty-state">${Icons.box}<h3>No ingredients yet</h3><p>Add ingredients here, then assign them to menu items so orders automatically deduct stock.</p></div>`;
      return;
    }
    list.innerHTML = inventory.map(i => {
      const isLow = i.active && i.stock <= i.threshold;
      return `
      <div class="menu-editor-item" data-row-edit="${i.id}">
        <div class="emoji">${isLow ? "⚠️" : "📦"}</div>
        <div class="info">
          <b>${Utils.escapeHtml(i.name)}</b> ${i.active ? "" : `<span class="tag-cat">Hidden</span>`} ${isLow ? `<span class="tag-cat" style="background:var(--red-soft);color:var(--red);">Low Stock</span>` : ""}
          <div class="p" style="${isLow ? "color:var(--red);font-weight:700;" : ""}">${i.stock} ${Utils.escapeHtml(i.unit)} on hand · threshold ${i.threshold} ${Utils.escapeHtml(i.unit)}</div>
        </div>
        <div class="acts">
          <button class="btn btn-outline btn-sm" data-restock="${i.id}">${Icons.plus} Restock</button>
          <button class="btn btn-outline btn-sm" data-edit="${i.id}">${Icons.edit} Edit</button>
          <button class="btn btn-danger btn-sm" data-del="${i.id}">${Icons.trash} Delete</button>
        </div>
      </div>`;
    }).join("");
    list.querySelectorAll("[data-row-edit]").forEach(row => row.onclick = () => openIngredientForm(inventory.find(i => i.id === row.dataset.rowEdit)));
    list.querySelectorAll("[data-edit]").forEach(b => b.onclick = (e) => { e.stopPropagation(); openIngredientForm(inventory.find(i => i.id === b.dataset.edit)); });
    list.querySelectorAll("[data-restock]").forEach(b => b.onclick = (e) => { e.stopPropagation(); openRestockModal(inventory.find(i => i.id === b.dataset.restock)); });
    list.querySelectorAll("[data-del]").forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this ingredient? Menu items using it in a recipe will just stop deducting it.")) { DB.deleteIngredient(b.dataset.del); renderIngredientList(); }
    });
  }

  function openIngredientForm(existing) {
    const isEdit = !!existing;
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3>${isEdit ? "Edit" : "Add"} Ingredient</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <div class="field"><label>Name</label><input id="ing-name" value="${Utils.escapeHtml(existing ? existing.name : "")}" placeholder="e.g. Kofte Meatball"></div>
          <div class="row gap">
            <div class="field" style="flex:1;"><label>Unit</label><input id="ing-unit" value="${Utils.escapeHtml(existing ? existing.unit : "pcs")}" placeholder="pcs, g, kg, ml, L, bottles"></div>
            <div class="field" style="flex:1;"><label>${isEdit ? "Current Stock" : "Starting Stock"}</label><input id="ing-stock" type="number" inputmode="decimal" value="${existing ? existing.stock : ""}" placeholder="0"></div>
          </div>
          <div class="field"><label>Low Stock Threshold</label><input id="ing-threshold" type="number" inputmode="decimal" value="${existing ? existing.threshold : ""}" placeholder="Alert when stock falls to/below this"></div>
          <div class="field">
            <label>Status</label>
            <div class="pill-toggle">
              <button type="button" data-active="1" class="${!existing || existing.active ? "active" : ""}">Active</button>
              <button type="button" data-active="0" class="${existing && !existing.active ? "active" : ""}">Hidden</button>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          ${isEdit ? `<button class="btn btn-ghost" data-delete style="color:var(--red);margin-right:auto;">${Icons.trash} Delete</button>` : ""}
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" data-save>${Icons.check} Save</button>
        </div>
      </div>
    `);
    let active = !existing || existing.active;
    wrap.querySelectorAll("[data-active]").forEach(b => b.onclick = () => { active = b.dataset.active === "1"; wrap.querySelectorAll("[data-active]").forEach(x => x.classList.toggle("active", x === b)); });
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    if (isEdit) wrap.querySelector("[data-delete]").onclick = () => {
      if (confirm("Delete this ingredient?")) { DB.deleteIngredient(existing.id); Utils.closeOverlay(); renderInventory(); }
    };
    wrap.querySelector("[data-save]").onclick = () => {
      const name = wrap.querySelector("#ing-name").value.trim();
      const unit = wrap.querySelector("#ing-unit").value.trim();
      const stock = Utils.num(wrap.querySelector("#ing-stock").value, NaN);
      const threshold = Utils.num(wrap.querySelector("#ing-threshold").value, NaN);
      if (!name) { Utils.toast("Enter an ingredient name.", "error"); return; }
      if (!unit) { Utils.toast("Enter a unit (e.g. pcs, g, kg).", "error"); return; }
      if (isNaN(stock) || stock < 0) { Utils.toast("Enter a valid stock quantity.", "error"); return; }
      if (isNaN(threshold) || threshold < 0) { Utils.toast("Enter a valid low-stock threshold.", "error"); return; }
      DB.upsertIngredient({ id: existing ? existing.id : undefined, name, unit, stock, threshold, active });
      Utils.closeOverlay(); Utils.toast("Saved.", "success"); renderInventory();
    };
  }

  function openRestockModal(ingredient) {
    const wrap = Utils.openOverlay(`
      <div class="modal" style="width:400px;">
        <div class="modal-head"><h3>Restock — ${Utils.escapeHtml(ingredient.name)}</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <p class="muted">Currently ${ingredient.stock} ${Utils.escapeHtml(ingredient.unit)} on hand.</p>
          <div class="field"><label>Add to Stock (${Utils.escapeHtml(ingredient.unit)})</label><input id="restock-qty" type="number" inputmode="decimal" placeholder="0" autofocus></div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" data-save>${Icons.check} Add to Stock</button>
        </div>
      </div>
    `);
    const input = wrap.querySelector("#restock-qty");
    input.focus();
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    const confirm = () => {
      const qty = Utils.num(input.value, NaN);
      if (!(qty > 0)) { Utils.toast("Enter a quantity greater than 0.", "error"); return; }
      DB.adjustStock(ingredient.id, qty);
      Utils.closeOverlay();
      Utils.toast(`Added ${qty} ${ingredient.unit} to ${ingredient.name}.`, "success");
      renderInventory();
    };
    wrap.querySelector("[data-save]").onclick = confirm;
    input.addEventListener("keydown", e => { if (e.key === "Enter") confirm(); });
  }

  return { mount, render, state };
})();

window.Admin = Admin;
