# 03 – SDK Setup

This guide explains how to initialize the Sitecore Marketplace SDK and use it in your React components. The SDK is the bridge between your app and the Cloud Portal.

---

## Why we need a hook

The SDK must be initialized **once** when the app loads. Multiple components (e.g. standalone page, dashboard widget) may need the client. A React hook lets us:

1. Initialize the SDK in one place
2. Share the client instance across components
3. Handle loading and error states

We use a **singleton** pattern so the client is created only once, even if the hook is used in several components.

---

## SDK initialization (v0.3+)

The Marketplace SDK changed in v0.3. The old pattern was:

```typescript
// OLD - deprecated
const client = new ClientSDK();
await client.init();
```

The **current** pattern is:

```typescript
// NEW - use ClientSDK.init()
const client = await ClientSDK.init({
  target: window.parent,
  modules: [XMC],
});
```

- **`target: window.parent`** – The app runs in an iframe. `window.parent` is the Portal's window. The SDK uses it for postMessage communication.
- **`modules: [XMC]`** – XMC adds XM Cloud features (e.g. GraphQL). Without it, `client.mutate("xmc.preview.graphql", ...)` would not work.

See the [SDK Quick Start (Manual)](https://doc.sitecore.com/mp/en/developers/sdk/latest/sitecore-marketplace-sdk/quick-start--manual-.html) for the official initialization docs.

---

## The useMarketplaceClient hook

Create `hooks/useMarketplaceClient.ts` with logic like this:

```typescript
import { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { XMC } from "@sitecore-marketplace-sdk/xmc";

let clientInstance: ClientSDK | undefined = undefined;

async function initializeClient(): Promise<ClientSDK> {
  if (clientInstance) return clientInstance;
  clientInstance = await ClientSDK.init({
    target: window.parent,
    modules: [XMC],
  });
  return clientInstance;
}

export function useMarketplaceClient() {
  const [client, setClient] = useState<ClientSDK | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!clientInstance);
  const [isInitialized, setIsInitialized] = useState(!!clientInstance);

  useEffect(() => {
    if (clientInstance) {
      setClient(clientInstance);
      return;
    }
    initializeClient()
      .then((c) => {
        setClient(c);
        setIsLoading(false);
        setIsInitialized(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
  }, []);

  return { client, error, isLoading, isInitialized };
}
```

The actual implementation in this repo includes a ref to avoid duplicate initialization. The idea is the same: one shared client, loading/error state, and a singleton.

---

## Using the hook in a page

In any page component:

```typescript
const { client, error, isLoading, isInitialized } = useMarketplaceClient();

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!client) return null;

// Now use client.query(), client.mutate(), client.getValue(), etc.
```

- **`client`** – The SDK client. Use it for `query`, `mutate`, `getValue`, `setValue`, etc.
- **`error`** – Set if initialization fails (e.g. app opened outside the Portal).
- **`isLoading`** – True until the client is ready.
- **`isInitialized`** – True when the client is ready to use.

---

## Common SDK operations

| Operation | Use case | Example |
|-----------|----------|---------|
| `client.query("pages.context", ...)` | Get site/page context (Pages editor) | [Pages Context Panel](../app/pages-contextpanel/page.tsx) |
| `client.mutate("xmc.preview.graphql", ...)` | Run GraphQL against XM Cloud | [xmcClient.ts](../lib/xmcClient.ts) |
| `client.getValue()` | Read custom field value | [Custom Field](../app/custom-field/page.tsx) |
| `client.setValue(value)` | Write custom field value | [Custom Field](../app/custom-field/page.tsx) |

The [Marketplace SDK for JavaScript](https://doc.sitecore.com/mp/en/developers/sdk/latest/sitecore-marketplace-sdk/sitecore-marketplace-sdk-for-javascript.html) docs list all available queries and mutations.

---

## Next steps

- [04 – Extension Points](./04-extension-points.md) – What each extension does and when it runs
- [Back to index](./README.md)
