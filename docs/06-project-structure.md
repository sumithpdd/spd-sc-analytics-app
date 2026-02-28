# 06 – Project Structure

This guide explains the codebase layout and what each key file does. It's aimed at developers who want to understand or modify the app.

---

## Directory overview

```
spd-sc-analytics-app/
├── app/
│   ├── standalone/           # Full-page dashboard
│   │   └── page.tsx
│   ├── pages-contextpanel/   # Site analytics (Pages editor)
│   │   └── page.tsx
│   ├── dashboard-widget/     # Dashboard card
│   │   └── page.tsx
│   ├── custom-field/         # Color picker field
│   │   └── page.tsx
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home (redirect or placeholder)
│   └── globals.css
├── hooks/
│   └── useMarketplaceClient.ts
├── lib/
│   └── xmcClient.ts
├── docs/
└── package.json
```

---

## Extension pages

### app/standalone/page.tsx

Full-page analytics dashboard. Runs when the user opens the app from the Portal navigation. May not have site context when launched from the main Portal, so it can show org-level or placeholder data. Uses `useMarketplaceClient` and optionally `executeGraphQL` / `searchByContentRoot` from `lib/xmcClient.ts`.

### app/pages-contextpanel/page.tsx

Site-specific analytics panel. Runs **inside the Pages editor** when the user is editing a page. Subscribes to `pages.context` to get `siteInfo.collectionId` (used as `sitecoreContextId`) and `pageInfo.path`. Derives the content root from the page path and calls `searchByContentRoot` to get item counts. This is the extension that typically shows real content data because it has site context.

### app/dashboard-widget/page.tsx

Compact card for the Portal dashboard. Similar to Standalone but designed for a smaller layout. May show summary metrics or a link to the full dashboard.

### app/custom-field/page.tsx

Color picker custom field. Uses `client.getValue()` to read the current value and `client.setValue(color)` to save. Renders preset colors and a custom color input. The custom field API does **not** use `client.query("field.context")` or `client.query("field.setValue")`—those are outdated.

---

## Shared modules

### hooks/useMarketplaceClient.ts

React hook that initializes the Marketplace SDK and returns `{ client, error, isLoading, isInitialized }`. Uses a singleton so the client is created once. Calls `ClientSDK.init({ target: window.parent, modules: [XMC] })`. All extension pages use this hook.

### lib/xmcClient.ts

XM Cloud API helpers:

- **`executeGraphQL(client, query, variables?, sitecoreContextId?)`** – Wraps `client.mutate("xmc.preview.graphql", ...)` for GraphQL queries. Pass `sitecoreContextId` when you have site context (e.g. from `pages.context.siteInfo.collectionId`).
- **`getContentRootFromPagePath(pagePath)`** – Derives the content root path from a page path (e.g. `/sitecore/content/industry-verticals/visitlondon/Home/SomePage` → `/sitecore/content/industry-verticals/visitlondon/Home`).
- **`tryItemByPath(client, path, sitecoreContextId?)`** – Fetches a single item by path. Useful for debugging.
- **`searchByContentRoot(client, contentRootPath, sitecoreContextId?)`** – Searches items under a content root. The GraphQL `search` API expects `_path` as a **GUID**, not a path string. This function first fetches the root item by path to get its ID, then searches using that GUID.

---

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server (Turbopack). Use for local development. |
| `npm run build` | Production build. |
| `npm run start` | Run production server. Use after `npm run build`. |

---

## Dependencies

- **`@sitecore-marketplace-sdk/client`** – Core SDK (ClientSDK, queries, mutations)
- **`@sitecore-marketplace-sdk/xmc`** – XM Cloud module (GraphQL, etc.)
- **Next.js** – App Router, React
- **React** – UI components
- **Tailwind CSS** – Styling

---

## Further reading

- [Sitecore Marketplace SDK for JavaScript](https://doc.sitecore.com/mp/en/developers/sdk/latest/sitecore-marketplace-sdk/sitecore-marketplace-sdk-for-javascript.html)
- [04 – Extension Points](./04-extension-points.md) – When each extension runs

---

[Back to index](./README.md)
