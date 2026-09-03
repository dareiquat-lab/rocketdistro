import { neon } from "@neondatabase/serverless";
import type { Product, Order, OrderItem, Client, CategoryRecord, DashboardStats, Brand } from "@/types";

export const sql = neon(
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost/placeholder",
  { fetchOptions: { cache: "no-store" } }
);

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD ?? "10");

// ─── Schema Ensurers ─────────────────────────────────────────────────────────

export async function ensureProductsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      cost NUMERIC(10,2) NOT NULL DEFAULT 0,
      image_url TEXT,
      barcode TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity)`;
}

export async function ensureProductCostColumn() {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS cost NUMERIC(10,2) NOT NULL DEFAULT 0`;
}

export async function ensureCategoriesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT NOT NULL DEFAULT '📦',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function ensureClientsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      business_name TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      tobacco_license_number TEXT,
      sellers_permit_number TEXT,
      client_type TEXT NOT NULL DEFAULT 'Retailer',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function ensureOrdersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      client_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`;
}

export async function ensureOrderClientColumn() {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_id INTEGER`;
}

export async function ensureOrderItemsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      product_sku TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      cost NUMERIC(10,2) NOT NULL DEFAULT 0
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`;
}

export async function ensureInvoiceActivityTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS invoice_activity (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      action_type TEXT NOT NULL CHECK (action_type IN ('printed','emailed')),
      performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      recipient_email TEXT,
      notes TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_invoice_activity_order_id ON invoice_activity(order_id)`;
}

export async function ensureEmailLogTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS email_log (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      order_number TEXT,
      type TEXT NOT NULL,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      error TEXT,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at DESC)`;
}

export async function logEmail(data: {
  order_id?: number | null;
  order_number?: string | null;
  type: string;
  to_email: string;
  subject: string;
  status: "sent" | "failed";
  error?: string | null;
}) {
  await ensureEmailLogTable();
  await sql`
    INSERT INTO email_log (order_id, order_number, type, to_email, subject, status, error)
    VALUES (${data.order_id ?? null}, ${data.order_number ?? null}, ${data.type}, ${data.to_email}, ${data.subject}, ${data.status}, ${data.error ?? null})
  `;
}

export async function getEmailLog(limit = 100) {
  await ensureEmailLogTable();
  const rows = await sql`
    SELECT * FROM email_log ORDER BY sent_at DESC LIMIT ${limit}
  `;
  return rows;
}

// ─── SKU Generation ───────────────────────────────────────────────────────────

const CATEGORY_PREFIXES: Record<string, string> = {
  general: "GEN",
  beverages: "BVR",
  snacks: "SNK",
  tobacco: "TOB",
  electronics: "ELC",
  accessories: "ACC",
  health: "HLT",
  cleaning: "CLN",
  "paper goods": "PPR",
  candy: "CND",
};

export function generateSKU(category: string, existingSkus: string[]): string {
  const key = category.toLowerCase();
  const prefix = CATEGORY_PREFIXES[key] ?? category.slice(0, 3).toUpperCase();
  const matching = existingSkus.filter((s) => s.startsWith(prefix + "-"));
  let next = matching.length + 1;
  while (existingSkus.includes(`${prefix}-${String(next).padStart(3, "0")}`)) {
    next++;
  }
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

// ─── Order Number ─────────────────────────────────────────────────────────────

export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const prefix = `RD-${dateStr}-`;
  const rows = await sql`
    SELECT order_number FROM orders WHERE order_number LIKE ${prefix + "%"} ORDER BY order_number DESC LIMIT 1
  `.catch(() => []);
  if (rows.length === 0) {
    return `${prefix}0001`;
  }
  const last = rows[0].order_number as string;
  const lastNum = parseInt(last.replace(prefix, ""), 10);
  return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(filters: {
  search?: string;
  category?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
  lowStock?: boolean;
}) {
  await ensureProductsTable();
  const {
    search = "",
    category = "",
    sortDir = "asc",
    page = 1,
    limit = 25,
    lowStock = false,
  } = filters;

  const validSortColumns = ["product_name", "category", "sku", "quantity", "price", "cost", "created_at", "updated_at"];
  const safeSort = validSortColumns.includes(filters.sortBy ?? "") ? filters.sortBy! : "created_at";
  const safeDir = sortDir === "desc" ? "DESC" : "ASC";
  const offset = (page - 1) * limit;
  const searchTerm = `%${search}%`;

  let rows: Record<string, unknown>[];
  let countRows: Record<string, unknown>[];

  if (lowStock) {
    if (category) {
      rows = await sql`
        SELECT * FROM products
        WHERE quantity <= ${LOW_STOCK_THRESHOLD}
        AND category = ${category}
        AND (${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm})
        ORDER BY quantity ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countRows = await sql`
        SELECT COUNT(*) as count FROM products
        WHERE quantity <= ${LOW_STOCK_THRESHOLD}
        AND category = ${category}
        AND (${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm})
      `;
    } else {
      rows = await sql`
        SELECT * FROM products
        WHERE quantity <= ${LOW_STOCK_THRESHOLD}
        AND (${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm})
        ORDER BY quantity ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countRows = await sql`
        SELECT COUNT(*) as count FROM products
        WHERE quantity <= ${LOW_STOCK_THRESHOLD}
        AND (${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm})
      `;
    }
  } else if (category) {
    if (safeSort === "created_at") {
      rows = await sql`
        SELECT * FROM products
        WHERE category = ${category}
        AND (${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR category ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (safeDir === "DESC") {
      rows = await sql`
        SELECT * FROM products
        WHERE category = ${category}
        AND (${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR category ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm})
        ORDER BY product_name DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT * FROM products
        WHERE category = ${category}
        AND (${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR category ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm})
        ORDER BY product_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }
    countRows = await sql`
      SELECT COUNT(*) as count FROM products
      WHERE category = ${category}
      AND (${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR category ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm})
    `;
  } else {
    if (safeSort === "created_at") {
      rows = await sql`
        SELECT * FROM products
        WHERE ${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR category ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (safeDir === "DESC") {
      rows = await sql`
        SELECT * FROM products
        WHERE ${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR category ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm}
        ORDER BY product_name DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT * FROM products
        WHERE ${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR category ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm}
        ORDER BY product_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }
    countRows = await sql`
      SELECT COUNT(*) as count FROM products
      WHERE ${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm} OR category ILIKE ${searchTerm} OR barcode ILIKE ${searchTerm}
    `;
  }

  const total = parseInt(String(countRows[0]?.count ?? "0"), 10);
  return { products: rows as unknown as Product[], total, pages: Math.ceil(total / limit) };
}

export async function getProductById(id: number): Promise<Product | null> {
  await ensureProductsTable();
  const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
  return (rows[0] as Product) ?? null;
}

export async function getProductByBarcode(code: string): Promise<Product | null> {
  await ensureProductsTable();
  const rows = await sql`SELECT * FROM products WHERE barcode = ${code} OR sku = ${code} LIMIT 1`;
  return (rows[0] as Product) ?? null;
}

export async function getStorefrontProducts(filters: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  await ensureProductsTable();
  const { search = "", category = "", page = 1, limit = 24 } = filters;
  const searchTerm = `%${search}%`;
  const offset = (page - 1) * limit;

  let rows: Record<string, unknown>[];
  let countRows: Record<string, unknown>[];

  if (category) {
    rows = await sql`
      SELECT id, product_name, category, sku, quantity, price, image_url, notes, brand
      FROM products
      WHERE category = ${category}
      AND (${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm})
      ORDER BY product_name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*) as count FROM products
      WHERE category = ${category}
      AND (${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm})
    `;
  } else {
    rows = await sql`
      SELECT id, product_name, category, sku, quantity, price, image_url, notes, brand
      FROM products
      WHERE ${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm}
      ORDER BY product_name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*) as count FROM products
      WHERE ${search} = '' OR product_name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm}
    `;
  }

  const total = parseInt(String(countRows[0]?.count ?? "0"), 10);
  return { products: rows as Partial<Product>[], total, pages: Math.ceil(total / limit) };
}

export async function createProduct(data: {
  product_name: string;
  category: string;
  sku: string;
  quantity: number;
  price: number;
  cost: number;
  image_url?: string | null;
  barcode?: string | null;
  notes?: string | null;
  brand?: string | null;
}): Promise<Product> {
  await ensureProductsTable();
  await ensureProductBrandColumn();
  const rows = await sql`
    INSERT INTO products (product_name, category, sku, quantity, price, cost, image_url, barcode, notes, brand)
    VALUES (${data.product_name}, ${data.category}, ${data.sku}, ${data.quantity}, ${data.price}, ${data.cost ?? 0}, ${data.image_url ?? null}, ${data.barcode ?? null}, ${data.notes ?? null}, ${data.brand ?? null})
    RETURNING *
  `;
  return rows[0] as Product;
}

export async function updateProduct(id: number, data: Partial<{
  product_name: string;
  category: string;
  sku: string;
  quantity: number;
  price: number;
  cost: number;
  image_url: string | null;
  barcode: string | null;
  notes: string | null;
  brand: string | null;
}>): Promise<Product | null> {
  await ensureProductsTable();
  await ensureProductBrandColumn();
  const rows = await sql`
    UPDATE products SET
      product_name = COALESCE(${data.product_name ?? null}, product_name),
      category = COALESCE(${data.category ?? null}, category),
      sku = COALESCE(${data.sku ?? null}, sku),
      quantity = COALESCE(${data.quantity ?? null}, quantity),
      price = COALESCE(${data.price ?? null}, price),
      cost = COALESCE(${data.cost ?? null}, cost),
      image_url = CASE WHEN ${data.image_url !== undefined} THEN ${data.image_url ?? null} ELSE image_url END,
      barcode = CASE WHEN ${data.barcode !== undefined} THEN ${data.barcode ?? null} ELSE barcode END,
      notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null} ELSE notes END,
      brand = CASE WHEN ${data.brand !== undefined} THEN ${data.brand ?? null} ELSE brand END,
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as Product) ?? null;
}

export async function deleteProduct(id: number): Promise<void> {
  await ensureProductsTable();
  await sql`DELETE FROM products WHERE id = ${id}`;
}

export async function bulkDeleteProducts(ids: number[]): Promise<void> {
  await ensureProductsTable();
  if (ids.length === 0) return;
  await sql`DELETE FROM products WHERE id = ANY(${ids})`;
}

export async function getAllProductsForExport(): Promise<Product[]> {
  await ensureProductsTable();
  const rows = await sql`SELECT * FROM products ORDER BY category, product_name`;
  return rows as unknown as Product[];
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<CategoryRecord[]> {
  await ensureCategoriesTable();
  const rows = await sql`SELECT * FROM categories ORDER BY name`;
  return rows as CategoryRecord[];
}

export async function getCategoryWithProductCount(): Promise<(CategoryRecord & { product_count: number })[]> {
  await ensureCategoriesTable();
  await ensureProductsTable();
  const rows = await sql`
    SELECT c.*, COUNT(p.id)::int as product_count
    FROM categories c
    LEFT JOIN products p ON p.category = c.name
    GROUP BY c.id
    ORDER BY c.name
  `;
  return rows as (CategoryRecord & { product_count: number })[];
}

export async function createCategory(name: string, description: string | null, icon: string): Promise<CategoryRecord> {
  await ensureCategoriesTable();
  const rows = await sql`
    INSERT INTO categories (name, description, icon)
    VALUES (${name}, ${description}, ${icon})
    RETURNING *
  `;
  return rows[0] as CategoryRecord;
}

export async function updateCategory(id: number, name: string, description: string | null, icon: string): Promise<CategoryRecord | null> {
  await ensureCategoriesTable();
  const old = await sql`SELECT name FROM categories WHERE id = ${id}`;
  const oldName = old[0]?.name as string;
  const rows = await sql`
    UPDATE categories SET name = ${name}, description = ${description}, icon = ${icon}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  if (oldName && oldName !== name) {
    await sql`UPDATE products SET category = ${name} WHERE category = ${oldName}`;
  }
  return (rows[0] as CategoryRecord) ?? null;
}

export async function deleteCategory(id: number, reassignTo?: string): Promise<void> {
  await ensureCategoriesTable();
  const old = await sql`SELECT name FROM categories WHERE id = ${id}`;
  const oldName = old[0]?.name as string;
  if (oldName && reassignTo) {
    await sql`UPDATE products SET category = ${reassignTo} WHERE category = ${oldName}`;
  }
  await sql`DELETE FROM categories WHERE id = ${id}`;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function getClients(filters: {
  search?: string;
  clientType?: string;
  page?: number;
  limit?: number;
}) {
  await ensureClientsTable();
  const { search = "", clientType = "", page = 1, limit = 25 } = filters;
  const searchTerm = `%${search}%`;
  const offset = (page - 1) * limit;

  let rows: Record<string, unknown>[];
  let countRows: Record<string, unknown>[];

  if (clientType) {
    rows = await sql`
      SELECT * FROM clients
      WHERE client_type = ${clientType}
      AND (${search} = '' OR business_name ILIKE ${searchTerm} OR contact_name ILIKE ${searchTerm} OR phone ILIKE ${searchTerm} OR tobacco_license_number ILIKE ${searchTerm} OR sellers_permit_number ILIKE ${searchTerm})
      ORDER BY business_name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*) as count FROM clients
      WHERE client_type = ${clientType}
      AND (${search} = '' OR business_name ILIKE ${searchTerm} OR contact_name ILIKE ${searchTerm} OR phone ILIKE ${searchTerm} OR tobacco_license_number ILIKE ${searchTerm} OR sellers_permit_number ILIKE ${searchTerm})
    `;
  } else {
    rows = await sql`
      SELECT * FROM clients
      WHERE ${search} = '' OR business_name ILIKE ${searchTerm} OR contact_name ILIKE ${searchTerm} OR phone ILIKE ${searchTerm} OR tobacco_license_number ILIKE ${searchTerm} OR sellers_permit_number ILIKE ${searchTerm}
      ORDER BY business_name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*) as count FROM clients
      WHERE ${search} = '' OR business_name ILIKE ${searchTerm} OR contact_name ILIKE ${searchTerm} OR phone ILIKE ${searchTerm} OR tobacco_license_number ILIKE ${searchTerm} OR sellers_permit_number ILIKE ${searchTerm}
    `;
  }

  const total = parseInt(String(countRows[0]?.count ?? "0"), 10);
  return { clients: rows as unknown as Client[], total, pages: Math.ceil(total / limit) };
}

export async function getClientById(id: number): Promise<Client | null> {
  await ensureClientsTable();
  const rows = await sql`SELECT * FROM clients WHERE id = ${id}`;
  return (rows[0] as Client) ?? null;
}

export async function createClient(data: Partial<Client>): Promise<Client> {
  await ensureClientsTable();
  const rows = await sql`
    INSERT INTO clients (business_name, contact_name, phone, email, address, city, state, zip, tobacco_license_number, sellers_permit_number, client_type, notes)
    VALUES (${data.business_name ?? ""}, ${data.contact_name ?? null}, ${data.phone ?? null}, ${data.email ?? null}, ${data.address ?? null}, ${data.city ?? null}, ${data.state ?? null}, ${data.zip ?? null}, ${data.tobacco_license_number ?? null}, ${data.sellers_permit_number ?? null}, ${data.client_type ?? "Retailer"}, ${data.notes ?? null})
    RETURNING *
  `;
  return rows[0] as Client;
}

export async function updateClient(id: number, data: Partial<Client>): Promise<Client | null> {
  await ensureClientsTable();
  const rows = await sql`
    UPDATE clients SET
      business_name = COALESCE(${data.business_name ?? null}, business_name),
      contact_name = COALESCE(${data.contact_name ?? null}, contact_name),
      phone = COALESCE(${data.phone ?? null}, phone),
      email = COALESCE(${data.email ?? null}, email),
      address = COALESCE(${data.address ?? null}, address),
      city = COALESCE(${data.city ?? null}, city),
      state = COALESCE(${data.state ?? null}, state),
      zip = COALESCE(${data.zip ?? null}, zip),
      tobacco_license_number = COALESCE(${data.tobacco_license_number ?? null}, tobacco_license_number),
      sellers_permit_number = COALESCE(${data.sellers_permit_number ?? null}, sellers_permit_number),
      client_type = COALESCE(${data.client_type ?? null}, client_type),
      notes = COALESCE(${data.notes ?? null}, notes),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as Client) ?? null;
}

export async function deleteClient(id: number): Promise<void> {
  await ensureClientsTable();
  await sql`DELETE FROM clients WHERE id = ${id}`;
}

export async function upsertClientFromOrder(data: {
  business_name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  tobacco_license_number?: string;
  sellers_permit_number?: string;
  client_type?: string;
}): Promise<number | null> {
  if (!data.business_name && !data.phone && !data.contact_name) return null;
  await ensureClientsTable();
  const businessName = data.business_name || data.contact_name || "";
  if (!businessName) return null;

  let existing: Record<string, unknown>[] = [];
  if (data.phone) {
    existing = await sql`SELECT id FROM clients WHERE phone = ${data.phone} LIMIT 1`;
  }
  if (existing.length === 0 && businessName) {
    existing = await sql`SELECT id FROM clients WHERE LOWER(business_name) = LOWER(${businessName}) LIMIT 1`;
  }

  if (existing.length > 0) {
    const id = existing[0].id as number;
    await sql`
      UPDATE clients SET
        contact_name = COALESCE(${data.contact_name ?? null}, contact_name),
        phone = COALESCE(${data.phone ?? null}, phone),
        email = COALESCE(${data.email ?? null}, email),
        tobacco_license_number = COALESCE(${data.tobacco_license_number ?? null}, tobacco_license_number),
        sellers_permit_number = COALESCE(${data.sellers_permit_number ?? null}, sellers_permit_number),
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return id;
  }

  const rows = await sql`
    INSERT INTO clients (business_name, contact_name, phone, email, tobacco_license_number, sellers_permit_number, client_type)
    VALUES (${businessName}, ${data.contact_name ?? null}, ${data.phone ?? null}, ${data.email ?? null}, ${data.tobacco_license_number ?? null}, ${data.sellers_permit_number ?? null}, ${data.client_type ?? "Retailer"})
    RETURNING id
  `;
  return rows[0]?.id as number;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(data: {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes?: string | null;
  client_id?: number | null;
  business_name?: string;
  tobacco_license_number?: string;
  sellers_permit_number?: string;
  items: {
    product_id?: number | null;
    product_name: string;
    product_sku?: string | null;
    quantity: number;
    price: number;
    cost?: number;
  }[];
}): Promise<Order> {
  await ensureOrdersTable();
  await ensureOrderItemsTable();
  await ensureClientsTable();

  let clientId = data.client_id ?? null;
  if (!clientId && (data.business_name || data.customer_name || data.customer_phone)) {
    clientId = await upsertClientFromOrder({
      business_name: data.business_name || data.customer_name,
      contact_name: data.customer_name,
      phone: data.customer_phone,
      email: data.customer_email,
      tobacco_license_number: data.tobacco_license_number,
      sellers_permit_number: data.sellers_permit_number,
    });
  }

  const orderNumber = await generateOrderNumber();
  const orderRows = await sql`
    INSERT INTO orders (order_number, customer_name, customer_phone, customer_email, notes, status, client_id)
    VALUES (${orderNumber}, ${data.customer_name}, ${data.customer_phone}, ${data.customer_email}, ${data.notes ?? null}, 'new', ${clientId})
    RETURNING *
  `;
  const order = orderRows[0] as Order;

  for (const item of data.items) {
    let cost = item.cost ?? 0;
    if (!cost && item.product_id) {
      const p = await sql`SELECT cost FROM products WHERE id = ${item.product_id}`;
      cost = parseFloat(String(p[0]?.cost ?? "0"));
    }
    await sql`
      INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, price, cost)
      VALUES (${order.id}, ${item.product_id ?? null}, ${item.product_name}, ${item.product_sku ?? null}, ${item.quantity}, ${item.price}, ${cost})
    `;
  }

  return order;
}

export async function getOrders(filters: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  await ensureOrdersTable();
  await ensureOrderItemsTable();
  const { search = "", status = "", page = 1, limit = 25 } = filters;
  const searchTerm = `%${search}%`;
  const offset = (page - 1) * limit;

  let rows: Record<string, unknown>[];
  let countRows: Record<string, unknown>[];

  if (status) {
    rows = await sql`
      SELECT o.*,
        COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status = ${status}
      AND (${search} = '' OR o.order_number ILIKE ${searchTerm} OR o.customer_name ILIKE ${searchTerm} OR o.customer_email ILIKE ${searchTerm} OR o.customer_phone ILIKE ${searchTerm})
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*) as count FROM orders o
      WHERE o.status = ${status}
      AND (${search} = '' OR o.order_number ILIKE ${searchTerm} OR o.customer_name ILIKE ${searchTerm} OR o.customer_email ILIKE ${searchTerm} OR o.customer_phone ILIKE ${searchTerm})
    `;
  } else {
    rows = await sql`
      SELECT o.*,
        COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE ${search} = '' OR o.order_number ILIKE ${searchTerm} OR o.customer_name ILIKE ${searchTerm} OR o.customer_email ILIKE ${searchTerm} OR o.customer_phone ILIKE ${searchTerm}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*) as count FROM orders o
      WHERE ${search} = '' OR o.order_number ILIKE ${searchTerm} OR o.customer_name ILIKE ${searchTerm} OR o.customer_email ILIKE ${searchTerm} OR o.customer_phone ILIKE ${searchTerm}
    `;
  }

  const total = parseInt(String(countRows[0]?.count ?? "0"), 10);
  return { orders: rows as unknown as Order[], total, pages: Math.ceil(total / limit) };
}

export async function getOrderById(id: number): Promise<Order | null> {
  await ensureOrdersTable();
  await ensureOrderItemsTable();
  const rows = await sql`
    SELECT o.*,
      COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = ${id}
    GROUP BY o.id
  `;
  return (rows[0] as Order) ?? null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  await ensureOrdersTable();
  await ensureOrderItemsTable();
  const rows = await sql`
    SELECT o.*,
      COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.order_number = ${orderNumber}
    GROUP BY o.id
  `;
  return (rows[0] as Order) ?? null;
}

export async function getOrdersByClientId(clientId: number): Promise<Order[]> {
  await ensureOrdersTable();
  await ensureOrderItemsTable();
  const rows = await sql`
    SELECT o.*,
      COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.client_id = ${clientId}
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  return rows as unknown as Order[];
}

export async function updateOrder(id: number, data: {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string | null;
  status?: string;
  client_id?: number | null;
  items?: {
    product_id?: number | null;
    product_name: string;
    product_sku?: string | null;
    quantity: number;
    price: number;
    cost?: number;
  }[];
}): Promise<Order | null> {
  await ensureOrdersTable();
  await ensureOrderItemsTable();
  await sql`
    UPDATE orders SET
      customer_name = COALESCE(${data.customer_name ?? null}, customer_name),
      customer_phone = COALESCE(${data.customer_phone ?? null}, customer_phone),
      customer_email = COALESCE(${data.customer_email ?? null}, customer_email),
      notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null} ELSE notes END,
      status = COALESCE(${data.status ?? null}, status),
      client_id = CASE WHEN ${data.client_id !== undefined} THEN ${data.client_id ?? null} ELSE client_id END,
      updated_at = NOW()
    WHERE id = ${id}
  `;
  if (data.items) {
    await sql`DELETE FROM order_items WHERE order_id = ${id}`;
    for (const item of data.items) {
      let cost = item.cost ?? 0;
      if (!cost && item.product_id) {
        const p = await sql`SELECT cost FROM products WHERE id = ${item.product_id}`;
        cost = parseFloat(String(p[0]?.cost ?? "0"));
      }
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, price, cost)
        VALUES (${id}, ${item.product_id ?? null}, ${item.product_name}, ${item.product_sku ?? null}, ${item.quantity}, ${item.price}, ${cost})
      `;
    }
  }
  return getOrderById(id);
}

export async function updateOrderStatus(id: number, status: string): Promise<void> {
  await ensureOrdersTable();
  await sql`UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
}

export async function deleteOrder(id: number): Promise<void> {
  await ensureOrdersTable();
  await sql`DELETE FROM order_items WHERE order_id = ${id}`;
  await sql`DELETE FROM orders WHERE id = ${id}`;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  await ensureProductsTable();
  await ensureCategoriesTable();
  await ensureOrdersTable();
  await ensureOrderItemsTable();

  const [
    productCountRows,
    unitsRows,
    lowStockRows,
    recentRows,
    categoryRows,
    newOrdersRows,
    monthlyRows,
    clientCountRows,
    statusRows,
    recentOrderRows,
  ] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM products`.catch(() => [{ count: 0 }]),
    sql`SELECT COALESCE(SUM(quantity), 0) as total FROM products`.catch(() => [{ total: 0 }]),
    sql`SELECT COUNT(*) as count FROM products WHERE quantity <= ${LOW_STOCK_THRESHOLD}`.catch(() => [{ count: 0 }]),
    sql`SELECT * FROM products ORDER BY updated_at DESC LIMIT 5`.catch(() => []),
    sql`
      SELECT c.name as category, c.icon, COUNT(p.id)::int as count
      FROM categories c
      LEFT JOIN products p ON p.category = c.name
      GROUP BY c.name, c.icon
      ORDER BY count DESC
    `.catch(() => []),
    sql`SELECT COUNT(*) as count FROM orders WHERE status = 'new'`.catch(() => [{ count: 0 }]),
    sql`
      SELECT
        COALESCE(SUM((oi.price - COALESCE(NULLIF(oi.cost, 0), 0)) * oi.quantity), 0) as profit,
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status = 'completed'
      AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', NOW())
    `.catch(() => [{ profit: 0, revenue: 0 }]),
    sql`SELECT COUNT(*) as count FROM clients`.catch(() => [{ count: 0 }]),
    sql`SELECT status, COUNT(*)::int as count FROM orders GROUP BY status`.catch(() => []),
    sql`
      SELECT o.id, o.order_number, o.customer_name, o.status, o.created_at,
        COALESCE(SUM(oi.price * oi.quantity), 0) as total
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id, o.order_number, o.customer_name, o.status, o.created_at
      ORDER BY o.created_at DESC LIMIT 5
    `.catch(() => []),
  ]);

  return {
    totalProducts: parseInt(String(productCountRows[0]?.count ?? "0"), 10),
    totalUnits: parseInt(String(unitsRows[0]?.total ?? "0"), 10),
    lowStockCount: parseInt(String(lowStockRows[0]?.count ?? "0"), 10),
    recentlyUpdated: recentRows as unknown as Product[],
    categoryBreakdown: categoryRows as { category: string; icon: string; count: number }[],
    totalCategories: categoryRows.length,
    newOrdersCount: parseInt(String(newOrdersRows[0]?.count ?? "0"), 10),
    monthlyProfit: parseFloat(String(monthlyRows[0]?.profit ?? "0")),
    monthlyRevenue: parseFloat(String(monthlyRows[0]?.revenue ?? "0")),
    totalClients: parseInt(String(clientCountRows[0]?.count ?? "0"), 10),
    orderStatusBreakdown: statusRows as { status: string; count: number }[],
    recentOrders: recentOrderRows as { id: number; order_number: string; customer_name: string; status: string; created_at: string; total: number }[],
  };
}

// ─── Profit ───────────────────────────────────────────────────────────────────

export async function getProfitData(filters: { startDate?: string; endDate?: string }) {
  await ensureProductsTable();
  await ensureOrdersTable();
  await ensureOrderItemsTable();

  const { startDate, endDate } = filters;

  const [salesRows, inventoryRows, categoryRows, statsRows] = await Promise.all([
    startDate && endDate
      ? sql`
          SELECT
            oi.product_name, oi.product_sku,
            SUM(oi.quantity) as units_sold,
            SUM(oi.price * oi.quantity) as revenue,
            SUM((oi.price - COALESCE(NULLIF(oi.cost, 0), 0)) * oi.quantity) as profit
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE o.status = 'completed'
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          GROUP BY oi.product_name, oi.product_sku
          ORDER BY profit DESC
        `.catch(() => [])
      : sql`
          SELECT
            oi.product_name, oi.product_sku,
            SUM(oi.quantity) as units_sold,
            SUM(oi.price * oi.quantity) as revenue,
            SUM((oi.price - COALESCE(NULLIF(oi.cost, 0), 0)) * oi.quantity) as profit
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE o.status = 'completed'
          GROUP BY oi.product_name, oi.product_sku
          ORDER BY profit DESC
        `.catch(() => []),
    sql`
      SELECT id, product_name, category, sku, quantity, price, cost,
        (price * quantity) as stock_value,
        ((price - cost) * quantity) as potential_profit,
        CASE WHEN price > 0 THEN ROUND(((price - cost) / price) * 100, 2) ELSE 0 END as margin_pct
      FROM products
      ORDER BY potential_profit DESC
    `.catch(() => []),
    sql`
      SELECT
        p.category,
        c.icon,
        COUNT(DISTINCT p.id)::int as products,
        SUM(p.price * p.quantity) as stock_value,
        SUM((p.price - p.cost) * p.quantity) as potential_profit,
        CASE WHEN SUM(p.price * p.quantity) > 0
          THEN ROUND((SUM((p.price - p.cost) * p.quantity) / SUM(p.price * p.quantity)) * 100, 2)
          ELSE 0
        END as avg_margin
      FROM products p
      LEFT JOIN categories c ON c.name = p.category
      GROUP BY p.category, c.icon
      ORDER BY potential_profit DESC
    `.catch(() => []),
    startDate && endDate
      ? sql`
          SELECT
            COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
            COALESCE(SUM((oi.price - COALESCE(NULLIF(oi.cost, 0), 0)) * oi.quantity), 0) as profit,
            COALESCE(SUM(oi.quantity), 0) as units_sold,
            COUNT(DISTINCT o.id)::int as order_count
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          WHERE o.status = 'completed'
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
        `.catch(() => [{ revenue: 0, profit: 0, units_sold: 0, order_count: 0 }])
      : sql`
          SELECT
            COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
            COALESCE(SUM((oi.price - COALESCE(NULLIF(oi.cost, 0), 0)) * oi.quantity), 0) as profit,
            COALESCE(SUM(oi.quantity), 0) as units_sold,
            COUNT(DISTINCT o.id)::int as order_count
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          WHERE o.status = 'completed'
        `.catch(() => [{ revenue: 0, profit: 0, units_sold: 0, order_count: 0 }]),
  ]);

  const allTimeRows = await sql`
    SELECT
      COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
      COALESCE(SUM((oi.price - COALESCE(NULLIF(oi.cost, 0), 0)) * oi.quantity), 0) as profit
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'completed'
  `.catch(() => [{ revenue: 0, profit: 0 }]);

  return {
    sales: salesRows,
    inventory: inventoryRows,
    categories: categoryRows,
    stats: statsRows[0] ?? { revenue: 0, profit: 0, units_sold: 0, order_count: 0 },
    allTime: allTimeRows[0] ?? { revenue: 0, profit: 0 },
  };
}

// ─── Monthly Report ───────────────────────────────────────────────────────────

export async function getMonthlyReportData() {
  await ensureOrdersTable();
  await ensureOrderItemsTable();
  await ensureProductsTable();

  const [ordersRows, productsRows, statusRows, lowStockRows] = await Promise.all([
    sql`
      SELECT o.*,
        COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', NOW())
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `.catch(() => []),
    sql`SELECT * FROM products ORDER BY category, product_name`.catch(() => []),
    sql`
      SELECT status, COUNT(*)::int as count,
        COALESCE(SUM(oi.price * oi.quantity), 0) as total_value
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', NOW())
      GROUP BY o.status
    `.catch(() => []),
    sql`SELECT * FROM products WHERE quantity <= ${LOW_STOCK_THRESHOLD} ORDER BY quantity ASC`.catch(() => []),
  ]);

  return { orders: ordersRows, products: productsRows, statusBreakdown: statusRows, lowStock: lowStockRows };
}

// ─── Supplier Invoices ────────────────────────────────────────────────────────

export async function ensureSupplierInvoicesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS supplier_invoices (
      id SERIAL PRIMARY KEY,
      invoice_number TEXT,
      supplier_name TEXT NOT NULL,
      invoice_date TEXT,
      total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      notes TEXT,
      import_source TEXT NOT NULL DEFAULT 'excel',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_supplier_invoices_created_at ON supplier_invoices(created_at DESC)`;
}

export async function ensureSupplierInvoiceItemsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS supplier_invoice_items (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
      product_name TEXT NOT NULL,
      category TEXT,
      quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
      unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_invoice_id ON supplier_invoice_items(invoice_id)`;
}

export async function createSupplierInvoice(data: {
  invoice_number?: string | null;
  supplier_name: string;
  invoice_date?: string | null;
  total_amount: number;
  notes?: string | null;
  import_source?: string;
  items: { product_name: string; category?: string | null; quantity: number; unit_cost: number }[];
}) {
  await ensureSupplierInvoicesTable();
  await ensureSupplierInvoiceItemsTable();
  const rows = await sql`
    INSERT INTO supplier_invoices (invoice_number, supplier_name, invoice_date, total_amount, notes, import_source)
    VALUES (${data.invoice_number ?? null}, ${data.supplier_name || "Unknown Supplier"}, ${data.invoice_date ?? null}, ${data.total_amount}, ${data.notes ?? null}, ${data.import_source ?? "excel"})
    RETURNING *
  `;
  const invoice = rows[0];
  for (const item of data.items) {
    await sql`
      INSERT INTO supplier_invoice_items (invoice_id, product_name, category, quantity, unit_cost)
      VALUES (${invoice.id as number}, ${item.product_name}, ${item.category ?? null}, ${item.quantity}, ${item.unit_cost})
    `;
  }
  return invoice;
}

export async function getSupplierInvoices(limit = 100) {
  await ensureSupplierInvoicesTable();
  const rows = await sql`SELECT * FROM supplier_invoices ORDER BY created_at DESC LIMIT ${limit}`;
  return rows;
}

export async function getSupplierInvoiceById(id: number) {
  await ensureSupplierInvoicesTable();
  await ensureSupplierInvoiceItemsTable();
  const rows = await sql`SELECT * FROM supplier_invoices WHERE id = ${id}`;
  if (!rows[0]) return null;
  const items = await sql`SELECT * FROM supplier_invoice_items WHERE invoice_id = ${id} ORDER BY id`;
  return { ...rows[0], items };
}

// ─── Invoice Activity ─────────────────────────────────────────────────────────

export async function logInvoiceActivity(data: {
  order_id: number;
  action_type: "printed" | "emailed";
  recipient_email?: string | null;
  notes?: string | null;
}) {
  await ensureInvoiceActivityTable();
  await sql`
    INSERT INTO invoice_activity (order_id, action_type, recipient_email, notes)
    VALUES (${data.order_id}, ${data.action_type}, ${data.recipient_email ?? null}, ${data.notes ?? null})
  `;
}

export async function getOrderActivity(orderId: number) {
  await ensureInvoiceActivityTable();
  const rows = await sql`
    SELECT * FROM invoice_activity WHERE order_id = ${orderId} ORDER BY performed_at DESC
  `;
  return rows;
}

// ─── Brands ───────────────────────────────────────────────────────────────────

export async function ensureBrandsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS brands (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      image_url TEXT,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug)`;
}

export async function ensureProductBrandColumn() {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT`;
}

export function normalizeBrandName(raw: string): string {
  let s = raw.trim();
  s = s.replace(/\./g, " ");
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/^[,.\s]+|[,.\s]+$/g, "");
  s = s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return s;
}

export function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getBrands(): Promise<Brand[]> {
  await ensureBrandsTable();
  const rows = await sql`SELECT * FROM brands ORDER BY name`;
  return rows as unknown as Brand[];
}

export async function getBrandWithProductCount(): Promise<(Brand & { product_count: number })[]> {
  await ensureBrandsTable();
  await ensureProductsTable();
  await ensureProductBrandColumn();
  const rows = await sql`
    SELECT b.*, COUNT(p.id)::int as product_count
    FROM brands b
    LEFT JOIN products p ON p.brand = b.name
    GROUP BY b.id
    ORDER BY b.name
  `;
  return rows as unknown as (Brand & { product_count: number })[];
}

export async function upsertBrand(rawName: string, imageUrl?: string | null): Promise<Brand> {
  await ensureBrandsTable();
  const name = normalizeBrandName(rawName);
  const slug = brandSlug(name);
  if (imageUrl != null) {
    const rows = await sql`
      INSERT INTO brands (name, slug, image_url)
      VALUES (${name}, ${slug}, ${imageUrl})
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        image_url = COALESCE(brands.image_url, EXCLUDED.image_url),
        updated_at = NOW()
      RETURNING *
    `;
    return rows[0] as Brand;
  } else {
    const rows = await sql`
      INSERT INTO brands (name, slug)
      VALUES (${name}, ${slug})
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
      RETURNING *
    `;
    return rows[0] as Brand;
  }
}

export async function updateBrand(
  id: number,
  data: Partial<{ name: string; image_url: string | null; description: string | null }>
): Promise<Brand | null> {
  await ensureBrandsTable();
  const slugVal = data.name ? brandSlug(normalizeBrandName(data.name)) : null;
  const rows = await sql`
    UPDATE brands SET
      name = COALESCE(${data.name ?? null}, name),
      slug = COALESCE(${slugVal}, slug),
      image_url = CASE WHEN ${data.image_url !== undefined} THEN ${data.image_url ?? null} ELSE image_url END,
      description = CASE WHEN ${data.description !== undefined} THEN ${data.description ?? null} ELSE description END,
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as Brand) ?? null;
}

export async function deleteBrand(id: number): Promise<void> {
  await ensureBrandsTable();
  await sql`DELETE FROM brands WHERE id = ${id}`;
}
