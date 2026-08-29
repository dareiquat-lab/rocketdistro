import { NextRequest, NextResponse } from "next/server";
import { getAllProductsForExport } from "@/lib/db";
import { cookies } from "next/headers";
import { computeAdminToken, ADMIN_COOKIE } from "@/lib/auth-utils";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;
    const expected = await computeAdminToken(process.env.ADMIN_PASSWORD || "");
    if (!token || token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "csv";
    const products = await getAllProductsForExport();

    if (format === "json") {
      return NextResponse.json(products, {
        headers: { "Content-Disposition": "attachment; filename=products.json" },
      });
    }

    const wsData = products.map((p) => ({
      ID: p.id,
      "Product Name": p.product_name,
      Category: p.category,
      SKU: p.sku,
      Quantity: p.quantity,
      Price: p.price,
      Cost: p.cost,
      Barcode: p.barcode ?? "",
      Notes: p.notes ?? "",
      "Created At": p.created_at,
      "Updated At": p.updated_at,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    const csvBuffer = XLSX.write(wb, { type: "buffer", bookType: "csv" });

    return new NextResponse(csvBuffer, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=products.csv",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
