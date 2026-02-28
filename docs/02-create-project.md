# 02 – Create the Project

This guide walks you through creating the Next.js project from scratch and installing the Sitecore Marketplace SDK packages.

---

## Create the Next.js app

Run the official Next.js scaffolding tool:

```bash
npx create-next-app@latest spd-sc-analytics-app
```

When prompted, choose:

- **TypeScript:** Yes
- **ESLint:** Yes
- **Tailwind CSS:** Yes
- **`src/` directory:** No (we use the default `app/` at the root)
- **App Router:** Yes
- **Turbopack:** Optional (Yes is fine for faster dev)

This creates a standard Next.js 14+ app with the App Router. See the [Next.js installation docs](https://nextjs.org/docs/app/getting-started/installation) for more details.

---

## Install the Marketplace SDK

Change into the project directory and add the SDK packages:

```bash
cd spd-sc-analytics-app
npm install @sitecore-marketplace-sdk/client @sitecore-marketplace-sdk/xmc
```

- **`@sitecore-marketplace-sdk/client`** – Required. Provides the main `ClientSDK` for communicating with the Portal (queries, mutations, subscriptions).
- **`@sitecore-marketplace-sdk/xmc`** – Optional but used here. Adds XM Cloud–specific capabilities (e.g. GraphQL via `xmc.preview.graphql`).

You can check the latest versions on [npm](https://www.npmjs.com/package/@sitecore-marketplace-sdk/client) or in the [Marketplace SDK docs](https://doc.sitecore.com/mp/en/developers/sdk/latest/sitecore-marketplace-sdk/sitecore-marketplace-sdk-for-javascript.html).

---

## Create the folder structure

Create the following folders and files. You can do this manually or with your IDE:

```
app/
  standalone/          # Full-page dashboard
  dashboard-widget/     # Dashboard card
  custom-field/        # Color picker field
  pages-contextpanel/  # Site analytics (Pages editor)
hooks/                 # React hooks (e.g. useMarketplaceClient)
lib/                   # Shared utilities (e.g. xmcClient)
```

Each `app/*` folder should contain a `page.tsx` file for the route. For example:

- `app/standalone/page.tsx` → route `/standalone`
- `app/pages-contextpanel/page.tsx` → route `/pages-contextpanel`
- `app/dashboard-widget/page.tsx` → route `/dashboard-widget`
- `app/custom-field/page.tsx` → route `/custom-field`

The `hooks` and `lib` folders hold shared logic used across these pages.

---

## Why this structure?

- **App Router** – Next.js 13+ uses the `app/` directory. Each folder with a `page.tsx` becomes a route.
- **Extension points** – Each extension (Standalone, Pages Context Panel, etc.) maps to a route. When the Portal loads your app, it navigates to the appropriate route (e.g. `/standalone`).
- **Shared code** – The SDK initialization and GraphQL helpers are reused, so they live in `hooks/` and `lib/` instead of being duplicated in each page.

---

## Next steps

- [03 – SDK Setup](./03-sdk-setup.md) – Initialize the SDK and create the `useMarketplaceClient` hook
- [Back to index](./README.md)
