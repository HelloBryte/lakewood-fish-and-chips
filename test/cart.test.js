"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./helpers/load-browser-script");

// Each test gets its own sandbox (and so its own in-memory localStorage),
// mirroring a fresh page load — tests never see each other's cart state.
function freshCart() {
  return loadBrowserScript("assets/js/cart.js").Cart;
}

test("lineTotal is just unit price times qty when there is no bulk deal", () => {
  const Cart = freshCart();
  Cart.add({ itemId: "chips", name: "Chips", basePrice: 5, qty: 3 });
  const [line] = Cart.all();
  assert.equal(Cart.lineTotal(line), 15);
});

test("bulk deal applies once qty exactly reaches the bundle size", () => {
  const Cart = freshCart();
  // "6 chicken nuggets for $6" — priced singly at $1.20, plain total would be $7.20.
  Cart.add({ itemId: "nuggets", name: "Nuggets", basePrice: 1.2, qty: 6, bulk: { qty: 6, price: 6 } });
  const [line] = Cart.all();
  assert.equal(Cart.lineTotal(line), 6);
  assert.ok(Math.abs(Cart.lineSaving(line) - 1.2) < 1e-9);
});

test("bulk deal combines a bundle with a leftover remainder at single price", () => {
  const Cart = freshCart();
  // 7 nuggets: one bundle of 6 ($6) + 1 single ($1.20) = $7.20, vs plain 7 * $1.20 = $8.40.
  Cart.add({ itemId: "nuggets", name: "Nuggets", basePrice: 1.2, qty: 7, bulk: { qty: 6, price: 6 } });
  const [line] = Cart.all();
  assert.equal(Cart.lineTotal(line), 7.2);
});

test("bulk deal never charges more than buying singly (below threshold)", () => {
  const Cart = freshCart();
  // Only 5 nuggets — never reaches the bundle of 6, so plain pricing must win.
  Cart.add({ itemId: "nuggets", name: "Nuggets", basePrice: 1.2, qty: 5, bulk: { qty: 6, price: 6 } });
  const [line] = Cart.all();
  assert.equal(Cart.lineTotal(line), 6); // 5 * 1.20
  assert.equal(Cart.lineSaving(line), 0);
});

test("option deltas (e.g. grilled fish +$0.50) add onto the unit price", () => {
  const Cart = freshCart();
  Cart.add({
    itemId: "flake", name: "Flake", basePrice: 9.5, qty: 2,
    options: [{ group: "cook", name: "Grilled", delta: 0.5 }],
  });
  const [line] = Cart.all();
  assert.equal(Cart.lineUnitPrice(line), 10);
  assert.equal(Cart.lineTotal(line), 20);
});

test("adding the same item with the same options twice stacks onto one line", () => {
  const Cart = freshCart();
  Cart.add({ itemId: "chips", name: "Chips", basePrice: 5, qty: 1 });
  Cart.add({ itemId: "chips", name: "Chips", basePrice: 5, qty: 2 });
  assert.equal(Cart.all().length, 1);
  assert.equal(Cart.count(), 3);
});

test("the same item with different options stays on separate lines", () => {
  const Cart = freshCart();
  Cart.add({ itemId: "flake", name: "Flake", basePrice: 9.5, qty: 1, options: [{ group: "cook", name: "Grilled", delta: 0.5 }] });
  Cart.add({ itemId: "flake", name: "Flake", basePrice: 9.5, qty: 1, options: [{ group: "cook", name: "Fried", delta: 0 }] });
  assert.equal(Cart.all().length, 2);
});

test("setQty removes the line once quantity drops to zero", () => {
  const Cart = freshCart();
  Cart.add({ itemId: "chips", name: "Chips", basePrice: 5, qty: 1 });
  Cart.setQty(Cart.all()[0].key, 0);
  assert.equal(Cart.all().length, 0);
});

test("setQty clamps quantity at 99", () => {
  const Cart = freshCart();
  Cart.add({ itemId: "chips", name: "Chips", basePrice: 5, qty: 1 });
  Cart.setQty(Cart.all()[0].key, 500);
  assert.equal(Cart.all()[0].qty, 99);
});

test("bump adjusts quantity relative to the current value", () => {
  const Cart = freshCart();
  Cart.add({ itemId: "chips", name: "Chips", basePrice: 5, qty: 1 });
  const key = Cart.all()[0].key;
  Cart.bump(key, 2);
  assert.equal(Cart.all()[0].qty, 3);
  Cart.bump(key, -5);
  assert.equal(Cart.all().length, 0); // dropped to <= 0 and removed
});

test("totals report whether the order is under or over the free-drink threshold", () => {
  const Cart = freshCart();
  Cart.add({ itemId: "pack", name: "Pack", basePrice: 54, qty: 1 });
  let totals = Cart.totals();
  assert.equal(totals.freeDrink, false);
  assert.equal(totals.freeDrinkGap, 1);

  Cart.add({ itemId: "extra", name: "Extra", basePrice: 1, qty: 1 });
  totals = Cart.totals();
  assert.equal(totals.subtotal, 55);
  assert.equal(totals.freeDrink, true);
  assert.equal(totals.freeDrinkGap, 0);
});

test("totals back out the GST-inclusive component of the subtotal", () => {
  const Cart = freshCart();
  Cart.add({ itemId: "pack", name: "Pack", basePrice: 11, qty: 1 });
  const totals = Cart.totals();
  assert.ok(Math.abs(totals.gstIncluded - 1) < 1e-9); // $11 incl. GST -> $1 GST
});

test("clear empties the cart", () => {
  const Cart = freshCart();
  Cart.add({ itemId: "chips", name: "Chips", basePrice: 5, qty: 1 });
  Cart.clear();
  assert.equal(Cart.count(), 0);
  assert.equal(Cart.totals().subtotal, 0);
});

test("cart contents persist across a reload via localStorage", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const vm = require("node:vm");

  const file = path.join(__dirname, "..", "assets", "js", "cart.js");
  const code = fs.readFileSync(file, "utf8");
  const store = Object.create(null);
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
  };

  // First "page load": add an item.
  const sandbox1 = { console };
  sandbox1.window = sandbox1;
  sandbox1.localStorage = localStorage;
  vm.createContext(sandbox1);
  vm.runInContext(code, sandbox1, { filename: file });
  sandbox1.Cart.add({ itemId: "chips", name: "Chips", basePrice: 5, qty: 2 });

  // Second "page load" (e.g. after navigating index.html -> order.html),
  // sharing the same localStorage backing store.
  const sandbox2 = { console };
  sandbox2.window = sandbox2;
  sandbox2.localStorage = localStorage;
  vm.createContext(sandbox2);
  vm.runInContext(code, sandbox2, { filename: file });

  assert.equal(sandbox2.Cart.count(), 2);
});
