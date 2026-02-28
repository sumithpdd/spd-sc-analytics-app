/**
 * XM Cloud API helpers for the SDK.
 *
 * The XMC package is an SDKModule passed to ClientSDK.init() - the article's
 * "new XMC() + init()" pattern is outdated. Use client.mutate('xmc.preview.graphql', ...)
 * or client.query() for XMC operations.
 */

import type { ClientSDK } from "@sitecore-marketplace-sdk/client";

/**
 * Execute a GraphQL query against the XM Cloud Preview API.
 * Use client.mutate('xmc.preview.graphql', ...) - this helper wraps it for convenience.
 *
 * @param sitecoreContextId - Optional. The site/collection context ID. Required for multi-site
 *   setups. Get from pages.context.siteInfo.collectionId when running in Pages Context Panel.
 */
export async function executeGraphQL<T = Record<string, unknown>>(
  client: ClientSDK,
  query: string,
  variables?: Record<string, unknown>,
  sitecoreContextId?: string
): Promise<{ data?: T; errors?: Array<{ message?: string }> }> {
  // Params for xmc.preview.graphql (GraphqlData from xmc client-content)
  const params: { body: { query: string; variables?: Record<string, unknown> }; url: string; query?: { sitecoreContextId?: string } } = {
    body: { query, variables },
    url: "/graphql/v1",
  };
  if (sitecoreContextId) {
    params.query = { sitecoreContextId };
  }

  const response = await client.mutate("xmc.preview.graphql", { params });

  // Response shape: { data?: { data?, errors? }, ... }
  const result = response as { data?: { data?: T; errors?: Array<{ message?: string }> } };
  return {
    data: result?.data?.data,
    errors: result?.data?.errors,
  };
}

/**
 * Derive the content root path from the current page's path.
 * E.g. /sitecore/content/industry-verticals/visitlondon/Home/SomePage → /sitecore/content/industry-verticals/visitlondon/Home
 */
export function getContentRootFromPagePath(pagePath: string | undefined): string | null {
  if (!pagePath?.trim()) return null;
  const path = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 5) return null;
  // Structure: sitecore, content, [tenant], site, startItem, ...
  // Take first 5 segments: /sitecore/content/industry-verticals/visitlondon/Home
  return "/" + parts.slice(0, 5).join("/");
}

/**
 * Try to fetch a single item by path - useful to verify path format when search returns empty.
 */
export async function tryItemByPath(
  client: ClientSDK,
  path: string,
  sitecoreContextId?: string
): Promise<{ found: boolean; id?: string; name?: string }> {
  const query = `
    query GetItem($path: String!) {
      item(path: $path) {
        id
        name
      }
    }
  `;
  const res = await executeGraphQL<{ item?: { id: string; name: string } }>(
    client,
    query,
    { path },
    sitecoreContextId
  );
  const item = res.data?.item;
  return {
    found: !!item,
    id: item?.id,
    name: item?.name,
  };
}

/**
 * Search requires _path value as GUID, not path string. Get item by path first, then search by its ID.
 */
export async function searchByContentRoot(
  client: ClientSDK,
  contentRootPath: string,
  sitecoreContextId?: string
): Promise<{
  total: number;
  results: Array<{ id: string; name: string; updated?: string; url?: { path?: string } }>;
}> {
  // Step 1: Get the root item by path to obtain its GUID
  const itemRes = await tryItemByPath(client, contentRootPath, sitecoreContextId);
  const rootId = itemRes.id;
  if (!rootId) {
    return { total: 0, results: [] };
  }
  const guid = rootId.includes("{") ? rootId : `{${rootId}}`;

  // Step 2: Search using GUID - _path CONTAINS requires GUID, not path string
  const query = `
    query GetContentStats($path: String!) {
      search(
        where: {
          AND: [
            { name: "_path", value: $path, operator: CONTAINS }
          ]
        }
        first: 1000
      ) {
        total
        results {
          id
          name
          updated
          url { path }
        }
      }
    }
  `;
  const response = await executeGraphQL<{
    search?: { total?: number; results?: Array<{ id: string; name: string; updated?: string; url?: { path?: string } }> };
  }>(client, query, { path: guid }, sitecoreContextId);

  const searchData = response.data?.search;
  return {
    total: searchData?.total ?? 0,
    results: searchData?.results ?? [],
  };
}
