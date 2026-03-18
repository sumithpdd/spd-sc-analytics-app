/**
 * Shared helpers for the Sitecore Authoring GraphQL API.
 * Used by /api/create-article and /api/content-stats.
 */

let tokenCache: { value: string; expiresAt: number } | null = null;

export async function getBearerToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.value;
  }

  const clientId = process.env.SITECORE_CLIENT_ID;
  const clientSecret = process.env.SITECORE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SITECORE_CLIENT_ID or SITECORE_CLIENT_SECRET in .env.local. " +
        "Create an Automation client in XM Cloud Deploy → Credentials → Environment."
    );
  }

  const res = await fetch("https://auth.sitecorecloud.io/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: "https://api.sitecorecloud.io",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Auth token request failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  tokenCache = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return tokenCache.value;
}

export async function authoringGql<T = Record<string, unknown>>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  const host = process.env.XMC_HOST;
  if (!host) {
    throw new Error(
      "Missing XMC_HOST in .env.local. " +
        "Set it to your CM hostname, e.g. xmcloudcm.localhost or <env>.sitecorecloud.io"
    );
  }

  const res = await fetch(
    `https://${host}/sitecore/api/authoring/graphql/v1/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GraphQL request failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<{
    data?: T;
    errors?: Array<{ message: string }>;
  }>;
}
