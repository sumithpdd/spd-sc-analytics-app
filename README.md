# SPD SC Analytics App

A Sitecore Marketplace app that provides a Content Analytics Dashboard for Sitecore XM Cloud. Built with Next.js and the [Sitecore Marketplace SDK](https://doc.sitecore.com/mp/en/developers/sdk/latest/sitecore-marketplace-sdk/sitecore-marketplace-sdk-for-javascript.html).

## Documentation

**Step-by-step guides for junior developers** are in the [`docs/`](./docs/) folder:

| Guide | Description |
|-------|-------------|
| [01 – Getting Started](./docs/01-getting-started.md) | Prerequisites and environment setup |
| [02 – Create the Project](./docs/02-create-project.md) | Create Next.js app and install dependencies |
| [03 – SDK Setup](./docs/03-sdk-setup.md) | Install and initialize the Marketplace SDK |
| [04 – Extension Points](./docs/04-extension-points.md) | Standalone, Dashboard Widget, Custom Field |
| [05 – Register in XM Cloud](./docs/05-register-app.md) | Configure and install the app in Developer Studio |
| [06 – Project Structure](./docs/06-project-structure.md) | Architecture and key files |

👉 **[Start with the docs index](./docs/README.md)**

## Quick Start

```bash
npm install
npm run dev
```

**Important:** Do not open the app directly at localhost. The Marketplace SDK requires the XM Cloud Portal context. Access the app only through its extension point inside the [Cloud Portal](https://portal.sitecorecloud.io/).

## Extension Points

| Route | Purpose |
|-------|---------|
| `/standalone` | Full-page Content Analytics Dashboard |
| `/pages-contextpanel` | **Site-specific analytics** – runs in Pages editor, uses site context |
| `/dashboard-widget` | Compact approval stats widget |
| `/custom-field` | Color picker for content editor fields |

**Getting real content data:** The standalone app runs from the Portal and may not have site context. For site-specific stats (e.g. visitlondon), use the **Pages Context Panel** extension from the Pages editor.

## Prerequisites

- Node.js v16+
- npm v10+
- Sitecore Cloud Portal access (Org Admin or Owner)
- Basic React/Next.js knowledge

## Project Structure

```
├── app/
│   ├── standalone/        # Analytics dashboard
│   ├── dashboard-widget/  # Dashboard card
│   └── custom-field/      # Color picker field
├── hooks/
│   └── useMarketplaceClient.ts
├── lib/
│   └── xmcClient.ts
└── docs/                  # Step-by-step documentation
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **404 for `/standalone/pages-contextpanel`** | Set Deployment URL to base only: `http://localhost:3000` (not `http://localhost:3000/standalone`). See [docs/05-register-app.md](./docs/05-register-app.md). |
| **Total Items = 0** | Enable API access in Developer Studio (Authoring and Management GraphQL API). Use the Pages Context Panel from the Pages editor. |
| SDK initialization fails | Access the app through Cloud Portal, not localhost directly |
| App doesn't appear in navigation | Ensure the app is Active in Developer Studio and installed from My Apps |
| Blank screen | Verify the deployment URL matches your route and the dev server is running |

## Learn More

- [Sitecore Marketplace SDK](https://doc.sitecore.com/mp/en/developers/sdk/latest/sitecore-marketplace-sdk/sitecore-marketplace-sdk-for-javascript.html)
- [Marketplace Starter Kit](https://github.com/Sitecore/marketplace-starter)
- [Next.js Documentation](https://nextjs.org/docs)
