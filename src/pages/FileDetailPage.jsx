import { useState, useEffect, useCallback, useRef } from "react";
import { getSession } from "../utils/auth";
import StatutoryComplianceTab from "../components/StatutoryComplianceTab";
import OtpModal from "../components/OtpModal";
import QueryCreationPanel from "../components/QueryCreationPanel";
import QueryDetailPanel from "../components/QueryDetailPanel";
import { useFiles } from "../context/FilesContext";
import { canAccessFile } from "../utils/accessControl";
import ManpowerChecklistForm from "../components/ManpowerChecklistForm";
import DynamicChecklistForm from "../components/DynamicChecklistForm";

import {
  getChecklistsByFile,
  createChecklistForFile,
  updateChecklist as apiUpdateChecklist,
  getChecklistDetails,
  saveChecklistResponses,
  getChecklistAttachments,
  uploadChecklistAttachments,
} from "../services/checklistService";

import { getFileDetail, updateFile as updateFileApi, getFileVersions } from "../services/filesService";
import { getQueriesByFile } from "../services/queriesService";
import { downloadFile } from "../utils/storage";

// ── Constants (UI-only) ────────────────────────────────────────────
const RISK_STYLES = {
  High: "bg-red-100 text-red-600",
  Medium: "bg-orange-100 text-orange-500",
  Low: "bg-green-100 text-green-600",
};
const CHECKLIST_STATUS_STYLES = {
  Draft: "bg-gray-100 text-gray-500",
  "In Progress": "bg-blue-100 text-blue-600",
  Completed: "bg-green-100 text-green-600"
};
const STATUS_STYLES = {
  "Pre-Audit": "bg-orange-100 text-orange-500",
  "Post-Audit": "bg-pink-100 text-pink-500",
  Indexed: "bg-cyan-100 text-cyan-600",
  Closed: "bg-gray-100 text-gray-500",
  "Under Review": "bg-blue-100 text-blue-500",
  Finalized: "bg-purple-100 text-purple-600",
};

const ULB_OPTIONS = [
  "Raipur Municipal Corporation",
  "Bilaspur Municipal Corporation",
  "Durg Municipal Council",
  "Korba Municipal Council",
  "Rajnandgaon Nagar Panchayat",
  "Jagdalpur Nagar Panchayat",
];

const FIELD_LABELS = {
  fileNumber: "File Number",
  fileTitle: "File Title",
  workDescription: "Work Description",
  amount: "Amount",
  riskFlag: "Risk Flag",
};

const TABS = [
  "Details",
  "Documents",
  "Version History",
  "Checklist",
  "Statutory Compliance",
  "Queries",
];

const PRIORITY_STYLES = {
  High: "bg-red-100 text-red-500",
  Medium: "bg-orange-100 text-orange-500",
  Low: "bg-green-100 text-green-600",
};

const QUERY_STATUS_STYLES = {
  Open: "bg-blue-100 text-blue-600",
  "In Progress": "bg-amber-100 text-amber-600",
  Resolved: "bg-green-100 text-green-600",
};

const getAgeing = (dateStr) => {
  if (!dateStr) return null;
  let created;
  if (dateStr.includes("T") || dateStr.includes("-")) {
    // ISO 8601 format from API (e.g. "2026-04-02T13:05:18.045Z" or "2026-04-02")
    created = new Date(dateStr);
  } else {
    // Legacy DD/MM/YYYY format from mock data
    const [d, m, y] = dateStr.split("/").map(Number);
    created = new Date(y, m - 1, d);
  }
  if (isNaN(created.getTime())) return null;
  return Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
};

/** Format a date string (ISO or DD/MM/YYYY) to DD/MM/YYYY for display */
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "—";
  if (dateStr.includes("/")) return dateStr; // already DD/MM/YYYY
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN");
};

// ── i18n ────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    backToFiles: "← Back to Files",
    riskSuffix: "Risk",
    fileInfo: "File Information",
    ulbTimeline: "ULB & Timeline",
    fileNumber: "File Number",
    fileTitle: "File Title",
    workDescription: "Work Description",
    amountPutUp: "Amount Put Up",
    contractType: "Contract Type",
    riskFlag: "Risk Flag",
    status: "Status",
    dateIndexed: "Date Indexed",
    category: "Category",
    entrySource: "Entry Source",
    ulb: "ULB",
    ulbCategory: "ULB Category",
    geography: "Geography",
    createdBy: "Created By",
    created: "Created",
    pendingModule: "Available after master & resource allocation module",
    edit: "Edit",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    reasonLabel: "Reason for changes",
    reasonOptional: "(optional)",
    reasonPlaceholder: "Briefly describe why you are making these changes...",
  },
  hi: {
    backToFiles: "← फ़ाइलों पर वापस",
    riskSuffix: "जोखिम",
    fileInfo: "फ़ाइल जानकारी",
    ulbTimeline: "ULB और समयरेखा",
    fileNumber: "फ़ाइल नंबर",
    fileTitle: "फ़ाइल शीर्षक",
    workDescription: "कार्य विवरण",
    amountPutUp: "प्रस्तुत राशि",
    contractType: "अनुबंध प्रकार",
    riskFlag: "जोखिम स्तर",
    status: "स्थिति",
    dateIndexed: "अनुक्रमण तिथि",
    category: "श्रेणी",
    entrySource: "प्रविष्टि स्रोत",
    ulb: "ULB",
    ulbCategory: "ULB श्रेणी",
    geography: "भूगोल",
    createdBy: "निर्माणकर्ता",
    created: "निर्मित तिथि",
    pendingModule: "मास्टर और संसाधन आवंटन मॉड्यूल के बाद उपलब्ध",
    edit: "संपादित करें",
    cancel: "रद्द करें",
    saveChanges: "परिवर्तन सहेजें",
    reasonLabel: "परिवर्तन का कारण",
    reasonOptional: "(वैकल्पिक)",
    reasonPlaceholder: "संक्षेप में बताएं कि आप ये परिवर्तन क्यों कर रहे हैं...",
  },
};

const VALUE_MAP = {
  "Road restoration": "सड़क पुनर्स्थापना",
  Service: "सेवा",
  Works: "कार्य",
  Supply: "आपूर्ति",
  Consultancy: "परामर्श",
  Medium: "मध्यम",
  High: "उच्च",
  Low: "निम्न",
  "Pre-Audit": "पूर्व-ऑडिट",
  "Post-Audit": "पश्च-ऑडिट",
  Indexed: "अनुक्रमित",
  Closed: "बंद",
  "Under Review": "समीक्षाधीन",
  "Raipur Municipal Corporation": "रायपुर नगर निगम",
  "Bilaspur Municipal Corporation": "बिलासपुर नगर निगम",
  "Durg Municipal Council": "दुर्ग नगर परिषद",
  "Korba Municipal Council": "कोरबा नगर परिषद",
  "Rajnandgaon Nagar Panchayat": "राजनांदगांव नगर पंचायत",
  "Jagdalpur Nagar Panchayat": "जगदलपुर नगर पंचायत",
};

// ── Helpers ────────────────────────────────────────────────────────
const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// const loadVersionHistory = (fileNumber) => {
//   try {
//     const all = JSON.parse(localStorage.getItem("ulb_version_history") || "{}");
//     return all[fileNumber] || [];
//   } catch { return []; }
// };

// const saveVersionEntry = (fileNumber, entry) => {
//   const all = JSON.parse(localStorage.getItem("ulb_version_history") || "{}");
//   if (!all[fileNumber]) all[fileNumber] = [];
//   all[fileNumber].unshift(entry);
//   localStorage.setItem("ulb_version_history", JSON.stringify(all));
// };

// const updateFileRecord = (updatedFile) => {
//   const files = JSON.parse(localStorage.getItem("ulb_files") || "[]");
//   const idx = files.findIndex((f) => f.fileNumber === updatedFile.fileNumber);
//   if (idx !== -1) {
//     files[idx] = { ...files[idx], ...updatedFile };
//     localStorage.setItem("ulb_files", JSON.stringify(files));
//   }
// };

/**
 * Build a flat responses map from the template JSON.
 * Handles ALL section types so every field has an initial entry.
 */
const buildResponsesMap = (form) => {
  const resMap = {};
  if (!form?.sections) return resMap;

  for (const section of form.sections) {
    // Regular fields
    if (section.fields) {
      for (const field of section.fields) {
        resMap[field.fieldId] = { value: field.value ?? null, remark: field.remark ?? "" };
      }
    }

    // Conditional group fields
    if (section.conditionalGroups) {
      for (const cg of section.conditionalGroups) {
        for (const field of cg.fields || []) {
          resMap[field.fieldId] = { value: field.value ?? null, remark: field.remark ?? "" };
        }
      }
    }

    // Checklist table items
    if (section.type === "checklist_table" && section.items) {
      for (const item of section.items) {
        if (item.responseField?.fieldId) {
          resMap[item.responseField.fieldId] = { value: item.responseField.value ?? null, remark: "" };
        }
        if (item.remarkField?.fieldId) {
          resMap[item.remarkField.fieldId] = { value: item.remarkField.value ?? null, remark: "" };
        }
      }
    }

    // Line items table
    if (section.type === "line_items_table" && section.rows && section.columns) {
      for (const row of section.rows) {
        for (const col of section.columns) {
          if (col.type === "readonly") continue;
          const key = `${row.rowId}__${col.columnId}`;
          resMap[key] = { value: null, remark: "" };
        }
      }
    }

    // Dynamic table
    if (section.type === "table") {
      const key = `__table_${section.sectionId}`;
      resMap[key] = { value: null, remark: "" };
    }
  }

  return resMap;
};

// ── Sub-components ─────────────────────────────────────────────────
const Row = ({ label, value }) => (
  <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-400 shrink-0 w-40">{label}</span>
    <span className="text-sm text-gray-800 font-medium text-right">{value || "—"}</span>
  </div>
);

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition";

const EditRow = ({ label, fieldKey, value, editMode, onChange, type = "text", options }) => (
  <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-400 shrink-0 w-40 pt-1">{label}</span>
    {editMode ? (
      <div className="w-56">
        {options ? (
          <select value={value} onChange={(e) => onChange(fieldKey, e.target.value)} className={inputClass}>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === "textarea" ? (
          <textarea value={value} onChange={(e) => onChange(fieldKey, e.target.value)} rows={2} className={`${inputClass} resize-none`} />
        ) : (
          <input type={type} value={value} onChange={(e) => onChange(fieldKey, e.target.value)} className={inputClass} />
        )}
      </div>
    ) : (
      <span className="text-sm text-gray-800 font-medium text-right">{value || "—"}</span>
    )}
  </div>
);

/* ── Checklist Attachments (per-checklist, API-driven) ── */

const MANDATORY_SLOTS = [
  { key: "firstPage",           label: "1st Page",      multerField: "firstPage" },
  { key: "lastPageMinus2",      label: "Last Page - 2", multerField: "lastPage" },
  { key: "lastPageMinus1",      label: "Last Page - 1", multerField: "lastPage" },
  { key: "lastPage",            label: "Last Page",     multerField: "lastPage" },
];
 
export const ChecklistAttachmentsSection = ({ fileId, checklistId, disabled }) => {
  const [atts, setAtts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const data = await getChecklistAttachments(checklistId);
      setAtts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load attachments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [checklistId]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("documents", file);
      });

      await uploadChecklistAttachments(fileId, checklistId, formData);

      await fetchAttachments();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Attachments — {checklistId}
        </p>

        {!disabled && (
          <label className="text-xs text-[#1a2744] font-medium hover:underline cursor-pointer">
            {uploading ? "Uploading…" : "+ Add Files"}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          Loading…
        </p>
      ) : atts.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
          No attachments yet
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {atts.map((att, i) => (
            <div
              key={att.id || i}
              className="flex items-center justify-between px-5 py-3 border-t border-gray-50 first:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded shrink-0">
                  {att.fileName?.split(".").pop() || "file"}
                </span>

                <span className="text-sm text-gray-700 truncate">
                  {att.fileName}
                </span>

                <span className="text-xs text-gray-400 shrink-0">
                  {formatSize(att.fileSize)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
 
// export const ChecklistAttachmentsSection = ({ fileId, checklistId, disabled }) => {
//   // Mandatory page photo slots — each is null | File
//   const [mandatoryPhotos, setMandatoryPhotos] = useState({
//     firstPage: null,
//     lastPageMinus2: null,
//     lastPageMinus1: null,
//     lastPage: null,
//   });
 
//   // Intermediate page photos
//   const [pagePhotos, setPagePhotos] = useState([]);
//   // [{ file: File, description: string }]
 
//   // Documents
//   const [documents, setDocuments] = useState([]);
//   // [File]
 
//   // Existing uploaded attachments from API
//   const [uploaded, setUploaded] = useState([]);
//   const [loadingUploaded, setLoadingUploaded] = useState(true);
 
//   const [docDragOver, setDocDragOver] = useState(false);
//   const [uploading, setUploading] = useState(false);
 
//   // Refs for hidden file inputs
//   const mandatoryRefs = {
//     firstPage:      useRef(null),
//     lastPageMinus2: useRef(null),
//     lastPageMinus1: useRef(null),
//     lastPage:       useRef(null),
//   };
//   const pagePhotoRef = useRef(null);
//   const docInputRef  = useRef(null);
 
//   // ── Fetch existing attachments ──────────────────────────────────────────────
//   const fetchUploaded = useCallback(async () => {
//     try {
//       setLoadingUploaded(true);
//       const data = await getChecklistAttachments(checklistId);
//       setUploaded(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Failed to load attachments:", err);
//     } finally {
//       setLoadingUploaded(false);
//     }
//   }, [checklistId]);
 
//   useEffect(() => { fetchUploaded(); }, [fetchUploaded]);
 
//   // ── Mandatory photo handlers ─────────────────────────────────────────────────
//   const handleMandatoryUpload = (key, files) => {
//     const file = files[0];
//     if (file) setMandatoryPhotos((prev) => ({ ...prev, [key]: file }));
//   };
 
//   const removeMandatory = (key) => {
//     setMandatoryPhotos((prev) => ({ ...prev, [key]: null }));
//     // reset input so same file can be re-selected
//     if (mandatoryRefs[key]?.current) mandatoryRefs[key].current.value = "";
//   };
 
//   // ── Intermediate page photo handlers ────────────────────────────────────────
//   const addPagePhotos = (files) => {
//     const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
//     setPagePhotos((prev) => [
//       ...prev,
//       ...images.map((f) => ({ file: f, description: "" })),
//     ]);
//     if (pagePhotoRef.current) pagePhotoRef.current.value = "";
//   };
 
//   const updatePagePhotoDesc = (index, desc) => {
//     setPagePhotos((prev) =>
//       prev.map((p, i) => (i === index ? { ...p, description: desc } : p))
//     );
//   };
 
//   const removePagePhoto = (index) => {
//     setPagePhotos((prev) => prev.filter((_, i) => i !== index));
//   };
 
//   // ── Document handlers ────────────────────────────────────────────────────────
//   const addDocuments = (files) => {
//     setDocuments((prev) => [...prev, ...Array.from(files)]);
//     if (docInputRef.current) docInputRef.current.value = "";
//   };
 
//   const removeDocument = (index) => {
//     setDocuments((prev) => prev.filter((_, i) => i !== index));
//   };
 
//   const handleDocDrop = (e) => {
//     e.preventDefault();
//     setDocDragOver(false);
//     addDocuments(e.dataTransfer.files);
//   };
 
//   // ── Upload all ───────────────────────────────────────────────────────────────
//   const handleUploadAll = async () => {
//     const hasAny =
//       Object.values(mandatoryPhotos).some(Boolean) ||
//       pagePhotos.length > 0 ||
//       documents.length > 0;
 
//     if (!hasAny) {
//       alert("Please add at least one file before uploading.");
//       return;
//     }
 
//     try {
//       setUploading(true);
 
//       // Build FormData matching multer field names on backend:
//       //   req.files?.firstPage          → mandatory first page
//       //   req.files?.lastPage           → mandatory last pages (multiple)
//       //   req.files?.intermediatePages  → intermediate page photos
//       //   req.files?.documents          → other documents
//       const formData = new FormData();
 
//       // Mandatory slots
//       MANDATORY_SLOTS.forEach((slot) => {
//         const file = mandatoryPhotos[slot.key];
//         if (file) formData.append(slot.multerField, file);
//       });
 
//       // Intermediate page photos
//       pagePhotos.forEach((p) => {
//         formData.append("intermediatePages", p.file);
//       });
 
//       // Documents
//       documents.forEach((doc) => {
//         formData.append("documents", doc);
//       });
 
//       // Service: uploadChecklistAttachments(fileId, checklistId, formData)
//       // Note: pass formData directly — service posts it with Content-Type: undefined
//       await uploadChecklistAttachments(fileId, checklistId, formData);
 
//       // Clear local staging state
//       setMandatoryPhotos({ firstPage: null, lastPageMinus2: null, lastPageMinus1: null, lastPage: null });
//       setPagePhotos([]);
//       setDocuments([]);
 
//       // Refresh uploaded list
//       await fetchUploaded();
 
//       alert("Attachments uploaded successfully.");
//     } catch (err) {
//       console.error("Upload error:", err);
//       alert("Upload failed: " + (err?.response?.data?.message || err.message));
//     } finally {
//       setUploading(false);
//     }
//   };
 
//   const hasStagedFiles =
//     Object.values(mandatoryPhotos).some(Boolean) ||
//     pagePhotos.length > 0 ||
//     documents.length > 0;
 
//   // ── Read-only view ───────────────────────────────────────────────────────────
//   if (disabled) {
//     if (loadingUploaded) return <p className="text-sm text-gray-400 py-4">Loading attachments…</p>;
//     if (uploaded.length === 0) return (
//       <p className="text-sm text-gray-400 italic">No attachments for this checklist.</p>
//     );
 
//     const pageAtts = uploaded.filter((a) => a.category === "page");
//     const docAtts  = uploaded.filter((a) => a.category === "document");
 
//     return (
//       <div className="space-y-3">
//         {pageAtts.length > 0 && (
//           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 pt-4 pb-2">Page Photos</p>
//             {pageAtts.map((att, i) => (
//               <div key={att.id || i} className="flex items-center gap-3 px-5 py-3 border-t border-gray-50">
//                 <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded shrink-0">{att.slot || "IMG"}</span>
//                 <span className="text-sm text-gray-700 truncate flex-1">{att.fileName}</span>
//                 <span className="text-xs text-gray-400 shrink-0">{formatSize(att.fileSize)}</span>
//               </div>
//             ))}
//           </div>
//         )}
//         {docAtts.length > 0 && (
//           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 pt-4 pb-2">Documents</p>
//             {docAtts.map((att, i) => (
//               <div key={att.id || i} className="flex items-center gap-3 px-5 py-3 border-t border-gray-50">
//                 <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded shrink-0">{att.fileName?.split(".").pop() || "file"}</span>
//                 <span className="text-sm text-gray-700 truncate flex-1">{att.fileName}</span>
//                 <span className="text-xs text-gray-400 shrink-0">{formatSize(att.fileSize)}</span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   }
 
//   // ── Upload UI ────────────────────────────────────────────────────────────────
//   return (
//     <div className="space-y-5">
 
//       {/* ── Already uploaded (from previous sessions) ── */}
//       {!loadingUploaded && uploaded.length > 0 && (
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 pt-4 pb-2">
//             Uploaded ({uploaded.length})
//           </p>
//           {uploaded.map((att, i) => (
//             <div key={att.id || i} className="flex items-center gap-3 px-5 py-3 border-t border-gray-50">
//               <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded shrink-0">
//                 {att.fileName?.split(".").pop() || "file"}
//               </span>
//               <span className="text-sm text-gray-700 truncate flex-1">{att.fileName}</span>
//               <span className="text-xs text-gray-400 shrink-0">{formatSize(att.fileSize)}</span>
//             </div>
//           ))}
//         </div>
//       )}
 
//       <div className="bg-white border border-gray-200 rounded-xl p-5">
//         <h3 className="text-sm font-semibold text-gray-700 mb-4">Upload Attachments</h3>
 
//         {/* ── Mandatory Page Photos ── */}
//         <div className="mb-6">
//           <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
//             Mandatory Page Photos
//           </h4>
//           <div className="grid grid-cols-4 gap-3">
//             {MANDATORY_SLOTS.map((slot) => {
//               const file = mandatoryPhotos[slot.key];
//               return (
//                 <div key={slot.key}>
//                   <input
//                     type="file"
//                     accept="image/*"
//                     ref={mandatoryRefs[slot.key]}
//                     className="hidden"
//                     onChange={(e) => handleMandatoryUpload(slot.key, e.target.files)}
//                   />
 
//                   {file ? (
//                     <div className="relative border border-gray-200 rounded-lg overflow-hidden group">
//                       <img
//                         src={URL.createObjectURL(file)}
//                         alt={slot.label}
//                         className="w-full h-28 object-cover"
//                       />
//                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
//                         <button
//                           type="button"
//                           onClick={() => mandatoryRefs[slot.key].current?.click()}
//                           className="text-white text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
//                         >
//                           Replace
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => removeMandatory(slot.key)}
//                           className="text-white text-xs bg-red-500/60 hover:bg-red-500/80 px-2 py-1 rounded transition-colors"
//                         >
//                           Remove
//                         </button>
//                       </div>
//                       <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
//                         {slot.label}
//                       </span>
//                     </div>
//                   ) : (
//                     <button
//                       type="button"
//                       onClick={() => mandatoryRefs[slot.key].current?.click()}
//                       className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#1a2744] hover:text-[#1a2744] transition-colors"
//                     >
//                       <span className="text-2xl leading-none">+</span>
//                       <span className="text-xs font-medium text-center px-1">{slot.label}</span>
//                     </button>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
 
//         {/* ── Intermediate Page Photos ── */}
//         <div className="mb-6">
//           <div className="flex items-center justify-between mb-3">
//             <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//               Intermediate Page Photos
//             </h4>
//             <input
//               type="file"
//               accept="image/*"
//               multiple
//               ref={pagePhotoRef}
//               className="hidden"
//               onChange={(e) => addPagePhotos(e.target.files)}
//             />
//             <button
//               type="button"
//               onClick={() => pagePhotoRef.current?.click()}
//               className="text-xs text-[#1a2744] font-medium hover:underline"
//             >
//               + Add Photos
//             </button>
//           </div>
 
//           {pagePhotos.length === 0 ? (
//             <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center text-sm text-gray-400">
//               No intermediate pages added yet
//             </div>
//           ) : (
//             <div className="grid grid-cols-4 gap-3">
//               {pagePhotos.map((p, i) => (
//                 <div key={i} className="border border-gray-200 rounded-lg overflow-hidden relative group">
//                   <img
//                     src={URL.createObjectURL(p.file)}
//                     alt={`page-${i}`}
//                     className="w-full h-28 object-cover"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => removePagePhoto(i)}
//                     className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                   >
//                     ×
//                   </button>
//                   <input
//                     type="text"
//                     placeholder="Description…"
//                     value={p.description}
//                     onChange={(e) => updatePagePhotoDesc(i, e.target.value)}
//                     className="w-full border-t border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1a2744]"
//                   />
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
 
//         {/* ── Documents ── */}
//         <div className="mb-6">
//           <div className="flex items-center justify-between mb-3">
//             <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//               Documents
//             </h4>
//             <input
//               type="file"
//               multiple
//               ref={docInputRef}
//               className="hidden"
//               onChange={(e) => addDocuments(e.target.files)}
//             />
//             <button
//               type="button"
//               onClick={() => docInputRef.current?.click()}
//               className="text-xs text-[#1a2744] font-medium hover:underline"
//             >
//               + Add Documents
//             </button>
//           </div>
 
//           <div
//             onDragOver={(e) => { e.preventDefault(); setDocDragOver(true); }}
//             onDragLeave={() => setDocDragOver(false)}
//             onDrop={handleDocDrop}
//             className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
//               docDragOver ? "border-[#1a2744] bg-blue-50" : "border-gray-200"
//             }`}
//           >
//             {documents.length === 0 ? (
//               <p className="text-center text-sm text-gray-400 py-2">
//                 Drag &amp; drop files here, or click "+ Add Documents"
//               </p>
//             ) : (
//               <ul className="space-y-2">
//                 {documents.map((doc, i) => (
//                   <li
//                     key={i}
//                     className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
//                   >
//                     <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
//                       <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded shrink-0">
//                         {doc.name.split(".").pop()}
//                       </span>
//                       <span className="truncate">{doc.name}</span>
//                       <span className="text-xs text-gray-400 shrink-0">{formatSize(doc.size)}</span>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => removeDocument(i)}
//                       className="text-gray-400 hover:text-red-500 text-lg leading-none ml-2 shrink-0 transition-colors"
//                     >
//                       ×
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </div>
 
//         {/* ── Upload Button ── */}
//         <button
//           type="button"
//           onClick={handleUploadAll}
//           disabled={uploading || !hasStagedFiles}
//           className="bg-[#1a2744] hover:bg-[#243460] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
//         >
//           {uploading ? "Uploading…" : "Upload Attachments"}
//         </button>
//       </div>
//     </div>
//   );
// }

// ── Main Component ─────────────────────────────────────────────────
const FileDetailPage = ({ file: initialFile, onBack, onFileUpdated, onFileFinalized }) => {
  const session = getSession();
  const isCA = session?.role === "Chartered Accountant";
  const { updateFile } = useFiles();

  const [file, setFile] = useState(initialFile);
  const [isFinalized, setIsFinalized] = useState(!!initialFile.finalized);
  const [activeTab, setActiveTab] = useState("Details");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [reason, setReason] = useState("");
  const [versionHistory, setVersionHistory] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [versionHistoryLoading, setVersionHistoryLoading] = useState(false);
  const [versionHistoryError, setVersionHistoryError] = useState("");
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showObservations, setShowObservations] = useState(false);
  const [lang, setLang] = useState("en");

  // Checklist state (API-driven)
  const [checklistList, setChecklistList] = useState([]);
  const [checklistsLoading, setChecklistsLoading] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState(null);
  const [checklistForm, setChecklistForm] = useState(null);
  const [checklistMeta, setChecklistMeta] = useState(null);
  const [responses, setResponses] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [savingResponses, setSavingResponses] = useState(false);

  // Documents
  const [allAttachments, setAllAttachments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [downloadStates, setDownloadStates] = useState({});

  // Queries (local)
  // Queries (API-driven)
  const [fileQueries, setFileQueries] = useState([]);
  const [queriesSummary, setQueriesSummary] = useState(null);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [queriesError, setQueriesError] = useState(null);
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);

  // Compliance (local)
  const [compliances, setCompliances] = useState([]);

  // Master data
  const [editMasterData, setEditMasterData] = useState(false);
  const [masterDataForm, setMasterDataForm] = useState({});

  const t = TRANSLATIONS[lang];
  const tv = (val) => (val && lang === "hi" ? VALUE_MAP[val] || val : val);
  const fileId = file.id || file.fileId;

  /* ─── Load file detail (enriches list-level data with full details) ─── */

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;

    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError("");
        const data = await getFileDetail(fileId);

        if (cancelled) return;

        // Normalize API response to match the shape the UI expects
        const normalized = {};

        // File-level fields
        if (data.file) {
          if (data.file.title) normalized.fileTitle = data.file.title;
          if (data.file.description) normalized.workDescription = data.file.description;
          if (data.file.amount) normalized.amount = data.file.amount;
          if (data.file.contractType) normalized.contractType = data.file.contractType;
          if (data.file.contractTypeId) normalized.contractTypeId = data.file.contractTypeId;
          if (data.file.riskFlag) normalized.riskFlag = data.file.riskFlag;
          if (data.file.status) normalized.status = data.file.status;
          if (data.file.createdAt) {
            const d = new Date(data.file.createdAt);
            normalized.date = isNaN(d.getTime()) ? data.file.createdAt : d.toLocaleDateString("en-IN");
          }
        }

        // ULB name
        if (data.ulb?.ulbName) {
          normalized.ulb = data.ulb.ulbName;
        }

        // Supplier → masterData (map API field names to UI field names)
        if (data.supplier) {
          normalized.masterData = {
            supplierName: data.supplier.supplierName || "",
            pan: data.supplier.pan || "",
            gstNumber: data.supplier.gst || "",
            epfRegNo: data.supplier.epf || "",
            esicRegNo: data.supplier.esic || "",
            labourLicenseNo: data.supplier.labour || "",
            nameOfDepartment: data.supplier.departmentName || "",
            fileNo: data.supplier.fileNo || "",
            nameOfFund: data.supplier.fundName || "",
          };
        }

        // Merge into file state — keeps existing fields (id, fileNumber, etc.), overlays with API data
        setFile((prev) => ({ ...prev, ...normalized }));
      } catch (err) {
        console.error("Failed to load file details:", err);
        if (!cancelled) {
          setDetailError("Unable to load file details right now. Please try again.");
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    loadDetail();
    return () => { cancelled = true; };
  }, [fileId]);

  /* ─── Load version history ─── */

  const fetchVersionHistory = useCallback(async () => {
    if (!fileId) return;
    try {
      setVersionHistoryLoading(true);
      setVersionHistoryError("");
      const data = await getFileVersions(fileId);
      setVersionHistory(data.versions || []);
    } catch (err) {
      console.error("Failed to load version history:", err);
      setVersionHistoryError("Unable to load version history. Please try again.");
    } finally {
      setVersionHistoryLoading(false);
    }
  }, [fileId]);

  useEffect(() => { fetchVersionHistory(); }, [fetchVersionHistory]);

  /* ─── Load checklists ─── */

  const fetchChecklists = useCallback(async () => {
    if (!fileId) return;
    try {
      setChecklistsLoading(true);
      const data = await getChecklistsByFile(fileId);
      setChecklistList(data);
    } catch (err) {
      console.error("Failed to load checklists:", err);
    } finally {
      setChecklistsLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    if (!fileId) return
    fetchChecklists()
  }, [fileId])

  /* ─── Load queries ─── */

  const fetchQueries = useCallback(async () => {
    if (!fileId) return;
    try {
      setQueriesLoading(true);
      setQueriesError(null);
      const data = await getQueriesByFile(fileId);
      setFileQueries(data.queries);
      setQueriesSummary(data.summary);
    } catch (err) {
      console.error("Failed to load queries:", err);
      setQueriesError(err.message || "Failed to load queries.");
    } finally {
      setQueriesLoading(false);
    }
  }, [fileId]);

  useEffect(() => { fetchQueries(); }, [fetchQueries]);

  /* ─── Load checklist details when selected ─── */

  // Replace the existing selectedChecklistId useEffect in FileDetailPage with this:

  useEffect(() => {
    if (!selectedChecklistId) {
      setChecklistForm(null);
      setChecklistMeta(null);
      setResponses({});
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setFormLoading(true);
        const data = await getChecklistDetails(selectedChecklistId);
        if (cancelled) return;

        setChecklistMeta(data.checklist);
        setChecklistForm(data.form);

        // 1. Build blank map for ALL field types
        const resMap = buildResponsesMap(data.form);

        // 2. Overlay saved responses on top using questionKey
        //    data.responses = [{ questionKey, responseValue, remark }]
        if (data.responses?.length) {
          for (const r of data.responses) {
            const key = r.questionKey;
            if (key && resMap[key] !== undefined) {
              resMap[key] = {
                value: r.responseValue ?? null,
                remark: r.remark ?? "",
              };
            }
          }
        }

        setResponses(resMap);
      } catch (err) {
        console.error("Failed to load checklist details:", err);
      } finally {
        if (!cancelled) setFormLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [selectedChecklistId]);

  /* ─── Load documents ─── */

  const fetchDocuments = useCallback(async () => {
    if (checklistList.length === 0) { setAllAttachments([]); return; }
    try {
      setDocsLoading(true);
      const results = await Promise.all(
        checklistList.map(async (cl) => {
          const atts = await getChecklistAttachments(cl.id);
          return atts.map((a) => ({ ...a, _checklistId: cl.id, _phase: cl.phaseNumber }));
        })
      );
      setAllAttachments(results.flat());
      // console.log("Fetched documents:", results.flat());
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setDocsLoading(false);
    }
  }, [checklistList]);

  useEffect(() => {
    if (activeTab === "Documents") fetchDocuments();
  }, [activeTab, fetchDocuments]);

  // useEffect(() => {
  //   setVersionHistory(loadVersionHistory(file.fileNumber));
  // }, [file.fileNumber]);

  /* ─── Checklist handlers ─── */

  const CONTRACT_TYPES = [
    { name: "Civil", id: "33333333-3333-3333-3333-000000000001", templateId: "99999999-9999-9999-9999-000000000002" },
    { name: "Manpower Service", id: "33333333-3333-3333-3333-000000000002", templateId: "aff9289f-1fec-4a0d-903f-3ce0040485db" },
    { name: "Procurement", id: "33333333-3333-3333-3333-000000000003", templateId: "1de0e9d3-eb6b-4802-99f3-6dfff3dcfeb9" },
    { name: "Service", id: "33333333-3333-3333-3333-000000000004", templateId: "99999999-9999-9999-9999-000000000002" }
  ];

  const handleNewChecklist = async () => {
    try {

      if (!fileId) {
        alert("File ID missing");
        return;
      }

      console.log("fileId:", fileId);

      // safer phase calculation
      const phase = (checklistList?.length || 0) + 1;
      console.log("file:", file);

      console.log("file.contractTypeId:", file?.contractTypeId);
      // determine template based on contract type
      const contract = CONTRACT_TYPES.find(
        (c) => c.id === file?.contractTypeId
      );
      console.log("Selected contract type:", contract);

      if (!contract) {
        alert("Template not configured for this contract type");
        return;
      }

      const payload = {
        templateId: contract.templateId,
        phaseNumber: phase,
        checkerName: session?.name || "",
        checkDate: new Date().toISOString().slice(0, 10),
      };

      const res = await createChecklistForFile(fileId, payload);

      if (!res?.success) {
        throw new Error(res?.message || "Checklist creation failed");
      }

      await fetchChecklists();

      if (res?.data?.id) {
        setSelectedChecklistId(res.data.id);
      }

    } catch (err) {

      console.error("CREATE CHECKLIST ERROR:", err);

      alert(
        err?.response?.data?.message ||
        err.message ||
        "Failed to create checklist"
      );

    }
  };

  const handleSaveResponses = async () => {
    if (!selectedChecklistId) return;

    try {
      setSavingResponses(true);

      const payload = Object.entries(responses)
        .filter(([, r]) => r.value !== null && r.value !== "")
        .map(([questionId, r]) => ({
          questionId,
          responseValue: String(r.value),
          remark: r.remark || ""
        }));

      // 1️⃣ Save responses
      await saveChecklistResponses(selectedChecklistId, payload);

      // 2️⃣ Update checklist status
      await apiUpdateChecklist(selectedChecklistId, {
        status: "In Progress"
      });

      alert("Checklist saved successfully");

      // 3️⃣ Refresh checklist list
      await fetchChecklists();

    } catch (err) {
      console.error(err);
      alert("Failed to save responses");
    } finally {
      setSavingResponses(false);
    }
  };
  const handleCompleteChecklist = async () => {
    try {

      await apiUpdateChecklist(selectedChecklistId, {
        status: "Completed"
      });

      await fetchChecklists();

      alert("Checklist completed");

    } catch (err) {
      console.error(err);
      alert("Failed to complete checklist");
    }
  };
  const handleUpdateChecklistMeta = async (field, value) => {
    if (!selectedChecklistId) return;
    try {
      await apiUpdateChecklist(selectedChecklistId, { [field]: value });
      setChecklistMeta((prev) => (prev ? { ...prev, [field]: value } : prev));
      fetchChecklists();
    } catch (err) { console.error(err); }
  };

  /* ─── Details edit ─── */

  const handleEditStart = () => {
    setEditForm({
      fileNumber: file.fileNumber || "",
      fileTitle: file.fileTitle || "",
      workDescription: file.workDescription || "",
      amount: file.amount || "",
      riskFlag: file.riskFlag || "Low",
    });
    setReason("");
    setSaveError("");
    setEditMode(true);
  };

  const handleEditCancel = () => { setEditMode(false); setReason(""); setSaveError(""); };

  const handleFieldChange = (key, value) => setEditForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const EDITABLE_KEYS = ["fileNumber", "fileTitle", "workDescription", "amount", "riskFlag"];

    // Detect which fields actually changed
    const changedKeys = EDITABLE_KEYS.filter(
      (key) => String(editForm[key] ?? "").trim() !== String(file[key] ?? "").trim()
    );
    if (changedKeys.length === 0) { setEditMode(false); return; }

    // Build partial payload — only changed fields, mapped to API field names
    const payload = {};
    if (changedKeys.includes("fileNumber"))     payload.fileNumber   = editForm.fileNumber.trim();
    if (changedKeys.includes("fileTitle"))      payload.title        = editForm.fileTitle.trim();
    if (changedKeys.includes("workDescription")) payload.description = editForm.workDescription.trim() || null;
    if (changedKeys.includes("amount"))         payload.amount       = editForm.amount;
    if (changedKeys.includes("riskFlag"))       payload.riskFlag     = editForm.riskFlag;
    if (reason.trim())                          payload.reason       = reason.trim();

    try {
      setSaveLoading(true);
      setSaveError("");
      await updateFileApi(fileId, payload);

      // Optimistic local state update (Option A)
      const updatedFile = {
        ...file,
        ...(payload.fileNumber  !== undefined ? { fileNumber: payload.fileNumber }        : {}),
        ...(payload.title       !== undefined ? { fileTitle: payload.title }              : {}),
        ...(payload.description !== undefined ? { workDescription: payload.description }  : {}),
        ...(payload.amount      !== undefined ? { amount: payload.amount }                : {}),
        ...(payload.riskFlag    !== undefined ? { riskFlag: payload.riskFlag }            : {}),
      };
      setFile(updatedFile);
      updateFile(updatedFile); // sync FilesContext

      // Refresh version history from API
      await fetchVersionHistory();

      setEditMode(false);
      setReason("");
      setSaveError("");
      onFileUpdated?.();
    } catch (err) {
      console.error("Failed to save file:", err);
      setSaveError(
        err?.response?.data?.message || "Failed to save changes. Please try again."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleMasterDataSave = () => {
    const updatedFile = { ...file, masterData: { ...(file.masterData || {}), ...masterDataForm } };
    updateFile(updatedFile);
    // updateFileRecord(updatedFile);
    setFile(updatedFile);
    setEditMasterData(false);
  };

  const handleFinalizeConfirm = (observations) => {
    const updatedFile = { ...file, finalized: true, status: "Finalized", finalizedAt: new Date().toLocaleDateString("en-IN"), finalizedBy: session?.name || "CA", ...(observations ? { caObservations: observations } : {}) };
    updateFile(updatedFile);
    setFile(updatedFile);
    setIsFinalized(true);
    setShowFinalizeModal(false);
    onFileFinalized?.(file.fileNumber);
    onFileUpdated?.();
  };

  const handleDownload = async (att) => {
    const key = att.id ?? att.storagePath;
    setDownloadStates((prev) => ({ ...prev, [key]: "downloading" }));
    try {
      await downloadFile(att.storagePath, att.fileName);
      setDownloadStates((prev) => { const next = { ...prev }; delete next[key]; return next; });
    } catch (err) {
      console.error("Download failed:", err);
      setDownloadStates((prev) => ({ ...prev, [key]: "error" }));
    }
  };

  if (!canAccessFile(file)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Access Restricted</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">You do not have permission to view this file.</p>
        </div>
        <button onClick={onBack} className="text-sm text-[#1a2744] font-medium hover:underline mt-1">← Back to Files</button>
      </div>
    );
  }

  /* ════════════════════════════ RENDER ════════════════════════════ */

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">{t.backToFiles}</button>

      {/* Heading */}
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800">{file.fileNumber}</h1>
        <div className="flex items-center gap-3 shrink-0 mt-1">
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {["EN", "HI"].map((l) => (
              <button key={l} onClick={() => setLang(l.toLowerCase())} className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${lang === l.toLowerCase() ? "bg-white text-[#1a2744] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>{l}</button>
            ))}
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${RISK_STYLES[file.riskFlag] || "bg-gray-100 text-gray-500"}`}>{tv(file.riskFlag)} {t.riskSuffix}</span>
          {isFinalized ? (
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Finalized
            </span>
          ) : (
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_STYLES[file.status] || "bg-gray-100 text-gray-500"}`}>{tv(file.status)}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {TABS.map((tab) => {
          let label = tab;
          if (tab === "Checklist" && checklistList.length > 0) label = `Checklist (${checklistList.length})`;
          if (tab === "Version History" && versionHistory.length > 0) label = `Version History (${versionHistory.length})`;
          if (tab === "Queries" && (queriesSummary?.total || fileQueries.length) > 0) label = `Queries (${queriesSummary?.total ?? fileQueries.length})`;
          return (
            <button key={tab} onClick={() => { setActiveTab(tab); if (editMode) handleEditCancel(); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab ? "border-[#1a2744] text-[#1a2744]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>{label}</button>
          );
        })}
      </div>

      {/* ── Details Tab ── */}
      {activeTab === "Details" && (
        <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
          {detailLoading ? (
            <div className="mb-4 bg-white rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-400">
              Loading file details…
            </div>
          ) : detailError ? (
            <div className="mb-4 bg-white rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-500">
              Unable to load file details right now. Please try again.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end mb-3 gap-2">
                <div className="flex items-center gap-2">
                  {!editMode ? (
                    <>
                      {isCA && !isFinalized && <button onClick={() => setShowFinalizeModal(true)} className="flex items-center gap-1.5 text-sm font-semibold bg-[#1a2744] hover:bg-[#243460] text-white px-4 py-1.5 rounded-lg transition-colors">Finalize File</button>}
                      {!isFinalized && <button onClick={handleEditStart} className="text-sm font-medium text-[#1a2744] border border-[#1a2744] px-4 py-1.5 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors">{t.edit}</button>}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEditCancel}
                        disabled={saveLoading}
                        className="text-sm font-medium text-gray-500 border border-gray-200 px-4 py-1.5 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saveLoading}
                        className="text-sm font-medium bg-[#1a2744] text-white px-4 py-1.5 rounded-lg hover:bg-[#243460] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {saveLoading ? "Saving…" : t.saveChanges}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <label className="block text-xs font-semibold text-amber-700 mb-1.5">{t.reasonLabel} <span className="font-normal text-amber-500">{t.reasonOptional}</span></label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.reasonPlaceholder} rows={2} className="w-full text-sm text-gray-700 bg-white border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
                </div>
              )}

              {saveError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {saveError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{t.fileInfo}</h3>
                  <EditRow label={t.fileNumber} fieldKey="fileNumber" value={editMode ? editForm.fileNumber : file.fileNumber} editMode={editMode} onChange={handleFieldChange} />
                  <EditRow label={t.fileTitle} fieldKey="fileTitle" value={editMode ? editForm.fileTitle : tv(file.fileTitle)} editMode={editMode} onChange={handleFieldChange} />
                  <EditRow label={t.workDescription} fieldKey="workDescription" value={editMode ? editForm.workDescription : tv(file.workDescription)} editMode={editMode} onChange={handleFieldChange} type="textarea" />
                  <EditRow label={t.amountPutUp} fieldKey="amount" value={editMode ? editForm.amount : (file.amount ? `₹${Number(file.amount).toLocaleString("en-IN")}` : "")} editMode={editMode} onChange={handleFieldChange} type="number" />
                  <Row label={t.contractType} value={tv(file.contractType)} />
                  <EditRow label={t.riskFlag} fieldKey="riskFlag" value={editMode ? editForm.riskFlag : tv(file.riskFlag)} editMode={editMode} onChange={handleFieldChange} options={["Low", "Medium", "High"]} />
                  <Row label={t.status} value={tv(file.status)} />
                  <Row label={t.dateIndexed} value={file.date} />
                  {["category", "entrySource"].map((key) => (
                    <div key={key} className="flex items-start justify-between py-3 border-b border-gray-50">
                      <span className="text-sm text-gray-400 shrink-0 w-40">{t[key]}</span>
                      <span className="text-right text-xs text-amber-500 italic">{t.pendingModule}</span>
                    </div>
                  ))}

                  {isFinalized && file.caObservations && (
                    <>
                      <button onClick={() => setShowObservations((prev) => !prev)} className="w-full flex items-start justify-between py-3 text-left group">
                        <span className="text-sm text-gray-400 shrink-0 w-40">CA Observations</span>
                        <span className={`flex items-center gap-1 text-xs font-medium transition-colors ${showObservations ? "text-purple-500" : "text-gray-400 group-hover:text-purple-500"}`}>
                          {showObservations ? "Hide" : "View"}
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 transition-transform duration-200 ${showObservations ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </span>
                      </button>
                      {showObservations && (
                        <div className="mb-1 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2.5">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{file.caObservations}</p>
                          <p className="text-xs text-purple-400 mt-2">— {file.finalizedBy} · {file.finalizedAt}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{t.ulbTimeline}</h3>
                  <Row label={t.ulb} value={tv(file.ulb)} />
                  {["ulbCategory", "geography", "createdBy"].map((key) => (
                    <div key={key} className="flex items-start justify-between py-3 border-b border-gray-50">
                      <span className="text-sm text-gray-400 shrink-0 w-40">{t[key]}</span>
                      <span className="text-right text-xs text-amber-500 italic">{t.pendingModule}</span>
                    </div>
                  ))}
                  <Row label={t.created} value={file.date} />
                </div>
              </div>

              {/* Supplier & Fund Details */}
              <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Supplier &amp; Fund Details</h3>
                  {!editMasterData && !isFinalized && (
                    <button onClick={() => { setMasterDataForm({ ...(file.masterData || {}) }); setEditMasterData(true); }} className="text-xs font-medium text-[#1a2744] border border-[#1a2744] px-3 py-1 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors">Edit</button>
                  )}
                </div>
                {editMasterData ? (
                  <>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-3 mb-4">
                      {[["supplierName","Supplier Name"],["pan","PAN"],["gstNumber","GST Number"],["epfRegNo","EPF Registration No."],["esicRegNo","ESIC Registration No."],["labourLicenseNo","Labour License No."],["nameOfDepartment","Name of Department"],["fileNo","File No."],["nameOfFund","Name of Fund"]].map(([key,label])=>(
                        <div key={key}><label className="block text-xs font-medium text-gray-500 mb-1">{label}</label><input type="text" value={masterDataForm[key]??""} onChange={(e)=>setMasterDataForm(prev=>({...prev,[key]:e.target.value}))} className={inputClass}/></div>
                      ))}
                    </div>
                    <div className="flex gap-2.5">
                      <button onClick={handleMasterDataSave} className="bg-[#1a2744] text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-[#243358] transition-colors">Save</button>
                      <button onClick={()=>setEditMasterData(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5 rounded-lg border border-gray-200 transition-colors">Cancel</button>
                    </div>
                  </>
                ) : file.masterData && Object.values(file.masterData).some(Boolean) ? (
                  <div className="grid grid-cols-3 gap-x-8">
                    {[["Supplier Name",file.masterData.supplierName],["PAN",file.masterData.pan],["GST Number",file.masterData.gstNumber],["EPF Reg. No.",file.masterData.epfRegNo],["ESIC Reg. No.",file.masterData.esicRegNo],["Labour License No.",file.masterData.labourLicenseNo],["Name of Department",file.masterData.nameOfDepartment],["File No.",file.masterData.fileNo],["Name of Fund",file.masterData.nameOfFund]].map(([label,value])=>(
                      <Row key={label} label={label} value={value}/>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No master data added yet. {!isFinalized&&<button onClick={()=>{setMasterDataForm({});setEditMasterData(true);}} className="text-[#1a2744] underline">Add now</button>}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Documents Tab ── */}
      {activeTab === "Documents" && (
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] space-y-4">
          {docsLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Loading documents…</div>
          ) : allAttachments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-400">No documents attached to this file.</p>
              <p className="text-xs text-gray-300 mt-1">Upload attachments via the Checklist tab.</p>
            </div>
          ) : (
            checklistList.filter(cl=>allAttachments.some(a=>a._checklistId===cl.id)).map(cl=>{
              const atts=allAttachments.filter(a=>a._checklistId===cl.id);
              // const pageAtts=atts.filter(a=>a.category==="page");
              // const docAtts=atts.filter(a=>a.category==="document"||!a.category);
              return (
                <div key={cl.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phase {cl.phaseNumber} — {cl.id}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {atts.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 pt-4 pb-2">
                        Attachments
                      </p>
                      {atts.map((att, i) => (
                        <div key={att.id || i} className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded shrink-0">
                              {att.slot || att.fileName?.split(".").pop() || "file"}
                            </span>
                            <span className="text-sm text-gray-700 truncate">{att.fileName}</span>
                            <span className="text-xs text-gray-400 shrink-0">{formatSize(att.fileSize)}</span>
                          </div>
                          {att.storagePath && (() => {
                            const dlKey = att.id ?? att.storagePath;
                            const dlState = downloadStates[dlKey];
                            const isDownloading = dlState === "downloading";
                            const hasError = dlState === "error";
                            return (
                              <div className="flex items-center gap-2 shrink-0 ml-4">
                                {hasError && (
                                  <span className="flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Failed
                                  </span>
                                )}
                                <button
                                  onClick={() => handleDownload(att)}
                                  disabled={isDownloading}
                                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                    isDownloading ? "text-gray-400 cursor-not-allowed"
                                    : hasError ? "text-red-500 hover:underline"
                                    : "text-[#1a2744] hover:underline"
                                  }`}
                                >
                                  {isDownloading ? (
                                    <>
                                      <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                                      </svg>
                                      Downloading…
                                    </>
                                  ) : hasError ? "Retry" : "Download"}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Checklist Tab ── */}
      {activeTab === "Checklist" && (() => {
        if (selectedChecklistId) {
          return (
            <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setSelectedChecklistId(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">← All Checklists</button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{selectedChecklistId}</span>
                  {checklistMeta && (<><span className="text-gray-300">·</span><span className="text-sm font-semibold text-gray-700">Phase {checklistMeta.phaseNumber} Checklist</span></>)}
                </div>
              </div>

              {checklistMeta && (
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Checker Name</label>
                    <input type="text" value={checklistMeta.checkerName || ""} disabled={isFinalized} onChange={(e) => handleUpdateChecklistMeta("checkerName", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Check Date</label>
                    <input type="date" value={checklistMeta.checkDate || ""} disabled={isFinalized} onChange={(e) => handleUpdateChecklistMeta("checkDate", e.target.value)} className={inputClass} />
                  </div>
                </div>
              )}

              {formLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Loading checklist…</div>
              ) : file.checklistType === "manpower" && checklistMeta ? (
                <ManpowerChecklistForm checklistNo={selectedChecklistId} checkerName={checklistMeta.checkerName} date={checklistMeta.checkDate} onCheckerNameChange={(v) => handleUpdateChecklistMeta("checkerName", v)} onDateChange={(v) => handleUpdateChecklistMeta("checkDate", v)} onSave={!isFinalized ? handleSaveResponses : undefined} />
              ) : checklistForm ? (
                <DynamicChecklistForm form={checklistForm} responses={responses} setResponses={setResponses} onSave={!isFinalized ? handleSaveResponses : undefined} saving={savingResponses} disabled={isFinalized} />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Checklist not loaded</div>
              )}

              <div className="mt-6">
                <ChecklistAttachmentsSection fileId={fileId} checklistId={selectedChecklistId} disabled={isFinalized} />
              </div>
            </div>
          );
        }

        return (
          <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Checklists</p>
                <p className="text-xs text-gray-400 mt-0.5">{checklistList.length} checklist{checklistList.length !== 1 ? "s" : ""}</p>
              </div>
              {!isFinalized && <button onClick={handleNewChecklist} className="bg-[#1a2744] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#243358] transition-colors flex items-center gap-1.5">+ New Checklist</button>}
            </div>

            {checklistsLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Loading…</div>
            ) : checklistList.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <p className="text-sm font-medium text-gray-500">No checklists yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Create the first checklist for this file</p>
                {!isFinalized && <button onClick={handleNewChecklist} className="bg-[#1a2744] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#243358] transition-colors">+ New Checklist</button>}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {checklistList.map((cl, idx) => {
                  const isCurrent = cl.status !== "Completed";
                  return (
                    <button key={cl.id} onClick={() => setSelectedChecklistId(cl.id)} className={`rounded-xl px-5 py-4 flex items-center gap-5 transition-all text-left w-full ${isCurrent ? "bg-white border-2 border-[#1a2744] shadow-sm" : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>
                      <div className="w-10 h-10 rounded-full bg-[#1a2744] text-white flex items-center justify-center text-sm font-bold shrink-0">{cl.phaseNumber}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">Phase {cl.phaseNumber} Checklist</span>
                          {isCurrent && <span className="text-xs bg-[#1a2744]/10 text-[#1a2744] font-semibold px-2 py-0.5 rounded-full">Current</span>}
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full 
${CHECKLIST_STATUS_STYLES[cl.status] || CHECKLIST_STATUS_STYLES.Draft}`}>
                            {cl.status || "Draft"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          {cl.checkerName && <span className="text-xs text-gray-400">Checker: <span className="text-gray-600">{cl.checkerName}</span></span>}
                          <span className="text-xs text-gray-400">Date: <span className="text-gray-600">{cl.checkDate || "—"}</span></span>
                          <span className="text-xs text-gray-400">Created: <span className="text-gray-600">{cl.createdAt ? new Date(cl.createdAt).toLocaleDateString("en-IN") : "—"}</span></span>
                        </div>
                      </div>
                      <span className="text-gray-300 text-lg shrink-0">›</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === "Statutory Compliance" && (
        <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
          <StatutoryComplianceTab compliances={compliances} setCompliances={setCompliances} isCA={isCA} isFinalized={isFinalized} onFinalize={() => setShowFinalizeModal(true)} />
        </div>
      )}

      {activeTab === "Version History" && (
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] space-y-3">
          {versionHistoryLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Loading version history…</div>
          ) : versionHistoryError ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">{versionHistoryError}</div>
          ) : versionHistory.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">No edits have been made to this file yet.</div>
          ) : (
            versionHistory.map((entry, i) => (
              <div key={entry.versionId ?? i} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">{entry.changedByName}</span>
                    <span className="text-xs text-gray-400 ml-2">{entry.changedByRole}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {entry.changedAt ? new Date(entry.changedAt).toLocaleString("en-IN") : "—"}
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  {(entry.changes || []).map((c, j) => (
                    <div key={j} className="text-sm">
                      <span className="text-gray-500 font-medium">Field: </span>
                      <span className="text-gray-700">{c.fieldLabel}</span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-red-50 text-red-500 line-through px-2 py-0.5 rounded">{c.oldValue || "—"}</span>
                        <span className="text-xs text-gray-400">→</span>
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">{c.newValue || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {entry.reason && (
                  <p className="text-xs text-gray-400 border-t border-gray-50 pt-2 mt-2">
                    <span className="font-medium text-gray-500">Reason: </span>{entry.reason}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Queries" && (
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700">{queriesSummary?.total ?? fileQueries.length} {(queriesSummary?.total ?? fileQueries.length)===1?"query":"queries"} on this file</h3>
              {(queriesSummary?.statusCounts?.Open || 0)>0&&<span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-600">{queriesSummary.statusCounts.Open} Open</span>}
            </div>
            <button onClick={() => setShowQueryForm(true)} className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"><span className="text-lg leading-none">+</span>Raise Query</button>
          </div>

          {queriesLoading?(
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Loading queries…</div>
          ):queriesError?(
            <div className="bg-white rounded-xl border border-gray-200 py-14 flex flex-col items-center gap-3">
              <p className="text-sm text-red-500">{queriesError}</p>
              <button onClick={fetchQueries} className="text-sm font-medium text-[#1a2744] border border-[#1a2744]/25 px-4 py-2 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors">Retry</button>
            </div>
          ):fileQueries.length===0?(
            <div className="bg-white rounded-xl border border-gray-200 py-14 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="text-sm text-gray-400">No queries raised on this file yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">{["Query", "Assigned To", "Priority", "Status", "Age", "Due Date"].map(col => <th key={col} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{col}</th>)}</tr></thead>
                <tbody>
                  {fileQueries.map(q => {
                    const age = getAgeing(q.createdAt);
                    return (
                      <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={()=>setSelectedQuery(q)}>
                        <td className="px-5 py-3.5 max-w-xs"><p className="text-sm font-medium text-gray-800 leading-snug">{q.title}</p><p className="text-xs font-mono text-gray-400 mt-0.5">{q.queryNumber}</p></td>
                        <td className="px-5 py-3.5 whitespace-nowrap"><p className="text-sm text-gray-700">{q.assignedTo?.name||"—"}</p></td>
                        <td className="px-5 py-3.5"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_STYLES[q.priority]||""}`}>{q.priority}</span></td>
                        <td className="px-5 py-3.5"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${QUERY_STATUS_STYLES[q.status]||""}`}>{q.status}</span></td>
                        <td className="px-5 py-3.5 whitespace-nowrap">{age!==null&&<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${age>7?"bg-orange-50 text-orange-400":"bg-gray-100 text-gray-400"}`}>{age}d</span>}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDateDisplay(q.dueDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {showQueryForm&&<QueryCreationPanel fileId={fileId} fileNumber={file.fileNumber} fileTitle={file.fileTitle} onClose={()=>setShowQueryForm(false)} onCreated={(nq)=>{setFileQueries(prev=>[nq,...prev]);setShowQueryForm(false);fetchQueries();}}/>}
          {selectedQuery&&<QueryDetailPanel query={selectedQuery} onClose={()=>setSelectedQuery(null)}/>}
        </div>
      )}

      {showFinalizeModal && <OtpModal onConfirm={handleFinalizeConfirm} onCancel={() => setShowFinalizeModal(false)} />}
    </div>
  );
};

export default FileDetailPage;