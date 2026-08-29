export const ADMIN_COOKIE = "rd_admin_token";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function computeAdminToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode("rocket-distro-admin:" + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
