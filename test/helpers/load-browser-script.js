"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

/**
 * assets/js/*.js are plain browser scripts that attach their public API to
 * `window` (e.g. `window.Cart`, `window.Shop`) rather than exporting a
 * CommonJS module. This loads one such script into a fresh, isolated VM
 * context with minimal `window` / `localStorage` / `MENU` stand-ins and
 * returns that context's `window`, so the pure pricing/formatting/hours
 * logic can be unit tested with plain Node — no bundler, no headless
 * browser, no new dependency.
 *
 * @param {string} relativePath  path to the script, relative to the repo root
 * @param {object} [opts]
 * @param {object} [opts.menu]   value to expose as `window.MENU`
 * @param {number|Date} [opts.now]  if given, freezes `new Date()` inside the
 *   sandbox to this instant, so time-of-day logic (open/closed, pickup
 *   slots) is deterministic instead of depending on the real clock.
 */
function loadBrowserScript(relativePath, { menu, now } = {}) {
  const file = path.join(__dirname, "..", "..", relativePath);
  const code = fs.readFileSync(file, "utf8");

  const store = Object.create(null);
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };

  const sandbox = { console };
  sandbox.window = sandbox;
  sandbox.localStorage = localStorage;
  sandbox.MENU = menu;

  vm.createContext(sandbox);

  if (now !== undefined) {
    const fixed = now instanceof Date ? now.getTime() : now;
    // Shadow the real Date with one frozen at `fixed` for any no-arg
    // construction, so `shopNow()` (which calls `new Date()`) is deterministic.
    vm.runInContext(
      `class Date extends globalThis.Date {
        constructor(...args) { super(...(args.length ? args : [${fixed}])); }
        static now() { return ${fixed}; }
      }`,
      sandbox,
      { filename: "date-shim.js" }
    );
  }

  vm.runInContext(code, sandbox, { filename: file });

  return sandbox.window;
}

module.exports = { loadBrowserScript };
