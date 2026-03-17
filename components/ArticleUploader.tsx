"use client";

import type React from "react";
import { useState } from "react";
import { processArticleDocument } from "@/lib/article-document-processor";
import { processDocument } from "@/lib/document-processor";
import type { ArticleData } from "@/lib/article-document-processor";

/**
 * Uploads a Word document, extracts article fields, and calls the server-side
 * /api/create-article route which uses the Authoring GraphQL API with OAuth2.
 * No SDK client or site context required here.
 */
export function ArticleUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdPath, setCreatedPath] = useState<string | null>(null);
  const [authorCreated, setAuthorCreated] = useState(false);
  const [error, setError] = useState<string>("");
  const [preview, setPreview] = useState<ArticleData | null>(null);
  const [rawRows, setRawRows] = useState<string[][] | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreview(null);
    setRawRows(null);
    setError("");
    setSuccess(false);
    setCreatedPath(null);
    setShowRaw(false);

    const f = e.target.files?.[0];
    if (!f) return;

    const validType =
      f.type === "application/msword" ||
      f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      f.type === "application/vnd.ms-word.document.macroEnabled.12" ||
      f.type === "application/vnd.ms-word.template.macroEnabled.12" ||
      f.name.endsWith(".docm") ||
      f.name.endsWith(".dotm");

    if (validType) {
      setFile(f);
    } else {
      setError("Please upload a .doc, .docx, .docm, or .dotm file");
      setFile(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setError("");
    setPreview(null);
    setRawRows(null);
    try {
      const [article, rows] = await Promise.all([
        processArticleDocument(file),
        processDocument(file),
      ]);
      setPreview(article);
      setRawRows(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse document");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess(false);
    setCreatedPath(null);

    try {
      const article = preview ?? (await processArticleDocument(file));

      if (!article.title?.trim()) {
        setError("Could not extract title. Use 'Preview extraction' to diagnose.");
        return;
      }

      const res = await fetch("/api/create-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article }),
      });

      const data = (await res.json()) as {
        itemId?: string;
        path?: string;
        authorCreated?: boolean;
        error?: string;
      };

      if (!res.ok || data.error) {
        setError(data.error ?? `Server error (${res.status})`);
        return;
      }

      setSuccess(true);
      setCreatedPath(data.path ?? null);
      setAuthorCreated(data.authorCreated ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process document");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 font-semibold text-gray-900">Import Word Document</h4>
        <p className="mb-4 text-xs text-gray-500">
          Upload a Word document with title, date, content, and author. Creates
          an ArticlePage in Sitecore via the Authoring GraphQL API.
        </p>

        {/* File drop zone */}
        <label
          htmlFor="article-file-upload"
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            file
              ? "border-green-300 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <p className="mb-1 text-sm font-medium text-gray-600">
            {file ? "File selected:" : "Click to upload"}
          </p>
          <p className="text-xs text-gray-500">
            {file ? file.name : "DOC, DOCX, DOCM, or DOTM files"}
          </p>
          <input
            id="article-file-upload"
            type="file"
            accept=".doc,.docx,.docm,.dotm,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="hidden"
            disabled={processing}
          />
        </label>

        {/* Preview button */}
        {file && !success && (
          <button
            type="button"
            onClick={handlePreview}
            className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Preview extraction
          </button>
        )}

        {/* Extracted fields */}
        {preview && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs space-y-1">
            <p className="font-semibold text-gray-700 mb-2">Extracted fields:</p>
            <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
              <span className="font-medium text-gray-500">Title</span>
              <span className={preview.title ? "text-gray-900" : "text-red-500 italic"}>
                {preview.title || "(empty – not found)"}
              </span>
              <span className="font-medium text-gray-500">Date</span>
              <span className={preview.date ? "text-gray-900" : "text-amber-600 italic"}>
                {preview.date || "(empty)"}
              </span>
              <span className="font-medium text-gray-500">Author</span>
              <span className={preview.author ? "text-gray-900" : "text-amber-600 italic"}>
                {preview.author || "(empty – no 'Author' heading found)"}
              </span>
              <span className="font-medium text-gray-500">Content</span>
              <span className="text-gray-700 break-all">
                {preview.content
                  ? preview.content.slice(0, 120) +
                    (preview.content.length > 120 ? "…" : "")
                  : "(empty)"}
              </span>
            </div>

            {rawRows && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  className="text-xs text-blue-600 underline"
                >
                  {showRaw ? "Hide" : "Show"} raw rows ({rawRows.length})
                </button>
                {showRaw && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded border border-gray-200 bg-white p-2">
                    {rawRows.map((row, i) => (
                      <div
                        key={i}
                        className="py-0.5 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-gray-400 mr-2">[{i}]</span>
                        {row.map((cell, j) => (
                          <span key={j} className="mr-3">
                            <span className="text-gray-400 text-xs">col{j}: </span>
                            <span className="text-gray-800">{cell || "(empty)"}</span>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-medium text-green-700">
              Article created successfully!
            </p>
            {createdPath && (
              <p className="mt-0.5 text-xs text-green-600 break-all">{createdPath}</p>
            )}
            {authorCreated && (
              <p className="mt-1 text-xs text-blue-600">
                New Author item created in the Authors folder.
              </p>
            )}
          </div>
        )}

        {/* Spinner */}
        {processing && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-blue-700">Creating article…</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || processing}
          className={`mt-4 w-full rounded-lg px-4 py-2 font-medium transition-colors ${
            success
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
          }`}
        >
          {processing ? "Creating…" : success ? "Complete" : "Create Article"}
        </button>
      </div>
    </div>
  );
}
