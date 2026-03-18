"use client";

/**
 * Dashboard widget – sample approval stats.
 * Uses mock data; replace with real workflow API when available.
 */
import { useMarketplaceClient } from "@/hooks/useMarketplaceClient";
import { useEffect, useState } from "react";

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
}

export default function ApprovalWidget() {
  const { client, isInitialized } = useMarketplaceClient();
  const [stats, setStats] = useState<ApprovalStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (!isInitialized || !client) return;

    async function fetchApprovals() {
      // In production, fetch from workflow API
      setStats({
        pending: 8,
        approved: 45,
        rejected: 2,
      });
    }

    fetchApprovals();
    
    // Refresh every minute
    const interval = setInterval(fetchApprovals, 60000);
    return () => clearInterval(interval);
  }, [client, isInitialized]);

  return (
    <div className="p-4 bg-white rounded-lg h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Content Approvals
        </h3>
        <span className="text-2xl">📋</span>
      </div>
      
      <div className="space-y-3">
        <ApprovalRow
          label="Pending Review"
          count={stats.pending}
          color="orange"
          pulse={stats.pending > 0}
        />
        <ApprovalRow
          label="Approved Today"
          count={stats.approved}
          color="green"
        />
        <ApprovalRow
          label="Rejected"
          count={stats.rejected}
          color="red"
        />
      </div>
      
      <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
        View All Workflows
      </button>
    </div>
  );
}

function ApprovalRow({
  label,
  count,
  color,
  pulse,
}: {
  label: string;
  count: number;
  color: "orange" | "green" | "red";
  pulse?: boolean;
}) {
  const colors: Record<string, string> = {
    orange: "bg-orange-100 text-orange-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`
        px-3 py-1 rounded-full text-sm font-semibold
        ${colors[color]}
        ${pulse ? 'animate-pulse' : ''}
      `}>
        {count}
      </span>
    </div>
  );
}