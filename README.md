# CookiesRegTech for Strapi

Cookie consent banner with automatic tracker blocking, Google Consent Mode,
a cookie scanner, and a verifiable consent log — powered by
[CookiesRegTech](https://www.cookiesregtech.com).

Helps with GDPR, UK GDPR, CCPA/CPRA, LGPD, POPIA, and PIPEDA compliance.
Supports Strapi v5 (Node 18+).

## Why this plugin works differently

Strapi is headless: it does not render the public website, so this plugin
cannot inject the consent banner script by itself the way the WordPress or
October CMS plugins do. Instead it gives you everything needed to add it to
your frontend in one step:

1. **Guided connect** in the Strapi admin — create a free CookiesRegTech
   account or link an existing one, and see the plan, banner status, last
   scan, and the detected cookie list.
2. **The exact snippet** for your frontend (Next.js, Nuxt, Astro, plain
   HTML, anything) — one line, ready to paste.
3. **A public config endpoint** — `GET /api/cookiesregtech/config` — so your
   frontend can read the script URL at build or run time instead of
   hardcoding it.

## Installation

Inside your Strapi project:

```bash
npm install strapi-plugin-cookiesregtech
```

Enable the plugin in `config/plugins.js`:

```js
module.exports = () => ({
  cookiesregtech: { enabled: true },
});
```

or `config/plugins.ts`:

```ts
export default () => ({
  cookiesregtech: { enabled: true },
});
```

Rebuild the admin panel and start Strapi:

```bash
npm run build
npm run develop
```

The package ships prebuilt (`dist/` contains both the server and admin
parts), so no extra build step is needed for the plugin itself.

## Setup

1. In the Strapi admin, open **CookiesRegTech** in the main menu.
2. Enter the **public address of your website** (for example
   `https://www.example.com`). A headless CMS cannot detect this on its own,
   so it must be the site your visitors actually see — not the Strapi URL.
3. Confirm the account email, tick the consent box, and press
   **Connect website**. A free account is created and the website is
   registered.

If the email already has a CookiesRegTech account, a confirmation link is
sent to it instead — click it, then press **Check status** in the plugin
screen.

## Add the banner to your frontend

After connecting, the plugin screen shows your snippet. Place it
**right after the opening `<head>` tag, before Google Tag Manager or any
analytics script**, so it can block trackers and signal Google Consent Mode
before anything else runs. Do not add `async` or `defer` to it.

### Option A — paste the snippet

Copy the line shown in the admin into your site's HTML head:

```html
<head>
  <!-- CookiesRegTech: must be the first script -->
  <script src="PASTE_SCRIPT_URL_FROM_STRAPI_ADMIN"></script>
  <!-- Google Tag Manager, analytics, etc. go below -->
</head>
```

### Option B — read it from the config endpoint

The endpoint returns:

```json
{
  "enabled": true,
  "domainId": "…",
  "server": "…",
  "scriptUrl": "…"
}
```

First allow public access to it: **Settings → Users & Permissions plugin →
Roles → Public → Cookiesregtech → `config`**, then save. Without this the
endpoint returns `403 Forbidden`.

**Next.js (App Router)** — `app/layout.tsx`:

```tsx
async function getConsentConfig() {
  try {
    const res = await fetch(`${process.env.STRAPI_URL}/api/cookiesregtech/config`, {
      next: { revalidate: 3600 },
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const consent = await getConsentConfig();
  return (
    <html lang="en">
      <head>
        {consent?.enabled && consent.scriptUrl && <script src={consent.scriptUrl} />}
        {/* analytics scripts after this line */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Astro** — in your base layout:

```astro
---
const res = await fetch(`${import.meta.env.STRAPI_URL}/api/cookiesregtech/config`).catch(() => null);
const consent = res?.ok ? await res.json() : null;
---
<html lang="en">
  <head>
    {consent?.enabled && consent.scriptUrl && <script is:inline src={consent.scriptUrl}></script>}
  </head>
  <body><slot /></body>
</html>
```

The same pattern works for Nuxt (`useHead` in `app.vue`), SvelteKit,
Gatsby, or any static site generator: fetch the config once, and render the
`scriptUrl` as the first script in the head when `enabled` is `true`.

## After connecting

The plugin screen shows the account, plan, banner status, and the cookies
found by the last scan, plus **Open dashboard** / **Upgrade plan**, which
open the CookiesRegTech dashboard already signed in. Banner design, cookie
scans, languages, and the consent log are managed there and publish to your
site instantly — no frontend redeploy needed, since the snippet stays the
same.

The free plan includes a working banner, consent logging, and cookie scans;
paid plans add scheduled full-site scans, geo-targeted banners, custom CSS,
and higher limits. Upgrades happen in the CookiesRegTech dashboard, never
inside this plugin.

## Troubleshooting

- **Banner not showing** — check that the snippet is in the rendered HTML
  (view source, not dev tools after hydration) and that it comes before
  other scripts.
- **`403` from `/api/cookiesregtech/config`** — public access to the route
  has not been enabled (see Option B).
- **Plugin missing from the admin menu** — confirm it is enabled in
  `config/plugins.js` and that you ran `npm run build` after installing.

## Developing this plugin

Built with the official `@strapi/sdk-plugin` toolchain:

```bash
npm install       # once, inside this folder
npm run build     # bundles server + admin into dist/
npm run watch     # rebuilds on change while linked into a Strapi app
npm run verify    # checks that the package exports resolve
```

To iterate inside a Strapi app, link this folder
(`npm install /path/to/this/folder`), or use `npx yalc` or a `file:`
dependency, then run `npm run develop` in the app.

## Support

- Website: <https://www.cookiesregtech.com>
- Email: <support@skynettechnologies.com>
