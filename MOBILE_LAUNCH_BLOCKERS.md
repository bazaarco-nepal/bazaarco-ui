# Mobile Launch Checkpoint

## Static export blockers

`output: "export"` has not been enabled because the current application relies on server behavior:

- `src/middleware.ts` implements maintenance redirects and a secure bypass cookie.
- `src/app/layout.tsx` reads the locale cookie during server rendering.
- Product and store pages are explicitly `force-dynamic` and fetch live SEO metadata and JSON-LD.
- The public catch-all route does not provide `generateStaticParams`.
- `src/app/sitemap.ts` uses ISR and live API data.
- `next.config.ts` proxies `/api/v1` through a rewrite, which static export cannot provide.

Enabling export without a product decision would remove the maintenance bypass, change first-paint
locale behavior, and remove live product/store SEO. The mobile build also needs an absolute
`NEXT_PUBLIC_API_BASE_URL`; `/api/v1` only works while a Next server is present.

Recommended split: preserve the current server-rendered deployment for the website and add a
mobile-specific static build mode that disables server-only SEO/middleware behavior and points API
requests directly at `bazaarco-api`.

## Google sign-in blocker

The brief names `@capacitor-community/google-auth`, but that package does not exist in npm.
`@codetrix-studio/capacitor-google-auth` only supports Capacitor 6. The installed compatible
replacement is `@capawesome/capacitor-google-sign-in`, which supports Capacitor 8.

Before wiring it into the sign-in UI, the API needs a dedicated endpoint that verifies the Google
ID token server-side and then calls the existing `upsertGoogleUser` account-matching path. Android,
iOS, and web OAuth client IDs also need to be supplied. The existing redirect callback must remain
available for the website.

## Native video embedding checkpoint

`bazaarco-mobile` now has prebuilt iOS and Android projects and a narrow `BazaarVideoHost`
JavaScript bridge contract. The recommended integration is a local native module/source dependency,
not copied generated projects. The Capacitor plugin should present the React Native controller and
translate `close`, `bargain`, and `buy` events back to the WebView.

The final Gradle/CocoaPods wiring should start after `bazaarco-ui` has real Capacitor platform
projects. Those projects cannot be generated correctly until the static mobile build produces
`out/`.
