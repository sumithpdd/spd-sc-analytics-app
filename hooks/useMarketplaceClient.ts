"use client";

import { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { XMC } from "@sitecore-marketplace-sdk/xmc";
import { useEffect, useState, useCallback, useRef } from "react";

export interface MarketplaceClientState {
  client: ClientSDK | null;
  error: Error | null;
  isLoading: boolean;
  isInitialized: boolean;
}

// Singleton to avoid re-initialization
let clientInstance: ClientSDK | undefined = undefined;

async function initializeClient(): Promise<ClientSDK> {
  if (clientInstance) return clientInstance;

  // SDK v0.3+ uses ClientSDK.init() - the old new ClientSDK() + client.init() API was deprecated
  // See: https://doc.sitecore.com/mp/en/developers/sdk/latest/sitecore-marketplace-sdk/quick-start--manual-.html
  clientInstance = await ClientSDK.init({
    target: window.parent,
    modules: [XMC],
  });
  return clientInstance;
}

export function useMarketplaceClient(): MarketplaceClientState {
  const [state, setState] = useState<MarketplaceClientState>({
    client: clientInstance || null,
    error: null,
    isLoading: !clientInstance,
    isInitialized: !!clientInstance,
  });

  const isInitializing = useRef(false);

  const initialize = useCallback(async () => {
    if (isInitializing.current || clientInstance) return;

    isInitializing.current = true;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const client = await initializeClient();
      setState({
        client,
        error: null,
        isLoading: false,
        isInitialized: true,
      });
      console.log("Marketplace SDK initialized");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("SDK initialization failed:", err);
      setState({
        client: null,
        error: err,
        isLoading: false,
        isInitialized: false,
      });
    } finally {
      isInitializing.current = false;
    }
  }, []);

  useEffect(() => {
    if (!clientInstance && !isInitializing.current) {
      initialize();
    }
  }, [initialize]);

  return state;
}