import { getMonthlyReportData } from "@/lib/db";
import { ReportPrintClient } from "@/components/admin/ReportPrintClient";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const data = await getMonthlyReportData().catch(() => ({
    orders: [], products: [], statusBreakdown: [], lowStock: [],
  }));
  return <ReportPrintClient data={data as Parameters<typeof ReportPrintClient>[0]["data"]} />;
}
