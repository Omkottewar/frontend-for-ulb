const DB_NAME = "ulb_audit_db";
const DB_VERSION = 1;
const STORE_NAME = "file_attachments";

const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("fileNumber", "fileNumber", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

// Get all IDs for a given fileNumber (used before deleting)
const getIdsByFileNumber = (db, fileNumber) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index("fileNumber");
    const req = index.getAllKeys(IDBKeyRange.only(fileNumber));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

// Delete records by their primary keys
const deleteByIds = (db, ids) =>
  new Promise((resolve, reject) => {
    if (ids.length === 0) { resolve(); return; }
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    ids.forEach((id) => store.delete(id));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

// Insert all attachments in a single transaction
const insertAttachments = (db, fileNumber, attachments) =>
  new Promise((resolve, reject) => {
    if (attachments.length === 0) { resolve(); return; }
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    attachments.forEach((att) => {
      store.add({
        fileNumber,
        checklistId: att.checklistId ?? "CHK-001",
        name: att.name,
        size: att.size,
        mimeType: att.mimeType,
        fileType: att.fileType,
        blob: att.blob, // File / Blob — IDB stores this natively
        category: att.category ?? null,
        slot: att.slot ?? null,
        description: att.description ?? null,
      });
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

// Public: save attachments for a fileNumber (replaces any existing ones)
export const saveAttachments = async (fileNumber, attachments) => {
  const db = await openDB();
  const existingIds = await getIdsByFileNumber(db, fileNumber);
  await deleteByIds(db, existingIds);
  await insertAttachments(db, fileNumber, attachments);
};

// Public: get all attachments for a fileNumber
export const getAttachments = async (fileNumber) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index("fileNumber");
    const req = index.getAll(IDBKeyRange.only(fileNumber));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

// Public: get attachments for a specific checklist
export const getAttachmentsByChecklist = async (fileNumber, checklistId) => {
  const all = await getAttachments(fileNumber);
  return all.filter((a) => (a.checklistId ?? "CHK-001") === checklistId);
};

// Public: add a single attachment for a checklist; returns IDB id for later removal
export const addChecklistAttachment = async (fileNumber, checklistId, attachment) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).add({
      fileNumber,
      checklistId,
      name: attachment.name,
      size: attachment.size,
      mimeType: attachment.mimeType,
      fileType: attachment.fileType,
      blob: attachment.blob,
      category: attachment.category ?? null,
      slot: attachment.slot ?? null,
      description: attachment.description ?? null,
    });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

// Public: remove a single attachment by its IDB primary key
export const removeChecklistAttachment = async (idbId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(idbId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};

// Public: trigger browser download for a stored attachment
export const downloadAttachment = (att) => {
  const url = URL.createObjectURL(att.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = att.name;
  a.click();
  URL.revokeObjectURL(url);
};