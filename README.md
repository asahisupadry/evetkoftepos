# Evet Kofte POS

A cashier + admin point-of-sale web app, installable on an Android tablet like a native app.
Works fully offline; internet is only needed when a report is emailed / uploaded to Drive.

## 1. Deploy it (pick one, both are free)

This is a static app (no server code to run) — it just needs to be served over
**http(s)**, not opened directly as a `file://` — Android/Chrome disables
storage and "Add to Home Screen" on `file://` pages.

**Easiest — GitHub Pages**
1. Create a new GitHub repo, upload everything in this folder.
2. Settings → Pages → Deploy from branch → `main` / root.
3. You'll get a URL like `https://yourname.github.io/evet-kofte-pos/`.

**Also easy — Netlify Drop**
1. Go to https://app.netlify.com/drop
2. Drag this whole folder in. You'll get a live URL instantly.

## 2. Install it on the tablet
1. Open the URL in Chrome on the Android tablet.
2. Chrome menu (⋮) → **Add to Home screen** → Install.
3. Launch it from the home screen icon — it opens full-screen, no browser bar.

## 3. Set up automatic email + Google Drive delivery (~5 minutes)
The tablet can't send email or talk to Drive directly — it POSTs the finished
report to a small script running on **your own Google account**, which does that part.

1. Go to https://script.google.com → **New project**.
2. Delete the placeholder code, paste in `google-apps-script/Code.gs`.
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click Deploy, approve the Drive + Gmail permission prompts.
5. Copy the URL ending in `/exec`.
6. On the tablet: **Admin → Settings → Google Apps Script Web App URL** — paste it, add your notification email, Save.

From then on, every "End Session" or generated report is emailed and saved into a
**"Evet Kofte Reports"** folder in that Google account's Drive automatically.
If the URL isn't set yet, or the tablet has no signal at that moment, the report
downloads to the tablet instead so nothing is ever lost.

## Default admin PIN
`1234` — change it immediately in Admin → Settings.

## How data is stored
Everything (menu, sessions, tabs, expenses) lives in the tablet's browser storage —
one device, works offline. Use **Admin → Settings → Export Backup** regularly;
it downloads one `.json` file you can restore from later if the tablet is ever reset.

## What's built in
**Cashier:** start/end session, live clock, customer tabs (remembers past names),
Food (Solo/Meal — meal prompts a drink upgrade with admin-set upcharges) and
Drinks ordering, per-tab running ticket, cash payment with change due, printable
QR-code receipt, expense logging, end-of-day XLSX report auto-sent. Tabs left
open at end of session (e.g. regulars who haven't paid) carry over automatically
into the next session instead of being force-closed.

### How the receipt QR code works
The QR on every receipt is a real link back to this same deployed app, with that
receipt's data packed into the URL itself — no database or server needed to
"host" it. Scan it with any phone camera and it opens a clean, standalone,
full-page copy of that exact receipt with a **Print / Save as PDF** button
(the phone's own browser print dialog can save it as an actual PDF file, not
just show a QR that decodes to unreadable text).

This only resolves for the customer once the app is deployed to a real
`https://` address (GitHub Pages, Netlify, etc. — see setup above). If you're
testing locally via `python -m http.server`, the QR will encode a
`http://localhost:...` link, which only works on the same computer — that's
expected for local testing, not a bug.

**Grab & FoodPanda delivery orders:** separate "New Grab Order" / "New FoodPanda Order"
flows, each tagged and priced independently from dine-in and from each other. Admin sets
a custom price per platform per menu item (Admin → Menu — each item has its own Grab and
FoodPanda Solo/Meal/Standalone/Upgrade price fields, currently defaulted to match the
regular dine-in price; leave a field blank to keep matching it, or set your own).
When the cashier opens a Grab or FoodPanda order, the whole menu automatically shows
and charges that platform's prices. Closing either skips cash/change entirely — it's
just "Mark as Paid" against the platform's order/reference number (editable right up
until you confirm), since both platforms settle payment (minus their commission) to
you directly. Reports and the dashboard break out Grab, FoodPanda, and dine-in sales
separately throughout.

**Inventory & recipes:** Admin → Inventory lets you define ingredients (name, unit,
stock on hand, low-stock threshold) and a shared "Meal Side Recipe" for the fries that
come with every meal. Each food/drink item's edit form has a Recipe section — set how
much of which ingredients it uses per order. **This includes drinks**: a drink's recipe
deducts whenever it's ordered on its own from the Drinks tab, *and* whenever it's the
one chosen as a meal's included drink upgrade — whichever drink actually gets picked
for that meal is the one whose recipe deducts, not any other. Whenever a cashier
punches in an order (any tab type — dine-in, Grab, or FoodPanda), the ingredients are
deducted immediately, and automatically restored if the item is removed, its quantity
lowered, or the tab is voided. A toast and a dashboard/Inventory banner warn the moment
any ingredient crosses its threshold. Three examples are pre-wired end to end — Kofte
Grande deducts 5 meatballs and 1 bread, Coke deducts a canned Coke (demonstrating the
meal-upgrade-drink path), and Budweiser deducts a bottle (demonstrating the standalone-
drink path) — so you can see all of it working and copy the pattern to the rest of the
menu.

**Admin:** PIN-gated. Report history + custom date-range export, full Food & Drinks
menu editor (add/edit/delete, solo & meal pricing, drink upgrade pricing, Grab/FoodPanda
pricing and recipes per item), Inventory (ingredients, thresholds, restocking, meal
side recipe), all-time expenses, settings (branding, PIN, delivery email/Drive endpoint,
cashier list, backup/restore).

## The current menu
Loaded by default — edit anytime in Admin → Menu:

**Food** — Bowls (Kofte/Chicken Salad or Rice Bowl, ₱360 solo / ₱490 meal), Kofte Mini
(₱290/₱440), Kofte Grande (₱360/₱490), Kofte Pulutan Platter (₱360, no meal), Kofte
Burger (₱360/₱490), Chicken Shish Kebab Wrap (₱360/₱490), Salads — Mediterranean
Classic, Anatolian, Tuna (₱360 each, no meal). Every meal includes a drink upgrade
choice plus a side of fries.

**Drinks** — Beer (Estrella Galicia/Corona ₱190, Budweiser ₱160), Shots & Combos
(Jager/Cuervo ₱180, Corona+Jager ₱270), Wine (Red/White/Sangria ₱190), Cocktails
(Gin Tonic/Rum Coke/Vodka Soda ₱250, Negroni ₱350), Soft Drinks (Coke/Coke Zero/
Sprite/Singha Soda ₱90, Bottled Water ₱40 — these five are the free/standard meal
upgrade options by default).

Grab and FoodPanda prices are set equal to dine-in prices for every item right now —
head to Admin → Menu to adjust any of them per platform whenever you're ready.

## A few suggestions for later
- **Kitchen ticket printer**: a Bluetooth/USB thermal printer needs a native driver —
  out of scope for a browser app, but the receipt view is already print-formatted
  if you connect a printer through Android's print service.
- **Multiple registers**: right now one open "session" is shared restaurant-wide;
  fine for a single tablet/counter. Running two tablets at once would need a small
  shared backend (e.g. Firebase) instead of on-device storage.
- **Daily sales/inventory-usage charts** would layer nicely on top of the existing
  Reports and Inventory data if you want them added later.
https://github.com/asahisupadry/evetkoftepos.git


