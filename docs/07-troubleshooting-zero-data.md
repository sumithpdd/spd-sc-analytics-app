# 07 – Troubleshooting: Zero Data

If your app shows **Total Items = 0** or stats fail to load, this guide explains the causes and how to fix them.

---

## Current approach: server-side Authoring API

The **Content Analytics** (Total Items, Updated Today) in the Pages Context Panel now uses `/api/content-stats`, which calls the Sitecore Authoring GraphQL API with OAuth2. It does **not** require Content/Preview API access in Developer Studio. It uses the same credentials as the Word import (see [08 – Word Import](./08-word-import.md)).

Stats show the article count in the Articles folder (`ARTICLES_FOLDER_ID` in `.env.local`).

---

## Why you might see zero data

1. **Missing credentials** – `SITECORE_CLIENT_ID`, `SITECORE_CLIENT_SECRET`, or `ARTICLES_FOLDER_ID` not set in `.env.local`.
2. **Wrong Articles folder ID** – The GUID in `ARTICLES_FOLDER_ID` doesn't match your Articles folder.

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

## Fix 2: Configure credentials

**Problem:** Stats fail with "Missing SITECORE_CLIENT_ID", "Auth token request failed", or "ARTICLES_FOLDER_ID not configured".

**Solution:** Ensure `.env.local` has the same values as for the Word import:

- `SITECORE_CLIENT_ID` and `SITECORE_CLIENT_SECRET` from XM Cloud Deploy → Credentials → Automation
- `XMC_HOST` – your CM hostname
- `ARTICLES_FOLDER_ID` – Item ID of the Articles folder (Content Editor → Articles item → Quick Info)

Restart the dev server after changing `.env.local`. See [08 – Word Import](./08-word-import.md) for full setup.

---

## Verifying the setup

1. **Check credentials** – Ensure `.env.local` has `SITECORE_CLIENT_ID`, `SITECORE_CLIENT_SECRET`, `XMC_HOST`, and `ARTICLES_FOLDER_ID`.
2. **Test the API** – Open `http://localhost:3000/api/content-stats` in your browser. You should see `{"totalItems":N,"updatedToday":0}`.
3. **Check context** – In the Pages Context Panel, the site name and path come from `pages.context` (SDK). Stats come from the server-side API.

---

## Further reading

- [04 – Extension Points](./04-extension-points.md) – When each extension has context
- [05 – Register App](./05-register-app.md) – App registration
- [08 – Word Import](./08-word-import.md) – Credentials setup (same as content stats)

---

[Back to index](./README.md)
