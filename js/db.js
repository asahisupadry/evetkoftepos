/* Evet Kofte POS — db.js
   Persistence layer. Uses localStorage (single-device tablet app, works fully offline).
   All reads/writes are synchronous and go through this module only. */

const DB = (() => {
  const KEYS = {
    settings: "ek_settings",
    food: "ek_menu_food",
    drinks: "ek_menu_drinks",
    customers: "ek_customers",
    sessions: "ek_sessions",
    currentSession: "ek_current_session_id",
    carriedTabs: "ek_carried_tabs",
    inventory: "ek_inventory",
    mealSideRecipe: "ek_meal_side_recipe",
    seeded: "ek_seeded_v1",
    menuV2Applied: "ek_menu_v2_applied"
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  /* ---------------------------------------------------------------------
     Seed data — sensible Evet Kofte starting menu. Admin can edit freely.
     --------------------------------------------------------------------- */
  function buildDefaultMenu() {
    const food = [
      // Bowls — 360 solo / 490 meal
      { id: Utils.uid("f"), name: "Kofte Salad Bowl", emoji: "🥗", category: "Bowls", soloPrice: 360, mealPrice: 490, allowMeal: true, active: true, grabSoloPrice: 360, grabMealPrice: 490, foodpandaSoloPrice: 360, foodpandaMealPrice: 490, recipe: [] },
      { id: Utils.uid("f"), name: "Kofte Rice Bowl", emoji: "🍚", category: "Bowls", soloPrice: 360, mealPrice: 490, allowMeal: true, active: true, grabSoloPrice: 360, grabMealPrice: 490, foodpandaSoloPrice: 360, foodpandaMealPrice: 490, recipe: [] },
      { id: Utils.uid("f"), name: "Chicken Rice Bowl", emoji: "🍚", category: "Bowls", soloPrice: 360, mealPrice: 490, allowMeal: true, active: true, grabSoloPrice: 360, grabMealPrice: 490, foodpandaSoloPrice: 360, foodpandaMealPrice: 490, recipe: [] },
      { id: Utils.uid("f"), name: "Chicken Salad Bowl", emoji: "🥗", category: "Bowls", soloPrice: 360, mealPrice: 490, allowMeal: true, active: true, grabSoloPrice: 360, grabMealPrice: 490, foodpandaSoloPrice: 360, foodpandaMealPrice: 490, recipe: [] },
      // Kofte
      { id: Utils.uid("f"), name: "Kofte Mini", emoji: "🍢", category: "Kofte", soloPrice: 290, mealPrice: 440, allowMeal: true, active: true, grabSoloPrice: 290, grabMealPrice: 440, foodpandaSoloPrice: 290, foodpandaMealPrice: 440, recipe: [] },
      { id: Utils.uid("f"), name: "Kofte Grande", emoji: "🍢", category: "Kofte", soloPrice: 360, mealPrice: 490, allowMeal: true, active: true, grabSoloPrice: 360, grabMealPrice: 490, foodpandaSoloPrice: 360, foodpandaMealPrice: 490, recipe: [] },
      { id: Utils.uid("f"), name: "Kofte Pulutan Platter", emoji: "🍽️", category: "Kofte", soloPrice: 360, mealPrice: 360, allowMeal: false, active: true, grabSoloPrice: 360, grabMealPrice: 360, foodpandaSoloPrice: 360, foodpandaMealPrice: 360, recipe: [] },
      // Burgers
      { id: Utils.uid("f"), name: "Kofte Burger", emoji: "🍔", category: "Burgers", soloPrice: 360, mealPrice: 490, allowMeal: true, active: true, grabSoloPrice: 360, grabMealPrice: 490, foodpandaSoloPrice: 360, foodpandaMealPrice: 490, recipe: [] },
      // Wraps
      { id: Utils.uid("f"), name: "Chicken Shish Kebab Wrap", emoji: "🌯", category: "Wraps", soloPrice: 360, mealPrice: 490, allowMeal: true, active: true, grabSoloPrice: 360, grabMealPrice: 490, foodpandaSoloPrice: 360, foodpandaMealPrice: 490, recipe: [] },
      // Salads — 360, no meal option
      { id: Utils.uid("f"), name: "Mediterranean Classic Salad", emoji: "🥗", category: "Salads", soloPrice: 360, mealPrice: 360, allowMeal: false, active: true, grabSoloPrice: 360, grabMealPrice: 360, foodpandaSoloPrice: 360, foodpandaMealPrice: 360, recipe: [] },
      { id: Utils.uid("f"), name: "Anatolian Salad", emoji: "🥗", category: "Salads", soloPrice: 360, mealPrice: 360, allowMeal: false, active: true, grabSoloPrice: 360, grabMealPrice: 360, foodpandaSoloPrice: 360, foodpandaMealPrice: 360, recipe: [] },
      { id: Utils.uid("f"), name: "Tuna Salad", emoji: "🐟", category: "Salads", soloPrice: 360, mealPrice: 360, allowMeal: false, active: true, grabSoloPrice: 360, grabMealPrice: 360, foodpandaSoloPrice: 360, foodpandaMealPrice: 360, recipe: [] },
    ];

    const drinks = [
      // Beer
      { id: Utils.uid("d"), name: "Estrella Galicia", emoji: "🍺", category: "Beer", standalonePrice: 190, mealUpgradePrice: 190, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 190, grabMealUpgradePrice: 190, foodpandaStandalonePrice: 190, foodpandaMealUpgradePrice: 190, recipe: [] },
      { id: Utils.uid("d"), name: "Corona", emoji: "🍺", category: "Beer", standalonePrice: 190, mealUpgradePrice: 190, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 190, grabMealUpgradePrice: 190, foodpandaStandalonePrice: 190, foodpandaMealUpgradePrice: 190, recipe: [] },
      { id: Utils.uid("d"), name: "Budweiser", emoji: "🍺", category: "Beer", standalonePrice: 160, mealUpgradePrice: 160, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 160, grabMealUpgradePrice: 160, foodpandaStandalonePrice: 160, foodpandaMealUpgradePrice: 160, recipe: [] },
      // Shots & Combos
      { id: Utils.uid("d"), name: "Jager Shot", emoji: "🥃", category: "Shots & Combos", standalonePrice: 180, mealUpgradePrice: 180, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 180, grabMealUpgradePrice: 180, foodpandaStandalonePrice: 180, foodpandaMealUpgradePrice: 180, recipe: [] },
      { id: Utils.uid("d"), name: "Cuervo Shot", emoji: "🥃", category: "Shots & Combos", standalonePrice: 180, mealUpgradePrice: 180, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 180, grabMealUpgradePrice: 180, foodpandaStandalonePrice: 180, foodpandaMealUpgradePrice: 180, recipe: [] },
      { id: Utils.uid("d"), name: "Corona + Jager", emoji: "🍻", category: "Shots & Combos", standalonePrice: 270, mealUpgradePrice: 270, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 270, grabMealUpgradePrice: 270, foodpandaStandalonePrice: 270, foodpandaMealUpgradePrice: 270, recipe: [] },
      // Wine
      { id: Utils.uid("d"), name: "Red Wine", emoji: "🍷", category: "Wine", standalonePrice: 190, mealUpgradePrice: 190, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 190, grabMealUpgradePrice: 190, foodpandaStandalonePrice: 190, foodpandaMealUpgradePrice: 190, recipe: [] },
      { id: Utils.uid("d"), name: "White Wine", emoji: "🥂", category: "Wine", standalonePrice: 190, mealUpgradePrice: 190, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 190, grabMealUpgradePrice: 190, foodpandaStandalonePrice: 190, foodpandaMealUpgradePrice: 190, recipe: [] },
      { id: Utils.uid("d"), name: "Sangria", emoji: "🍷", category: "Wine", standalonePrice: 190, mealUpgradePrice: 190, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 190, grabMealUpgradePrice: 190, foodpandaStandalonePrice: 190, foodpandaMealUpgradePrice: 190, recipe: [] },
      // Cocktails
      { id: Utils.uid("d"), name: "Gin Tonic", emoji: "🍸", category: "Cocktails", standalonePrice: 250, mealUpgradePrice: 250, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 250, grabMealUpgradePrice: 250, foodpandaStandalonePrice: 250, foodpandaMealUpgradePrice: 250, recipe: [] },
      { id: Utils.uid("d"), name: "Rum Coke", emoji: "🍹", category: "Cocktails", standalonePrice: 250, mealUpgradePrice: 250, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 250, grabMealUpgradePrice: 250, foodpandaStandalonePrice: 250, foodpandaMealUpgradePrice: 250, recipe: [] },
      { id: Utils.uid("d"), name: "Vodka Soda", emoji: "🍸", category: "Cocktails", standalonePrice: 250, mealUpgradePrice: 250, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 250, grabMealUpgradePrice: 250, foodpandaStandalonePrice: 250, foodpandaMealUpgradePrice: 250, recipe: [] },
      { id: Utils.uid("d"), name: "Negroni", emoji: "🍸", category: "Cocktails", standalonePrice: 350, mealUpgradePrice: 350, availableStandalone: true, availableMealUpgrade: false, active: true, grabStandalonePrice: 350, grabMealUpgradePrice: 350, foodpandaStandalonePrice: 350, foodpandaMealUpgradePrice: 350, recipe: [] },
      // Soft Drinks — the standard, included-free meal upgrade options
      { id: Utils.uid("d"), name: "Coke", emoji: "🥤", category: "Soft Drinks", standalonePrice: 90, mealUpgradePrice: 0, availableStandalone: true, availableMealUpgrade: true, active: true, grabStandalonePrice: 90, grabMealUpgradePrice: 0, foodpandaStandalonePrice: 90, foodpandaMealUpgradePrice: 0, recipe: [] },
      { id: Utils.uid("d"), name: "Coke Zero", emoji: "🥤", category: "Soft Drinks", standalonePrice: 90, mealUpgradePrice: 0, availableStandalone: true, availableMealUpgrade: true, active: true, grabStandalonePrice: 90, grabMealUpgradePrice: 0, foodpandaStandalonePrice: 90, foodpandaMealUpgradePrice: 0, recipe: [] },
      { id: Utils.uid("d"), name: "Sprite", emoji: "🥤", category: "Soft Drinks", standalonePrice: 90, mealUpgradePrice: 0, availableStandalone: true, availableMealUpgrade: true, active: true, grabStandalonePrice: 90, grabMealUpgradePrice: 0, foodpandaStandalonePrice: 90, foodpandaMealUpgradePrice: 0, recipe: [] },
      { id: Utils.uid("d"), name: "Singha Soda", emoji: "🥤", category: "Soft Drinks", standalonePrice: 90, mealUpgradePrice: 0, availableStandalone: true, availableMealUpgrade: true, active: true, grabStandalonePrice: 90, grabMealUpgradePrice: 0, foodpandaStandalonePrice: 90, foodpandaMealUpgradePrice: 0, recipe: [] },
      { id: Utils.uid("d"), name: "Bottled Water", emoji: "💧", category: "Soft Drinks", standalonePrice: 40, mealUpgradePrice: 0, availableStandalone: true, availableMealUpgrade: true, active: true, grabStandalonePrice: 40, grabMealUpgradePrice: 0, foodpandaStandalonePrice: 40, foodpandaMealUpgradePrice: 0, recipe: [] },
    ];

    return { food, drinks };
  }

  // One example ingredient set + recipe, demonstrating the inventory feature
  // on Kofte Grande exactly as described when the feature was requested.
  // Everything else starts with an empty recipe — admin fills the rest in
  // via Admin → Inventory and each item's edit form.
  function buildExampleInventory(food, drinks) {
    const meatball = { id: Utils.uid("ing"), name: "Kofte Meatball", unit: "pcs", stock: 200, threshold: 40, active: true };
    const bread = { id: Utils.uid("ing"), name: "Burger/Wrap Bread", unit: "pcs", stock: 60, threshold: 15, active: true };
    const potato = { id: Utils.uid("ing"), name: "Frozen French Fries", unit: "g", stock: 10000, threshold: 2000, active: true };
    const canCoke = { id: Utils.uid("ing"), name: "Canned Coke", unit: "pcs", stock: 150, threshold: 30, active: true };
    const budweiserBottle = { id: Utils.uid("ing"), name: "Budweiser Bottle", unit: "pcs", stock: 100, threshold: 20, active: true };

    const grande = food.find(f => f.name === "Kofte Grande");
    if (grande) grande.recipe = [{ ingredientId: meatball.id, qty: 5 }, { ingredientId: bread.id, qty: 1 }];

    // Two examples showing both deduction paths asked for: a drink that can
    // be chosen as a meal's included drink (Coke), and a drink only ever
    // ordered standalone (Budweiser) — both deduct their own ingredient
    // whichever way they're ordered.
    const coke = drinks.find(d => d.name === "Coke");
    if (coke) coke.recipe = [{ ingredientId: canCoke.id, qty: 1 }];
    const budweiser = drinks.find(d => d.name === "Budweiser");
    if (budweiser) budweiser.recipe = [{ ingredientId: budweiserBottle.id, qty: 1 }];

    return {
      inventory: [meatball, bread, potato, canCoke, budweiserBottle],
      mealSideRecipe: [{ ingredientId: potato.id, qty: 150 }]
    };
  }

  function seedIfNeeded() {
    if (read(KEYS.seeded, false)) return;

    const { food, drinks } = buildDefaultMenu();
    const { inventory, mealSideRecipe } = buildExampleInventory(food, drinks);

    write(KEYS.food, food);
    write(KEYS.drinks, drinks);
    write(KEYS.customers, []);
    write(KEYS.sessions, []);
    write(KEYS.currentSession, null);
    write(KEYS.inventory, inventory);
    write(KEYS.mealSideRecipe, mealSideRecipe);
    write(KEYS.settings, {
      restaurantName: "Evet Kofte",
      adminPin: "1234",
      appsScriptUrl: "",
      notifyEmail: "",
      cashierNames: [],
      receiptFooter: "Salamat po! Come again."
    });
    write(KEYS.seeded, true);
    write(KEYS.menuV2Applied, true);
  }
  seedIfNeeded();

  // Surgical one-time migration for installs that already have data (old
  // menu, real session history): replaces ONLY the food/drinks menu and
  // seeds the inventory/meal-side-recipe, without touching sessions,
  // customers, or settings.
  function applyMenuV2IfNeeded() {
    if (read(KEYS.menuV2Applied, false)) return;
    const { food, drinks } = buildDefaultMenu();
    const { inventory, mealSideRecipe } = buildExampleInventory(food, drinks);
    write(KEYS.food, food);
    write(KEYS.drinks, drinks);
    if (!read(KEYS.inventory, null)) write(KEYS.inventory, inventory);
    if (!read(KEYS.mealSideRecipe, null)) write(KEYS.mealSideRecipe, mealSideRecipe);
    write(KEYS.menuV2Applied, true);
  }
  applyMenuV2IfNeeded();

  // One-time-per-load migration: older installs won't have Grab-specific
  // pricing fields yet. Default them to the item's regular price so Grab
  // ordering works immediately; admin can then customize any item.
  function migrateGrabPricing() {
    let changed = false;
    const food = getFood();
    food.forEach(f => {
      if (f.grabSoloPrice === undefined) { f.grabSoloPrice = f.soloPrice; changed = true; }
      if (f.grabMealPrice === undefined) { f.grabMealPrice = f.mealPrice; changed = true; }
      if (f.foodpandaSoloPrice === undefined) { f.foodpandaSoloPrice = f.soloPrice; changed = true; }
      if (f.foodpandaMealPrice === undefined) { f.foodpandaMealPrice = f.mealPrice; changed = true; }
      if (f.recipe === undefined) { f.recipe = []; changed = true; }
    });
    if (changed) saveFoodList(food);

    changed = false;
    const drinks = getDrinks();
    drinks.forEach(d => {
      if (d.grabStandalonePrice === undefined) { d.grabStandalonePrice = d.standalonePrice; changed = true; }
      if (d.grabMealUpgradePrice === undefined) { d.grabMealUpgradePrice = d.mealUpgradePrice; changed = true; }
      if (d.foodpandaStandalonePrice === undefined) { d.foodpandaStandalonePrice = d.standalonePrice; changed = true; }
      if (d.foodpandaMealUpgradePrice === undefined) { d.foodpandaMealUpgradePrice = d.mealUpgradePrice; changed = true; }
      if (d.recipe === undefined) { d.recipe = []; changed = true; }
      if (d.category === undefined) { d.category = "Drinks"; changed = true; }
    });
    if (changed) saveDrinksList(drinks);

    if (read(KEYS.inventory, null) === null) write(KEYS.inventory, []);
    if (read(KEYS.mealSideRecipe, null) === null) write(KEYS.mealSideRecipe, []);
  }
  migrateGrabPricing();

  /* ---------------------------------------------------------------------
     Settings
     --------------------------------------------------------------------- */
  function getSettings() { return read(KEYS.settings, {}); }
  function saveSettings(patch) {
    const s = Object.assign({}, getSettings(), patch);
    write(KEYS.settings, s);
    return s;
  }

  /* ---------------------------------------------------------------------
     Menu — Food
     --------------------------------------------------------------------- */
  function getFood() { return read(KEYS.food, []); }
  function saveFoodList(list) { write(KEYS.food, list); }
  function upsertFood(item) {
    const list = getFood();
    const i = list.findIndex(x => x.id === item.id);
    if (i >= 0) list[i] = item; else { item.id = item.id || Utils.uid("f"); list.push(item); }
    saveFoodList(list);
    return item;
  }
  function deleteFood(id) { saveFoodList(getFood().filter(x => x.id !== id)); }

  /* ---------------------------------------------------------------------
     Menu — Drinks
     --------------------------------------------------------------------- */
  function getDrinks() { return read(KEYS.drinks, []); }
  function saveDrinksList(list) { write(KEYS.drinks, list); }
  function upsertDrink(item) {
    const list = getDrinks();
    const i = list.findIndex(x => x.id === item.id);
    if (i >= 0) list[i] = item; else { item.id = item.id || Utils.uid("d"); list.push(item); }
    saveDrinksList(list);
    return item;
  }
  function deleteDrink(id) { saveDrinksList(getDrinks().filter(x => x.id !== id)); }

  /* ---------------------------------------------------------------------
     Customers (saved names, for autocomplete across sessions)
     --------------------------------------------------------------------- */
  function getCustomers() { return read(KEYS.customers, []); }
  function touchCustomer(name) {
    name = (name || "").trim();
    if (!name) return;
    const list = getCustomers();
    const i = list.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    if (i >= 0) list[i].lastUsed = Date.now();
    else list.push({ name, lastUsed: Date.now() });
    list.sort((a, b) => b.lastUsed - a.lastUsed);
    write(KEYS.customers, list.slice(0, 200));
  }

  /* ---------------------------------------------------------------------
     Sessions
     --------------------------------------------------------------------- */
  function getSessions() { return read(KEYS.sessions, []); }
  function saveSessions(list) { write(KEYS.sessions, list); }
  function getCurrentSessionId() { return read(KEYS.currentSession, null); }
  function getCurrentSession() {
    const id = getCurrentSessionId();
    if (!id) return null;
    return getSessions().find(s => s.id === id) || null;
  }
  function getSessionById(id) { return getSessions().find(s => s.id === id) || null; }

  function _saveSession(session) {
    const list = getSessions();
    const i = list.findIndex(s => s.id === session.id);
    if (i >= 0) list[i] = session; else list.push(session);
    saveSessions(list);
    return session;
  }

  function startSession(cashierName) {
    if (getCurrentSession()) throw new Error("A session is already open.");
    const carried = read(KEYS.carriedTabs, []);
    const session = {
      id: Utils.uid("sess"),
      dateStarted: new Date().toISOString(),
      dateEnded: null,
      status: "open",
      cashierName: cashierName || "Cashier",
      tabs: carried,
      expenses: []
    };
    _saveSession(session);
    write(KEYS.currentSession, session.id);
    write(KEYS.carriedTabs, []);
    if (cashierName) {
      const s = getSettings();
      if (!s.cashierNames.includes(cashierName)) {
        s.cashierNames.push(cashierName);
        saveSettings({ cashierNames: s.cashierNames });
      }
    }
    return session;
  }

  // Ending a session no longer requires every tab to be closed first —
  // regulars who run a tab can be left open; it carries forward and shows
  // up already-open on the next session instead of being lost or forced shut.
  function endSession() {
    const session = getCurrentSession();
    if (!session) throw new Error("No open session.");
    const stillOpen = session.tabs.filter(t => t.status === "open");
    const closedTabs = session.tabs.filter(t => t.status !== "open");
    session.tabs = closedTabs;
    session.carriedOverCount = stillOpen.length;
    session.status = "closed";
    session.dateEnded = new Date().toISOString();
    _saveSession(session);
    write(KEYS.currentSession, null);
    if (stillOpen.length) {
      const marked = stillOpen.map(t => Object.assign({}, t, { carriedOver: true, lastCarriedAt: new Date().toISOString() }));
      write(KEYS.carriedTabs, read(KEYS.carriedTabs, []).concat(marked));
    }
    return session;
  }

  function getCarriedTabs() { return read(KEYS.carriedTabs, []); }

  /* ---------------------------------------------------------------------
     Tabs
     --------------------------------------------------------------------- */
  function createTab(customerName, orderType) {
    const session = getCurrentSession();
    if (!session) throw new Error("No open session.");
    const validTypes = ["grab", "foodpanda"];
    const tab = {
      id: Utils.uid("tab"),
      customerName: customerName || "Walk-in",
      orderType: validTypes.includes(orderType) ? orderType : "dine-in",
      status: "open",
      items: [],
      openedAt: new Date().toISOString(),
      closedAt: null,
      cashReceived: null,
      changeGiven: null,
      total: 0,
      receiptNo: null
    };
    session.tabs.push(tab);
    _saveSession(session);
    if (tab.orderType === "dine-in") touchCustomer(customerName);
    return tab;
  }

  function getOpenTabs() {
    const session = getCurrentSession();
    if (!session) return [];
    return session.tabs.filter(t => t.status === "open");
  }

  function getTab(tabId) {
    const session = getCurrentSession();
    if (!session) return null;
    return session.tabs.find(t => t.id === tabId) || null;
  }

  function _recalcTab(tab) {
    tab.total = tab.items.reduce((sum, it) => sum + it.lineTotal, 0);
  }

  function addItemToTab(tabId, item) {
    const session = getCurrentSession();
    if (!session) throw new Error("No open session.");
    const tab = session.tabs.find(t => t.id === tabId);
    if (!tab) throw new Error("Tab not found.");
    item.id = Utils.uid("it");
    item.qty = item.qty || 1;
    item.lineTotal = item.unitPrice * item.qty;
    tab.items.push(item);
    _recalcTab(tab);
    _saveSession(session);
    _adjustInventoryForItem(item, item.qty);
    return tab;
  }

  function updateTabItemQty(tabId, itemId, qty) {
    const session = getCurrentSession();
    const tab = session.tabs.find(t => t.id === tabId);
    const item = tab.items.find(i => i.id === itemId);
    const newQty = Math.max(1, qty);
    const delta = newQty - item.qty;
    item.qty = newQty;
    item.lineTotal = item.unitPrice * item.qty;
    _recalcTab(tab);
    _saveSession(session);
    _adjustInventoryForItem(item, delta);
    return tab;
  }

  function removeTabItem(tabId, itemId) {
    const session = getCurrentSession();
    const tab = session.tabs.find(t => t.id === tabId);
    const item = tab.items.find(i => i.id === itemId);
    tab.items = tab.items.filter(i => i.id !== itemId);
    _recalcTab(tab);
    _saveSession(session);
    if (item) _adjustInventoryForItem(item, -item.qty);
    return tab;
  }

  function closeTab(tabId, cashReceived) {
    const session = getCurrentSession();
    if (!session) throw new Error("No open session.");
    const tab = session.tabs.find(t => t.id === tabId);
    if (!tab) throw new Error("Tab not found.");
    _recalcTab(tab);
    if (cashReceived < tab.total) throw new Error("Cash received is less than the total due.");
    tab.status = "closed";
    tab.closedAt = new Date().toISOString();
    tab.cashReceived = cashReceived;
    tab.changeGiven = +(cashReceived - tab.total).toFixed(2);
    tab.receiptNo = "EK-" + Utils.dateKey(session.dateStarted).replace(/-/g, "") + "-" + tab.id.slice(-5).toUpperCase();
    _saveSession(session);
    return tab;
  }

  // Grab orders are paid digitally by Grab, not in cash at the counter —
  // this just marks the order fulfilled/paid, keeping cashReceived/changeGiven
  // in sync with the total so totals math elsewhere doesn't need special-casing.
  function closeGrabOrder(tabId, refNo) {
    const session = getCurrentSession();
    if (!session) throw new Error("No open session.");
    const tab = session.tabs.find(t => t.id === tabId);
    if (!tab) throw new Error("Tab not found.");
    _recalcTab(tab);
    if (refNo && refNo.trim()) tab.customerName = refNo.trim();
    tab.status = "closed";
    tab.closedAt = new Date().toISOString();
    tab.cashReceived = tab.total;
    tab.changeGiven = 0;
    tab.receiptNo = "GRAB-" + Utils.dateKey(session.dateStarted).replace(/-/g, "") + "-" + tab.id.slice(-5).toUpperCase();
    _saveSession(session);
    return tab;
  }

  // FoodPanda works exactly like Grab — paid digitally by the platform, so
  // this just marks the order fulfilled/paid with the platform's own
  // reference number, no cash/change entry.
  function closeFoodPandaOrder(tabId, refNo) {
    const session = getCurrentSession();
    if (!session) throw new Error("No open session.");
    const tab = session.tabs.find(t => t.id === tabId);
    if (!tab) throw new Error("Tab not found.");
    _recalcTab(tab);
    if (refNo && refNo.trim()) tab.customerName = refNo.trim();
    tab.status = "closed";
    tab.closedAt = new Date().toISOString();
    tab.cashReceived = tab.total;
    tab.changeGiven = 0;
    tab.receiptNo = "FOODPANDA-" + Utils.dateKey(session.dateStarted).replace(/-/g, "") + "-" + tab.id.slice(-5).toUpperCase();
    _saveSession(session);
    return tab;
  }

  function voidTab(tabId) {
    const session = getCurrentSession();
    if (!session) throw new Error("No open session.");
    const tab = session.tabs.find(t => t.id === tabId);
    if (tab) tab.items.forEach(item => _adjustInventoryForItem(item, -item.qty));
    session.tabs = session.tabs.filter(t => t.id !== tabId);
    _saveSession(session);
  }

  /* ---------------------------------------------------------------------
     Expenses (attached to the currently open session)
     --------------------------------------------------------------------- */
  function addExpense(expense) {
    const session = getCurrentSession();
    if (!session) throw new Error("No open session. Start a session to log expenses.");
    const e = {
      id: Utils.uid("exp"),
      name: expense.name,
      category: expense.category || "General",
      amount: Utils.num(expense.amount),
      at: new Date().toISOString(),
      enteredBy: expense.enteredBy || session.cashierName
    };
    session.expenses.push(e);
    _saveSession(session);
    return e;
  }

  function deleteExpense(sessionId, expenseId) {
    const session = getSessionById(sessionId);
    if (!session) return;
    session.expenses = session.expenses.filter(e => e.id !== expenseId);
    _saveSession(session);
  }

  function updateExpense(sessionId, expenseId, patch) {
    const session = getSessionById(sessionId);
    if (!session) return;
    const e = session.expenses.find(x => x.id === expenseId);
    if (!e) return;
    Object.assign(e, patch);
    _saveSession(session);
    return e;
  }

  /* ---------------------------------------------------------------------
     Inventory — ingredients, recipes, and automatic stock deduction.
     Deduction happens the moment an item is punched into an order (added
     to a tab), not when it's paid for, and is reversed if the item is
     removed, its quantity lowered, or the tab is voided — so stock always
     reflects what's actually in play right now.
     --------------------------------------------------------------------- */
  function getInventory() { return read(KEYS.inventory, []); }
  function saveInventoryList(list) { write(KEYS.inventory, list); }
  function upsertIngredient(item) {
    const list = getInventory();
    const i = list.findIndex(x => x.id === item.id);
    if (i >= 0) list[i] = item; else { item.id = item.id || Utils.uid("ing"); list.push(item); }
    saveInventoryList(list);
    return item;
  }
  function deleteIngredient(id) { saveInventoryList(getInventory().filter(x => x.id !== id)); }

  // Manual stock adjustment (restock deliveries, corrections). delta can be
  // negative (e.g. spoilage write-off) or positive (new delivery arrived).
  function adjustStock(id, delta) {
    const list = getInventory();
    const ing = list.find(x => x.id === id);
    if (!ing) throw new Error("Ingredient not found.");
    ing.stock = +(ing.stock + delta).toFixed(3);
    saveInventoryList(list);
    return ing;
  }

  function getLowStockIngredients() {
    return getInventory().filter(i => i.active && i.stock <= i.threshold);
  }

  function getMealSideRecipe() { return read(KEYS.mealSideRecipe, []); }
  function saveMealSideRecipe(recipe) { write(KEYS.mealSideRecipe, recipe); }

  // Alerts raised the moment a deduction pushes an ingredient at-or-below
  // its threshold, queued here so the UI layer can toast them after the
  // triggering action completes, then clear the queue.
  let _pendingLowStockAlerts = [];
  function consumeLowStockAlerts() {
    const a = _pendingLowStockAlerts;
    _pendingLowStockAlerts = [];
    return a;
  }

  // qtyDelta > 0 deducts that many units' worth of the recipe (order placed
  // or increased); qtyDelta < 0 restores that many units' worth (removed,
  // decreased, or voided). Stock is allowed to go negative rather than
  // being clamped at 0, so a shortfall from selling past recorded stock
  // stays visible to the admin instead of being silently hidden.
  function _applyRecipeDelta(recipe, qtyDelta) {
    if (!recipe || !recipe.length || !qtyDelta) return;
    const inv = getInventory();
    let changed = false;
    recipe.forEach(r => {
      const ing = inv.find(i => i.id === r.ingredientId);
      if (!ing) return;
      const before = ing.stock;
      ing.stock = +(ing.stock - r.qty * qtyDelta).toFixed(3);
      changed = true;
      if (qtyDelta > 0 && ing.active && before > ing.threshold && ing.stock <= ing.threshold) {
        _pendingLowStockAlerts.push({ id: ing.id, name: ing.name, stock: ing.stock, unit: ing.unit, threshold: ing.threshold });
      }
    });
    if (changed) saveInventoryList(inv);
  }

  // Resolves and applies every ingredient deduction/restoration a single
  // cart line implies: the food or drink's own recipe, plus — for a meal —
  // the shared meal-side recipe (the included fries) and the chosen drink
  // upgrade's own recipe, if it has one.
  function _adjustInventoryForItem(item, qtyDelta) {
    if (!item || !qtyDelta) return;
    if (item.kind === "food" && item.foodItemId) {
      const food = getFood().find(f => f.id === item.foodItemId);
      if (food) _applyRecipeDelta(food.recipe, qtyDelta);
      if (item.type === "meal") {
        _applyRecipeDelta(getMealSideRecipe(), qtyDelta);
        if (item.drinkUpgradeId) {
          const drink = getDrinks().find(d => d.id === item.drinkUpgradeId);
          if (drink) _applyRecipeDelta(drink.recipe, qtyDelta);
        }
      }
    } else if (item.kind === "drink" && item.drinkItemId) {
      const drink = getDrinks().find(d => d.id === item.drinkItemId);
      if (drink) _applyRecipeDelta(drink.recipe, qtyDelta);
    }
  }

  /* ---------------------------------------------------------------------
     Aggregates / reporting helpers
     --------------------------------------------------------------------- */
  function getSessionTotals(session) {
    const closedTabs = session.tabs.filter(t => t.status === "closed");
    const grossSales = closedTabs.reduce((s, t) => s + t.total, 0);
    const grabSales = closedTabs.filter(t => t.orderType === "grab").reduce((s, t) => s + t.total, 0);
    const foodpandaSales = closedTabs.filter(t => t.orderType === "foodpanda").reduce((s, t) => s + t.total, 0);
    const dineInSales = +(grossSales - grabSales - foodpandaSales).toFixed(2);
    const totalExpenses = session.expenses.reduce((s, e) => s + e.amount, 0);
    return {
      grossSales,
      grabSales,
      foodpandaSales,
      dineInSales,
      totalExpenses,
      netProfit: +(grossSales - totalExpenses).toFixed(2),
      tabCount: closedTabs.length,
      openTabCount: session.tabs.filter(t => t.status === "open").length,
      itemCount: closedTabs.reduce((s, t) => s + t.items.reduce((a, i) => a + i.qty, 0), 0)
    };
  }

  function getSessionsInRange(startDate, endDate) {
    // startDate/endDate: "YYYY-MM-DD" strings, inclusive
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");
    return getSessions().filter(s => {
      const d = new Date(s.dateStarted);
      return d >= start && d <= end;
    }).sort((a, b) => new Date(a.dateStarted) - new Date(b.dateStarted));
  }

  /* ---------------------------------------------------------------------
     Backup / restore (full local data, JSON) — safety net since this is a
     single-device app.
     --------------------------------------------------------------------- */
  function exportBackup() {
    const out = { exportedAt: new Date().toISOString(), data: {} };
    Object.values(KEYS).forEach(k => { out.data[k] = read(k, null); });
    return JSON.stringify(out, null, 2);
  }

  function importBackup(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !parsed.data) throw new Error("Invalid backup file.");
    Object.entries(parsed.data).forEach(([k, v]) => { if (v !== null) write(k, v); });
    return true;
  }

  return {
    KEYS,
    exportBackup, importBackup,
    getSettings, saveSettings,
    getFood, upsertFood, deleteFood,
    getDrinks, upsertDrink, deleteDrink,
    getCustomers, touchCustomer,
    getSessions, getCurrentSession, getCurrentSessionId, getSessionById, startSession, endSession, getCarriedTabs,
    createTab, getOpenTabs, getTab, addItemToTab, updateTabItemQty, removeTabItem, closeTab, closeGrabOrder, closeFoodPandaOrder, voidTab,
    addExpense, deleteExpense, updateExpense,
    getInventory, upsertIngredient, deleteIngredient, adjustStock, getLowStockIngredients,
    getMealSideRecipe, saveMealSideRecipe, consumeLowStockAlerts,
    getSessionTotals, getSessionsInRange
  };
})();

window.DB = DB;
