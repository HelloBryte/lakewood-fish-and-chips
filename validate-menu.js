#!/usr/bin/env node
/**
 * Sanity-checks data/menu.json before it's baked into assets/js/menu-data.js.
 * Catches the kind of mistake that's easy to make hand-editing JSON — a
 * duplicate id, a bulk deal that's not actually a discount, a negative
 * price — before it ships to the browser.
 *
 *   node validate-menu.js
 *
 * Exits non-zero (and prints every problem found) if anything's wrong.
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "data", "menu.json");
const menu = JSON.parse(fs.readFileSync(src, "utf8"));

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// ---- shop ------------------------------------------------------------
["name", "phone", "phoneE164"].forEach((key) => {
  if (!menu.shop || !menu.shop[key]) err(`shop.${key} is missing`);
});
if (menu.shop && menu.shop.phoneE164 && !/^\+\d{9,15}$/.test(menu.shop.phoneE164)) {
  err(`shop.phoneE164 "${menu.shop.phoneE164}" doesn't look like E.164 (e.g. +61397895722)`);
}

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
DAY_KEYS.forEach((day) => {
  const h = menu.shop && menu.shop.hours && menu.shop.hours[day];
  if (!h) return err(`shop.hours.${day} is missing`);
  if (h.closed) return;
  if (!TIME_RE.test(h.open) || !TIME_RE.test(h.close)) {
    return err(`shop.hours.${day} has a malformed open/close time`);
  }
  if (h.open >= h.close) err(`shop.hours.${day} opens (${h.open}) at or after it closes (${h.close})`);
});

if (menu.shop && menu.shop.address && menu.shop.address.postcode === "TODO_CONFIRM") {
  warn("shop.address.postcode is still a placeholder (TODO_CONFIRM)");
}

// ---- categories / items -----------------------------------------------
const seenCatIds = new Set();
const seenItemIds = new Set();

(menu.categories || []).forEach((cat) => {
  if (!cat.id) return err("a category is missing an id");
  if (seenCatIds.has(cat.id)) err(`duplicate category id "${cat.id}"`);
  seenCatIds.add(cat.id);
  if (!cat.name) err(`category "${cat.id}" is missing a name`);
  if (!Array.isArray(cat.items)) return err(`category "${cat.id}" has no items array`);

  cat.items.forEach((item) => {
    if (!item.id) return err(`an item in "${cat.id}" is missing an id`);
    if (seenItemIds.has(item.id)) err(`duplicate item id "${item.id}"`);
    seenItemIds.add(item.id);

    if (!item.name) err(`item "${item.id}" is missing a name`);

    const priceIsPlaceholder = item.price === null && !!item.priceStatus;
    if (item.price === undefined) {
      err(`item "${item.id}" has no price field (use null + priceStatus for TBC items)`);
    } else if (item.price === null) {
      if (!priceIsPlaceholder) err(`item "${item.id}" has a null price but no priceStatus explaining why`);
    } else if (typeof item.price !== "number" || item.price < 0) {
      err(`item "${item.id}" has an invalid price (${JSON.stringify(item.price)})`);
    }

    if (item.bulk) {
      const { qty, price } = item.bulk;
      if (!(qty > 1)) err(`item "${item.id}" bulk.qty must be greater than 1`);
      if (typeof price !== "number" || price < 0) err(`item "${item.id}" bulk.price is invalid`);
      if (typeof item.price === "number" && typeof price === "number" && qty > 1) {
        if (price >= item.price * qty) {
          warn(`item "${item.id}" bulk deal (${qty} for $${price}) isn't actually cheaper than buying individually`);
        }
      }
    }

    (item.options || []).forEach((group) => {
      if (!Array.isArray(group.choices) || !group.choices.length) {
        err(`item "${item.id}" option group "${group.id || "?"}" has no choices`);
      }
    });
  });
});

if (!seenCatIds.size) err("menu has no categories");

// ---- report -------------------------------------------------------------
warnings.forEach((w) => console.warn(`warning: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  console.error(`\n${errors.length} error(s) found in data/menu.json — fix these before running build-menu.js.`);
  process.exit(1);
}

const itemCount = (menu.categories || []).reduce((n, c) => n + c.items.length, 0);
console.log(`data/menu.json looks good — ${seenCatIds.size} categories, ${itemCount} items, ${warnings.length} warning(s).`);
