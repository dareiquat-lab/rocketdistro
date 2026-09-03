import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, STAFF_COOKIE, isAdminOrStaff } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const PRODUCT_CANDIDATES = [
  "product name", "product", "item name", "item", "item description",
  "description", "particulars", "name", "goods", "article",
  "merchandise", "material", "material description", "part name",
  "line description", "product title", "items", "product description",
];
const QTY_CANDIDATES = ["quantity", "qty", "units", "count", "pcs", "pieces", "pack", "ordered", "no of units"];
const COST_CANDIDATES = ["unit cost", "unit price", "cost", "price", "rate", "each", "per unit", "amount", "value"];
const CATEGORY_CANDIDATES = ["category", "type", "dept", "department", "class", "group"];
const BRAND_CANDIDATES = ["brand", "brand name", "manufacturer", "make", "mfr", "vendor brand", "label"];
const SKIP_NAMES = ["total", "subtotal", "grand total", "sub-total", "tax", "shipping", "discount"];

function findColIndex(headers: string[], candidates: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] ?? "").toLowerCase().trim();
    if (h.length < 2) continue;
    if (candidates.some((c) => h === c || h.includes(c) || (h.length >= 3 && c.includes(h)))) return i;
  }
  return -1;
}

function parseNumber(val: unknown): number {
  if (typeof val === "number") return val;
  return parseFloat(String(val ?? "0").replace(/[$,\s]/g, "")) || 0;
}

// Words that commonly appear at the start of product names but are NOT brand names
const BRAND_STOP_WORDS = new Set([
  "new", "the", "a", "an", "and", "or", "of", "with", "for", "in", "on", "at",
  "pack", "box", "case", "ct", "pk", "oz", "ml", "mg", "g", "lb", "lbs",
  "each", "per", "unit", "units", "item", "items", "product", "assorted",
  "mixed", "variety", "regular", "original", "classic", "deluxe", "premium",
  "small", "medium", "large", "xl", "xxl", "mini", "king", "size", "single",
]);

// Normalize a token for comparison only (not for display)
function tokenKey(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Scans all item names and detects repeating leading words/phrases that are
 * likely brand names (e.g. "STIIIZY" appearing across many lines).
 * Returns an array parallel to `names` with the detected brand (or null).
 */
function inferBrandsFromNames(names: string[]): (string | null)[] {
  if (names.length < 2) return names.map(() => null);

  // Count how many names start with each 1-, 2-, or 3-word prefix
  type Entry = { count: number; display: string };
  const prefixMap = new Map<string, Entry>();

  for (const name of names) {
    const words = name.trim().split(/\s+/);
    for (let len = 1; len <= Math.min(3, words.length - 1); len++) {
      const slice = words.slice(0, len);
      const key = slice.map(tokenKey).join(" ");
      const firstKey = slice[0] ? tokenKey(slice[0]) : "";
      // Skip if the leading token is a stop word or too short
      if (!firstKey || firstKey.length < 2 || BRAND_STOP_WORDS.has(firstKey)) break;
      const existing = prefixMap.get(key);
      prefixMap.set(key, {
        count: (existing?.count ?? 0) + 1,
        display: existing?.display ?? slice.join(" "),
      });
    }
  }

  // Keep only prefixes that appear in 2+ item names, sorted longest-first then most-frequent
  const candidates = [...prefixMap.entries()]
    .filter(([, e]) => e.count >= 2)
    .sort((a, b) => {
      const lenDiff = b[0].split(" ").length - a[0].split(" ").length;
      return lenDiff !== 0 ? lenDiff : b[1].count - a[1].count;
    });

  if (candidates.length === 0) return names.map(() => null);

  return names.map((name) => {
    const words = name.trim().split(/\s+/);
    // Try each candidate against this item's name (prefix match first, then anywhere)
    for (const [key, { display }] of candidates) {
      const keyParts = key.split(" ");
      // Check prefix
      const namePrefix = words.slice(0, keyParts.length).map(tokenKey).join(" ");
      if (namePrefix === key) return display;
    }
    // Fallback: check if any candidate appears mid-name
    for (const [key, { display }] of candidates) {
      const keyParts = key.split(" ");
      for (let i = 1; i <= words.length - keyParts.length; i++) {
        const slice = words.slice(i, i + keyParts.length).map(tokenKey).join(" ");
        if (slice === key) return display;
      }
    }
    return null;
  });
}

/**
 * Uses Claude Haiku to identify brand patterns embedded in product codes.
 * Returns pairs of {name, pattern} where pattern is the substring to match
 * (e.g. {name: "Stizzy", pattern: "stizzy"} catches "CA-STIZZY-ORG").
 * Gracefully returns [] if the API key is absent or the call fails.
 */
async function detectBrandPatternsWithAI(
  names: string[]
): Promise<{ name: string; pattern: string }[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const sample = names.filter(Boolean).slice(0, 50);
    const res = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are identifying brand names embedded inside product codes on a supplier invoice.
Brands can appear anywhere in a code — prefixed, suffixed, or concatenated with non-brand tokens like state codes, flavor codes, or size indicators.
Examples: "CA-STIZZY-ORG" → brand "Stizzy" (pattern "stizzy"); "ORGSTIZZY" → brand "Stizzy" (pattern "stizzy"); "RBULL-12OZ-CAN" → brand "Red Bull" (pattern "rbull").

Return ONLY valid JSON, no markdown:
{"brands": [{"name": "Proper Display Name", "pattern": "lowercase substring that identifies this brand"}]}
Use an empty array if no brand can be confidently determined.

Product names:
${sample.map((n) => `- ${n}`).join("\n")}`,
        },
      ],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.brands)
      ? parsed.brands.filter(
          (b: unknown) =>
            typeof (b as { name?: unknown }).name === "string" &&
            typeof (b as { pattern?: unknown }).pattern === "string" &&
            (b as { pattern: string }).pattern.length > 1
        )
      : [];
  } catch {
    return [];
  }
}

function matchBrandPattern(
  name: string,
  aiPatterns: { name: string; pattern: string }[]
): string | null {
  const lower = name.toLowerCase();
  for (const { name: brandName, pattern } of aiPatterns) {
    if (lower.includes(pattern.toLowerCase())) return brandName;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
  if (!(await isAdminOrStaff(adminToken, staffToken)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  // Detect header row (first row with ≥2 non-empty cells matching column keywords)
  const ALL_KEYWORDS = [...PRODUCT_CANDIDATES, ...QTY_CANDIDATES, ...COST_CANDIDATES, ...CATEGORY_CANDIDATES, ...BRAND_CANDIDATES];
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i].map((c) => String(c ?? "").toLowerCase().trim());
    const hits = row.filter((c) => {
      if (c.length < 2) return false; // empty / single-char cells are never a column header
      return ALL_KEYWORDS.some((k) => c === k || c.includes(k) || (c.length >= 3 && k.includes(c)));
    }).length;
    if (hits >= 2) { headerRowIdx = i; break; }
  }

  if (headerRowIdx === -1)
    return NextResponse.json({ error: "Could not detect column headers. Make sure the sheet has Product, Qty, and Cost columns." }, { status: 422 });

  const headers = rows[headerRowIdx].map((c) => String(c ?? ""));
  const productCol = findColIndex(headers, PRODUCT_CANDIDATES);
  const qtyCol = findColIndex(headers, QTY_CANDIDATES);
  const costCol = findColIndex(headers, COST_CANDIDATES);
  const categoryCol = findColIndex(headers, CATEGORY_CANDIDATES);
  const brandCol = findColIndex(headers, BRAND_CANDIDATES);

  if (productCol === -1)
    return NextResponse.json({ error: "Could not find a Product/Item column in the spreadsheet." }, { status: 422 });

  // Extract metadata from rows before the header
  let supplierName = "";
  let invoiceNumber = "";
  let invoiceDate = "";

  for (let i = 0; i < headerRowIdx; i++) {
    const row = rows[i];
    for (let j = 0; j < row.length - 1; j++) {
      const key = String(row[j] ?? "").toLowerCase().trim();
      const val = String(row[j + 1] ?? "").trim();
      if (!val) continue;
      if (key.includes("supplier") || key.includes("vendor") || key === "from" || key === "sold by") supplierName ||= val;
      else if (key.includes("invoice") && (key.includes("#") || key.includes("no") || key.includes("num"))) invoiceNumber ||= val;
      else if (key === "date" || key === "invoice date") invoiceDate ||= val;
    }
    // Also check if a single cell value looks like "Invoice #: INV-001"
    for (const cell of row) {
      const s = String(cell ?? "").trim();
      const invMatch = s.match(/invoice\s*[#no.:]+\s*([A-Za-z0-9\-_]+)/i);
      if (invMatch) invoiceNumber ||= invMatch[1];
    }
  }

  // Pre-collect all raw names so we can run cross-item brand inference
  const dataRows = rows.slice(headerRowIdx + 1);
  const rawNames = dataRows.map((r) => String((r as unknown[])[productCol] ?? "").trim());

  // When no brand column: try AI first (handles embedded codes), fall back to frequency analysis
  let aiPatterns: { name: string; pattern: string }[] = [];
  let inferredBrands: (string | null)[] | null = null;
  if (brandCol === -1) {
    aiPatterns = await detectBrandPatternsWithAI(rawNames);
    if (aiPatterns.length === 0) {
      inferredBrands = inferBrandsFromNames(rawNames);
    }
  }

  // Extract items
  const items: { name: string; brand: string | null; category: string; quantity: number; unit_cost: number }[] = [];
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as unknown[];
    const name = rawNames[i];
    if (!name || SKIP_NAMES.some((s) => name.toLowerCase().includes(s))) continue;
    const qty = qtyCol !== -1 ? parseNumber(row[qtyCol]) : 1;
    const cost = costCol !== -1 ? parseNumber(row[costCol]) : 0;
    const category = categoryCol !== -1 ? String(row[categoryCol] ?? "").trim() : "";
    let brand: string | null = null;
    if (brandCol !== -1) {
      brand = String(row[brandCol] ?? "").trim() || null;
    } else if (aiPatterns.length > 0) {
      brand = matchBrandPattern(name, aiPatterns);
    } else {
      brand = inferredBrands?.[i] ?? null;
    }
    items.push({ name, brand, category, quantity: qty || 1, unit_cost: cost });
  }

  if (items.length === 0)
    return NextResponse.json({ error: "No items found after the header row." }, { status: 422 });

  const total = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  return NextResponse.json({ supplier_name: supplierName, invoice_number: invoiceNumber, invoice_date: invoiceDate, items, total });
}
