import { api } from "./api";
import { isTokenExpired } from "./jwt";
import { signOut } from "next-auth/react";

let logoutInProgress = false;

export async function logoutExpiredSession() {
  if (typeof window === "undefined") return;
  if (logoutInProgress) return;
  logoutInProgress = true;
  try {
    setAuthToken(null);
    localStorage.removeItem("username");
    await signOut({ redirect: false });
  } catch (err) {
    console.error("Failed to sign out expired session:", err);
  } finally {
    logoutInProgress = false;
  }
}


const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const localToken = localStorage.getItem("token");

  if (localToken) {
    if (localToken === "test123") {
      localStorage.removeItem("token");
    } else {
      if (isTokenExpired(localToken)) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return null;
      }
      return localToken;
    }
  }

  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  if (match) {
    const cookieToken = decodeURIComponent(match[1]);
    if (isTokenExpired(cookieToken)) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      return null;
    }
    return cookieToken;
  }

  return null;
};

export const getBrowserToken = () => {
  return getAuthToken();
};

export const setAuthToken = (token: string | null) => {
  if (typeof window === "undefined") return;

  if (token) {
    localStorage.setItem("token", token);

    document.cookie = `token=${encodeURIComponent(token)}; path=/`;

    // QUAN TRỌNG
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    return;
  }

  localStorage.removeItem("token");

  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  delete api.defaults.headers.common.Authorization;
};
