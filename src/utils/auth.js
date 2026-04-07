import { api } from "./api";

/* ─── Auth APIs ─── */

export const registerUser = async (payload) => {
  const res = await api.post("/auth/signup", payload);
  return res.data;
};

export const loginUser = async (payload) => {
  const res = await api.post("/auth/signin", payload);
  return res.data;
};

/* ─── Session Helpers ─── */

export const setSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const getSession = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};