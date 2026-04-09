const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET;

/**
 * Generates a public download URL for a Supabase Storage file.
 * @param {string} storagePath - e.g. "checklists/422ab8e7.../filename.jpg"
 */

export const getStorageUrl = (storagePath) => {
  if (!storagePath) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
};
// utils/storage.js — add this alongside downloadFile
export const getFileUrl = async (storagePath) => {
  const supabase = getSupabase(); // your supabase client
  const { data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 60 * 60); // 1 hour expiry
  return data?.signedUrl ?? null;
};
export const downloadFile = async (storagePath, fileName) => {
  try {
    const url = getStorageUrl(storagePath);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download error:", err);
    alert("Failed to download file.");
  }
};