/* Evet Kofte POS — cashier.js
   Everything the cashier operates: start/end session, customer tabs,
   the food/drinks order builder, payment + QR receipt, and expenses. */

const Cashier = (() => {

  const state = { view: "dashboard", tabId: null, menuTab: "food", operatorName: "", orderSubView: "menu" };

  function platformTag(orderType) {
    if (orderType === "grab") return `<span class="grab-tag">GRAB</span> `;
    if (orderType === "foodpanda") return `<span class="foodpanda-tag">FOODPANDA</span> `;
    return "";
  }
  function platformLabel(orderType) {
    return orderType === "grab" ? "Grab" : orderType === "foodpanda" ? "FoodPanda" : "Dine-in";
  }

  function mount(operatorName) {
    state.operatorName = operatorName;
    state.view = "dashboard";
    state.tabId = null;
    render();
  }

  /* ------------------------------------------------------------------ */
  function render() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="shell">
        <div class="nav-rail" id="nav-rail"></div>
        <div class="main">
          <div class="topbar" id="topbar"></div>
          <div class="content ${state.view === "order" ? "no-pad" : ""}" id="content"></div>
        </div>
      </div>`;
    renderNav();
    renderTopbar();
    if (state.view === "dashboard") renderDashboard();
    else if (state.view === "order") renderOrderBuilder();
    else if (state.view === "expenses") renderExpenses();
  }

  function renderNav() {
    const rail = document.getElementById("nav-rail");
    rail.innerHTML = `
      <button class="nav-btn ${state.view === "dashboard" ? "active" : ""}" data-nav="dashboard"><span class="ic">${Icons.home}</span>Home</button>
      <button class="nav-btn ${state.view === "expenses" ? "active" : ""}" data-nav="expenses"><span class="ic">${Icons.receipt}</span>Expenses</button>
      <button class="nav-btn danger" data-nav="logout"><span class="ic">${Icons.logout}</span>Switch</button>
    `;
    rail.querySelectorAll("[data-nav]").forEach(b => b.onclick = () => {
      const v = b.dataset.nav;
      if (v === "logout") return App.goRoleSelect();
      state.view = v; state.tabId = null; render();
    });
    App.tickClock();
  }

  function renderTopbar() {
    const bar = document.getElementById("topbar");
    const session = DB.getCurrentSession();
    if (state.view === "order") {
      const tab = DB.getTab(state.tabId);
      bar.innerHTML = `
        <div class="topbar-left row gap-sm">
          <button class="btn btn-icon btn-ghost" data-back>${Icons.chevronLeft}</button>
          <div>
            <h1>${Utils.escapeHtml(tab ? tab.customerName : "Tab")}</h1>
            <div class="sub">Building order</div>
          </div>
        </div>
        <div class="topbar-right"><div class="topbar-clock"><b data-clock="time-short">--:--</b><span data-clock="date-short">…</span></div></div>`;
      bar.querySelector("[data-back]").onclick = () => { state.view = "dashboard"; state.tabId = null; render(); };
      App.tickClock();
      return;
    }
    const titles = { dashboard: ["Dashboard", state.operatorName], expenses: ["Expenses", "Ingredients, utilities & other costs"] };
    const [title, sub] = titles[state.view] || ["Evet Kofte", ""];
    bar.innerHTML = `
      <div class="topbar-left row gap-sm">
        <div class="topbar-mark">EK</div>
        <div><h1>${title}</h1><div class="sub">${Utils.escapeHtml(sub)}</div></div>
      </div>
      <div class="topbar-right">
        <div class="topbar-clock"><b data-clock="time-short">--:--</b><span data-clock="date-short">…</span></div>
        ${session ? `<span class="badge badge-open"><span class="dot"></span>Open</span>` : `<span class="badge badge-closed"><span class="dot"></span>Closed</span>`}
      </div>`;
    App.tickClock();
  }

  /* ------------------------------------------------------------------ */
  function renderDashboard() {
    const content = document.getElementById("content");
    const session = DB.getCurrentSession();

    if (!session) {
      const carried = DB.getCarriedTabs();
      content.innerHTML = `
        <div class="session-hero closed">
          <div class="top">
            <div><div class="clock num" data-clock="time-full">--:--:--</div><div class="date" data-clock="date">…</div></div>
            <span class="badge badge-closed"><span class="dot"></span>Restaurant Closed</span>
          </div>
          <div class="spacer-16"></div>
          <p class="muted" style="max-width:420px;">Start today's session to open customer tabs, take orders, and log expenses.</p>
          <div class="spacer-16"></div>
          <button class="btn btn-primary btn-lg" data-start-session>${Icons.check} Start Session</button>
        </div>
        ${carried.length ? `
          <div class="card card-pad" style="margin-bottom:20px;border-color:var(--amber);">
            <div class="section-title" style="color:var(--amber);">${carried.length} Running Tab(s) Carrying Over</div>
            <p class="hint" style="margin-top:-4px;">These regulars haven't paid yet — they'll reopen automatically once you start the session.</p>
            <div class="option-list" style="margin-top:10px;">
              ${carried.map(tb => `<div class="option-row" style="cursor:default;"><div class="nm">${platformTag(tb.orderType)}${Utils.escapeHtml(tb.customerName)}</div><div class="pr">${Utils.peso(tb.total)}</div></div>`).join("")}
            </div>
          </div>
        ` : `
          <div class="empty-state">
            ${Icons.tabs}
            <h3>No active session</h3>
            <p>Once you start the session, customer tabs and today's KPIs will show up here.</p>
          </div>
        `}`;
      content.querySelector("[data-start-session]").onclick = () => {
        try { DB.startSession(state.operatorName); Utils.toast("Session started — good luck today! 🔥", "success"); render(); }
        catch (e) { Utils.toast(e.message, "error"); }
      };
      App.tickClock();
      return;
    }

    const t = DB.getSessionTotals(session);
    const openTabs = DB.getOpenTabs();
    const lowStock = DB.getLowStockIngredients();

    content.innerHTML = `
      ${lowStock.length ? `
        <div class="card card-pad" style="margin-bottom:16px;border-color:var(--red);background:var(--red-soft);">
          <div class="row gap-sm" style="color:var(--red);font-weight:800;font-size:13px;">${Icons.warning} Low stock: ${lowStock.map(i => Utils.escapeHtml(i.name)).join(", ")}</div>
        </div>
      ` : ""}
      <div class="session-hero">
        <div class="top">
          <div><div class="clock num" data-clock="time-full">--:--:--</div><div class="date" data-clock="date">…</div></div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;">
            <span class="badge badge-open"><span class="dot"></span>Open since ${Utils.fmtTimeShort(session.dateStarted)}</span>
            <button class="btn btn-sm" data-end-session style="background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.4);color:#fff;">End Session</button>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><b>${Utils.peso(t.grossSales)}</b><span>Gross Sales</span></div>
          <div class="stat"><b>${Utils.peso(t.grabSales)}</b><span>Grab Sales</span></div>
          <div class="stat"><b>${Utils.peso(t.foodpandaSales)}</b><span>FoodPanda Sales</span></div>
          <div class="stat"><b>${Utils.peso(t.totalExpenses)}</b><span>Expenses</span></div>
          <div class="stat"><b>${t.tabCount}</b><span>Orders Closed</span></div>
          <div class="stat"><b>${t.openTabCount}</b><span>Open Tabs</span></div>
        </div>
      </div>

      <div class="tabs-toolbar"><h2>Customer Tabs</h2><span class="muted">${openTabs.length} open</span></div>
      <div class="tab-grid" id="tab-grid"></div>
    `;

    const grid = document.getElementById("tab-grid");
    grid.innerHTML = openTabs.map(tab => `
      <div class="tab-card" data-open-tab="${tab.id}">
        <div class="count-chip">${tab.items.reduce((a, i) => a + i.qty, 0)} items</div>
        <div class="name">${platformTag(tab.orderType)}${Utils.escapeHtml(tab.customerName)}</div>
        <div class="meta">${tab.carriedOver ? `<span style="color:var(--amber);font-weight:700;">↻ Running tab</span> · ` : ""}Opened ${Utils.fmtTimeShort(tab.openedAt)}</div>
        <div class="amount">${Utils.peso(tab.total)}</div>
      </div>
    `).join("") + `
      <div class="tab-card new" data-new-tab>${Icons.plus}<span>New Tab</span></div>
      <div class="tab-card new" data-new-grab>${Icons.cloud}<span>New Grab Order</span></div>
      <div class="tab-card new" data-new-foodpanda>${Icons.cloud}<span>New FoodPanda Order</span></div>
    `;
    grid.querySelectorAll("[data-open-tab]").forEach(c => c.onclick = () => {
      state.view = "order"; state.tabId = c.dataset.openTab; state.orderSubView = "menu"; render();
    });
    grid.querySelector("[data-new-tab]").onclick = () => openNewTabModal();
    grid.querySelector("[data-new-grab]").onclick = () => openNewGrabModal();
    grid.querySelector("[data-new-foodpanda]").onclick = () => openNewFoodPandaModal();

    content.querySelector("[data-end-session]").onclick = () => openEndSessionModal();
    App.tickClock();
  }

  function openNewTabModal() {
    const recents = DB.getCustomers().slice(0, 8);
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3>New Customer Tab</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <div class="field">
            <label>Customer / Table Name</label>
            <input id="new-tab-name" placeholder="e.g. Juan, Table 5" autocomplete="off">
          </div>
          ${recents.length ? `
            <div class="section-title">Recent</div>
            <div class="row gap-sm" style="flex-wrap:wrap;">
              ${recents.map(c => `<button class="btn btn-sm btn-soft" data-chip="${Utils.escapeHtml(c.name)}">${Utils.escapeHtml(c.name)}</button>`).join("")}
            </div>` : ""}
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" data-create>${Icons.plus} Create Tab</button>
        </div>
      </div>
    `);
    const input = wrap.querySelector("#new-tab-name");
    input.focus();
    wrap.querySelectorAll("[data-chip]").forEach(c => c.onclick = () => { input.value = c.dataset.chip; input.focus(); });
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    const create = () => {
      const name = input.value.trim();
      if (!name) { Utils.toast("Enter a customer name.", "error"); return; }
      const tab = DB.createTab(name, "dine-in");
      Utils.closeOverlay();
      state.view = "order"; state.tabId = tab.id; state.orderSubView = "menu"; render();
    };
    wrap.querySelector("[data-create]").onclick = create;
    input.addEventListener("keydown", e => { if (e.key === "Enter") create(); });
  }

  function openNewGrabModal() {
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3><span class="grab-tag">GRAB</span> New Grab Order</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <div class="field">
            <label>Grab Order / Reference No.</label>
            <input id="new-grab-ref" placeholder="e.g. GF-88213" autocomplete="off">
          </div>
          <p class="hint">Menu prices for this order will automatically use the Grab prices set in Admin → Menu.</p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" data-create>${Icons.plus} Create Grab Order</button>
        </div>
      </div>
    `);
    const input = wrap.querySelector("#new-grab-ref");
    input.focus();
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    const create = () => {
      const ref = input.value.trim();
      if (!ref) { Utils.toast("Enter the Grab order/reference number.", "error"); return; }
      const tab = DB.createTab(ref, "grab");
      Utils.closeOverlay();
      state.view = "order"; state.tabId = tab.id; state.orderSubView = "menu"; render();
    };
    wrap.querySelector("[data-create]").onclick = create;
    input.addEventListener("keydown", e => { if (e.key === "Enter") create(); });
  }

  function openNewFoodPandaModal() {
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3><span class="foodpanda-tag">FOODPANDA</span> New FoodPanda Order</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <div class="field">
            <label>FoodPanda Order / Reference No.</label>
            <input id="new-foodpanda-ref" placeholder="e.g. FP-88213" autocomplete="off">
          </div>
          <p class="hint">Menu prices for this order will automatically use the FoodPanda prices set in Admin → Menu.</p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" data-create>${Icons.plus} Create FoodPanda Order</button>
        </div>
      </div>
    `);
    const input = wrap.querySelector("#new-foodpanda-ref");
    input.focus();
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    const create = () => {
      const ref = input.value.trim();
      if (!ref) { Utils.toast("Enter the FoodPanda order/reference number.", "error"); return; }
      const tab = DB.createTab(ref, "foodpanda");
      Utils.closeOverlay();
      state.view = "order"; state.tabId = tab.id; state.orderSubView = "menu"; render();
    };
    wrap.querySelector("[data-create]").onclick = create;
    input.addEventListener("keydown", e => { if (e.key === "Enter") create(); });
  }

  function openEndSessionModal() {
    const session = DB.getCurrentSession();
    const t = DB.getSessionTotals(session);
    const openTabs = DB.getOpenTabs();
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3>End Session</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <p class="muted">This closes the restaurant for the day and generates today's report.</p>
          <div class="spacer-16"></div>
          <div class="tot-row"><span>Dine-in Sales</span><span class="num">${Utils.peso(t.dineInSales)}</span></div>
          <div class="tot-row"><span>Grab Sales</span><span class="num">${Utils.peso(t.grabSales)}</span></div>
          <div class="tot-row"><span>FoodPanda Sales</span><span class="num">${Utils.peso(t.foodpandaSales)}</span></div>
          <div class="tot-row"><span>Total Expenses</span><span class="num">${Utils.peso(t.totalExpenses)}</span></div>
          <div class="hr"></div>
          <div class="tot-row grand"><span>Net Profit</span><span class="amt">${Utils.peso(t.netProfit)}</span></div>
          ${openTabs.length ? `
            <div class="hr"></div>
            <div class="section-title">Carrying Over to Next Session (${openTabs.length})</div>
            <p class="hint" style="margin-top:-6px;margin-bottom:10px;">These stay open for regulars who haven't paid yet — nothing is lost or force-closed.</p>
            <div class="option-list">
              ${openTabs.map(tb => `<div class="option-row" style="cursor:default;"><div class="nm">${platformTag(tb.orderType)}${Utils.escapeHtml(tb.customerName)}</div><div class="pr">${Utils.peso(tb.total)}</div></div>`).join("")}
            </div>
          ` : ""}
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" data-confirm>${Icons.check} End Session & Send Report</button>
        </div>
      </div>
    `);
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-confirm]").onclick = async () => {
      let closed;
      try { closed = DB.endSession(); } catch (e) { Utils.toast(e.message, "error"); return; }
      Utils.closeOverlay();
      state.view = "dashboard"; render();
      await Report.generateAndSend([closed], { rangeLabel: Utils.dateKey(closed.dateStarted) });
    };
  }

  /* ------------------------------------------------------------------ */
  function renderOrderBuilder() {
    const content = document.getElementById("content");
    const tab = DB.getTab(state.tabId);
    if (!tab) { state.view = "dashboard"; render(); return; }
    const platform = (tab.orderType === "grab" || tab.orderType === "foodpanda") ? tab.orderType : null;
    const platformTagClass = platform === "grab" ? "grab-tag" : "foodpanda-tag";
    const itemCount = tab.items.reduce((a, i) => a + i.qty, 0);

    content.innerHTML = `
      <div class="order-layout">
        <div class="order-toggle">
          <button class="order-toggle-btn ${state.orderSubView === "menu" ? "active" : ""}" data-sub="menu">${Icons.plate} Menu</button>
          <button class="order-toggle-btn ${state.orderSubView === "ticket" ? "active" : ""}" data-sub="ticket">${Icons.receipt} Ticket${itemCount ? ` (${itemCount})` : ""}</button>
        </div>
        <div class="order-page" id="order-page"></div>
      </div>`;

    content.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => { state.orderSubView = b.dataset.sub; renderOrderBuilder(); });

    if (state.orderSubView === "ticket") {
      renderTicketPage(tab, platform);
    } else {
      renderMenuPage(tab, platform, platformTagClass);
    }
  }

  function renderMenuPage(tab, platform, platformTagClass) {
    const page = document.getElementById("order-page");
    page.innerHTML = `
      <div class="order-menu-tabs">
        <button class="chip-tab ${state.menuTab === "food" ? "active" : ""}" data-menu-switch="food">${Icons.plate} Food</button>
        <button class="chip-tab ${state.menuTab === "drinks" ? "active" : ""}" data-menu-switch="drinks">${Icons.cup} Drinks</button>
        ${platform ? `<span class="${platformTagClass}" style="align-self:center;margin-left:6px;">${platformLabel(platform).toUpperCase()} PRICES</span>` : ""}
      </div>
      <div class="menu-scroll" id="menu-scroll"></div>
      ${tab.items.length ? `
        <button class="order-summary-bar" id="order-summary-bar">
          <span><span class="count">${tab.items.reduce((a, i) => a + i.qty, 0)} item(s) in ticket</span><br><span class="amt">${Utils.peso(tab.total)}</span></span>
          <span>View Ticket ${Icons.chevronRight}</span>
        </button>` : ""}
    `;
    renderMenuGrid();
    page.querySelectorAll("[data-menu-switch]").forEach(b => b.onclick = () => { state.menuTab = b.dataset.menuSwitch; renderMenuGrid(); syncMenuTabButtons(); });
    const bar = document.getElementById("order-summary-bar");
    if (bar) bar.onclick = () => { state.orderSubView = "ticket"; renderOrderBuilder(); };
  }

  function renderTicketPage(tab, platform) {
    const page = document.getElementById("order-page");
    page.innerHTML = `
      <div class="ticket-rail">
        <div class="ticket-head">
          <div>
            <div class="who">${platformTag(tab.orderType)}${Utils.escapeHtml(tab.customerName)}</div>
            <div class="meta">${tab.carriedOver ? `<span style="color:var(--amber);font-weight:700;">↻ Running tab</span> · ` : ""}Opened ${Utils.fmtTimeShort(tab.openedAt)} · ${tab.items.length} line item(s)</div>
          </div>
          <button class="btn btn-outline btn-sm" id="btn-add-more">${Icons.plus} Add More</button>
        </div>
        <div class="ticket-items" id="ticket-items"></div>
        <div class="ticket-foot">
          <div class="tot-row grand"><span>Total</span><span class="amt">${Utils.peso(tab.total)}</span></div>
          <button class="btn btn-primary btn-block btn-lg" id="btn-close-tab" style="margin-top:10px;" ${tab.items.length ? "" : "disabled"}>
            ${platform ? `${Icons.check} Mark ${platformLabel(platform)} Order as Paid` : `${Icons.wallet} Close Tab & Pay`}
          </button>
          <button class="btn btn-ghost btn-block" id="btn-void-tab" style="margin-top:6px;color:var(--red);">Void / Cancel ${platform ? "Order" : "Tab"}</button>
        </div>
      </div>`;

    renderTicketItems();

    document.getElementById("btn-add-more").onclick = () => { state.orderSubView = "menu"; renderOrderBuilder(); };
    document.getElementById("btn-close-tab").onclick = () => {
      if (platform === "grab") openGrabCloseModal(tab.id);
      else if (platform === "foodpanda") openFoodPandaCloseModal(tab.id);
      else openPaymentModal(tab.id);
    };
    document.getElementById("btn-void-tab").onclick = () => {
      if (confirm(`Void this ${platform ? platformLabel(platform) + " order" : "tab"} for ${tab.customerName}? This removes it completely.`)) {
        DB.voidTab(tab.id); state.view = "dashboard"; state.tabId = null; render();
      }
    };
  }

  function syncMenuTabButtons() {
    document.querySelectorAll("[data-menu-switch]").forEach(b => b.classList.toggle("active", b.dataset.menuSwitch === state.menuTab));
  }

  function renderMenuGrid() {
    const scroll = document.getElementById("menu-scroll");
    const tab = DB.getTab(state.tabId);
    const platform = tab && (tab.orderType === "grab" || tab.orderType === "foodpanda") ? tab.orderType : null;
    if (state.menuTab === "food") {
      const items = DB.getFood().filter(f => f.active);
      const cats = [...new Set(items.map(i => i.category || "Menu"))];
      scroll.innerHTML = cats.map(cat => `
        <div class="menu-cat">${Utils.escapeHtml(cat)}</div>
        <div class="item-grid">
          ${items.filter(i => (i.category || "Menu") === cat).map(i => {
            const solo = PosModal.foodPrice(i, platform, "solo");
            return `
            <button class="item-card" data-food-id="${i.id}">
              <div class="emoji">${i.emoji || "🍽️"}</div>
              <div class="nm">${Utils.escapeHtml(i.name)}</div>
              <div class="pr">${Utils.peso(solo)}${i.allowMeal ? " solo" : ""}</div>
            </button>`;
          }).join("")}
        </div>
      `).join("") || emptyMenuHtml("No food items yet. Add some in Admin → Menu.");
      scroll.querySelectorAll("[data-food-id]").forEach(card => card.onclick = () => {
        const food = DB.getFood().find(f => f.id === card.dataset.foodId);
        if (!food.allowMeal) {
          const price = PosModal.foodPrice(food, platform, "solo");
          DB.addItemToTab(state.tabId, { kind: "food", name: food.name, type: "solo", foodItemId: food.id, basePrice: price, unitPrice: price, drinkUpgradeName: null, drinkUpgradeDelta: 0, drinkUpgradeId: null, qty: 1 });
          notifyLowStock();
          renderOrderBuilder();
        } else {
          PosModal.pickFoodOption(food, item => { DB.addItemToTab(state.tabId, item); notifyLowStock(); renderOrderBuilder(); }, platform);
        }
      });
    } else {
      const drinks = DB.getDrinks().filter(d => d.active && d.availableStandalone);
      const cats = [...new Set(drinks.map(d => d.category || "Drinks"))];
      scroll.innerHTML = cats.map(cat => `
        <div class="menu-cat">${Utils.escapeHtml(cat)}</div>
        <div class="item-grid">
          ${drinks.filter(d => (d.category || "Drinks") === cat).map(d => {
            const price = PosModal.drinkStandalonePrice(d, platform);
            return `
            <button class="item-card" data-drink-id="${d.id}">
              <div class="emoji">${d.emoji || "🥤"}</div>
              <div class="nm">${Utils.escapeHtml(d.name)}</div>
              <div class="pr">${Utils.peso(price)}</div>
            </button>`;
          }).join("")}
        </div>
      `).join("") || emptyMenuHtml("No drinks yet. Add some in Admin → Menu.");
      scroll.querySelectorAll("[data-drink-id]").forEach(card => card.onclick = () => {
        const drink = drinks.find(d => d.id === card.dataset.drinkId);
        DB.addItemToTab(state.tabId, PosModal.buildDrinkItem(drink, platform));
        notifyLowStock();
        renderOrderBuilder();
      });
    }
  }

  function notifyLowStock() {
    DB.consumeLowStockAlerts().forEach(a => {
      Utils.toast(`⚠️ Low stock: ${a.name} (${a.stock} ${a.unit} left)`, "error");
    });
  }

  function emptyMenuHtml(msg) {
    return `<div class="empty-state">${Icons.grid}<p>${msg}</p></div>`;
  }

  function renderTicketItems() {
    const box = document.getElementById("ticket-items");
    const tab = DB.getTab(state.tabId);
    if (!tab.items.length) {
      box.innerHTML = `<div class="empty-state">${Icons.receipt}<p>No items yet. Tap a menu item to add it to this tab.</p></div>`;
      return;
    }
    box.innerHTML = tab.items.map(it => `
      <div class="ticket-line">
        <div class="top-row">
          <div>
            <div class="nm">${Utils.escapeHtml(it.name)}</div>
            ${it.type ? `<span class="tag">${it.type.toUpperCase()}${it.drinkUpgradeName ? " + " + Utils.escapeHtml(it.drinkUpgradeName) : ""}${it.type === "meal" ? " + Fries" : ""}</span>` : ""}
          </div>
          <div class="amt">${Utils.peso(it.lineTotal)}</div>
        </div>
        <div class="ctrls">
          <button class="qty-btn" data-minus="${it.id}">${Icons.minus}</button>
          <span class="qty-val">${it.qty}</span>
          <button class="qty-btn" data-plus="${it.id}">${Icons.plus}</button>
          <button class="remove-x" data-remove="${it.id}">Remove</button>
        </div>
      </div>
    `).join("");
    box.querySelectorAll("[data-plus]").forEach(b => b.onclick = () => {
      const it = tab.items.find(i => i.id === b.dataset.plus);
      DB.updateTabItemQty(tab.id, it.id, it.qty + 1);
      renderOrderBuilder();
    });
    box.querySelectorAll("[data-minus]").forEach(b => b.onclick = () => {
      const it = tab.items.find(i => i.id === b.dataset.minus);
      if (it.qty <= 1) DB.removeTabItem(tab.id, it.id); else DB.updateTabItemQty(tab.id, it.id, it.qty - 1);
      renderOrderBuilder();
    });
    box.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => { DB.removeTabItem(tab.id, b.dataset.remove); renderOrderBuilder(); });
  }

  /* ------------------------------------------------------------------ */
  function openGrabCloseModal(tabId) {
    const tab = DB.getTab(tabId);
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3><span class="grab-tag">GRAB</span> Mark as Paid</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <div class="field">
            <label>Grab Order / Reference No.</label>
            <input id="grab-close-ref" value="${Utils.escapeHtml(tab.customerName)}" placeholder="e.g. GF-88213" autocomplete="off">
          </div>
          <div class="tot-row grand" style="margin-top:4px;"><span>Total</span><span class="amt">${Utils.peso(tab.total)}</span></div>
          <p class="hint" style="margin-top:14px;">This confirms the order is fulfilled and paid — Grab settles the payment (minus commission) to you directly, so no cash is collected here.</p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" id="confirm-grab">${Icons.check} Confirm Paid</button>
        </div>
      </div>
    `);
    const refInput = wrap.querySelector("#grab-close-ref");
    refInput.focus();
    refInput.setSelectionRange(refInput.value.length, refInput.value.length);
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    const confirm = () => {
      const ref = refInput.value.trim();
      if (!ref) { Utils.toast("Enter the Grab order/reference number.", "error"); return; }
      let closedTab, session;
      try {
        closedTab = DB.closeGrabOrder(tab.id, ref);
        session = DB.getCurrentSession();
      } catch (e) { Utils.toast(e.message, "error"); return; }
      Utils.closeOverlay();
      Utils.toast("Grab order marked as paid ✓", "success");
      state.view = "dashboard"; state.tabId = null; render();
      Receipt.show(closedTab, session);
    };
    wrap.querySelector("#confirm-grab").onclick = confirm;
    refInput.addEventListener("keydown", e => { if (e.key === "Enter") confirm(); });
  }

  function openFoodPandaCloseModal(tabId) {
    const tab = DB.getTab(tabId);
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3><span class="foodpanda-tag">FOODPANDA</span> Mark as Paid</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <div class="field">
            <label>FoodPanda Order / Reference No.</label>
            <input id="foodpanda-close-ref" value="${Utils.escapeHtml(tab.customerName)}" placeholder="e.g. FP-88213" autocomplete="off">
          </div>
          <div class="tot-row grand" style="margin-top:4px;"><span>Total</span><span class="amt">${Utils.peso(tab.total)}</span></div>
          <p class="hint" style="margin-top:14px;">This confirms the order is fulfilled and paid — FoodPanda settles the payment (minus commission) to you directly, so no cash is collected here.</p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" id="confirm-foodpanda">${Icons.check} Confirm Paid</button>
        </div>
      </div>
    `);
    const refInput = wrap.querySelector("#foodpanda-close-ref");
    refInput.focus();
    refInput.setSelectionRange(refInput.value.length, refInput.value.length);
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    const confirm = () => {
      const ref = refInput.value.trim();
      if (!ref) { Utils.toast("Enter the FoodPanda order/reference number.", "error"); return; }
      let closedTab, session;
      try {
        closedTab = DB.closeFoodPandaOrder(tab.id, ref);
        session = DB.getCurrentSession();
      } catch (e) { Utils.toast(e.message, "error"); return; }
      Utils.closeOverlay();
      Utils.toast("FoodPanda order marked as paid ✓", "success");
      state.view = "dashboard"; state.tabId = null; render();
      Receipt.show(closedTab, session);
    };
    wrap.querySelector("#confirm-foodpanda").onclick = confirm;
    refInput.addEventListener("keydown", e => { if (e.key === "Enter") confirm(); });
  }

  /* ------------------------------------------------------------------ */
  function openPaymentModal(tabId) {
    const tab = DB.getTab(tabId);
    let cashStr = "";

    function roundUp(n, to) { return Math.ceil(n / to) * to; }
    const suggestions = [...new Set([
      tab.total,
      roundUp(tab.total, 50),
      roundUp(tab.total, 100),
      roundUp(tab.total, 500)
    ])].slice(0, 4);

    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head"><h3>Close Tab — ${Utils.escapeHtml(tab.customerName)}</h3><button class="modal-close" data-close>${Icons.x}</button></div>
        <div class="modal-body">
          <div class="tot-row"><span>Amount Due</span><span class="num strong">${Utils.peso(tab.total)}</span></div>
          <div class="amount-display"><span class="cur">₱</span><span id="cash-amt-display">0.00</span></div>
          <div class="quick-cash">${suggestions.map(s => `<button data-quick="${s}">₱${Utils.pesoPlain(s)}</button>`).join("")}</div>
          <div class="numpad">
            <button data-key="1">1</button><button data-key="2">2</button><button data-key="3">3</button>
            <button data-key="4">4</button><button data-key="5">5</button><button data-key="6">6</button>
            <button data-key="7">7</button><button data-key="8">8</button><button data-key="9">9</button>
            <button data-key=".">.</button><button data-key="0">0</button><button data-key="back">⌫</button>
          </div>
          <div class="row between" style="margin-top:16px;">
            <span class="muted">Change</span>
            <span class="num strong" id="change-display" style="font-size:18px;">₱0.00</span>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-cancel>Cancel</button>
          <button class="btn btn-primary" id="confirm-payment" disabled>${Icons.check} Confirm Payment</button>
        </div>
      </div>
    `);

    const display = wrap.querySelector("#cash-amt-display");
    const changeDisplay = wrap.querySelector("#change-display");
    const confirmBtn = wrap.querySelector("#confirm-payment");

    function refresh() {
      const val = parseFloat(cashStr || "0");
      display.textContent = (cashStr ? val : 0).toFixed(2);
      const change = Math.max(0, val - tab.total);
      changeDisplay.textContent = "₱" + Utils.pesoPlain(change);
      confirmBtn.disabled = !(val >= tab.total);
    }
    refresh();

    wrap.querySelectorAll("[data-key]").forEach(b => b.onclick = () => {
      const k = b.dataset.key;
      if (k === "back") cashStr = cashStr.slice(0, -1);
      else if (k === "." ) { if (!cashStr.includes(".")) cashStr += "."; }
      else {
        if (cashStr.includes(".") && cashStr.split(".")[1].length >= 2) return;
        cashStr += k;
      }
      refresh();
    });
    wrap.querySelectorAll("[data-quick]").forEach(b => b.onclick = () => { cashStr = String(Number(b.dataset.quick).toFixed(2)); refresh(); });

    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-cancel]").onclick = () => Utils.closeOverlay();
    confirmBtn.onclick = () => {
      const val = parseFloat(cashStr || "0");
      let closedTab, session;
      try {
        closedTab = DB.closeTab(tab.id, val);
        session = DB.getCurrentSession();
      } catch (e) { Utils.toast(e.message, "error"); return; }
      Utils.closeOverlay();
      Utils.toast("Payment received ✓", "success");
      state.view = "dashboard"; state.tabId = null; render();
      Receipt.show(closedTab, session);
    };
  }

  /* ------------------------------------------------------------------ */
  function renderExpenses() {
    const content = document.getElementById("content");
    const session = DB.getCurrentSession();
    content.innerHTML = `
      <div class="tabs-toolbar">
        <h2>Today's Expenses</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-expense" ${session ? "" : "disabled"}>${Icons.plus} Add Expense</button>
      </div>
      <div id="expense-body"></div>
    `;
    const body = document.getElementById("expense-body");
    if (!session) {
      body.innerHTML = `<div class="empty-state">${Icons.receipt}<h3>No active session</h3><p>Start a session from the dashboard to begin logging expenses.</p></div>`;
    } else if (!session.expenses.length) {
      body.innerHTML = `<div class="empty-state">${Icons.receipt}<h3>No expenses logged</h3><p>Ingredient deliveries, utilities, and other day-to-day costs go here.</p></div>`;
    } else {
      const total = session.expenses.reduce((s, e) => s + e.amount, 0);
      body.innerHTML = `
        <div class="card card-pad" style="margin-bottom:16px;">
          <table class="table">
            <thead><tr><th>Time</th><th>Expense</th><th>Category</th><th class="num">Amount</th><th></th></tr></thead>
            <tbody>
              ${session.expenses.map(e => `
                <tr>
                  <td class="num">${Utils.fmtTimeShort(e.at)}</td>
                  <td>${Utils.escapeHtml(e.name)}</td>
                  <td><span class="tag-cat">${Utils.escapeHtml(e.category)}</span></td>
                  <td class="num">${Utils.peso(e.amount)}</td>
                  <td><button class="btn btn-icon btn-ghost" data-del-exp="${e.id}">${Icons.trash}</button></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <div class="kpi-row" style="grid-template-columns:1fr;">
          <div class="kpi red"><div class="lbl">Total Expenses Today</div><div class="val">${Utils.peso(total)}</div></div>
        </div>
      `;
      body.querySelectorAll("[data-del-exp]").forEach(b => b.onclick = () => {
        if (confirm("Remove this expense?")) { DB.deleteExpense(session.id, b.dataset.delExp); renderExpenses(); }
      });
    }
    const addBtn = document.getElementById("btn-add-expense");
    if (addBtn) addBtn.onclick = () => openAddExpenseModal();
  }

  function openAddExpenseModal() {
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
      try { DB.addExpense({ name, category, amount, enteredBy: state.operatorName }); }
      catch (e) { Utils.toast(e.message, "error"); return; }
      Utils.closeOverlay();
      Utils.toast("Expense logged.", "success");
      renderExpenses();
    };
  }

  return { mount, render, state };
})();

window.Cashier = Cashier;
