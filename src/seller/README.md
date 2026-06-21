# `seller/` — the seller console (Microsoft Fluent theme)

Everything the seller sees: `features/` (dashboard, inventory, orders, chat, analytics…), seller
`hooks/` + `api/`, the seller shell/sidebar, and the `SellerPack` UI (Fluent icons,
`[data-skin="fluent"]`, Segoe UI).

**Import rule (enforced by ESLint):** `seller/` may import from `seller/` and `shared/` only. It must
never import from `buyer/`. Anything genuinely common belongs in `shared/`.
