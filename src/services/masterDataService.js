import { api } from "../utils/api";

export const getUlbs = () => api("/ulbs");

export const getContractTypes = async () => {
  const res = await api.get("/master-data/contract-types");
  return res.data;
};