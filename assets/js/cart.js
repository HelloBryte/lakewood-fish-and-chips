/* Cart state. Lives in localStorage so it survives the hop from home to menu. */
(function () {
  "use strict";

  var KEY = "lakewood.cart.v1";
  var FREE_DRINK_OVER = 55;
  var listeners = [];
  var lines = [];

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      lines = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(lines)) lines = [];
    } catch (e) {
      lines = [];
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* private mode */ }
    listeners.forEach(function (fn) { fn(); });
  }

  function onChange(fn) { listeners.push(fn); }

  /* A line is identified by item + the exact set of options chosen, so
     "flake grilled" and "flake fried" stack separately. */
  function keyFor(itemId, options) {
    var o = (options || []).map(function (x) { return x.group + ":" + x.name; }).sort().join("|");
    return itemId + (o ? "#" + o : "");
  }

  function lineUnitPrice(line) {
    return (line.basePrice || 0) + (line.options || []).reduce(function (n, o) {
      return n + (o.delta || 0);
    }, 0);
  }

  /* Bulk deals (6 nuggets for $6) apply per line, cheaper of the two. */
  function lineTotal(line) {
    var unit = lineUnitPrice(line);
    var plain = unit * line.qty;
    if (!line.bulk || !line.bulk.qty) return plain;

    var bundles = Math.floor(line.qty / line.bulk.qty);
    var rest = line.qty % line.bulk.qty;
    var deal = bundles * line.bulk.price + rest * unit;
    return Math.min(plain, deal);
  }

  function lineSaving(line) {
    if (!line.bulk) return 0;
    var plain = lineUnitPrice(line) * line.qty;
    return Math.max(0, plain - lineTotal(line));
  }

  function add(entry) {
    var key = keyFor(entry.itemId, entry.options);
    var existing = lines.filter(function (l) { return l.key === key; })[0];
    if (existing) {
      existing.qty += entry.qty || 1;
    } else {
      lines.push({
        key: key,
        itemId: entry.itemId,
        name: entry.name,
        basePrice: entry.basePrice,
        options: entry.options || [],
        bulk: entry.bulk || null,
        qty: entry.qty || 1
      });
    }
    save();
  }

  function setQty(key, qty) {
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].key !== key) continue;
      if (qty <= 0) lines.splice(i, 1);
      else lines[i].qty = Math.min(qty, 99);
      break;
    }
    save();
  }

  function bump(key, delta) {
    var line = lines.filter(function (l) { return l.key === key; })[0];
    if (line) setQty(key, line.qty + delta);
  }

  function clear() { lines = []; save(); }

  function count() {
    return lines.reduce(function (n, l) { return n + l.qty; }, 0);
  }

  function subtotal() {
    return lines.reduce(function (n, l) { return n + lineTotal(l); }, 0);
  }

  function totals() {
    var sub = subtotal();
    return {
      subtotal: sub,
      total: sub,                                   // pickup only — no delivery fee
      gstIncluded: sub - sub / 1.1,                 // AU prices are GST inclusive
      freeDrink: sub >= FREE_DRINK_OVER,
      freeDrinkGap: Math.max(0, FREE_DRINK_OVER - sub),
      freeDrinkOver: FREE_DRINK_OVER
    };
  }

  load();

  window.Cart = {
    onChange: onChange,
    all: function () { return lines.slice(); },
    add: add,
    bump: bump,
    setQty: setQty,
    clear: clear,
    count: count,
    totals: totals,
    lineUnitPrice: lineUnitPrice,
    lineTotal: lineTotal,
    lineSaving: lineSaving
  };
})();
