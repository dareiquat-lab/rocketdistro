import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const products = [
  { product_name: "Coca-Cola 12pk Cans", category: "Beverages", sku: "BVR-001", quantity: 144, price: 8.99, cost: 5.50, notes: "12 fl oz cans" },
  { product_name: "Red Bull Energy 8.4oz", category: "Beverages", sku: "BVR-002", quantity: 96, price: 3.49, cost: 1.80 },
  { product_name: "Monster Energy Original 16oz", category: "Beverages", sku: "BVR-003", quantity: 72, price: 3.99, cost: 2.10 },
  { product_name: "Lay's Classic Chips 1oz", category: "Snacks", sku: "SNK-001", quantity: 200, price: 1.29, cost: 0.60 },
  { product_name: "Doritos Nacho Cheese 1.75oz", category: "Snacks", sku: "SNK-002", quantity: 180, price: 1.79, cost: 0.85 },
  { product_name: "Kind Bar Almond & Honey", category: "Snacks", sku: "SNK-003", quantity: 120, price: 1.99, cost: 1.10 },
  { product_name: "Marlboro Red Cigarettes", category: "Tobacco", sku: "TOB-001", quantity: 50, price: 9.99, cost: 7.20 },
  { product_name: "Newport Menthol 100s", category: "Tobacco", sku: "TOB-002", quantity: 40, price: 10.49, cost: 7.80 },
  { product_name: "Swisher Sweets Original 2pk", category: "Tobacco", sku: "TOB-003", quantity: 100, price: 1.99, cost: 1.10 },
  { product_name: "AA Batteries 4pk Duracell", category: "Electronics", sku: "ELC-001", quantity: 80, price: 5.99, cost: 3.20 },
  { product_name: "USB-C Cable 6ft Braided", category: "Electronics", sku: "ELC-002", quantity: 60, price: 12.99, cost: 4.50 },
  { product_name: "Phone Screen Protector Universal", category: "Accessories", sku: "ACC-001", quantity: 50, price: 4.99, cost: 1.20 },
  { product_name: "Lighter Bic Classic Assorted", category: "Accessories", sku: "ACC-002", quantity: 150, price: 1.49, cost: 0.65 },
  { product_name: "Advil Ibuprofen 200mg 24ct", category: "Health", sku: "HLT-001", quantity: 45, price: 7.99, cost: 4.50 },
  { product_name: "Tylenol Extra Strength 24ct", category: "Health", sku: "HLT-002", quantity: 6, price: 8.49, cost: 5.20 },
  { product_name: "Fabuloso Multi-Purpose Cleaner 22oz", category: "Cleaning", sku: "CLN-001", quantity: 60, price: 2.99, cost: 1.40 },
  { product_name: "Paper Towels Bounty 2-Roll", category: "Paper Goods", sku: "PPR-001", quantity: 30, price: 4.99, cost: 2.80 },
  { product_name: "Snickers Chocolate Bar 1.86oz", category: "Candy", sku: "CND-001", quantity: 240, price: 1.49, cost: 0.70 },
  { product_name: "Skittles Original 2.17oz", category: "Candy", sku: "CND-002", quantity: 200, price: 1.29, cost: 0.60 },
  { product_name: "General Purpose Tape Clear 3pk", category: "General", sku: "GEN-001", quantity: 8, price: 3.99, cost: 1.80 },
];

async function main() {
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
