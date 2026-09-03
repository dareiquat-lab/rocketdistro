import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
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

  // Extract items
  const items: { name: string; brand: string | null; category: string; quantity: number; unit_cost: number }[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row[productCol] ?? "").trim();
    if (!name || SKIP_NAMES.some((s) => name.toLowerCase().includes(s))) continue;
    const qty = qtyCol !== -1 ? parseNumber(row[qtyCol]) : 1;
    const cost = costCol !== -1 ? parseNumber(row[costCol]) : 0;
    const category = categoryCol !== -1 ? String(row[categoryCol] ?? "").trim() : "";
    let brand: string | null = null;
    if (brandCol !== -1) {
      brand = String(row[brandCol] ?? "").trim() || null;
    } else {
      const words = name.split(/\s+/);
      if (words.length >= 4) {
        brand = words.slice(0, Math.min(3, Math.floor(words.length / 2))).join(" ");
      } else if (words.length >= 2) {
        brand = words[0];
      }
    }
    items.push({ name, brand, category, quantity: qty || 1, unit_cost: cost });
  }

  if (items.length === 0)
    return NextResponse.json({ error: "No items found after the header row." }, { status: 422 });

  const total = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  return NextResponse.json({ supplier_name: supplierName, invoice_number: invoiceNumber, invoice_date: invoiceDate, items, total });
}
