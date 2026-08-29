export interface Product {
  id: number;
  product_name: string;
  category: string;
  sku: string;
  quantity: number;
  price: number;
  cost: number;
  image_url: string | null;
  barcode: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = "new" | "contacted" | "ready" | "completed" | "cancelled";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  price: number;
  cost: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string | null;
  status: OrderStatus;
  client_id: number | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface Client {
  id: number;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  tobacco_license_number: string | null;
  sellers_permit_number: string | null;
  client_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRecord {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  recentlyUpdated: Product[];
  categoryBreakdown: { category: string; icon: string; count: number }[];
  totalCategories: number;
  newOrdersCount: number;
  monthlyProfit: number;
  monthlyRevenue: number;
}

export interface CartItem {
  id: number;
  product_name: string;
  sku: string;
  price: number;
  image_url: string | null;
  category: string;
  quantity: number;
  stock: number;
}

export interface InvoiceActivity {
  id: number;
  order_id: number;
  action_type: "printed" | "emailed";
  performed_at: string;
  recipient_email: string | null;
  notes: string | null;
}

export const ORDER_STATUSES = [
  { value: "new", label: "New", color: "#2563eb" },
  { value: "contacted", label: "Contacted", color: "#7c3aed" },
  { value: "ready", label: "Ready", color: "#d97706" },
  { value: "completed", label: "Completed", color: "#16a34a" },
  { value: "cancelled", label: "Cancelled", color: "#dc2626" },
] as const;

export const CLIENT_TYPES = ["Retailer", "Store Owner", "Distributor", "Supplier", "Chain Store", "Other"] as const;
export type ClientType = typeof CLIENT_TYPES[number];
