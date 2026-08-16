/* Shared page wiring: open/closed pills, hours table, header cart badge. */
(function () {
  "use strict";

  function renderStatusPills() {
    var info = Shop.statusText();
    document.querySelectorAll("[data-status-pill]").forEach(function (el) {
      el.classList.remove("is-open", "is-closed");
      el.classList.add(info.state);
      el.innerHTML =
        '<span class="dot"></span><span>' + Shop.esc(info.label) + "</span>" +
        (info.detail
          ? '<span class="sep">·</span><span class="detail">' + Shop.esc(info.detail) + "</span>"
          : "");
    });
  }

  function renderHours() {
    var host = document.querySelector("[data-hours]");
    if (!host) return;
    host.innerHTML = Shop.hoursRows().map(function (r) {
      return '<li class="' + (r.isToday ? "is-today" : "") + '">' +
        '<span class="day">' + r.label + "</span>" +
        '<span class="time' + (r.closed ? " closed" : "") + '">' + r.text + "</span>" +
        "</li>";
    }).join("");
  }

  function renderNotices() {
    var host = document.querySelector("[data-notices]");
    if (!host) return;
    host.innerHTML = MENU.shop.notices.map(function (n) {
      return "<li>" + Shop.esc(n) + "</li>";
    }).join("");
  }

  function renderShopDetails() {
    var a = MENU.shop.address;
    document.querySelectorAll("[data-address]").forEach(function (el) {
      el.textContent = a.line1 + ", " + a.suburb + " " + a.state;
    });
    document.querySelectorAll("[data-address-note]").forEach(function (el) {
      el.textContent = a.note;
    });
    document.querySelectorAll("[data-phone]").forEach(function (el) {
      el.textContent = MENU.shop.phone;
    });
    document.querySelectorAll("[data-phone-link]").forEach(function (el) {
      el.setAttribute("href", "tel:" + MENU.shop.phoneE164);
    });
  }

  function renderCartBadge() {
    var n = Cart.count();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = n;
      var btn = el.closest(".cart-btn");
      if (btn) btn.hidden = n === 0;
    });
  }

  function markActiveNav() {
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav a").forEach(function (a) {
      var target = a.getAttribute("href");
      if (target && target.split("#")[0] === here) a.classList.add("is-active");
    });
  }

  function init() {
    renderStatusPills();
    renderHours();
    renderNotices();
    renderShopDetails();
    renderCartBadge();
    markActiveNav();

    var yr = document.querySelector("[data-year]");
    if (yr) yr.textContent = new Date().getFullYear();

    Cart.onChange(renderCartBadge);

    /* Keep the open/closed pill honest if the page is left open. */
    setInterval(renderStatusPills, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
