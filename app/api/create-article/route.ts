/**
 * POST /api/create-article
 *
 * Server-side route that creates an ArticlePage in XM Cloud using the
 * Sitecore Authoring and Management GraphQL API with OAuth2 client credentials.
 *
 * Auth flow:
 *   1. POST https://auth.sitecorecloud.io/oauth/token  →  Bearer JWT (24h)
 *   2. POST https://{XMC_HOST}/sitecore/api/authoring/graphql/v1/  →  GraphQL
 *
 * Required environment variables – set in .env.local:
 *   SITECORE_CLIENT_ID      XM Cloud Deploy → Credentials → Environment → Automation client ID
 *   SITECORE_CLIENT_SECRET  XM Cloud Deploy → Credentials → Environment → Automation client secret
 *   XMC_HOST                CM hostname, e.g. xmcloudcm.localhost  or  <env>.sitecorecloud.io
 */

import { NextRequest, NextResponse } from "next/server";
import type { ArticleData } from "@/lib/article-document-processor";
import { TEMPLATES, ITEMS, FIELDS } from "@/lib/sitecore-constants";
import { getBearerToken, authoringGql } from "@/lib/authoring-api";

// ---------------------------------------------------------------------------
// Author resolution – find existing or create new Author item
// ---------------------------------------------------------------------------

/** Normalise a name for comparison: lowercase, trim, collapse spaces */
function normaliseName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Normalise a Sitecore GUID to the canonical {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX} format.
 * Handles compact GUIDs returned by the Authoring API (no hyphens, no braces).
 */
function normalizeGuid(id: string): string {
  const clean = id.replace(/[{}\-]/g, "");
  if (clean.length !== 32) return id; // not a GUID – return as-is
  const h = clean.toUpperCase();
  return `{${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}}`;
}

/**
 * Resolve the Author item template ID using three strategies (in order):
 *   1. AUTHOR_ITEM_TEMPLATE_ID environment variable (explicit override)
 *   2. Template ID copied from an existing Author sibling in the folder
 *   3. Known template ID from sitecore-constants.ts
 */
function getAuthorTemplateId(
  existingChildren: Array<{ templateId: string }>
): string {
  const fromEnv = process.env.AUTHOR_ITEM_TEMPLATE_ID?.trim();
  if (fromEnv) return normalizeGuid(fromEnv);

  if (existingChildren.length > 0) {
    return normalizeGuid(existingChildren[0].templateId);
  }

  return TEMPLATES.Author;
}

/**
 * Returns the Author item GUID (with braces) for the given display name.
 * Searches existing children of the Authors folder first (case-insensitive).
 * Creates a new Author item if no match is found.
 * Returns null only if the template ID cannot be determined.
 */
async function resolveOrCreateAuthor(
  token: string,
  authorName: string
): Promise<string | null> {
  // Author names from documents often include role: "Paul Inman // Partner"
  // Use only the part before " // " as the actual person's name
  const name = authorName.split("//")[0].trim();
  if (!name) return null;

  // Derive the Sitecore item name the same way we would when creating
  const safeName = name
    .replace(/[/\\?*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 100)
    .trim();

  // ── 1. List children of Authors folder (templateId used when creating first author) ─
  type ChildNode = { itemId: string; name: string; templateId?: string };

  async function fetchAuthorChildren(): Promise<ChildNode[]> {
    const r = await authoringGql<Record<string, unknown>>(
      token,
      `query ListAuthors($itemId: ID!) {
        item(where: { database: "master", itemId: $itemId }) {
          children(first: 500) {
            nodes { itemId name templateId }
          }
        }
      }`,
      { itemId: ITEMS.AuthorsFolder.id }
    );
    const data = r.data as { item?: { children?: { nodes: ChildNode[] } } } | undefined;
    return data?.item?.children?.nodes ?? [];
  }

  const needle = normaliseName(name);
  function findInList(list: ChildNode[]): ChildNode | undefined {
    return list.find(
      (c) =>
        normaliseName(c.name) === needle ||
        normaliseName(c.name.replace(/-/g, " ")) === needle
    );
  }

  const children = await fetchAuthorChildren();
  const existing = findInList(children);
  if (existing) return normalizeGuid(existing.itemId);

  // ── 2. Get Author template ID (from env, existing authors, or constants) ───
  const authorTemplateId = getAuthorTemplateId(
    children
      .filter((c): c is ChildNode & { templateId: string } => !!c.templateId)
      .map((c) => ({ templateId: c.templateId }))
  );

  // ── 3. Create new Author item ─────────────────────────────────────────────
  const createResult = await authoringGql<{
    createItem?: { item?: { itemId: string } };
  }>(
    token,
    `mutation CreateAuthor($parent: ID!, $name: String!, $templateId: ID!, $authorName: String!) {
      createItem(input: {
        parent: $parent
        name: $name
        templateId: $templateId
        fields: [{ name: "${FIELDS.Author.AuthorName}", value: $authorName }]
      }) {
        item { itemId name path }
      }
    }`,
    {
      parent: ITEMS.AuthorsFolder.idWithBraces,
      name: safeName,
      templateId: authorTemplateId,
      authorName: name,
    }
  );

  // ── 4. "Already exists" fallback – re-query children ─────────────────────
  const alreadyExists = createResult.errors?.some((e) =>
    e.message.toLowerCase().includes("already defined")
  );
  if (alreadyExists) {
    const refreshed = await fetchAuthorChildren();
    const found = findInList(refreshed);
    if (found) return normalizeGuid(found.itemId);
    return null;
  }

  if (createResult.errors?.length) {
    return null;
  }

  const newId = createResult.data?.createItem?.item?.itemId;
  return newId ? normalizeGuid(newId) : null;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { article } = (await req.json()) as { article: ArticleData };

    if (!article?.title?.trim()) {
      return NextResponse.json(
        { error: "Article title is required" },
        { status: 400 }
      );
    }

    const token = await getBearerToken();

    // Resolve or create the Author reference item
    const authorId = article.author?.trim()
      ? await resolveOrCreateAuthor(token, article.author)
      : null;

    const itemName =
      article.title
        .replace(/[/\\?*:|"<>]/g, "-")
        .replace(/\s+/g, " ")
        .slice(0, 100)
        .trim() || "Untitled Article";

    // ── Step 1: Create the article (without the Author reference field) ──────
    // createItem does not support setting reference (Lookup/Droptree) fields.
    // We set the Author field separately via updateItem after creation.
    // parent and templateId are inlined as string literals (matching the docs pattern).
    // Only field values that contain user content use variables.
    // parent must be the item GUID (Authoring API does not accept path strings).
    // Use ARTICLES_FOLDER_ID env var or the id from sitecore-constants.ts.
    const articlesFolderId = (
      process.env.ARTICLES_FOLDER_ID ?? ITEMS.ArticlesFolder.id
    ).replace(/[{}]/g, "");

    if (!articlesFolderId) {
      return NextResponse.json(
        {
          error:
            "ARTICLES_FOLDER_ID is not set. Add it to .env.local – find the value in " +
            "Content Editor → /sitecore/content/industry-verticals/legal/Home/Articles " +
            "→ Home ribbon → Quick Info → Item ID (no braces).",
        },
        { status: 500 }
      );
    }

    const createResult = await authoringGql<{
      createItem?: { item?: { itemId: string; name: string; path: string } };
    }>(
      token,
      `mutation CreateArticle($name: String!, $title: String!, $date: String!, $content: String!) {
          createItem(input: {
            parent: "${articlesFolderId}"
            name: $name
            templateId: "${TEMPLATES.ArticlePage}"
            fields: [
              { name: "${FIELDS.ArticlePage.Title}",         value: $title }
              { name: "${FIELDS.ArticlePage.PublishedDate}", value: $date }
              { name: "${FIELDS.ArticlePage.Content}",       value: $content }
            ]
          }) {
            item { itemId name path }
          }
        }`,
      {
        name: itemName,
        title: article.title,
        date: parseDateForSitecore(article.date),
        content: formatContentAsHtml(article.content),
      }
    );

    if (createResult.errors?.length) {
      return NextResponse.json(
        { error: createResult.errors.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const item = createResult.data?.createItem?.item;
    if (!item?.itemId) {
      return NextResponse.json(
        { error: `No item returned. Response: ${JSON.stringify(createResult).slice(0, 300)}` },
        { status: 500 }
      );
    }

    // ── Step 2: Set the Author reference field via updateItem ─────────────────
    // updateItem supports reference fields; value must be the GUID with braces.
    if (authorId) {
      const updateResult = await authoringGql<{
        updateItem?: { item?: { itemId: string } };
      }>(
        token,
        `mutation SetAuthor($itemId: ID!, $author: String!) {
          updateItem(input: {
            itemId: $itemId
            language: "en"
            version: 1
            fields: [{ name: "${FIELDS.ArticlePage.Author}", value: $author }]
          }) {
            item { itemId }
          }
        }`,
        {
          // updateItem itemId: raw GUID without braces
          itemId: normalizeGuid(item.itemId).replace(/[{}]/g, ""),
          // Author reference field value: GUID with braces
          author: authorId,
        }
      );

      if (updateResult.errors?.length) {
        console.warn("[create-article] updateItem author errors:", updateResult.errors.map((e) => e.message).join("; "));
      }
    }

    return NextResponse.json({
      itemId: item.itemId,
      path: item.path,
      authorCreated: !!authorId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Parse extracted date to ISO YYYY-MM-DD; fallback to today if empty or unparseable */
function parseDateForSitecore(raw: string | undefined): string {
  const s = raw?.trim();
  if (!s) return new Date().toISOString().slice(0, 10);

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function formatContentAsHtml(content: string): string {
  if (!content?.trim()) return "";
  const html = content
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map((p) => {
      const t = p.trim();
      return t.length < 80 && !t.endsWith(".")
        ? `<h3>${esc(t)}</h3>`
        : `<p>${esc(t)}</p>`;
    })
    .join("\n");
  return `<div class="ck-content">${html}</div>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
