# 06 – Project Structure

This guide explains the codebase layout and what each key file does. It's aimed at developers who want to understand or modify the app.

---

## Directory overview

```
spd-sc-marketplace-app/
├── app/
│   ├── api/
│   │   ├── create-article/   # POST – Word import (OAuth2 + Authoring API)
│   │   │   └── route.ts
│   │   └── content-stats/    # GET – Article count (Authoring API)
│   │       └── route.ts
│   ├── standalone/           # Full-page dashboard (Preview API)
│   ├── pages-contextpanel/   # Analytics + Word import (Authoring API)
│   ├── import-doc/           # Standalone Word import page
│   ├── dashboard-widget/     # Sample dashboard card
│   ├── custom-field/         # Color picker field
│   ├── layout.tsx
│   ├── page.tsx              # Landing page
│   └── globals.css
├── components/
│   └── ArticleUploader.tsx
├── hooks/
│   └── useMarketplaceClient.ts
├── lib/
│   ├── authoring-api.ts     # OAuth2 + GraphQL helpers
│   ├── sitecore-constants.ts # IDs, field names
│   ├── xmcClient.ts         # Preview API (standalone dashboard)
│   ├── document-processor.ts
│   └── article-document-processor.ts
├── docs/
└── package.json
```

---

## Extension pages

### app/standalone/page.tsx

Full-page analytics dashboard. Runs when the user opens the app from the Portal navigation. Uses `useMarketplaceClient` and `lib/xmcClient.ts` (Preview API) for site-specific content counts. Requires **Content/Preview API** access in Developer Studio. For analytics without Preview API, use the **Pages Context Panel** instead (uses `/api/content-stats`).

### app/pages-contextpanel/page.tsx

Site-specific analytics panel and **Word document import**. Runs **inside the Pages editor** when the user is editing a page. Fetches stats from `/api/content-stats` (server-side Authoring API – no Preview API needed). Includes `ArticleUploader` for importing Word docs and creating ArticlePage items. See [08 – Word Import](./08-word-import.md).

### app/dashboard-widget/page.tsx

Compact card for the Portal dashboard. Similar to Standalone but designed for a smaller layout. May show summary metrics or a link to the full dashboard.

### app/custom-field/page.tsx

Color picker custom field. Uses `client.getValue()` to read the current value and `client.setValue(color)` to save. Renders preset colors and a custom color input. The custom field API does **not** use `client.query("field.context")` or `client.query("field.setValue")`—those are outdated.

---

## Shared modules

### hooks/useMarketplaceClient.ts

React hook that initializes the Marketplace SDK and returns `{ client, error, isLoading, isInitialized }`. Uses a singleton so the client is created once. Calls `ClientSDK.init({ target: window.parent, modules: [XMC] })`. All extension pages use this hook.

### app/import-doc/page.tsx

Standalone Word document import page. Renders `ArticleUploader` for uploading Word docs. Uses the same server-side `/api/create-article` route as the Pages Context Panel. For best results, use the import from the Pages Context Panel (site context + analytics in one place).

### components/ArticleUploader.tsx

Word document upload UI. Accepts .doc, .docx, .docm, .dotm files. Extracts title, date, content, author and creates ArticlePage items in Sitecore. Used in the Pages Context Panel and the import-doc page.

### lib/document-processor.ts

Parses Word OOXML files. Extracts table rows and paragraphs from `word/document.xml` and returns `string[][]`.

### lib/article-document-processor.ts

Transforms parsed rows into title, date, content, author. Expects: first line = title, second = date (optional), body until "Author" = content, then author name and role.

### lib/authoring-api.ts

Shared helpers for the Sitecore Authoring GraphQL API. Used by `/api/create-article` and `/api/content-stats`. `getBearerToken()` obtains OAuth2 JWT from XM Cloud Deploy credentials. `authoringGql()` runs GraphQL mutations/queries against the Authoring API.

### lib/sitecore-constants.ts

Template IDs, item IDs (Articles folder, Authors folder), and field names. Used by create-article and content-stats routes. Override via `ARTICLES_FOLDER_ID` and `AUTHOR_ITEM_TEMPLATE_ID` env vars.

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
