import { api } from "../utils/api";

export const createSupplier = async (payload) => {
  const res = await api.post("/suppliers", payload);
  return res.data;
};