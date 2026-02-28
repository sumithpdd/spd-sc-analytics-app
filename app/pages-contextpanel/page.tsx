"use client";

/**
 * Pages Context Panel extension - runs inside the Pages editor.
 * Gets site context (collectionId, siteInfo) for GraphQL queries.
 * Register in Developer Studio with deployment URL: /pages-contextpanel
 */
import { useMarketplaceClient } from "@/hooks/useMarketplaceClient";
import { getContentRootFromPagePath, searchByContentRoot } from "@/lib/xmcClient";
import type { PagesContext } from "@sitecore-marketplace-sdk/client";
import { useEffect, useState } from "react";

interface ContentStats {
  totalItems: number;
  publishedToday: number;
  lastUpdated: Date;
}

export default function PagesContextPanel() {
  const { client, error, isInitialized, isLoading } = useMarketplaceClient();
  const [pagesContext, setPagesContext] = useState<PagesContext | null>(null);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Subscribe to pages.context (site + page info) - only available in Pages editor
  useEffect(() => {
    if (!isInitialized || !client) return;
    const c = client;

    c.query("pages.context", {
      subscribe: true,
      onSuccess: (data) => setPagesContext((data as PagesContext) ?? null),
    })
      .then((res) => setPagesContext((res.data as PagesContext) ?? null))
      .catch((err) => console.error("pages.context error:", err));
  }, [client, isInitialized]);

  // Fetch stats when we have site context (collectionId = sitecoreContextId)
  useEffect(() => {
    if (!client || !pagesContext?.siteInfo?.collectionId) return;
    const c = client;
    const collectionId = pagesContext.siteInfo.collectionId;
    const siteName = pagesContext.siteInfo.name ?? "content";
    const pagePath = pagesContext.pageInfo?.path;

    async function fetchStats() {
      setLoadError(null);
      try {
        // Derive content root from current page path (e.g. /sitecore/content/industry-verticals/visitlondon/Home)
        const contentRootPath = getContentRootFromPagePath(pagePath) ?? `/sitecore/content/${siteName}/Home`;

        // Search requires _path as GUID - searchByContentRoot gets item by path first, then searches by its ID
        const { total, results: items } = await searchByContentRoot(c, contentRootPath, collectionId);

        if (total === 0) {
          setLoadError(
            `No content found at ${contentRootPath}. Ensure Content/Preview API access is enabled in Developer Studio.`
          );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const publishedToday = items.filter((item) => {
          const d = item.updated ? new Date(item.updated) : new Date(0);
          return d >= today;
        }).length;

        setStats({
          totalItems: total,
          publishedToday,
          lastUpdated: new Date(),
        });
      } catch (err) {
        console.error("GraphQL error:", err);
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    }

    void fetchStats();
  }, [client, pagesContext?.siteInfo?.collectionId, pagesContext?.siteInfo?.name, pagesContext?.pageInfo?.path]);

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-gray-600">Initializing...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">Error: {error.message}</div>
    );
  }

  if (!pagesContext?.siteInfo) {
    return (
      <div className="p-4 text-sm text-gray-600">
        No site context yet. Open a page in the Pages editor.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Content Analytics</h3>
        <p className="text-xs text-gray-500 mt-1">
          Site: {pagesContext.siteInfo.displayName ?? pagesContext.siteInfo.name}
        </p>
        {(pagesContext.siteInfo.startItemId || pagesContext.pageInfo?.path) && (
          <p className="text-xs text-gray-400 mt-0.5 break-all">
            {pagesContext.pageInfo?.path
              ? `Path: ${pagesContext.pageInfo.path}`
              : `Start: ${pagesContext.siteInfo.startItemId}`}
          </p>
        )}
      </div>

      {loadError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{loadError}</div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500">Total Items</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalItems.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500">Updated Today</p>
            <p className="text-lg font-bold text-gray-900">{stats.publishedToday}</p>
          </div>
          <p className="text-xs text-gray-400 col-span-2">
            Updated {stats.lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
