/**
 * Word document processor – extracts content from .docx, .docm, .dotm files.
 * Reads word/document.xml from the OOXML package and extracts:
 * - Table rows as string[][] (each cell's text)
 * - Paragraphs outside tables as single-cell rows
 *
 * Based on FMC-ORG/xmc-marketplace document-processor.
 */
import JSZip from "jszip";

// Both the transitional and strict OOXML WordprocessingML namespaces.
// Word documents using "strict" conformance use the purl.oclc.org URI.
const NS_TRANSITIONAL = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const NS_STRICT = "http://purl.oclc.org/ooxml/wordprocessingml/main";

/**
 * Detect which WordprocessingML namespace the document actually uses.
 * Looks up the namespace bound to the "w" prefix on the root element.
 */
function detectNS(xmlDoc: Document): string {
  const root = xmlDoc.documentElement;
  const detected = root.lookupNamespaceURI("w");
  if (detected === NS_STRICT || detected === NS_TRANSITIONAL) return detected;
  // Fallback: try whichever finds a <body>
  if (xmlDoc.getElementsByTagNameNS(NS_STRICT, "body").length > 0) return NS_STRICT;
  return NS_TRANSITIONAL;
}

function makeExtractors(ns: string) {
  function extractCellText(tc: Element): string {
    return Array.from(tc.getElementsByTagNameNS(ns, "t"))
      .map((t) => t.textContent ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractTextFromElement(el: Element): string {
    return Array.from(el.getElementsByTagNameNS(ns, "t"))
      .map((w) => w.textContent ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
  }

  return { extractCellText, extractTextFromElement, ns };
}

/**
 * Process a Word document and return rows of cell text in document order.
 * Handles: paragraphs, tables, content controls (SDT). Order preserved.
 * Supports both transitional and strict OOXML conformance documents.
 */
export async function processDocument(file: File): Promise<string[][]> {
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const docFile =
    zip.file("word/document.xml") ?? zip.file("/word/document.xml");
  if (!docFile) throw new Error("Cannot find word/document.xml in file.");

  const xml = await docFile.async("string");
  const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");

  const ns = detectNS(xmlDoc);
  const { extractCellText, extractTextFromElement } = makeExtractors(ns);

  const rows: string[][] = [];
  const body = xmlDoc.getElementsByTagNameNS(ns, "body")[0];
  if (!body) return rows;

  function processChild(child: Element): void {
    const localName = ((child.localName ?? child.nodeName) || "").toLowerCase();

    if (localName === "tbl") {
      const trs = Array.from(child.getElementsByTagNameNS(ns, "tr"));
      for (const tr of trs) {
        const tcs = Array.from(tr.getElementsByTagNameNS(ns, "tc"));
        const cells = tcs.map(extractCellText);
        if (cells.some((c) => c?.trim())) {
          rows.push(cells);
        }
      }
    } else if (localName === "p") {
      const text = extractTextFromElement(child);
      if (text) rows.push([text]);
    } else if (localName === "sdt") {
      // Content control – get first paragraph inside
      const sdtContent = child.getElementsByTagNameNS(ns, "sdtContent")[0] ?? child;
      const firstP = sdtContent.getElementsByTagNameNS(ns, "p")[0];
      if (firstP) {
        const text = extractTextFromElement(firstP);
        if (text) rows.push([text]);
      } else {
        const text = extractTextFromElement(sdtContent);
        if (text) rows.push([text]);
      }
    } else if (localName === "sectpr") {
      // Section properties – skip
    } else {
      // Try to extract text from unknown elements (e.g. customXml with inline content)
      const text = extractTextFromElement(child);
      if (text) rows.push([text]);
    }
  }

  for (const child of Array.from(body.children)) {
    processChild(child);
  }

  // Fallback: if no rows, try getting all paragraphs directly under body
  if (rows.length === 0) {
    const allParas = body.getElementsByTagNameNS(ns, "p");
    for (const p of Array.from(allParas)) {
      const text = extractTextFromElement(p);
      if (text) rows.push([text]);
    }
  }

  return rows;
}
