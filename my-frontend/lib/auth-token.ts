import { api } from "./api";

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const localToken = localStorage.getItem("token");

  if (localToken) {
    return localToken;
  }

  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);

  return match ? decodeURIComponent(match[1]) : null;
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
