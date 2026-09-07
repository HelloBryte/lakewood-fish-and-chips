"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./helpers/load-browser-script");

// ---- pure formatting helpers (no clock involved) --------------------------

const Shop = loadBrowserScript("assets/js/shop.js", { menu: { shop: { hours: {} } } }).Shop;

test("money formats to two decimal places with a leading dollar sign", () => {
  assert.equal(Shop.money(9.5), "$9.50");
  assert.equal(Shop.money(0), "$0.00");
  assert.equal(Shop.money(12), "$12.00");
});

test("toMinutes converts HH:MM into minutes since midnight", () => {
  assert.equal(Shop.toMinutes("00:00"), 0);
  assert.equal(Shop.toMinutes("11:30"), 690);
  assert.equal(Shop.toMinutes("20:30"), 1230);
});

test("fromMinutes formats 12-hour clock times, omitting :00", () => {
  assert.equal(Shop.fromMinutes(0), "12am");
  assert.equal(Shop.fromMinutes(60), "1am");
  assert.equal(Shop.fromMinutes(690), "11:30am");
  assert.equal(Shop.fromMinutes(720), "12pm");
  assert.equal(Shop.fromMinutes(1230), "8:30pm");
});

test("fromMinutes wraps values past a single day", () => {
  assert.equal(Shop.fromMinutes(1440), "12am"); // exactly 24h later
  assert.equal(Shop.fromMinutes(1500), "1am");  // 25:00 -> 1am
});

test("esc escapes HTML-significant characters (menu text is user-photographed, not trusted)", () => {
  assert.equal(
    Shop.esc(`<script>alert("hi") & 'bye'</script>`),
    "&lt;script&gt;alert(&quot;hi&quot;) &amp; &#39;bye&#39;&lt;/script&gt;"
  );
});

test("esc treats null/undefined as an empty string", () => {
  assert.equal(Shop.esc(null), "");
  assert.equal(Shop.esc(undefined), "");
});

// ---- hours / open-closed / pickup slots (clock-dependent) -----------------
//
// These pin the shop's real trading-hours shape from data/menu.json but
// freeze the clock so the results are deterministic. August 2026 falls
// outside AU daylight saving (first Sun Oct - first Sun Apr), so
// Australia/Melbourne is a stable UTC+10 all month, which keeps the
// UTC offsets below simple and exact.

const HOURS = {
  monday: { closed: true },
  tuesday: { open: "16:00", close: "20:00" },
  wednesday: { open: "11:30", close: "20:00" },
  thursday: { closed: true },
  friday: { open: "11:30", close: "20:30" },
  saturday: { closed: true },
  sunday: { closed: true },
};
const MENU = { shop: { hours: HOURS } };

// Melbourne local time -> UTC epoch ms, valid for August 2026 (UTC+10, no DST).
function melbourne(y, m, d, h, min) {
  return Date.UTC(y, m - 1, d, h - 10, min);
}

function shopAt(now) {
  return loadBrowserScript("assets/js/shop.js", { menu: MENU, now }).Shop;
}

test("status(): open, well before the last-order cutoff", () => {
  // Wednesday 26 Aug 2026, 14:00 — trading 11:30-20:00, last order 19:45.
  const s = shopAt(melbourne(2026, 8, 26, 14, 0)).status();
  assert.equal(s.open, true);
  assert.equal(s.acceptingOrders, true);
  assert.equal(s.closesAt, 1200); // 20:00
  assert.equal(s.lastOrder, 1185); // 19:45
});

test("status(): open, but inside the 15-minute last-order cutoff", () => {
  // Wednesday 26 Aug 2026, 19:50 — still open, but past 19:45 last order.
  const s = shopAt(melbourne(2026, 8, 26, 19, 50)).status();
  assert.equal(s.open, true);
  assert.equal(s.acceptingOrders, false);
});

test("status(): closed before opening, reopens later the same day", () => {
  // Wednesday 26 Aug 2026, 09:00 — opens at 11:30 today.
  const s = shopAt(melbourne(2026, 8, 26, 9, 0)).status();
  assert.equal(s.open, false);
  assert.equal(s.opensDay, "today");
  assert.equal(s.opensAt, 690); // 11:30
});

test("status(): closed all day, correctly reports 'tomorrow'", () => {
  // Monday 24 Aug 2026 is fully closed; next opening is Tuesday 16:00.
  const s = shopAt(melbourne(2026, 8, 24, 10, 0)).status();
  assert.equal(s.open, false);
  assert.equal(s.opensDay, "tomorrow");
  assert.equal(s.opensDayKey, "tuesday");
  assert.equal(s.opensAt, 960); // 16:00
});

test("status(): scans forward across multiple closed days without wrapping incorrectly", () => {
  // Saturday 29 Aug 2026: Sat/Sun/Mon are all closed, so the next opening
  // is Tuesday — three days out, so it must be labelled by name, not
  // "today"/"tomorrow".
  const s = shopAt(melbourne(2026, 8, 29, 10, 0)).status();
  assert.equal(s.open, false);
  assert.equal(s.opensDay, "Tuesday");
  assert.equal(s.opensDayKey, "tuesday");
  assert.equal(s.daysAway, 3);
});

test("pickupSlots(): same-day slots start after prep time, rounded up, and stop at last order", () => {
  // Wednesday 26 Aug 2026, 14:00. earliest = 14:00 + 20min prep = 14:20,
  // rounded up to the next 15-min mark = 14:30. Last slot before last
  // order (19:45) is 19:45 itself.
  const slots = shopAt(melbourne(2026, 8, 26, 14, 0)).pickupSlots();
  assert.equal(slots.sameDay, true);
  assert.equal(slots.slots[0].value, "asap");
  assert.equal(slots.slots[1].minutes, 870); // 14:30
  assert.equal(slots.slots[1].label, "2:30pm");
  const last = slots.slots[slots.slots.length - 1];
  assert.equal(last.minutes, 1185); // 19:45
  assert.equal(last.label, "7:45pm");
});

test("pickupSlots(): while closed, offers slots for the next trading day instead", () => {
  // Monday 24 Aug 2026, 10:00 -> next trading day is Tuesday, 16:00-20:00.
  const slots = shopAt(melbourne(2026, 8, 24, 10, 0)).pickupSlots();
  assert.equal(slots.sameDay, false);
  assert.equal(slots.dayLabel, "tomorrow");
  assert.equal(slots.slots[0].value, "tuesday-960");
  assert.equal(slots.slots[0].label, "4pm");
  const last = slots.slots[slots.slots.length - 1];
  assert.equal(last.minutes, 1185); // 19:45, 15 min before the 20:00 close
});

test("hoursRows(): marks today and formats closed days", () => {
  const rows = shopAt(melbourne(2026, 8, 26, 14, 0)).hoursRows();
  const wed = rows.find((r) => r.key === "wednesday");
  const mon = rows.find((r) => r.key === "monday");
  assert.equal(wed.isToday, true);
  assert.equal(wed.text, "11:30am – 8pm");
  assert.equal(mon.closed, true);
  assert.equal(mon.text, "Closed");
});
