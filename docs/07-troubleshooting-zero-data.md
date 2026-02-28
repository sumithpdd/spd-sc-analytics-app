# 07 – Troubleshooting: Zero Data

If your app shows **Total Items = 0** or "No content found" even though you have content in XM Cloud, this guide explains the causes and how to fix them.

---

## Why you might see zero data

There are three main reasons:

1. **Missing site context** – The extension you're using doesn't receive `sitecoreContextId`, so GraphQL queries run without site scope and return nothing.
2. **API Access not enabled** – The app doesn't have permission to call the GraphQL API.
3. **GraphQL search expects a GUID** – The `search` API's `_path` filter requires a GUID, not a path string. Using a path directly returns no results.

---

## Fix 1: Use the Pages Context Panel

**Problem:** When you open the **Standalone** app from the Portal's main navigation, it often runs without site context. The Portal doesn't know which site you're in, so `sitecoreContextId` is missing. GraphQL queries without `sitecoreContextId` may return no data or wrong data.

**Solution:** Use the **Pages Context Panel** instead. It runs when you're editing a page in the Pages editor. In that context, the Portal provides `pages.context` with:

- `siteInfo.collectionId` – Use this as `sitecoreContextId` in GraphQL
- `pageInfo.path` – The path of the current page (e.g. `/sitecore/content/industry-verticals/visitlondon/Home`)
- `siteInfo.name`, `siteInfo.displayName`, etc.

To use it:

1. Open **Pages** in the Portal
2. Open a page for editing
3. Open the **context panel** (usually on the right)
4. Your app's Pages Context Panel extension should appear there with site-specific data

---

## Fix 2: Enable API Access

**Problem:** The app is registered but doesn't have permission to call the Authoring and Management GraphQL API. Queries fail or return empty results.

**Solution:**

1. Go to **Developer Studio** → your app
2. Open the **API Access** section
3. Click **Select APIs**
4. Enable **Authoring and Management GraphQL API** (and any SitecoreAI APIs you need)
5. Save and ensure the app is Active

See [05 – Register App](./05-register-app.md) for screenshots and step-by-step instructions.

---

## Fix 3: Use GUID for search, not path

**Problem:** The GraphQL `search` API's `_path` filter expects a **GUID** (e.g. `{110D559F-DEA5-42EA-9C1C-8A5DF7E70EF9}`), not a path string like `/sitecore/content/MySite/Home`. If you pass a path, the search returns no results.

**Solution:** The `searchByContentRoot` function in `lib/xmcClient.ts` handles this:

1. **Step 1:** Call `item(path: $path)` to fetch the root item by path. This returns the item's `id` (GUID).
2. **Step 2:** Use that GUID in the `search` query: `where: { name: "_path", value: $guid, operator: CONTAINS }`.

If you write your own search, follow the same pattern: get the item by path first, then search by its ID.

---

## How content root is derived

The Pages Context Panel derives the content root from `pageInfo.path`. For example:

- Page path: `/sitecore/content/industry-verticals/visitlondon/Home/SomePage`
- Content root: `/sitecore/content/industry-verticals/visitlondon/Home` (first 5 segments)

The structure is typically: `/sitecore/content/<tenant>/<site>/<startItem>/...`. The content root is the start item (e.g. `Home`). The `getContentRootFromPagePath` function in `lib/xmcClient.ts` implements this logic.

If your site structure is different, you may need to adjust the logic. You can also use `siteInfo.startItemId` if the context provides it.

---

## Verifying the setup

1. **Check API Access** – In Developer Studio, confirm Authoring and Management GraphQL API is enabled.
2. **Check context** – In the Pages Context Panel, open the browser console. Log `pagesContext` to see if `siteInfo.collectionId` and `pageInfo.path` are present.
3. **Check path** – In Content Editor, verify the path of your site's start item matches what the app expects (e.g. `/sitecore/content/.../Home`).
4. **Use tryItemByPath** – Call `tryItemByPath(client, yourPath, collectionId)` to verify the item exists and the path format is correct.

---

## Further reading

- [04 – Extension Points](./04-extension-points.md) – When each extension has context
- [05 – Register App](./05-register-app.md) – API Access configuration
- [lib/xmcClient.ts](../lib/xmcClient.ts) – Implementation of `searchByContentRoot` and `getContentRootFromPagePath`

---

[Back to index](./README.md)
