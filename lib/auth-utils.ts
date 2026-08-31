export const ADMIN_COOKIE = "rd_admin_token";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const STAFF_COOKIE = "rd_staff_token";
export const STAFF_PASSWORD = "rocketstaff";

export async function computeAdminToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode("rocket-distro-admin:" + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function computeStaffToken(): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode("rocket-distro-staff:" + STAFF_PASSWORD);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isAdminOrStaff(adminToken: string | undefined, staffToken: string | undefined): Promise<boolean> {
  const expectedAdmin = await computeAdminToken(process.env.ADMIN_PASSWORD || "");
  if (adminToken && adminToken === expectedAdmin) return true;
  const expectedStaff = await computeStaffToken();
  return !!(staffToken && staffToken === expectedStaff);
}
