# Lakewood Fish & Chips — online ordering demo

A demonstration online-ordering site for Lakewood Fish & Chips, Shop 1, 300 Heatherhill
Road, Frankston VIC.

**This is a demo, not a live shop system.** Nothing is sent anywhere, no payment is
processed, and no customer detail is stored or transmitted. Every page carries a banner
saying so, and the card fields at checkout are read-only and pre-filled with the standard
`4242 4242 4242 4242` test number so nobody can type a real card into it.

## What it does

- Full menu, transcribed from the shop's printed takeaway menu
- Pickup ordering with a persistent cart (survives page reloads via `localStorage`)
- Item options — grilled fish `+$0.50`, steamed or fried dim sims, `$0.60` burger extras
- Bulk pricing — 6 chicken nuggets for $6 applies automatically, cheaper of the two wins
- Free 1.25L drink over $55, with a live "spend $X more" prompt in the cart
- Live open/closed status computed in `Australia/Melbourne`, so it is correct regardless
  of where the visitor is
- Pickup time slots generated from real trading hours, stopping 15 minutes before close;
  when the shop is shut it offers slots on the next trading day
- Simulated checkout with validation (name, Australian mobile format, pickup time) ending
  in an order-number confirmation
- Responsive — desktop three-column layout collapses to a scrolling category rail and a
  slide-up cart sheet on mobile

## Running it

No build step and no dependencies. Any static server works:

```bash
python3 -m http.server 4177
```

Then open <http://localhost:4177>. It also works opened directly off the filesystem,
because the menu is inlined into `assets/js/menu-data.js` rather than fetched.

## Editing the menu

`data/menu.json` is the single source of truth. After changing it, regenerate the file
the browser actually reads:

```bash
node build-menu.js
```

Keys prefixed with `_` in `menu.json` are notes for the shop owner and are stripped out
of the generated file.

## Layout

```
index.html              home — hero, value packs, hours, location
order.html              full menu, cart, checkout
data/menu.json          menu source of truth (edit this)
build-menu.js           regenerates assets/js/menu-data.js
assets/js/shop.js       trading hours, open/closed, pickup slots, formatting
assets/js/cart.js       cart state, bulk deals, totals
assets/js/app.js        shared page wiring
assets/js/order.js      menu render, options modal, checkout
assets/css/style.css    all styling
docs/CLIENT-BRIEF.md    what the shop still needs to supply
```

## Still needed before this could go live

See [docs/CLIENT-BRIEF.md](docs/CLIENT-BRIEF.md) for the full list. The short version:

1. **Seafood Pack price** — glare obscured it in the menu photo.
2. **Fish and Seafood price columns** — verify against the printed menu.
3. **Drinks** — sold in the shop but absent from the printed menu.
4. **What the $0.60 extras actually are** — currently a placeholder list.
5. **Real photos** and a vector logo. The current fish is a stand-in SVG.
6. **A backend.** This demo is entirely client-side. Taking real prepaid orders needs a
   payment processor, an order store, and something that puts the docket in front of the
   kitchen — none of which a static site can do.

## Placeholders to replace

- Prep time is hard-coded to 20 minutes in `assets/js/shop.js` (`PREP_MINUTES`)
- Last orders is hard-coded to 15 minutes before close (`LAST_ORDER_BEFORE_CLOSE`)
- Postcode in `data/menu.json` is `TODO_CONFIRM`
- Hero and footer copy is descriptive filler — no claims about the business are invented,
  but it should be replaced with the owner's own words
- Pages are `noindex, nofollow` while this is a demo. Remove that before any real launch.
