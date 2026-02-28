"use client";

import { useMarketplaceClient } from "@/hooks/useMarketplaceClient";
import { ApplicationContext } from "@sitecore-marketplace-sdk/client";
import { useEffect, useState } from "react";
import { getContentRootFromPagePath, searchByContentRoot } from "@/lib/xmcClient";

interface ContentStats {
  totalItems: number;
  publishedToday: number;
  draftItems: number;
  scheduledPublishing: number;
  lastUpdated: Date;
}

interface ActivityItem {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
}

export default function AnalyticsDashboard() {
  const { client, error, isInitialized, isLoading } = useMarketplaceClient();
  const [appContext, setAppContext] = useState<ApplicationContext | null>(null);
  const [siteContext, setSiteContext] = useState<{
    collectionId?: string;
    siteName?: string;
    pagePath?: string;
  } | null>(null);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Fetch application context
  useEffect(() => {
    if (!isInitialized || !client) return;
    const c = client;

    async function fetchContext() {
      try {
        const response = await c.query("application.context");
        setAppContext(response.data ?? null);
      } catch (err) {
        console.error("Failed to fetch context:", err);
      }
    }

    void fetchContext();
  }, [client, isInitialized]);

  // Get site context from pages.context (only available when app runs in Pages editor)
  useEffect(() => {
    if (!isInitialized || !client) return;
    const c = client;

    c.query("pages.context", {
      subscribe: true,
      onSuccess: (data: unknown) => {
        const pc = data as { siteInfo?: { collectionId?: string; name?: string; startItemId?: string }; pageInfo?: { path?: string } };
        if (pc?.siteInfo || pc?.pageInfo) {
          setSiteContext({
            collectionId: pc.siteInfo?.collectionId,
            siteName: pc.siteInfo?.name,
            pagePath: pc.pageInfo?.path,
          });
        }
      },
    })
      .then((res) => {
        const pc = res.data as { siteInfo?: { collectionId?: string; name?: string; startItemId?: string }; pageInfo?: { path?: string } } | undefined;
        if (pc?.siteInfo || pc?.pageInfo) {
          setSiteContext({
            collectionId: pc.siteInfo?.collectionId,
            siteName: pc.siteInfo?.name,
            pagePath: pc.pageInfo?.path,
          });
        }
      })
      .catch(() => {});
  }, [client, isInitialized]);

  // Fetch content statistics
  useEffect(() => {
    if (!appContext || !client) return;

    void fetchStats();

    const interval = setInterval(() => void fetchStats(), 30000);
    return () => clearInterval(interval);
  }, [appContext, client, siteContext?.collectionId, siteContext?.siteName, siteContext?.pagePath]);

  async function fetchStats() {
    if (!client) return;

    setRefreshing(true);
    setDataError(null);

    try {
      // sitecoreContextId scopes the query to a site - required for multi-site. Get from pages.context.
      const sitecoreContextId = siteContext?.collectionId;
      const siteName = siteContext?.siteName ?? "visitlondon";
      const pagePath = siteContext?.pagePath;

      // Derive content root from current page path (e.g. /sitecore/content/industry-verticals/visitlondon/Home)
      const contentRootPath =
        getContentRootFromPagePath(pagePath) ?? `/sitecore/content/industry-verticals/${siteName}/Home`;

      // Search requires _path as GUID - searchByContentRoot gets item by path first, then searches by its ID
      let items: Array<{ id: string; name: string; updated?: string; url?: { path?: string } }> = [];
      let total = 0;
      let fetchError: string | null = null;

      try {
        const result = await searchByContentRoot(client, contentRootPath, sitecoreContextId);
        items = result.results;
        total = result.total;
        if (total > 0) {
          setDataError(null);
        } else {
          fetchError =
            !sitecoreContextId
              ? "No site context. Use the Pages Context Panel from the Pages editor for site-specific data."
              : `No content at ${contentRootPath}. Ensure Content/Preview API access is enabled in Developer Studio.`;
        }
      } catch (err) {
        fetchError = err instanceof Error ? err.message : String(err);
      }

      if (fetchError) setDataError(fetchError);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const publishedToday = items.filter((item) => {
        const updateDate = item.updated ? new Date(item.updated) : new Date(0);
        return updateDate >= today;
      }).length;

      setStats({
        totalItems: total,
        publishedToday,
        draftItems: 0,
        scheduledPublishing: 0,
        lastUpdated: new Date(),
      });

      const recentItems = items.slice(0, 5).map((item) => ({
        id: item.id,
        action: "Updated",
        user: "Content Editor",
        timestamp: new Date(item.updated ?? Date.now()),
      }));

      setActivity(recentItems);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setDataError(err instanceof Error ? err.message : String(err));
      setStats({
        totalItems: 0,
        publishedToday: 0,
        draftItems: 0,
        scheduledPublishing: 0,
        lastUpdated: new Date(),
      });
    } finally {
      setRefreshing(false);
    }
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with refresh */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Content Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              {appContext?.organization?.name || "Your Organization"}
            </p>
          </div>
          
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshIcon className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {dataError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            {dataError}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Items"
                value={stats.totalItems.toLocaleString()}
                icon="📊"
                trend="+12%"
                trendUp={true}
              />
              <StatCard
                title="Published Today"
                value={stats.publishedToday.toString()}
                icon="✅"
                trend="+5"
                trendUp={true}
              />
              <StatCard
                title="Draft Items"
                value={stats.draftItems.toString()}
                icon="📝"
                trend="-3"
                trendUp={false}
              />
              <StatCard
                title="Scheduled"
                value={stats.scheduledPublishing.toString()}
                icon="⏰"
                trend="→"
                trendUp={null}
              />
            </div>

            <p className="text-sm text-gray-500 mb-8">
              Last updated: {stats.lastUpdated.toLocaleTimeString()}
            </p>
          </>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {activity.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.action}</p>
                  <p className="text-sm text-gray-500">by {item.user}</p>
                </div>
                <p className="text-sm text-gray-500">
                  {formatTimeAgo(item.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function StatCard({ title, value, icon, trend, trendUp }: any) {
  const trendColor = trendUp === true ? "text-green-600" : 
                     trendUp === false ? "text-red-600" : "text-gray-600";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span className={`text-sm font-medium ${trendColor}`}>
          {trend}
        </span>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <h2 className="text-red-800 font-semibold text-lg mb-2">
          ⚠️ Error Loading Dashboard
        </h2>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    </div>
  );
}