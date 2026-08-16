#!/usr/bin/env node
/**
 * data/menu.json is the single source of truth for the menu.
 * GitHub Pages could fetch() it directly, but inlining it means the site
 * also works when opened straight off the filesystem (file://), which is
 * how the demo usually gets shown on a laptop with no wifi.
 *
 *   node build-menu.js
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "data", "menu.json");
const out = path.join(__dirname, "assets", "js", "menu-data.js");

const menu = JSON.parse(fs.readFileSync(src, "utf8"));
// Keys prefixed with _ are notes for the shop owner, not for the browser.
Object.keys(menu).forEach((k) => { if (k.startsWith("_")) delete menu[k]; });

const banner = `/* AUTO-GENERATED from data/menu.json — do not edit by hand.
   Run: node build-menu.js */\n`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${banner}window.MENU = ${JSON.stringify(menu, null, 2)};\n`);

const count = menu.categories.reduce((n, c) => n + c.items.length, 0);
console.log(`Wrote ${path.relative(__dirname, out)} — ${menu.categories.length} categories, ${count} items.`);
