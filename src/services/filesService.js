import { api } from "../utils/api.js";

export const createFile = async (payload) => {

  const res = await api.post("/files", payload);

  return res.data;
};

export const getFiles = async () => {
  const res = await api.get("/user-files");

  // console.log("FULL RESPONSE:", res);
  // console.log("DATA:", res.data);

  return res.data;
};

/**
 * Fetch full details of a single file (file info + ULB + supplier).
 *
 * @param {string} fileId – UUID of the file
 * @returns {{ file, ulb, supplier }} – raw API response data
 */
export const getFileDetail = async (fileId) => {
  const res = await api.get(`/files/${fileId}`);
  return res.data.data;
};
 
/**
 * Update editable fields on a file.
 * Sends only the fields that changed (partial body).
 *
 * @param {string} fileId – UUID of the file
 * @param {object} payload – { fileNumber?, title?, description?, amount?, riskFlag?, reason? }
 * @returns {{ fileId, versionNumber, changesCount }}
 */
export const updateFile = async (fileId, payload) => {
  const res = await api.patch(`/files/${fileId}`, payload);
  return res.data.data;
};

/**
 * Fetch the full version history of a file with field-level diffs.
 *
 * @param {string} fileId – UUID of the file
 * @returns {{ fileId, totalVersions, versions: [...] }}
 */
export const getFileVersions = async (fileId) => {
  const res = await api.get(`/files/${fileId}/versions`);
  return res.data.data;
};