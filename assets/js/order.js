/* Ordering page: menu render, item options, cart panel, demo checkout. */
(function () {
  "use strict";

  var index = {};          // itemId -> { item, cat }
  var railLinks = {};
  var lastFocus = null;

  /* ------------------------------------------------------------------ index */

  function buildIndex() {
    MENU.categories.forEach(function (cat) {
      cat.items.forEach(function (item) { index[item.id] = { item: item, cat: cat }; });
    });
  }

  function visibleCategories() {
    return MENU.categories.filter(function (c) { return c.items.length > 0; });
  }

  /* ------------------------------------------------------- option modelling */

  function optionGroupsFor(item, cat) {
    var groups = [];

    (cat.options || []).forEach(function (g) { groups.push(asRadio(g)); });
    (item.options || []).forEach(function (g) { groups.push(asRadio(g)); });

    if (cat.extras && MENU.extraChoices) {
      groups.push({
        id: "extras",
        name: "Add extras",
        note: Shop.money(cat.extras.pricePerExtra) + " each",
        type: "checkbox",
        choices: MENU.extraChoices.map(function (name) {
          var delta = (name === "Pineapple" && cat.extras.pineapple)
            ? cat.extras.pineapple : cat.extras.pricePerExtra;
          return { name: name, priceDelta: delta };
        })
      });
    }
    return groups;
  }

  function asRadio(g) {
    return { id: g.id, name: g.name, type: "radio", choices: g.choices };
  }

  /* ----------------------------------------------------------- menu render */

  function renderRail() {
    var host = document.querySelector("[data-cat-rail]");
    if (!host) return;
    host.innerHTML = visibleCategories().map(function (c) {
      return '<li><a href="#cat-' + c.id + '" data-cat-link="' + c.id + '">' + Shop.esc(c.name) + "</a></li>";
    }).join("");
    host.querySelectorAll("[data-cat-link]").forEach(function (a) {
      railLinks[a.getAttribute("data-cat-link")] = a;
    });
  }

  function itemPriceHtml(item) {
    if (item.price === null || item.price === undefined) {
      return '<div class="price-tbd">Price to be confirmed</div>';
    }
    var html = '<div class="item-price">' + Shop.money(item.price);
    if (item.bulk) html += "<small>" + Shop.esc(item.bulk.label) + "</small>";
    html += "</div>";
    return html;
  }

  function renderMenu() {
    var host = document.querySelector("[data-menu]");
    if (!host) return;

    host.innerHTML = visibleCategories().map(function (cat) {
      var items = cat.items.map(function (item) {
        var hasOptions = optionGroupsFor(item, cat).length > 0;
        var unavailable = item.price === null || item.price === undefined;

        var includes = item.includes
          ? '<ul class="item-includes">' + item.includes.map(function (x) {
              return "<li>" + Shop.esc(x) + "</li>";
            }).join("") + "</ul>"
          : "";

        var desc = item.description
          ? '<div class="item-desc">' + Shop.esc(item.description) + "</div>" : "";

        var badge = hasOptions
          ? '<span class="item-badge">Choices</span>' : "";

        var action = unavailable
          ? '<button class="add-btn" disabled>Unavailable</button>'
          : '<button class="add-btn" data-add="' + Shop.esc(item.id) + '">Add' +
            (hasOptions ? " …" : "") + "</button>";

        return '<article class="item">' +
          '<div class="item-body">' +
            '<div class="item-name">' + Shop.esc(item.name) + badge + "</div>" +
            desc + includes +
          "</div>" +
          '<div class="item-side">' + itemPriceHtml(item) + action + "</div>" +
        "</article>";
      }).join("");

      return '<section class="menu-cat" id="cat-' + cat.id + '" data-cat="' + cat.id + '">' +
        "<header><h2>" + Shop.esc(cat.name) + "</h2>" +
        (cat.note ? '<p class="cat-note">' + Shop.esc(cat.note) + "</p>" : "") +
        "</header>" +
        '<div class="item-list">' + items + "</div>" +
      "</section>";
    }).join("");

    host.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add]");
      if (btn) handleAdd(btn.getAttribute("data-add"), btn);
    });

    setupScrollSpy();
  }

  function setupScrollSpy() {
    var sections = document.querySelectorAll(".menu-cat");
    if (!sections.length || !("IntersectionObserver" in window)) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute("data-cat");
        Object.keys(railLinks).forEach(function (k) {
          railLinks[k].classList.toggle("is-active", k === id);
        });
      });
    }, { rootMargin: "-120px 0px -70% 0px", threshold: 0 });

    sections.forEach(function (s) { obs.observe(s); });
  }

  /* --------------------------------------------------------------- add flow */

  function handleAdd(itemId, btn) {
    var entry = index[itemId];
    if (!entry) return;

    var groups = optionGroupsFor(entry.item, entry.cat);
    if (groups.length === 0) {
      Cart.add({
        itemId: entry.item.id,
        name: entry.item.name,
        basePrice: entry.item.price,
        bulk: entry.item.bulk || null,
        options: [],
        qty: 1
      });
      flash(btn);
      Shop.toast(entry.item.name + " added");
      return;
    }
    openItemModal(entry, groups);
  }

  function flash(btn) {
    if (!btn) return;
    var original = btn.textContent;
    btn.classList.add("is-added");
    btn.textContent = "Added ✓";
    setTimeout(function () {
      btn.classList.remove("is-added");
      btn.textContent = original;
    }, 1100);
  }

  function openItemModal(entry, groups) {
    var item = entry.item;
    var body = groups.map(function (g) {
      var inputs = g.choices.map(function (c, i) {
        var delta = c.priceDelta || 0;
        var checked = g.type === "radio" && i === 0 ? " checked" : "";
        return '<label class="choice">' +
          '<input type="' + g.type + '" name="' + Shop.esc(g.id) + '"' +
            ' value="' + Shop.esc(c.name) + '" data-delta="' + delta + '"' +
            ' data-group="' + Shop.esc(g.name) + '"' + checked + ">" +
          '<span class="label">' + Shop.esc(c.name) + "</span>" +
          (delta > 0 ? '<span class="delta">+' + Shop.money(delta) + "</span>" : "") +
        "</label>";
      }).join("");

      return '<div class="opt-group"><fieldset>' +
        "<legend>" + Shop.esc(g.name) +
        (g.note ? ' <span class="hint">(' + Shop.esc(g.note) + ")</span>" : "") +
        "</legend>" + inputs + "</fieldset></div>";
    }).join("");

    openModal({
      title: item.name,
      body: body,
      foot: '<button class="btn btn-primary btn-block btn-lg" data-confirm-item>' +
            "Add to order · <span data-opt-total>" + Shop.money(item.price) + "</span></button>",
      onMount: function (modal) {
        function recalc() {
          var total = item.price;
          modal.querySelectorAll("input:checked").forEach(function (input) {
            total += parseFloat(input.getAttribute("data-delta")) || 0;
          });
          modal.querySelector("[data-opt-total]").textContent = Shop.money(total);
        }
        modal.addEventListener("change", recalc);

        modal.querySelector("[data-confirm-item]").addEventListener("click", function () {
          var options = [];
          modal.querySelectorAll("input:checked").forEach(function (input) {
            var delta = parseFloat(input.getAttribute("data-delta")) || 0;
            options.push({
              group: input.getAttribute("data-group"),
              name: input.value,
              delta: delta
            });
          });
          Cart.add({
            itemId: item.id,
            name: item.name,
            basePrice: item.price,
            bulk: item.bulk || null,
            options: options,
            qty: 1
          });
          closeModal();
          Shop.toast(item.name + " added");
        });
      }
    });
  }

  /* ------------------------------------------------------------ cart render */

  function optionsSummary(line) {
    if (!line.options || !line.options.length) return "";
    return line.options.map(function (o) { return o.name; }).join(", ");
  }

  function renderCart() {
    var body = document.querySelector("[data-cart-body]");
    var foot = document.querySelector("[data-cart-foot]");
    if (!body || !foot) return;

    var lines = Cart.all();

    if (!lines.length) {
      body.innerHTML =
        '<div class="cart-empty">' + fishGlyph() +
        "<p>Your order is empty.<br>Pick something from the menu.</p></div>";
      foot.innerHTML = '<p class="pickup-only-note">Pickup only · pay online when you order</p>';
      renderMobileBar();
      return;
    }

    body.innerHTML = lines.map(function (l) {
      var opts = optionsSummary(l);
      var saving = Cart.lineSaving(l);
      return '<div class="cart-line">' +
        '<div class="info">' +
          '<div class="name">' + Shop.esc(l.name) + "</div>" +
          (opts ? '<div class="opts">' + Shop.esc(opts) + "</div>" : "") +
          (saving > 0 ? '<div class="bulk-note">Deal saves ' + Shop.money(saving) + "</div>" : "") +
          '<div class="qty">' +
            '<button data-qty="-1" data-key="' + Shop.esc(l.key) + '" aria-label="Remove one ' + Shop.esc(l.name) + '">−</button>' +
            '<span class="n">' + l.qty + "</span>" +
            '<button data-qty="1" data-key="' + Shop.esc(l.key) + '" aria-label="Add one ' + Shop.esc(l.name) + '">+</button>' +
          "</div>" +
        "</div>" +
        '<div class="line-price">' + Shop.money(Cart.lineTotal(l)) + "</div>" +
      "</div>";
    }).join("");

    var t = Cart.totals();
    var perk = t.freeDrink
      ? '<div class="cart-perk">🥤 <span>Free 1.25L drink included with this order.</span></div>'
      : '<div class="cart-perk progress">Spend ' + Shop.money(t.freeDrinkGap) +
        " more for a free 1.25L drink.</div>";

    foot.innerHTML = perk +
      '<div class="cart-row"><span>Subtotal</span><span>' + Shop.money(t.subtotal) + "</span></div>" +
      '<div class="cart-row"><span>Pickup</span><span>Free</span></div>' +
      '<div class="cart-row total"><span>Total</span><span class="amt">' + Shop.money(t.total) + "</span></div>" +
      '<div class="cart-row" style="font-size:12.5px;color:var(--ink-500)"><span>Includes GST</span><span>' +
        Shop.money(t.gstIncluded) + "</span></div>" +
      '<button class="btn btn-primary btn-block btn-lg" data-checkout>Checkout · ' + Shop.money(t.total) + "</button>" +
      '<p class="pickup-only-note">Pickup only · ' + Shop.esc(MENU.shop.address.line1) + "</p>";

    renderMobileBar();
  }

  function renderMobileBar() {
    var bar = document.querySelector("[data-mobile-bar]");
    if (!bar) return;
    var n = Cart.count();
    bar.style.display = "";
    if (!n) { bar.hidden = true; return; }
    bar.hidden = false;
    bar.innerHTML =
      '<div class="mc-info">' + n + (n === 1 ? " item" : " items") + " · pickup</div>" +
      '<div style="display:flex;align-items:center;gap:14px">' +
        '<span class="mc-total">' + Shop.money(Cart.totals().total) + "</span>" +
        '<button class="btn btn-primary" data-open-cart>View order</button>' +
      "</div>";
  }

  function fishGlyph() {
    return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M6 32c8-11 19-17 30-17s20 6 22 17c-2 11-11 17-22 17S14 43 6 32Z"/>' +
      '<circle cx="45" cy="27" r="2.5" fill="currentColor" stroke="none"/>' +
      '<path d="M6 32 14 22v20L6 32Z"/></svg>';
  }

  /* ---------------------------------------------------------------- modals */

  function openModal(cfg) {
    var overlay = document.querySelector("[data-overlay]");
    lastFocus = document.activeElement;

    overlay.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="' + Shop.esc(cfg.title) + '">' +
        "<header><h3>" + Shop.esc(cfg.title) + "</h3>" +
        '<button class="modal-close" data-close aria-label="Close">×</button></header>' +
        '<div class="modal-body">' + cfg.body + "</div>" +
        (cfg.foot ? '<div class="modal-foot">' + cfg.foot + "</div>" : "") +
      "</div>";

    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";

    var modal = overlay.querySelector(".modal");
    if (cfg.onMount) cfg.onMount(modal);

    var focusable = modal.querySelector("input, select, button:not([data-close])");
    if (focusable) focusable.focus();
  }

  function closeModal() {
    var overlay = document.querySelector("[data-overlay]");
    overlay.classList.remove("is-open");
    overlay.innerHTML = "";
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* -------------------------------------------------------------- checkout */

  function openCheckout() {
    if (!Cart.count()) return;

    var status = Shop.status();
    var slotInfo = Shop.pickupSlots();
    var t = Cart.totals();

    var closedNotice = status.acceptingOrders ? "" :
      '<div class="cart-perk progress" style="margin-bottom:18px">' +
      "The shop is closed right now — choose a pickup time for " +
      Shop.esc(slotInfo.dayLabel || "the next trading day") + ".</div>";

    var slotOptions = slotInfo.slots.length
      ? slotInfo.slots.map(function (s) {
          return '<option value="' + Shop.esc(s.value) + '">' + Shop.esc(s.label) + "</option>";
        }).join("")
      : '<option value="">No times available</option>';

    var summary = Cart.all().map(function (l) {
      var opts = optionsSummary(l);
      return "<li><span><span class='q'>" + l.qty + "×</span>" + Shop.esc(l.name) +
        (opts ? ' <span style="color:var(--ink-500)">(' + Shop.esc(opts) + ")</span>" : "") +
        "</span><span>" + Shop.money(Cart.lineTotal(l)) + "</span></li>";
    }).join("");

    var body = closedNotice +
      '<ul class="summary-list">' + summary +
        (t.freeDrink ? "<li><span><span class='q'>1×</span>1.25L drink <em>(free over " +
          Shop.money(t.freeDrinkOver) + ")</em></span><span>$0.00</span></li>" : "") +
      "</ul>" +
      '<div class="cart-row total" style="margin-bottom:24px"><span>Total</span>' +
        '<span class="amt">' + Shop.money(t.total) + "</span></div>" +

      '<form id="checkout-form" novalidate>' +
        '<div class="field"><label for="co-name">Name for the order</label>' +
          '<input id="co-name" name="name" type="text" autocomplete="name" placeholder="e.g. Sam">' +
          '<div class="error">Please enter a name.</div></div>' +

        '<div class="field"><label for="co-phone">Mobile number ' +
          '<span class="hint">— so we can call if there\'s a question</span></label>' +
          '<input id="co-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="04XX XXX XXX">' +
          '<div class="error">Please enter a valid Australian mobile number.</div></div>' +

        '<div class="field"><label for="co-time">Pickup time' +
          (slotInfo.sameDay ? "" : " <span class=\"hint\">— " + Shop.esc(slotInfo.dayLabel) + "</span>") +
          "</label>" +
          '<select id="co-time" name="time">' + slotOptions + "</select>" +
          '<div class="error">Please choose a pickup time.</div></div>' +

        '<div class="field"><label for="co-notes">Notes for the kitchen <span class="hint">— optional</span></label>' +
          '<textarea id="co-notes" name="notes" placeholder="e.g. no salt on the chips"></textarea></div>' +

        '<div class="fake-card">' +
          '<div class="fake-card-warn">' + warnGlyph() +
            "<span>Demonstration only. This form is not connected to any payment processor " +
            "and nothing is sent anywhere. <strong>Do not enter a real card number.</strong></span></div>" +
          '<div class="field"><label for="co-card">Card number <span class="hint">— test card, pre-filled</span></label>' +
            '<input id="co-card" name="card" type="text" inputmode="numeric" autocomplete="off" ' +
            'value="4242 4242 4242 4242" readonly></div>' +
          '<div class="field-row">' +
            '<div class="field"><label for="co-exp">Expiry</label>' +
              '<input id="co-exp" type="text" autocomplete="off" value="12/34" readonly></div>' +
            '<div class="field"><label for="co-cvc">CVC</label>' +
              '<input id="co-cvc" type="text" autocomplete="off" value="123" readonly></div>' +
          "</div>" +
        "</div>" +
      "</form>";

    openModal({
      title: "Checkout · Pickup",
      body: body,
      foot: '<button class="btn btn-primary btn-block btn-lg" data-place-order>' +
            "Pay " + Shop.money(t.total) + " &amp; place order</button>" +
            '<p class="pickup-only-note">Simulated payment — no money moves.</p>',
      onMount: function (modal) {
        modal.querySelector("[data-place-order]").addEventListener("click", function () {
          if (validateCheckout(modal)) placeOrder(modal, slotInfo);
        });
      }
    });
  }

  function warnGlyph() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" aria-hidden="true">' +
      '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v5"/><path d="M12 18h.01"/></svg>';
  }

  function validateCheckout(modal) {
    var ok = true;

    function mark(id, valid) {
      var field = modal.querySelector("#" + id).closest(".field");
      field.classList.toggle("has-error", !valid);
      if (!valid) ok = false;
    }

    var name = modal.querySelector("#co-name").value.trim();
    mark("co-name", name.length >= 2);

    var phone = modal.querySelector("#co-phone").value.replace(/[\s()-]/g, "");
    mark("co-phone", /^(?:\+?61|0)[2-478]\d{8}$/.test(phone));

    var time = modal.querySelector("#co-time").value;
    mark("co-time", !!time);

    if (!ok) {
      var first = modal.querySelector(".field.has-error input, .field.has-error select");
      if (first) first.focus();
    }
    return ok;
  }

  function placeOrder(modal, slotInfo) {
    var name = modal.querySelector("#co-name").value.trim();
    var timeSelect = modal.querySelector("#co-time");
    var timeLabel = timeSelect.options[timeSelect.selectedIndex].text;
    var notes = modal.querySelector("#co-notes").value.trim();
    var total = Cart.totals().total;
    var orderNo = "LW-" + String(Math.floor(1000 + Math.random() * 9000));

    var dayWord = slotInfo.sameDay ? "today" : slotInfo.dayLabel;
    var when = /soon as possible/i.test(timeLabel)
      ? "In about " + Shop.PREP_MINUTES + " minutes"
      : timeLabel + ", " + dayWord;

    var btn = modal.querySelector("[data-place-order]");
    btn.disabled = true;
    btn.textContent = "Processing…";

    /* A beat of fake latency so the demo feels like a real gateway. */
    setTimeout(function () {
      Cart.clear();
      openModal({
        title: "Order placed",
        body:
          '<div class="confirm">' +
            '<div class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
              'stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="m4 12 6 6L20 6"/></svg></div>' +
            "<h3>Thanks, " + Shop.esc(name) + "!</h3>" +
            '<div class="order-no">' + orderNo + "</div>" +
            "<p>Paid " + Shop.money(total) + " · pickup order</p>" +
            '<div class="pickup-at">Ready for pickup<strong>' + Shop.esc(when) + "</strong></div>" +
            "<p style='margin-top:16px'>" + Shop.esc(MENU.shop.address.line1) + ", " +
              Shop.esc(MENU.shop.address.suburb) + "<br>" +
              "<a href='tel:" + Shop.esc(MENU.shop.phoneE164) + "'>" + Shop.esc(MENU.shop.phone) + "</a></p>" +
            (notes ? "<p style='color:var(--ink-500)'><em>Note: " + Shop.esc(notes) + "</em></p>" : "") +
            '<div class="confirm-demo-note">This is a demonstration. No order was sent to the shop, ' +
              "no payment was taken, and no details were stored or transmitted.</div>" +
          "</div>",
        foot: '<button class="btn btn-dark btn-block" data-close-confirm>Back to the menu</button>',
        onMount: function (m) {
          m.querySelector("[data-close-confirm]").addEventListener("click", closeModal);
        }
      });
    }, 900);
  }

  /* ------------------------------------------------------------------ wire */

  function wireCartControls() {
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) return closeModal();
      if (e.target.closest("[data-checkout]")) return openCheckout();
      if (e.target.closest("[data-clear-cart]")) {
        if (Cart.count() && confirm("Clear your whole order?")) Cart.clear();
        return;
      }
      if (e.target.closest("[data-open-cart]")) {
        document.body.classList.add("cart-open");
        return;
      }
      if (e.target.closest("[data-close-cart]") || e.target.closest(".cart-scrim")) {
        document.body.classList.remove("cart-open");
        return;
      }
      var q = e.target.closest("[data-qty]");
      if (q) Cart.bump(q.getAttribute("data-key"), parseInt(q.getAttribute("data-qty"), 10));
    });

    document.querySelector("[data-overlay]").addEventListener("click", function (e) {
      if (e.target === this) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (document.querySelector("[data-overlay]").classList.contains("is-open")) closeModal();
      else document.body.classList.remove("cart-open");
    });
  }

  function init() {
    buildIndex();
    renderRail();
    renderMenu();
    renderCart();
    wireCartControls();
    Cart.onChange(renderCart);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
