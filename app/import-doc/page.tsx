"use client";

/**
 * Standalone document import page.
 * Article creation is handled server-side via /api/create-article
 * using the Authoring GraphQL API with OAuth2 client credentials.
 */
import { ArticleUploader } from "@/components/ArticleUploader";

export default function ImportDocPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Import Word Document
        </h1>
        <p className="mb-6 text-gray-600">
          Upload a Word document to extract content and create an article in
          Sitecore. Content is created via the server-side Authoring GraphQL API.
        </p>
        <ArticleUploader />
      </div>
    </div>
  );
}
