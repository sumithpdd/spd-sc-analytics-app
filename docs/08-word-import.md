# 08 – Word Document Import

Upload a Word document to create **ArticlePage** items in Sitecore. The importer extracts title, date, content, and author from your document and calls the Sitecore Authoring GraphQL API from a server-side route.

---

## Where to use it

- **Pages Context Panel** – The uploader appears in the Pages editor context panel, below Content Analytics.
- **Standalone route** – `/import-doc` can be registered as a Standalone extension in Developer Studio.

---

## Our approach: server-side OAuth2

We use a **server-side API route** instead of the Marketplace SDK for article creation because:

1. **Reference fields** – The Author field is a Sitecore reference (Lookup/Droptree). The Authoring API handles reference fields via `updateItem`; the SDK's context is tied to the Pages editor.
2. **Automation credentials** – Server-side calls need their own OAuth2 client. We use an **Automation client** from XM Cloud Deploy, which provides a Client ID and Client Secret for machine-to-machine auth.
3. **Reliability** – The route gets a Bearer token from Sitecore's OAuth endpoint, caches it, and calls the Authoring GraphQL API directly. No dependency on the user's browser session.

### Auth flow

```
1. POST https://auth.sitecorecloud.io/oauth/token
   Body: grant_type=client_credentials, client_id=..., client_secret=..., audience=https://api.sitecorecloud.io
   → Returns: access_token (JWT, ~24h validity)

2. POST https://{XMC_HOST}/sitecore/api/authoring/graphql/v1/
   Header: Authorization: Bearer <access_token>
   Body: GraphQL mutation (createItem, updateItem)
   → Creates article, then sets Author reference via updateItem
```

---

## Prerequisites – one-time setup

### 1. Create an Automation client in XM Cloud Deploy

The Client ID and Client Secret come from **XM Cloud Deploy**, not Developer Studio.

1. Open [XM Cloud Deploy](https://deploy.sitecorecloud.io)
2. Select your **Project** → your **Environment**
3. In the sidebar, click **Credentials**
4. Click **Create credentials** → **Automation**
5. Enter a name (e.g. `spd-marketplace-app`) and click **Create**
6. **Copy the Client ID and Client Secret immediately** – the secret is shown only once. Store them securely.

### 2. Get the Articles folder Item ID

The Authoring API requires a **GUID** for the `createItem` parent field – it does not accept path strings.

1. Open **Content Editor**
2. Navigate to: `/sitecore/content/industry-verticals/legal/Home/Articles`
3. Select the **Articles** item
4. In the ribbon: **Home** → **Edit** → **Quick Info**
5. Copy the **Item ID** (e.g. `E8FA98B3-1F51-4B5B-B39B-27F822E1D991`). Use it **without** the curly braces.

### 3. Set environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
SITECORE_CLIENT_ID=<Client ID from step 1>
SITECORE_CLIENT_SECRET=<Client Secret from step 1>
XMC_HOST=<your CM hostname, e.g. xmc-xxx.sitecorecloud.io>
ARTICLES_FOLDER_ID=<Item ID from step 2, no braces>
```

Find `XMC_HOST` in XM Cloud Deploy → your Environment → the CM URL on the overview page. Use only the hostname (no `https://` or trailing slash).

### 4. Restart the dev server

```bash
# Stop the server (Ctrl+C), then:
npm run dev
```

Next.js reads `.env.local` only at startup.

---

## Word document format

| Order | Content | Maps to field |
|-------|---------|---------------|
| 1 | First line (Heading 1) | **Title** |
| 2 | Second line (subtitle / date) | **PublishedDate** |
| 3+ | Normal text paragraphs | **Content** |
| Last section | "Author" heading, then name + role | **Author** |

Supported date formats: `17 March 2026`, `March 17, 2026`, `17/03/2026`, `2026-03-17`. If no date is found, today's date is used.

---

## How it works

1. **Upload** – User selects a `.docx` (or `.docm`, `.dotm`) file.
2. **Parse** – `lib/document-processor.ts` reads `word/document.xml` from the OOXML ZIP and extracts paragraphs in document order.
3. **Transform** – `lib/article-document-processor.ts` maps paragraphs to title, date, content, author.
4. **API route** – Browser sends extracted data to `POST /api/create-article`.
5. **Auth** – Route obtains a Bearer JWT from `https://auth.sitecorecloud.io/oauth/token` using the automation client credentials (cached for 24h).
6. **Create article** – Route calls `createItem` with parent GUID, template ID, and fields (Title, PublishedDate, Content).
7. **Set author** – If an author was extracted, the route looks up or creates an Author item in `/sitecore/content/industry-verticals/legal/Data/Authors`, then uses `updateItem` to set the Author reference field.

---

## Customizing

### Field names and IDs

Edit `lib/sitecore-constants.ts`:

- `TEMPLATES.ArticlePage` – Article template ID
- `TEMPLATES.Author` – Author item template ID
- `ITEMS.ArticlesFolder` – Parent folder ID and path
- `ITEMS.AuthorsFolder` – Authors folder ID and path
- `FIELDS.ArticlePage` – Field names (Title, PublishedDate, Content, Author, etc.)

### Environment overrides

- `ARTICLES_FOLDER_ID` – Override the Articles folder GUID (required if different from constants)
- `AUTHOR_ITEM_TEMPLATE_ID` – Override the Author template ID

---

## File structure

| Path | Purpose |
|------|---------|
| `app/api/create-article/route.ts` | Server-side route – OAuth2 + GraphQL mutations |
| `components/ArticleUploader.tsx` | Upload UI, preview extraction |
| `lib/article-document-processor.ts` | Maps raw rows → title / date / content / author |
| `lib/document-processor.ts` | OOXML ZIP parser |
| `lib/sitecore-constants.ts` | Template IDs, item IDs, field names |
| `.env.local.example` | Template for required environment variables |

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Auth token request failed (401)` | Wrong or placeholder credentials | Create an Automation client in XM Cloud Deploy → Credentials and update `.env.local` |
| `Missing SITECORE_CLIENT_ID` | `.env.local` not created | Copy `.env.local.example` to `.env.local`, fill in values, restart dev server |
| `ARTICLES_FOLDER_ID is not set` | Missing folder GUID | Get Item ID from Content Editor (Articles item → Quick Info) and add to `.env.local` |
| `GraphQL request failed (404)` | Wrong `XMC_HOST` | Check CM hostname in XM Cloud Deploy → Environment overview |
| `Cannot find a field with the name X` | Field name mismatch | Update `FIELDS.ArticlePage` in `lib/sitecore-constants.ts` to match your template |
| `Could not extract title` | Document structure not recognised | Click **Preview extraction** to inspect parsed content. Ensure first line is a heading. |

---

[Back to index](./README.md)
