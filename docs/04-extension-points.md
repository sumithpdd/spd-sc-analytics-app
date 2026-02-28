# 04 – Extension Points

Extension points define **where** your app appears in the Sitecore Cloud Portal. Each extension has a route in your app and a corresponding configuration in Developer Studio.

---

## Overview

| Extension | Route | When it runs | Use case |
|-----------|-------|--------------|----------|
| **Standalone** | `/standalone` | User opens the app from Portal navigation | Full-page dashboard |
| **Pages Context Panel** | `/pages-contextpanel` | User is editing a page in the Pages editor | Site-specific analytics |
| **Dashboard Widget** | `/dashboard-widget` | Shown on the Portal dashboard | Compact summary card |
| **Custom Field** | `/custom-field` | User edits a field that uses your custom field type | Color picker, custom input |

When you register the app in Developer Studio, you enable each extension and set its **Routing** value to the path (e.g. `/standalone`). The Portal then loads your app at `Deployment URL + Route` (e.g. `http://localhost:3000/standalone`).

---

## Standalone

- **Route:** `/standalone`
- **When:** User clicks your app in the Portal's app menu or navigation.
- **Context:** May not have site-specific context (e.g. `sitecoreContextId`) when launched from the main Portal. Useful for org-level dashboards or settings.
- **Code:** [app/standalone/page.tsx](../app/standalone/page.tsx)

---

## Pages Context Panel

- **Route:** `/pages-contextpanel`
- **When:** User is in the **Pages editor** (editing a page). The panel appears in the context panel on the side.
- **Context:** Has `pages.context` with `siteInfo.collectionId`, `pageInfo.path`, etc. This is the **site context** needed for GraphQL queries that return content data.
- **Code:** [app/pages-contextpanel/page.tsx](../app/pages-contextpanel/page.tsx)

**Important for content data:** If you need site-specific stats (e.g. total items under a site), use the **Pages Context Panel** from the Pages editor. The Standalone extension launched from the Portal often lacks `sitecoreContextId`, so GraphQL may return no data. See [07 – Zero Data](./07-troubleshooting-zero-data.md).

---

## Dashboard Widget

- **Route:** `/dashboard-widget`
- **When:** Shown as a card on the Portal dashboard.
- **Context:** Similar to Standalone; may not have site context. Good for high-level metrics.
- **Code:** [app/dashboard-widget/page.tsx](../app/dashboard-widget/page.tsx)

---

## Custom Field

- **Route:** `/custom-field`
- **When:** A content item has a field that uses your custom field type. The field editor loads your app.
- **Context:** Field context. Use `client.getValue()` to read the current value and `client.setValue(value)` to save. **Not** `client.query("field.context")` or `client.query("field.setValue")`—those are outdated.
- **Code:** [app/custom-field/page.tsx](../app/custom-field/page.tsx)

---

## Deployment URL and routes

The **Deployment URL** in Developer Studio must be the **base URL only** (e.g. `http://localhost:3000`). Do not include `/standalone` or any path.

Sitecore appends the route for each extension. For example:

- Standalone → `http://localhost:3000` + `/standalone` = `http://localhost:3000/standalone`
- Pages Context Panel → `http://localhost:3000` + `/pages-contextpanel` = `http://localhost:3000/pages-contextpanel`

If you set Deployment URL to `http://localhost:3000/standalone`, Sitecore would request `http://localhost:3000/standalone/pages-contextpanel` for the Pages Context Panel, which would 404.

---

## Further reading

- [Sitecore Marketplace SDK – Extension Points](https://doc.sitecore.com/mp/en/developers/sdk/latest/sitecore-marketplace-sdk/sitecore-marketplace-sdk-for-javascript.html) – Official extension point docs
- [05 – Register App](./05-register-app.md) – How to configure these in Developer Studio

---

[Next: Register in XM Cloud](./05-register-app.md) | [Back to index](./README.md)
