/**
 * Sitecore item IDs, template IDs, paths, and field names used across the app.
 *
 * GUID conventions used in this file:
 *   - TEMPLATES.*  use braces  {…}  – required by createItem templateId (ID type accepts both)
 *   - ITEMS.*.id   NO braces        – required by item(where: { itemId }) which expects raw GUID
 *   - ITEMS.*.path string paths     – used as createItem parent (accepts path strings)
 *
 * Update these values if you deploy to a different environment or site.
 */

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
export const TEMPLATES = {
  /** /sitecore/templates/Project/industry-verticals/Pages/ArticlePage */
  ArticlePage: "{412BF445-B1A6-4AFF-8054-0B21A1FEBC47}",

  /** /sitecore/templates/Project/industry-verticals/Custom Templates/Article/Authors/Author */
  Author: "{AE7C9FA3-F2CB-4A02-8781-789897E12044}",
} as const;

// ---------------------------------------------------------------------------
// Content items
// ---------------------------------------------------------------------------
export const ITEMS = {
  /**
   * Articles folder where new ArticlePage items are created.
   * Path: /sitecore/content/industry-verticals/legal/Home/Articles
   *
   * id  – raw GUID without braces, used as createItem parent (Authoring API requires GUID, not path).
   * Find it: Content Editor → Articles item → Home ribbon → Quick Info → Item ID
   * Set ARTICLES_FOLDER_ID in .env.local to override (no braces).
   */
  ArticlesFolder: {
    /** Raw GUID without braces – used as createItem parent */
    id: "E8FA98B3-1F51-4B5B-B39B-27F822E1D991",
    path: "/sitecore/content/industry-verticals/legal/Home/Articles",
  },

  /**
   * Authors folder where Author items are created/looked up.
   * Path: /sitecore/content/industry-verticals/legal/Data/Authors
   */
  AuthorsFolder: {
    /** Raw GUID without braces – used in item(where: { itemId }) queries */
    id: "4C19291D-21A9-42CE-A397-2CB7CD7AC39B",
    /** With braces – used as createItem parent */
    idWithBraces: "{4C19291D-21A9-42CE-A397-2CB7CD7AC39B}",
    path: "/sitecore/content/industry-verticals/legal/Data/Authors",
  },
} as const;

// ---------------------------------------------------------------------------
// Field names  (must match the template field names exactly)
// ---------------------------------------------------------------------------
export const FIELDS = {
  ArticlePage: {
    Title: "Title",
    ShortDescription: "ShortDescription",
    Content: "Content",
    Image: "Image",
    /** Date field – Sitecore date format: YYYYMMDD or ISO string */
    PublishedDate: "PublishedDate",
    /** Reference field – value must be the Author item GUID (with braces) */
    Author: "Author",
    ReadTime: "ReadTime",
    metadataTitle: "metadataTitle",
    metadataDescription: "metadataDescription",
  },
  Author: {
    /** The author's display name field (not "Title" – the template uses "AuthorName") */
    AuthorName: "AuthorName",
    About: "About",
    Avatar: "Avatar",
  },
} as const;
