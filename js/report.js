/* Evet Kofte POS — report.js
   Builds XLSX income/expense reports (SheetJS) and pushes them to the
   Google Apps Script endpoint configured in Admin > Settings, which emails
   the file and/or saves it to Google Drive. Falls back to a local download
   if no endpoint is configured or the network call fails, so a report is
   never lost. */

const Report = (() => {

  function orderTypeLabel(orderType) {
    return orderType === "grab" ? "Grab" : orderType === "foodpanda" ? "FoodPanda" : "Dine-in";
  }

  function sessionRowSummary(session) {
    const t = DB.getSessionTotals(session);
    return {
      "Date": Utils.fmtDateShort(session.dateStarted),
      "Cashier": session.cashierName,
      "Started": Utils.fmtTimeShort(session.dateStarted),
      "Ended": session.dateEnded ? Utils.fmtTimeShort(session.dateEnded) : "(open)",
      "Orders": t.tabCount,
      "Items Sold": t.itemCount,
      "Dine-in Sales (PHP)": t.dineInSales,
      "Grab Sales (PHP)": t.grabSales,
      "FoodPanda Sales (PHP)": t.foodpandaSales,
      "Gross Sales (PHP)": t.grossSales,
      "Total Expenses (PHP)": t.totalExpenses,
      "Net Profit (PHP)": t.netProfit,
      "Tabs Carried Over": session.carriedOverCount || 0
    };
  }

  function buildWorkbook(sessions, meta) {
    meta = meta || {};
    const summaryRows = sessions.map(sessionRowSummary);
    const totals = sessions.reduce((acc, s) => {
      const t = DB.getSessionTotals(s);
      acc.gross += t.grossSales; acc.grab += t.grabSales; acc.foodpanda += t.foodpandaSales; acc.dineIn += t.dineInSales;
      acc.exp += t.totalExpenses; acc.profit += t.netProfit;
      acc.orders += t.tabCount; acc.items += t.itemCount;
      return acc;
    }, { gross: 0, grab: 0, foodpanda: 0, dineIn: 0, exp: 0, profit: 0, orders: 0, items: 0 });
    summaryRows.push({
      "Date": "TOTAL", "Cashier": "", "Started": "", "Ended": "",
      "Orders": totals.orders, "Items Sold": totals.items,
      "Dine-in Sales (PHP)": +totals.dineIn.toFixed(2),
      "Grab Sales (PHP)": +totals.grab.toFixed(2),
      "FoodPanda Sales (PHP)": +totals.foodpanda.toFixed(2),
      "Gross Sales (PHP)": +totals.gross.toFixed(2),
      "Total Expenses (PHP)": +totals.exp.toFixed(2),
      "Net Profit (PHP)": +totals.profit.toFixed(2),
      "Tabs Carried Over": ""
    });

    const orderRows = [];
    const itemRows = [];
    sessions.forEach(s => {
      s.tabs.filter(t => t.status === "closed").forEach(t => {
        const isDelivery = t.orderType === "grab" || t.orderType === "foodpanda";
        const typeLabel = orderTypeLabel(t.orderType);
        orderRows.push({
          "Session Date": Utils.fmtDateShort(s.dateStarted),
          "Order Type": typeLabel,
          "Receipt No": t.receiptNo,
          "Time Closed": Utils.fmtTimeShort(t.closedAt),
          "Customer / Ref": t.customerName,
          "Cashier": s.cashierName,
          "Items": t.items.reduce((a, i) => a + i.qty, 0),
          "Total (PHP)": t.total,
          "Cash Received (PHP)": isDelivery ? "" : t.cashReceived,
          "Change (PHP)": isDelivery ? "" : t.changeGiven
        });
        t.items.forEach(it => {
          itemRows.push({
            "Session Date": Utils.fmtDateShort(s.dateStarted),
            "Order Type": typeLabel,
            "Receipt No": t.receiptNo,
            "Item": it.name,
            "Category": it.kind === "food" ? "Food" : "Drinks",
            "Type": it.type ? it.type.toUpperCase() : "",
            "Drink Upgrade": it.drinkUpgradeName || "",
            "Qty": it.qty,
            "Unit Price (PHP)": it.unitPrice,
            "Line Total (PHP)": it.lineTotal
          });
        });
      });
    });

    const expenseRows = [];
    sessions.forEach(s => {
      s.expenses.forEach(e => {
        expenseRows.push({
          "Session Date": Utils.fmtDateShort(s.dateStarted),
          "Time": Utils.fmtTimeShort(e.at),
          "Expense": e.name,
          "Category": e.category,
          "Amount (PHP)": e.amount,
          "Entered By": e.enteredBy
        });
      });
    });
    if (expenseRows.length) {
      const expTotal = expenseRows.reduce((s, r) => s + r["Amount (PHP)"], 0);
      expenseRows.push({ "Session Date": "TOTAL", "Time": "", "Expense": "", "Category": "", "Amount (PHP)": +expTotal.toFixed(2), "Entered By": "" });
    }

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 9 }, { wch: 11 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 15 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const wsOrders = XLSX.utils.json_to_sheet(orderRows);
    wsOrders["!cols"] = [{ wch: 13 }, { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 7 }, { wch: 12 }, { wch: 16 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

    const wsItems = XLSX.utils.json_to_sheet(itemRows);
    wsItems["!cols"] = [{ wch: 13 }, { wch: 10 }, { wch: 20 }, { wch: 24 }, { wch: 9 }, { wch: 7 }, { wch: 16 }, { wch: 6 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsItems, "Order Items");

    const wsExp = XLSX.utils.json_to_sheet(expenseRows);
    wsExp["!cols"] = [{ wch: 13 }, { wch: 8 }, { wch: 24 }, { wch: 16 }, { wch: 13 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsExp, "Expenses");

    return wb;
  }

  function filenameFor(meta) {
    const safe = (meta.restaurantName || "Evet-Kofte").replace(/\s+/g, "-");
    return `${safe}_Report_${meta.rangeLabel || Utils.dateKey()}.xlsx`;
  }

  async function pushToAppsScript(wb, filename, meta) {
    const settings = DB.getSettings();
    if (!settings.appsScriptUrl) return { sent: false, reason: "no-endpoint" };
    const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
    const payload = {
      fileName: filename,
      fileData: base64,
      email: settings.notifyEmail || "",
      subject: `${settings.restaurantName || "Evet Kofte"} — Report (${meta.rangeLabel})`,
      body: `Attached: sales & expense report for ${meta.rangeLabel}.\nGenerated ${Utils.fmtDate()} ${Utils.fmtTime()}.`
    };
    try {
      const res = await fetch(settings.appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight against Apps Script
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (data && data.success) return { sent: true, url: data.url };
      return { sent: false, reason: "endpoint-error" };
    } catch (e) {
      return { sent: false, reason: "network-error" };
    }
  }

  // Generates the report, tries to email/upload it via Apps Script, and
  // always keeps a local-download fallback so nothing is ever lost.
  async function generateAndSend(sessions, meta) {
    const settings = DB.getSettings();
    meta = Object.assign({ restaurantName: settings.restaurantName }, meta);
    const wb = buildWorkbook(sessions, meta);
    const filename = filenameFor(meta);

    Utils.toast("Generating report…");
    const result = await pushToAppsScript(wb, filename, meta);

    if (result.sent) {
      Utils.toast("Report emailed / uploaded to Google Drive ✓", "success");
    } else {
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      Utils.downloadBlob(blob, filename);
      if (result.reason === "no-endpoint") {
        Utils.toast("Report downloaded. Set up auto email/Drive in Admin → Settings.", "error");
      } else {
        Utils.toast("Couldn't reach Drive/email — report downloaded instead.", "error");
      }
    }
    return result;
  }

  return { buildWorkbook, generateAndSend, filenameFor };
})();

window.Report = Report;
