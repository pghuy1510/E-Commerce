export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    
    let payloadStr = "";
    if (typeof window === "undefined") {
      // Node.js (Server-side) environment
      payloadStr = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    } else {
      // Browser environment
      payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    }
    
    const payload = JSON.parse(payloadStr);
    if (typeof payload.exp !== "number") return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}
