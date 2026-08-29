import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const categories = [
  { name: "Beverages", icon: "🥤" },
  { name: "Snacks", icon: "🍿" },
  { name: "Tobacco", icon: "🚬" },
  { name: "General", icon: "📦" },
];

const products = [
  { product_name: "Sample Beverage A", category: "Beverages", sku: "BVR-001", quantity: 100, price: 4.99, cost: 2.50, notes: "Example beverage product" },
  { product_name: "Sample Beverage B", category: "Beverages", sku: "BVR-002", quantity: 80, price: 3.99, cost: 1.80, notes: null },
  { product_name: "Sample Snack A", category: "Snacks", sku: "SNK-001", quantity: 150, price: 2.49, cost: 1.00, notes: null },
  { product_name: "Sample Snack B", category: "Snacks", sku: "SNK-002", quantity: 4, price: 1.99, cost: 0.85, notes: null },
  { product_name: "Sample Tobacco A", category: "Tobacco", sku: "TOB-001", quantity: 60, price: 9.99, cost: 7.00, notes: null },
  { product_name: "Sample General Item", category: "General", sku: "GEN-001", quantity: 50, price: 5.99, cost: 3.00, notes: "General purpose item" },
];

async function main() {
  console.log("Seeding categories...");
  for (const cat of categories) {
    await sql`INSERT INTO categories (name, icon) VALUES (${cat.name}, ${cat.icon}) ON CONFLICT (name) DO NOTHING`;
    console.log(`✓ ${cat.name}`);
  }

  console.log("Seeding products...");
  for (const p of products) {
    await sql`
      INSERT INTO products (product_name, category, sku, quantity, price, cost, notes)
      VALUES (${p.product_name}, ${p.category}, ${p.sku}, ${p.quantity}, ${p.price}, ${p.cost}, ${p.notes ?? null})
      ON CONFLICT (sku) DO NOTHING
    `;
    console.log(`✓ ${p.product_name}`);
  }
  console.log("Seeding complete!");
}

main().catch((e) => { console.error(e); process.exit(1); });
