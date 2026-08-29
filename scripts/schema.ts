import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Creating tables...");

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
  console.log("✓ products table");

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
  console.log("✓ categories table");

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
  console.log("✓ clients table");

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`;
  console.log("✓ orders table");

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      product_sku TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      cost NUMERIC(10,2) NOT NULL DEFAULT 0
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`;
  console.log("✓ order_items table");

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
  console.log("✓ invoice_activity table");

  // Seed categories
  const categories = [
    { name: "General", icon: "📦" },
    { name: "Beverages", icon: "🥤" },
    { name: "Snacks", icon: "🍿" },
    { name: "Tobacco", icon: "🚬" },
    { name: "Electronics", icon: "🔋" },
    { name: "Accessories", icon: "⚙️" },
    { name: "Health", icon: "💊" },
    { name: "Cleaning", icon: "🧹" },
    { name: "Paper Goods", icon: "📄" },
    { name: "Candy", icon: "🍬" },
  ];

  for (const cat of categories) {
    await sql`INSERT INTO categories (name, icon) VALUES (${cat.name}, ${cat.icon}) ON CONFLICT (name) DO NOTHING`;
  }
  console.log("✓ seeded categories");
  console.log("Schema push complete!");
}

main().catch((e) => { console.error(e); process.exit(1); });
