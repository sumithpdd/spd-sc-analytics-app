# 01 – Getting Started

This guide explains what the SPD Marketplace App is, what you need before you start, and why some things work differently than a typical web app.

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js 16+** and **npm 10+** – [Download from nodejs.org](https://nodejs.org/). You can check versions with `node -v` and `npm -v`.
- **Sitecore Cloud Portal** access with **Org Admin** or **Owner** role – [portal.sitecorecloud.io](https://portal.sitecorecloud.io/). Only these roles can register custom apps in Developer Studio.
- **Basic React/Next.js knowledge** – Components, hooks (`useState`, `useEffect`), and the App Router. If you're new, the [Next.js Learn course](https://nextjs.org/learn) is a good starting point.

---

## What is this app?

The **SPD Marketplace App** is a **Sitecore Marketplace app** that runs inside **XM Cloud**. It provides:

- A **content analytics dashboard** – Total items, items updated today, etc.
- A **dashboard widget** – A compact card for the Portal dashboard
- A **custom color-picker field** – Used when editing content in the Pages editor
- A **Pages Context Panel** – Site-specific analytics when you're editing a page

Unlike a normal website, this app **runs inside an iframe** in the Sitecore Cloud Portal. It does not have its own URL that users visit directly. Instead, the Portal loads your app at a route like `/standalone` or `/pages-contextpanel` and embeds it in the UI.

---

## Why does it run in an iframe?

Sitecore Marketplace apps are **extensions** of the Cloud Portal. They:

1. **Run in an iframe** – Your app is loaded inside the Portal's page. The Portal controls when and where it appears.
2. **Communicate via the Marketplace SDK** – The SDK provides a secure bridge between your app and Sitecore. You use `client.query()`, `client.mutate()`, `client.getValue()`, etc. instead of calling APIs directly.
3. **Don't need API keys in your code** – Authentication is handled by the Portal. When a user opens your app, they're already logged in; the SDK uses that session.

Because of this, **you must not open `http://localhost:3000/standalone` directly in a new browser tab**. The SDK expects to run inside the Portal's iframe and communicate with `window.parent`. Outside the iframe, initialization fails and you'll see a blank or error screen.

---

## Important: How to run and test

1. Start the dev server: `npm run dev`
2. Register the app in Developer Studio (see [05 – Register App](./05-register-app.md))
3. Open the **Cloud Portal** and launch the app from there (e.g. from the navigation or from the Pages editor)

---

## Next steps

- [02 – Create the Project](./02-create-project.md) – Set up the Next.js app and install the SDK
- [Back to index](./README.md)
