/* Evet Kofte POS — pos-modal.js
   The "Solo or Meal?" -> "Pick your drink" flow for food items.
   `platform` is undefined/null for a regular dine-in tab, "grab" for a Grab
   order, or "foodpanda" for a FoodPanda order — each uses that item's own
   admin-set price for the platform instead of the regular dine-in price. */

const PosModal = (() => {

  function foodPrice(food, platform, kind) {
    if (platform === "grab") return kind === "solo" ? food.grabSoloPrice : food.grabMealPrice;
    if (platform === "foodpanda") return kind === "solo" ? food.foodpandaSoloPrice : food.foodpandaMealPrice;
    return kind === "solo" ? food.soloPrice : food.mealPrice;
  }

  function drinkStandalonePrice(drink, platform) {
    if (platform === "grab") return drink.grabStandalonePrice;
    if (platform === "foodpanda") return drink.foodpandaStandalonePrice;
    return drink.standalonePrice;
  }

  function drinkUpgradePrice(drink, platform) {
    if (platform === "grab") return drink.grabMealUpgradePrice;
    if (platform === "foodpanda") return drink.foodpandaMealUpgradePrice;
    return drink.mealUpgradePrice;
  }

  function pickFoodOption(foodItem, onDone, platform) {
    const soloPrice = foodPrice(foodItem, platform, "solo");
    const mealPrice = foodPrice(foodItem, platform, "meal");
    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head">
          <h3>${Utils.escapeHtml(foodItem.name)}</h3>
          <button class="modal-close" data-close>${Icons.x}</button>
        </div>
        <div class="modal-body">
          <div class="big-choice">
            <button data-solo>
              ${Icons.plate}
              <b>Solo</b>
              <span>${Utils.peso(soloPrice)}</span>
            </button>
            <button data-meal>
              ${Icons.tray}
              <b>Meal</b>
              <span>${Utils.peso(mealPrice)} + drink</span>
            </button>
          </div>
        </div>
      </div>
    `);
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-solo]").onclick = () => {
      Utils.closeOverlay();
      onDone({
        kind: "food", name: foodItem.name, type: "solo", foodItemId: foodItem.id,
        basePrice: soloPrice, unitPrice: soloPrice,
        drinkUpgradeName: null, drinkUpgradeDelta: 0, drinkUpgradeId: null, qty: 1
      });
    };
    wrap.querySelector("[data-meal]").onclick = () => {
      Utils.closeOverlay();
      pickDrinkUpgrade(foodItem, onDone, platform);
    };
  }

  function pickDrinkUpgrade(foodItem, onDone, platform) {
    const mealPrice = foodPrice(foodItem, platform, "meal");
    const drinks = DB.getDrinks().filter(d => d.active && d.availableMealUpgrade);
    if (!drinks.length) {
      Utils.toast("No drinks are set up for meal upgrades yet — add some in Admin → Menu.", "error");
      onDone({
        kind: "food", name: foodItem.name, type: "meal", foodItemId: foodItem.id,
        basePrice: mealPrice, unitPrice: mealPrice,
        drinkUpgradeName: null, drinkUpgradeDelta: 0, drinkUpgradeId: null, qty: 1
      });
      return;
    }
    const rows = drinks.map(d => {
      const delta = drinkUpgradePrice(d, platform);
      const isStd = delta === 0;
      return `
        <div class="option-row" data-id="${d.id}">
          <div>
            <div class="nm">${Utils.escapeHtml(d.emoji || "")} ${Utils.escapeHtml(d.name)}</div>
            <div class="desc">${isStd ? "Standard option" : "Premium upgrade"}</div>
          </div>
          <div class="pr ${isStd ? "free" : "plus"}">${isStd ? "Included" : "+" + Utils.peso(delta)}</div>
        </div>`;
    }).join("");

    const wrap = Utils.openOverlay(`
      <div class="modal">
        <div class="modal-head">
          <h3>Choose a drink</h3>
          <button class="modal-close" data-close>${Icons.x}</button>
        </div>
        <div class="modal-body">
          <div class="option-list">${rows}</div>
        </div>
      </div>
    `);
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelectorAll(".option-row").forEach(row => {
      row.onclick = () => {
        const drink = drinks.find(d => d.id === row.dataset.id);
        const delta = drinkUpgradePrice(drink, platform);
        Utils.closeOverlay();
        onDone({
          kind: "food", name: foodItem.name, type: "meal", foodItemId: foodItem.id,
          basePrice: mealPrice, unitPrice: mealPrice + delta,
          drinkUpgradeName: drink.name, drinkUpgradeDelta: delta, drinkUpgradeId: drink.id, qty: 1
        });
      };
    });
  }

  function buildDrinkItem(drink, platform) {
    const price = drinkStandalonePrice(drink, platform);
    return {
      kind: "drink", name: drink.name, type: null, drinkItemId: drink.id,
      basePrice: price, unitPrice: price,
      drinkUpgradeName: null, drinkUpgradeDelta: 0, drinkUpgradeId: null, qty: 1
    };
  }

  return { pickFoodOption, buildDrinkItem, foodPrice, drinkStandalonePrice, drinkUpgradePrice };
})();

window.PosModal = PosModal;
