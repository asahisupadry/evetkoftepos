/* Evet Kofte POS — receipt.js
   Builds the printable thermal-style receipt for a closed tab, and the QR
   code on it.

   The QR encodes a real https:// link back to this same deployed app
   (wherever it's hosted) with the receipt's data compacted into the URL
   itself — no server or database needed to "host" the receipt. When a
   customer scans it, their phone opens that link in their own browser,
   which renders a clean standalone copy of that exact receipt with a
   Print button (their browser's native print dialog can also "Save as
   PDF" — a real printable file, not just a QR that decodes to raw text).

   This only resolves correctly once the app is deployed to a real
   https:// URL (GitHub Pages, Netlify, etc.) — see the README. Scanned
   from a purely local test server (http://localhost:...), the link
   target won't be reachable from another device, which is expected. */

const Receipt = (() => {

  function qrSvg(text, cellSize) {
    // qrcode-generator global (lib/qrcode.min.js). Type 0 = auto-detect smallest size.
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: cellSize || 4, margin: 2 });
  }

  // Items are encoded as short arrays (not objects) to keep the URL/QR as
  // compact as possible: [name, qty, lineTotal, type, drinkUpgradeName].
  function buildReceiptUrl(tab, session, settings, condensed) {
    const data = {
      b: settings.restaurantName || "Evet Kofte",
      f: settings.receiptFooter || "",
      c: session.cashierName || "",
      o: tab.orderType || "dine-in",
      r: tab.receiptNo,
      d: tab.closedAt,
      n: tab.customerName,
      t: tab.total,
      p: tab.cashReceived,
      g: tab.changeGiven
    };
    if (condensed) {
      data.ic = tab.items.reduce((a, i) => a + i.qty, 0);
    } else {
      data.i = tab.items.map(it => [it.name, it.qty, it.lineTotal, it.type || "", it.drinkUpgradeName || ""]);
    }
    const encoded = encodeURIComponent(Utils.utf8ToBase64(JSON.stringify(data)));
    const base = location.origin + location.pathname;
    return `${base}?receipt=${encoded}`;
  }

  // Falls back to a condensed (itemized-list-free) receipt URL if the full
  // one would produce an unreasonably dense/hard-to-scan QR code.
  function receiptQrUrl(tab, session, settings) {
    const full = buildReceiptUrl(tab, session, settings, false);
    return full.length > 1800 ? buildReceiptUrl(tab, session, settings, true) : full;
  }

  function decodeReceiptParam(param) {
    const json = Utils.base64ToUtf8(decodeURIComponent(param));
    const data = JSON.parse(json);
    const items = data.i
      ? data.i.map(a => ({ name: a[0], qty: a[1], lineTotal: a[2], type: a[3] || null, drinkUpgradeName: a[4] || null }))
      : [{ name: `${data.ic || 0} item(s) — ask staff for a full itemized copy`, qty: 1, lineTotal: data.t, type: null, drinkUpgradeName: null }];
    return {
      tab: {
        orderType: data.o, receiptNo: data.r, closedAt: data.d, customerName: data.n,
        items, total: data.t, cashReceived: data.p, changeGiven: data.g
      },
      session: { cashierName: data.c },
      settings: { restaurantName: data.b, receiptFooter: data.f }
    };
  }

  function itemLineHtml(it) {
    const typeTag = it.type === "meal" ? "MEAL" : (it.type === "solo" ? "SOLO" : "");
    const upgrade = it.drinkUpgradeName ? ` + ${Utils.escapeHtml(it.drinkUpgradeName)}` : "";
    const fries = it.type === "meal" ? " + Fries" : "";
    return `
      <div class="rc-item">
        <div class="l1"><span>${it.qty}x ${Utils.escapeHtml(it.name)}</span><span>${Utils.pesoPlain(it.lineTotal)}</span></div>
        ${typeTag || upgrade ? `<div class="l2">${typeTag}${upgrade}${fries}</div>` : ""}
      </div>`;
  }

  function html(tab, session, settings, opts) {
    opts = opts || {};
    const platform = (tab.orderType === "grab" || tab.orderType === "foodpanda") ? tab.orderType : null;
    const platformName = platform === "grab" ? "Grab" : platform === "foodpanda" ? "FoodPanda" : null;
    const items = tab.items.map(itemLineHtml).join("");
    const qr = opts.noQr ? "" : qrSvg(receiptQrUrl(tab, session, settings), 3.6);
    return `
      <div class="receipt" id="print-area">
        <div class="rc-brand">${Utils.escapeHtml(settings.restaurantName || "Evet Kofte")}</div>
        <div class="rc-sub">${platform ? `${platformName} Delivery Order` : "Official Receipt"}</div>
        <div class="rc-div"></div>
        <div class="rc-row"><span>Receipt No.</span><span>${tab.receiptNo}</span></div>
        <div class="rc-row"><span>Date</span><span>${Utils.fmtDateShort(tab.closedAt)}</span></div>
        <div class="rc-row"><span>Time</span><span>${Utils.fmtTimeShort(tab.closedAt)}</span></div>
        <div class="rc-row"><span>${platform ? platformName + " Ref. No." : "Customer"}</span><span>${Utils.escapeHtml(tab.customerName)}</span></div>
        <div class="rc-row"><span>Cashier</span><span>${Utils.escapeHtml(session.cashierName)}</span></div>
        <div class="rc-div"></div>
        ${items}
        <div class="rc-div"></div>
        <div class="rc-total"><span>TOTAL</span><span>₱${Utils.pesoPlain(tab.total)}</span></div>
        ${platform
          ? `<div class="rc-row"><span>Payment</span><span>${platformName} (Cashless)</span></div>`
          : `<div class="rc-row"><span>Cash Received</span><span>₱${Utils.pesoPlain(tab.cashReceived)}</span></div>
             <div class="rc-row"><span>Change</span><span>₱${Utils.pesoPlain(tab.changeGiven)}</span></div>`}
        ${qr ? `<div class="rc-qr">${qr}</div>` : ""}
        <div class="rc-foot">${Utils.escapeHtml(settings.receiptFooter || "Salamat po!")}</div>
        ${qr ? `<div class="rc-foot">Scan QR for a printable copy</div>` : ""}
      </div>`;
  }

  function show(tab, session) {
    const settings = DB.getSettings();
    const wrap = Utils.openOverlay(`
      <div class="modal" style="width:360px;">
        <div class="modal-head">
          <h3>Receipt</h3>
          <button class="modal-close" data-close>${Icons.x}</button>
        </div>
        <div class="modal-body" style="background:var(--surface-sunken); display:flex; justify-content:center; padding:26px 16px;">
          <div class="receipt-wrap">${html(tab, session, settings)}</div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-print>${Icons.print} Print</button>
          <button class="btn btn-primary" data-done>${Icons.check} Done</button>
        </div>
      </div>
    `);
    wrap.querySelector("[data-close]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-done]").onclick = () => Utils.closeOverlay();
    wrap.querySelector("[data-print]").onclick = () => window.print();
  }

  // Renders a standalone, full-page printable copy of a receipt, decoded
  // entirely from the URL — no DB/session/app state needed. This is what
  // loads when a customer scans the QR code.
  function renderStandalonePage(param) {
    const app = document.getElementById("app");
    let decoded;
    try {
      decoded = decodeReceiptParam(param);
    } catch (e) {
      app.innerHTML = `
        <div class="centered-screen">
          <div class="card auth-card card-pad" style="text-align:center;">
            <div class="auth-title">Couldn't read this receipt</div>
            <div class="auth-sub">The link looks incomplete or damaged. Please ask staff for a copy.</div>
          </div>
        </div>`;
      return;
    }
    const { tab, session, settings } = decoded;
    app.innerHTML = `
      <div class="centered-screen" style="align-items:flex-start; overflow-y:auto; padding:32px 16px;">
        <div style="display:flex; flex-direction:column; align-items:center; gap:18px; width:100%;">
          <div class="receipt-wrap">${html(tab, session, settings, { noQr: true })}</div>
          <button class="btn btn-primary btn-lg" id="standalone-print" style="width:300px;">${Icons.print} Print / Save as PDF</button>
        </div>
      </div>`;
    document.getElementById("standalone-print").onclick = () => window.print();
  }

  return { show, html, qrSvg, renderStandalonePage, receiptQrUrl, decodeReceiptParam };
})();

window.Receipt = Receipt;
