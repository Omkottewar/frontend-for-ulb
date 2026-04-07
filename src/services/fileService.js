import { api } from "../utils/api";

export const updateFileSupplier = async (fileId, supplierId) => {

  const res = await api.patch(
    `/files/${fileId}/supplier`,
    { supplierId }
  );

  return res.data;
};