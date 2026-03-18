import Link from "next/link";

/**
 * Landing page for the SPD Sitecore Marketplace App.
 * The app runs inside the Sitecore Cloud Portal – open it from My Apps, not directly.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <main className="max-w-2xl space-y-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          SPD Sitecore Marketplace App
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Content analytics and Word document import for Sitecore XM Cloud.
          Open this app from the{" "}
          <strong>Sitecore Cloud Portal</strong> (My Apps) – it runs in an
          iframe and requires the Marketplace SDK context.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/standalone"
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Analytics Dashboard
          </Link>
          <Link
            href="/import-doc"
            className="rounded-lg border border-zinc-300 px-5 py-2.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Import Word Document
          </Link>
        </div>
        <p className="text-sm text-zinc-500">
          For the best experience, use the{" "}
          <strong>Pages Context Panel</strong> from the Pages editor – it shows
          site-specific analytics and the Word import in one place.
        </p>
      </main>
    </div>
  );
}
