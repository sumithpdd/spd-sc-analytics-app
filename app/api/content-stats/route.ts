/**
 * GET /api/content-stats
 *
 * Returns article count and "updated today" for the Articles folder.
 * Uses the Authoring API (OAuth2) – no Preview API / Developer Studio access needed.
 */
import { NextResponse } from "next/server";
import { getBearerToken, authoringGql } from "@/lib/authoring-api";
import { ITEMS } from "@/lib/sitecore-constants";

export async function GET() {
  try {
    const token = await getBearerToken();

    const articlesFolderId = (
      process.env.ARTICLES_FOLDER_ID ?? ITEMS.ArticlesFolder.id
    ).replace(/[{}]/g, "");

    if (!articlesFolderId) {
      return NextResponse.json(
        { error: "ARTICLES_FOLDER_ID not configured" },
        { status: 500 }
      );
    }

    const r = await authoringGql<{
      item?: {
        children?: {
          nodes: Array<{ itemId: string; name: string }>;
        };
      };
    }>(
      token,
      `query ArticlesStats($itemId: ID!) {
        item(where: { database: "master", itemId: $itemId }) {
          children(first: 1000) {
            nodes { itemId name }
          }
        }
      }`,
      { itemId: articlesFolderId }
    );

    if (r.errors?.length) {
      return NextResponse.json(
        { error: r.errors.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const nodes = r.data?.item?.children?.nodes ?? [];

    return NextResponse.json({
      totalItems: nodes.length,
      updatedToday: 0, // Authoring API Item nodes don't expose updated; use total for now
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
