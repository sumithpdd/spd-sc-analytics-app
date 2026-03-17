/**
 * Article document processor – extracts title, date, content, author from Word.
 * Expects document structure:
 * - First line/paragraph: Title
 * - Second (if date pattern): Date (e.g. "17 March 2026")
 * - Body paragraphs until "Author" section
 * - After "Author": Author name, optionally author title
 *
 * Uses the same OOXML extraction as document-processor (paragraphs as rows).
 */
import { processDocument } from "./document-processor";

// Flexible date patterns: "17 March 2026", "March 17, 2026", "17/03/2026", "2026-03-17"
const DATE_PATTERN =
  /^\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s,]+\d{2,4}$|^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$|^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/i;
const AUTHOR_SECTION_MARKER = /^author$/i;

export interface ArticleData {
  title: string;
  date: string;
  content: string;
  author: string;
}

/**
 * Transform rows from processDocument into ArticleData.
 * Rows are paragraphs (single-cell) or table rows (multi-cell).
 */
export function transformRowsToArticleData(rows: string[][]): ArticleData {
  const result: ArticleData = {
    title: "",
    date: "",
    content: "",
    author: "",
  };

  if (rows.length === 0) return result;

  // Flatten: take first non-empty cell from each row (title/date may be in any column)
  const texts = rows
    .map((row) => {
      const cell = row.find((c) => c?.trim()) ?? row.join(" ").trim();
      return cell?.trim();
    })
    .filter((t): t is string => !!t);

  let i = 0;

  // Title: first line (heading)
  if (texts.length > 0) {
    result.title = texts[0];
    i = 1;
  }

  // Date: second line (subtitle) – match date pattern or short line
  if (texts.length > 1) {
    const second = texts[1];
    if (DATE_PATTERN.test(second) || (second.length < 60 && /\d/.test(second))) {
      result.date = second;
      i = 2;
    }
  }

  // Find "Author" section – everything before is content, after is author
  let authorIdx = -1;
  for (let j = i; j < texts.length; j++) {
    if (AUTHOR_SECTION_MARKER.test(texts[j])) {
      authorIdx = j;
      break;
    }
  }

  if (authorIdx >= 0) {
    result.content = texts
      .slice(i, authorIdx)
      .join("\n\n")
      .trim();
    // Author: first line after "Author" is typically the name; second is role/title
    const authorLines = texts.slice(authorIdx + 1);
    const name = authorLines[0] ?? "";
    const role = authorLines[1] ?? "";
    result.author = role ? `${name} // ${role}` : name;
  } else {
    result.content = texts.slice(i).join("\n\n").trim();
  }

  return result;
}

/**
 * Process a Word file and return ArticleData.
 */
export async function processArticleDocument(file: File): Promise<ArticleData> {
  const rows = await processDocument(file);
  return transformRowsToArticleData(rows);
}
