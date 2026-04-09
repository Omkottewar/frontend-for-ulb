import { api } from "../utils/api.js";
 
/* ─── Checklists by file ─── */
export const getChecklistsByFile = async (fileId) => {
  const res = await api.get(`/files/${fileId}/checklists`);
  return res.data.checklists || [];
};
 
/* ─── Create checklist ─── */
export const createChecklistForFile = async (fileId, payload) => {
  const res = await api.post(`/files/${fileId}/checklists`, payload);
  return res.data;
};
 
/* ─── Update checklist meta ─── */
export const updateChecklist = async (checklistId, payload) => {
  const res = await api.patch(`/checklists/${checklistId}`, payload);
  return res.data;
};
 
/* ─── Get checklist details ─── */
export const getChecklistDetails = async (checklistId) => {
  const res = await api.get(`/checklists/${checklistId}/details`);
  return res.data;
};
 
/* ─── Save responses ─── */
export const saveChecklistResponses = async (checklistId, responses) => {
  const res = await api.post(`/checklists/${checklistId}/responses`, { responses });
  return res.data;
};
 
/* ─── Get checklist attachments ─── */
export const getChecklistAttachments = async (checklistId) => {
  const res = await api.get(`/checklists/${checklistId}/attachments`);
  return res.data.attachments || [];
};
 
/* ─── Upload checklist attachments ─── */
export const uploadChecklistAttachments = async (fileId, checklistId, files) => {
  const formData = new FormData();

  files.forEach(({ field, file }) => {
    formData.append(field, file); // ✅ use the correct field name
  });

  const res = await api.post(
    `/files/${fileId}/checklists/${checklistId}/attachments`,
    formData,
    {
      headers: { "Content-Type": undefined },
    }
  );

  return res.data;
};