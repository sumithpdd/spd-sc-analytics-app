"use client";

/**
 * Pages Context Panel extension - runs inside the Pages editor.
 * Uses server-side /api/content-stats (Authoring API) for analytics – no Preview API needed.
 * Register in Developer Studio with deployment URL: /pages-contextpanel
 */
import { useMarketplaceClient } from "@/hooks/useMarketplaceClient";
import { ArticleUploader } from "@/components/ArticleUploader";
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
    client
      .query("pages.context", {
        subscribe: true,
        onSuccess: (data) => setPagesContext((data as PagesContext) ?? null),
      })
      .then((res) => setPagesContext((res.data as PagesContext) ?? null))
      .catch((err) => console.error("pages.context error:", err));
  }, [client, isInitialized]);

  // Fetch stats from server-side API (Authoring API – no Preview API / Developer Studio access needed)
  useEffect(() => {
    async function fetchStats() {
      setLoadError(null);
      try {
        const res = await fetch("/api/content-stats");
        const data = (await res.json()) as {
          totalItems?: number;
          updatedToday?: number;
          error?: string;
        };

        if (!res.ok || data.error) {
          setLoadError(data.error ?? `Failed to load stats (${res.status})`);
          return;
        }

        setStats({
          totalItems: data.totalItems ?? 0,
          publishedToday: data.updatedToday ?? 0,
          lastUpdated: new Date(),
        });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    }

    void fetchStats();
  }, []);

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

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900">Content Analytics</h3>
        <p className="text-xs text-gray-500 mt-1">
          {pagesContext?.siteInfo
            ? `Site: ${pagesContext.siteInfo.displayName ?? pagesContext.siteInfo.name}`
            : "Articles (legal)"}
        </p>
        {pagesContext?.pageInfo?.path && (
          <p className="text-xs text-gray-400 mt-0.5 break-all">
            Path: {pagesContext.pageInfo.path}
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

      <div className="border-t border-gray-200 pt-4">
        <ArticleUploader />
      </div>
    </div>
  );
}
