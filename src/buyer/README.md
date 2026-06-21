# `buyer/` — the customer marketplace (BazaarCo theme)

Everything the buyer sees: `features/`, buyer `hooks/` + `api/`, the buyer shell/navbar/footer, the
`BuyerPack` UI (custom SVG icons, `[data-pack="buyer"]` buttons, IBM Plex), and the buyer cart /
saved / checkout context.

**Import rule (enforced by ESLint):** `buyer/` may import from `buyer/` and `shared/` only. It must
never import from `seller/`. Anything genuinely common belongs in `shared/`.
