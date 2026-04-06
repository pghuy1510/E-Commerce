import { api } from "./api";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
}

export const login = (data: LoginPayload) => api.post("/auth/login", data);

export const register = (data: RegisterPayload) =>
  api.post("/auth/register", data);
