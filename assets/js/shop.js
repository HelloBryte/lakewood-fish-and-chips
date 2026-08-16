/* Shared helpers: shop clock, trading hours, formatting. */
(function () {
  "use strict";

  var TZ = "Australia/Melbourne";
  var DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  var DAY_LABEL = {
    monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
    thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday"
  };
  var WEEK_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  /* Prep time is a placeholder until the shop confirms a realistic number. */
  var PREP_MINUTES = 20;
  var SLOT_MINUTES = 15;
  var LAST_ORDER_BEFORE_CLOSE = 15;

  function money(n) {
    return "$" + Number(n).toFixed(2);
  }

  function toMinutes(hhmm) {
    var p = hhmm.split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function fromMinutes(mins) {
    mins = ((mins % 1440) + 1440) % 1440;
    var h = Math.floor(mins / 60), m = mins % 60;
    var suffix = h >= 12 ? "pm" : "am";
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + (m ? ":" + String(m).padStart(2, "0") : "") + suffix;
  }

  /* Current time at the shop, regardless of the visitor's own timezone. */
  function shopNow() {
    var parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: TZ, weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());

    var get = function (t) {
      for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value;
      return "";
    };
    var weekday = get("weekday").toLowerCase();
    var hour = parseInt(get("hour"), 10) % 24;
    var minute = parseInt(get("minute"), 10);

    return {
      dayKey: weekday,
      dayIndex: DAYS.indexOf(weekday),
      minutes: hour * 60 + minute
    };
  }

  function hoursFor(dayKey) {
    var h = window.MENU.shop.hours[dayKey];
    if (!h || h.closed) return null;
    return { open: toMinutes(h.open), close: toMinutes(h.close) };
  }

  /* { open, closesAt, opensDay, opensAt, lastOrder } */
  function status() {
    var now = shopNow();
    var today = hoursFor(now.dayKey);

    if (today && now.minutes >= today.open && now.minutes < today.close) {
      return {
        open: true,
        closesAt: today.close,
        lastOrder: today.close - LAST_ORDER_BEFORE_CLOSE,
        acceptingOrders: now.minutes < today.close - LAST_ORDER_BEFORE_CLOSE
      };
    }

    /* Not open — find the next opening, scanning today first then forward. */
    for (var i = 0; i < 8; i++) {
      var key = DAYS[(now.dayIndex + i) % 7];
      var h = hoursFor(key);
      if (!h) continue;
      if (i === 0 && now.minutes >= h.open) continue; // today's window already passed
      return {
        open: false,
        acceptingOrders: false,
        opensDay: i === 0 ? "today" : (i === 1 ? "tomorrow" : DAY_LABEL[key]),
        opensDayKey: key,
        opensAt: h.open,
        daysAway: i
      };
    }
    return { open: false, acceptingOrders: false };
  }

  function statusText() {
    var s = status();
    if (s.open) {
      return {
        state: "is-open",
        label: "Open now",
        detail: "Closes " + fromMinutes(s.closesAt)
      };
    }
    if (!s.opensAt && s.opensAt !== 0) {
      return { state: "is-closed", label: "Closed", detail: "" };
    }
    return {
      state: "is-closed",
      label: "Closed now",
      detail: "Opens " + s.opensDay + " " + fromMinutes(s.opensAt)
    };
  }

  /* Pickup slots for the current (or next) trading day. */
  function pickupSlots() {
    var now = shopNow();
    var s = status();
    var slots = [];

    if (s.open && s.acceptingOrders) {
      var earliest = now.minutes + PREP_MINUTES;
      var first = Math.ceil(earliest / SLOT_MINUTES) * SLOT_MINUTES;
      for (var t = first; t <= s.closesAt - LAST_ORDER_BEFORE_CLOSE; t += SLOT_MINUTES) {
        slots.push({ value: "today-" + t, label: fromMinutes(t), minutes: t });
      }
      slots.unshift({
        value: "asap",
        label: "As soon as possible (about " + PREP_MINUTES + " min)",
        minutes: earliest
      });
      return { sameDay: true, dayLabel: "today", slots: slots };
    }

    /* Closed: offer slots on the next trading day. */
    if (s.opensAt === undefined) return { sameDay: false, dayLabel: "", slots: [] };
    var h = hoursFor(s.opensDayKey);
    for (var u = h.open; u <= h.close - LAST_ORDER_BEFORE_CLOSE; u += SLOT_MINUTES) {
      slots.push({ value: s.opensDayKey + "-" + u, label: fromMinutes(u), minutes: u });
    }
    return { sameDay: false, dayLabel: s.opensDay, slots: slots };
  }

  function hoursRows() {
    var todayKey = shopNow().dayKey;
    return WEEK_ORDER.map(function (key) {
      var h = window.MENU.shop.hours[key];
      return {
        key: key,
        label: DAY_LABEL[key],
        isToday: key === todayKey,
        closed: !h || h.closed,
        text: (!h || h.closed) ? "Closed" : fromMinutes(toMinutes(h.open)) + " – " + fromMinutes(toMinutes(h.close))
      };
    });
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function toast(message) {
    var el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("is-shown");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("is-shown"); }, 2200);
  }

  window.Shop = {
    TZ: TZ,
    PREP_MINUTES: PREP_MINUTES,
    money: money,
    fromMinutes: fromMinutes,
    toMinutes: toMinutes,
    shopNow: shopNow,
    status: status,
    statusText: statusText,
    pickupSlots: pickupSlots,
    hoursRows: hoursRows,
    esc: esc,
    toast: toast
  };
})();
