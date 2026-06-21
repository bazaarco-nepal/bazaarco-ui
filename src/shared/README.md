# `shared/` — code used by BOTH buyer and seller

Theme-neutral, role-neutral building blocks: transport (`api/`), generic hooks, `lib/` helpers,
cross-cutting providers (session, query, i18n), and design-system **primitives** that switch on the
`BzPack` context rather than hard-coding a theme.

**Import rule (enforced by ESLint):** `shared/` may import only from `shared/`. It must never import
from `buyer/` or `seller/`. If shared code needs something role-specific, invert the dependency —
pass it in.
