import { useState, useEffect, useRef } from "react";
import {
  getAttachmentsByChecklist,
  addChecklistAttachment,
  removeChecklistAttachment,
} from "../utils/db";

// ── Constants (mirrored from NewFilePage) ───────────────────────────
const MANDATORY_SLOTS = [
  { key: "page1", label: "1st Page" },
  { key: "last3", label: "Last Page - 2" },
  { key: "last2", label: "Last Page - 1" },
  { key: "last1", label: "Last Page" },
];

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileType = (file) => {
  if (file.type?.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (file.type?.includes("word") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) return "word";
  if (file.type?.includes("excel") || file.type?.includes("spreadsheet") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) return "excel";
  if (file.type?.startsWith("text/")) return "text";
  return "other";
};

// ── ChecklistAttachments ────────────────────────────────────────────
export default function ChecklistAttachments({ fileNumber, checklistId, disabled }) {
  const [mandatoryPhotos, setMandatoryPhotos] = useState({
    page1: null, last3: null, last2: null, last1: null,
    // each slot: null | { blob: Blob, idbId: number, name: string }
  });
  const [pagePhotos, setPagePhotos] = useState([]);
  // [{ blob: Blob, description: string, idbId: number, name: string }]
  const [documents, setDocuments] = useState([]);
  // [{ blob: Blob, idbId: number, name: string, size: number }]
  const [docDragOver, setDocDragOver] = useState(false);
  const [loading, setLoading] = useState(true);

  const mandatoryRefs = {
    page1: useRef(null), last3: useRef(null),
    last2: useRef(null), last1: useRef(null),
  };
  const pagePhotoRef = useRef(null);
  const docInputRef = useRef(null);

  // ── Load existing attachments from IDB on mount ──
  useEffect(() => {
    setLoading(true);
    setMandatoryPhotos({ page1: null, last3: null, last2: null, last1: null });
    setPagePhotos([]);
    setDocuments([]);

    getAttachmentsByChecklist(fileNumber, checklistId)
      .then((records) => {
        const mandatory = { page1: null, last3: null, last2: null, last1: null };
        const pages = [];
        const docs = [];
        records.forEach((r) => {
          if (r.category === "mandatory" && r.slot) {
            mandatory[r.slot] = { blob: r.blob, idbId: r.id, name: r.name };
          } else if (r.category === "page") {
            pages.push({ blob: r.blob, description: r.description ?? "", idbId: r.id, name: r.name });
          } else {
            docs.push({ blob: r.blob, idbId: r.id, name: r.name, size: r.size });
          }
        });
        setMandatoryPhotos(mandatory);
        setPagePhotos(pages);
        setDocuments(docs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fileNumber, checklistId]);

  // ── Handlers ──
  const handleMandatoryUpload = async (key, files) => {
    const file = files[0];
    if (!file) return;
    // Remove old IDB record if exists
    if (mandatoryPhotos[key]?.idbId != null) {
      await removeChecklistAttachment(mandatoryPhotos[key].idbId);
    }
    const slot = MANDATORY_SLOTS.find((s) => s.key === key);
    const idbId = await addChecklistAttachment(fileNumber, checklistId, {
      name: file.name, size: file.size, mimeType: file.type,
      fileType: "image", blob: file,
      category: "mandatory", slot: key, description: slot?.label ?? key,
    });
    setMandatoryPhotos((prev) => ({ ...prev, [key]: { blob: file, idbId, name: file.name } }));
  };

  const handleMandatoryRemove = async (key) => {
    const item = mandatoryPhotos[key];
    if (item?.idbId != null) await removeChecklistAttachment(item.idbId);
    setMandatoryPhotos((prev) => ({ ...prev, [key]: null }));
  };

  const addPagePhoto = async (files) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith("image/"));
    for (const file of incoming) {
      const idbId = await addChecklistAttachment(fileNumber, checklistId, {
        name: file.name, size: file.size, mimeType: file.type,
        fileType: "image", blob: file,
        category: "page", slot: null, description: "",
      });
      setPagePhotos((prev) => [...prev, { blob: file, description: "", idbId, name: file.name }]);
    }
  };

  const updatePagePhotoDesc = (index, desc) => {
    setPagePhotos((prev) => prev.map((p, i) => i === index ? { ...p, description: desc } : p));
  };

  const removePagePhoto = async (index) => {
    const item = pagePhotos[index];
    if (item?.idbId != null) await removeChecklistAttachment(item.idbId);
    setPagePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const addDocuments = async (files) => {
    const incoming = Array.from(files);
    for (const file of incoming) {
      const idbId = await addChecklistAttachment(fileNumber, checklistId, {
        name: file.name, size: file.size, mimeType: file.type,
        fileType: getFileType(file), blob: file,
        category: "document", slot: null, description: null,
      });
      setDocuments((prev) => [...prev, { blob: file, idbId, name: file.name, size: file.size }]);
    }
  };

  const removeDocument = async (index) => {
    const item = documents[index];
    if (item?.idbId != null) await removeChecklistAttachment(item.idbId);
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocDrop = (e) => {
    e.preventDefault();
    setDocDragOver(false);
    addDocuments(e.dataTransfer.files);
  };

  // ── Loading ──
  if (loading) {
    return <p className="text-sm text-gray-400 py-4">Loading attachments...</p>;
  }

  // ── Read-only view (disabled/finalized) ──
  if (disabled) {
    const hasAny =
      Object.values(mandatoryPhotos).some(Boolean) ||
      pagePhotos.length > 0 ||
      documents.length > 0;
    if (!hasAny) {
      return <p className="text-sm text-gray-400 italic">No attachments for this checklist.</p>;
    }
    return (
      <div className="space-y-4">
        {Object.values(mandatoryPhotos).some(Boolean) && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Page Photos</p>
            <div className="grid grid-cols-2 gap-3">
              {MANDATORY_SLOTS.map((slot) => {
                const item = mandatoryPhotos[slot.key];
                if (!item) return null;
                return (
                  <div key={slot.key} className="border border-gray-200 rounded-lg overflow-hidden">
                    <img src={URL.createObjectURL(item.blob)} alt={slot.label} className="w-full h-32 object-cover" />
                    <div className="px-2.5 py-1.5">
                      <span className="text-xs font-medium text-gray-600">{slot.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {pagePhotos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 pt-4 pb-2">Intermediate Page Photos</p>
            {pagePhotos.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-50">
                <img src={URL.createObjectURL(p.blob)} alt={p.name} className="w-12 h-12 object-cover rounded-md border border-gray-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        {documents.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 pt-4 pb-2">Other Documents</p>
            {documents.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded shrink-0">{d.name.split(".").pop()}</span>
                  <span className="text-sm text-gray-700 truncate">{d.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatSize(d.size)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Upload UI ──
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="grid grid-cols-2 gap-6">

        {/* Left: Mandatory Page Photos */}
        <div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-sm font-semibold text-gray-700">Page Photos</span>
            <span className="text-xs text-gray-400">1st page and last 3 pages</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MANDATORY_SLOTS.map((slot) => {
              const item = mandatoryPhotos[slot.key];
              return (
                <div key={slot.key}>
                  <input
                    ref={mandatoryRefs[slot.key]}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleMandatoryUpload(slot.key, e.target.files)}
                  />
                  {item ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <img src={URL.createObjectURL(item.blob)} alt={slot.label} className="w-full h-32 object-cover" />
                      <div className="px-2.5 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 truncate">{slot.label}</span>
                        <button onClick={() => handleMandatoryRemove(slot.key)} className="text-gray-300 hover:text-red-400 text-lg leading-none ml-1 shrink-0 transition-colors">×</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => mandatoryRefs[slot.key].current.click()} className="w-full h-32 border-2 border-dashed border-gray-200 hover:border-[#1a2744] rounded-lg flex flex-col items-center justify-center gap-1.5 transition-colors group">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300 group-hover:text-[#1a2744] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs text-gray-400 group-hover:text-[#1a2744] transition-colors font-medium">{slot.label}</span>
                      <span className="text-[10px] text-gray-300">Click to upload</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Intermediate Photos + Other Documents */}
        <div className="space-y-5">

          {/* Intermediate Page Photos */}
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-sm font-semibold text-gray-700">Intermediate Page Photos</span>
              <span className="text-xs text-gray-400">optional</span>
            </div>
            <input ref={pagePhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPagePhoto(e.target.files)} />
            {pagePhotos.length > 0 && (
              <div className="space-y-2 mb-2">
                {pagePhotos.map((p, i) => (
                  <div key={i} className="flex gap-3 items-start border border-gray-200 rounded-lg p-2.5 bg-gray-50">
                    <img src={URL.createObjectURL(p.blob)} alt={p.name} className="w-14 h-14 object-cover rounded-md shrink-0 border border-gray-200" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate mb-1">{p.name}</p>
                      <input
                        type="text"
                        value={p.description}
                        onChange={(e) => updatePagePhotoDesc(i, e.target.value)}
                        placeholder="Describe this page..."
                        className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] placeholder-gray-400"
                      />
                    </div>
                    <button onClick={() => removePagePhoto(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none mt-0.5 shrink-0 transition-colors">×</button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => pagePhotoRef.current.click()} className="flex items-center gap-1.5 text-sm text-[#1a2744] hover:underline font-medium">
              <span className="text-base leading-none">+</span> Add Page Photo
            </button>
          </div>

          {/* Other Documents */}
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-sm font-semibold text-gray-700">Other Documents</span>
              <span className="text-xs text-gray-400">PDF, Word, Excel, Text</span>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDocDragOver(true); }}
              onDragLeave={() => setDocDragOver(false)}
              onDrop={handleDocDrop}
              onClick={() => docInputRef.current.click()}
              className={`border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors duration-150 ${
                docDragOver ? "border-[#1a2744] bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-gray-50"
              }`}
            >
              <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={(e) => addDocuments(e.target.files)} />
              {documents.length === 0 ? (
                <div>
                  <p className="text-sm font-medium text-gray-500">Click or drag files here</p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF, Word, Excel, Text</p>
                </div>
              ) : (
                <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  {documents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-gray-400 uppercase shrink-0 w-8">{d.name.split(".").pop()}</span>
                        <span className="text-sm text-gray-700 truncate">{d.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{formatSize(d.size)}</span>
                      </div>
                      <button onClick={() => removeDocument(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none ml-2 shrink-0 transition-colors">×</button>
                    </div>
                  ))}
                  <button onClick={() => docInputRef.current.click()} className="text-xs text-[#1a2744] hover:underline mt-1 block">+ Add more files</button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
