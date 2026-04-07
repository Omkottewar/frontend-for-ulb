import { api } from "../utils/api";

export const uploadAttachments = async (fileId, checklistId, attachments) => {
  const formData = new FormData();

  attachments.forEach((a) => {
    formData.append(a.field, a.file);
  });

  const res = await api.post(
    `/files/${fileId}/checklists/${checklistId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};