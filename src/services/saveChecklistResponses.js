import { api } from "../utils/api";

export const saveChecklistResponses = async (checklistId, responses) => {
  const res = await api.post(
    `/checklists/${checklistId}/responses`,
    { responses }
  );

  return res.data;
};