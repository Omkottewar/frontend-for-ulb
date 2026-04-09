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
import { CONTRACT_TYPES, TRANSLATIONS, VALUE_MAP, STATUS_STYLES } from "../assets/data";
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
import { createQuery, getQueriesByFile } from "../services/queriesService";
import { downloadFile } from "../utils/storage";
import toast from "react-hot-toast";
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
// The placeholder supplier seeded by default — if this ID comes back,
// treat it as "no real supplier linked yet" and prompt the user to fill it in.
const DEFAULT_SUPPLIER_ID = "44444444-4444-4444-4444-000000000002";

/** Format a date string (ISO or DD/MM/YYYY) to DD/MM/YYYY for display */
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "—";
  if (dateStr.includes("/")) return dateStr; // already DD/MM/YYYY
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN");
};

// ── Helpers ────────────────────────────────────────────────────────
const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Build a flat responses map from the template JSON.
 * Handles ALL section types so every field has an initial entry.
 */
const buildResponsesMap = (form) => {
  const resMap = {};
  if (!form?.sections) return resMap;

  for (const section of form.sections) {
    // ── Regular fields ──────────────────────────────────────
    if (section.fields) {
      for (const field of section.fields) {
        resMap[field.fieldId] = { value: field.value ?? null, remark: field.remark ?? "" };
      }
    }

    // ── Conditional group fields ─────────────────────────────
    if (section.conditionalGroups) {
      for (const cg of section.conditionalGroups) {
        for (const field of cg.fields || []) {
          resMap[field.fieldId] = { value: field.value ?? null, remark: field.remark ?? "" };
        }
      }
    }

    // ── Checklist table items ────────────────────────────────
    if (section.type === "checklist_table" && section.items) {
      for (const item of section.items) {
        if (item.responseField?.fieldId) {
          resMap[item.responseField.fieldId] = {
            value: item.responseField.value ?? null,
            remark: "",
          };
        }
        if (item.remarkField?.fieldId) {
          resMap[item.remarkField.fieldId] = {
            value: item.remarkField.value ?? null,
            remark: "",
          };
        }
      }
    }

    // ── Document checklist ───────────────────────────────────
    // FIX: was missing entirely — these fields were never initialised
    if (section.type === "document_checklist" && section.items) {
      for (const item of section.items) {
        if (item.checkField?.fieldId) {
          resMap[item.checkField.fieldId] = {
            value: item.checkField.value ?? null,
            remark: "",
          };
        }
      }
    }

    // ── Line items table ─────────────────────────────────────
    // FIX: was using `rowId__columnId` — backend uses `rowId_amount` / `rowId_remark`
    // Now we use `rowId_columnId` (single underscore) to stay consistent,
    // AND we update the backend to match this same convention (see Fix 3).
    // ── Line items table ─────────────────────────────────────────────
    if (section.type === "line_items_table" && section.rows && section.columns) {
      for (const row of section.rows) {
        for (const col of section.columns) {
          if (col.type === "readonly") continue;
          const key = `${row.rowId}_${col.columnId}`;
          // ✅ read savedValues injected by backend instead of always null
          resMap[key] = {
            value: row.savedValues?.[col.columnId] ?? null,
            remark: "",
          };
        }
      }
    }

    // ── Dynamic table ─────────────────────────────────────────────────
    // FIX: was skipped — now initialised from savedRows injected by backend
    if (section.type === "table") {
      const key = `__table_${section.sectionId}`;
      resMap[key] = {
        value: section.savedRows?.length
          ? JSON.stringify(section.savedRows)
          : null,
        remark: "",
      };
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
      toast.error("Upload failed: " + (err?.response?.data?.message || err.message));
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
// ❌ These are at module level, before FileDetailPage
const [creatingChecklist, setCreatingChecklist] = useState(false);
const [savingMasterData, setSavingMasterData] = useState(false);
const [previewUrl, setPreviewUrl] = useState(null);
const [previewFileName, setPreviewFileName] = useState("");
const [previewLoading, setPreviewLoading] = useState(false);
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

        // Supplier → masterData
        if (data.supplier) {
          // ✅ store the raw supplier ID so we can check for the default later
          normalized.supplierId = data.supplier.id || data.supplier.supplierId || null;

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
  /**
   * Scan all conditional groups in the form and return red flags
   * whose trigger condition is currently met in responses.
   *
   * Returns: [{ flagFieldId, title, triggerFieldId, triggerValue }]
   */
  const detectTriggeredRedFlags = (form, responses) => {
    const triggered = [];

    for (const section of form?.sections || []) {
      for (const group of section.conditionalGroups || []) {
        const { fieldId: triggerFieldId, equals: triggerValue } = group.showWhen || {};
        if (!triggerFieldId || !triggerValue) continue;

        const currentVal = responses[triggerFieldId]?.value;
        if (currentVal !== triggerValue) continue;

        // This group's condition is met — check if it contains a red_flag field
        for (const field of group.fields || []) {
          if (field.flagType === "red_flag") {
            triggered.push({
              flagFieldId: field.fieldId,
              title: field.defaultValue || field.label || "Auto Query",
              triggerFieldId,
              triggerValue,
            });
          }
        }
      }
    }

    return triggered;
  };
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

  const handleNewChecklist = async () => {
    try {
      if (!fileId) { toast.error("File ID missing"); return; }

      setCreatingChecklist(true); // ✅

      const phase = (checklistList?.length || 0) + 1;
      const contract = CONTRACT_TYPES.find(c => c.id === file?.contractTypeId);

      if (!contract) {
        toast.error("Template not configured for this contract type");
        return;
      }

      const payload = {
        templateId: contract.template_id,
        phaseNumber: phase,
        checkerName: session?.name || "",
        checkDate: new Date().toISOString().slice(0, 10),
      };

      const res = await createChecklistForFile(fileId, payload);

      if (!res?.success) throw new Error(res?.message || "Checklist creation failed");

      await fetchChecklists();
      if (res?.data?.id) setSelectedChecklistId(res.data.id);

    } catch (err) {
      console.error("CREATE CHECKLIST ERROR:", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to create checklist");
    } finally {
      setCreatingChecklist(false); // ✅
    }
  };

  const handleSaveResponses = async () => {
    if (!selectedChecklistId) return;

    try {
      setSavingResponses(true);

      // ── 1. Build and submit payload ───────────────────────────────────────
      const payload = Object.entries(responses).map(([questionId, r]) => ({
        questionId,
        responseValue:
          r.value !== null && r.value !== undefined ? String(r.value) : null,
        remark: r.remark || "",
      }));

      console.log(`📤 Submitting ${payload.length} responses`);

      await saveChecklistResponses(selectedChecklistId, payload);
      await apiUpdateChecklist(selectedChecklistId, { status: "In Progress" });

      // ── 2. Detect triggered red flags ─────────────────────────────────────
      if (checklistForm) {
        const triggered = detectTriggeredRedFlags(checklistForm, responses);

        if (triggered.length > 0) {
          console.log(`🚩 ${triggered.length} red flag(s) triggered:`, triggered.map(t => t.title));

          // Deduplicate against already-existing queries by title
          // so we don't raise the same auto-query twice on re-save
          const existingTitles = new Set(fileQueries.map(q => q.title?.trim()));

          const toRaise = triggered.filter(t => !existingTitles.has(t.title?.trim()));

          if (toRaise.length > 0) {
            // Default due date: 7 days from today
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            const dueDateStr = dueDate.toISOString().slice(0, 10);

            const queryResults = await Promise.allSettled(
              toRaise.map(flag =>
                createQuery(fileId, {
                  title: flag.title,
                  description: `Auto-raised from checklist. Trigger: ${flag.triggerFieldId} = "${flag.triggerValue}"`,
                  assignedTo: session?.id,   // assign to current user as default
                  priority: "High",
                  dueDate: dueDateStr,
                  checklistId: selectedChecklistId,
                })
              )
            );

            const raised = queryResults.filter(r => r.status === "fulfilled").length;
            const failed = queryResults.filter(r => r.status === "rejected").length;

            queryResults.forEach((r, i) => {
              if (r.status === "rejected") {
                console.error(`❌ Failed to raise query for "${toRaise[i].title}":`, r.reason);
              }
            });

            if (raised > 0) {
              // Refresh queries list so new ones appear in Queries tab
              await fetchQueries();
              console.log(`✅ Auto-raised ${raised} query/queries`);
            }

            if (failed > 0) {
              console.warn(`⚠️ ${failed} auto-query/queries failed to raise`);
            }
          }
        }
      }

      // ── 3. Refresh checklists + notify user ────────────────────────────────
      await fetchChecklists();

      const flagCount = checklistForm
        ? detectTriggeredRedFlags(checklistForm, responses).length
        : 0;

      if (flagCount > 0) {
        toast.success(
          `Checklist saved.\n\n🚩 ${flagCount} red flag${flagCount !== 1 ? "s" : ""} detected — queries have been auto-raised in the Queries tab.`
        );
      } else {
        toast.success("Checklist saved successfully.");
      }

    } catch (err) {
      console.error("Failed to save responses:", err);
      toast.error("Failed to save responses: " + (err?.response?.data?.message || err.message));
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

      toast.success("Checklist completed");

    } catch (err) {
      console.error(err);
      toast.error("Failed to complete checklist");
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
    if (changedKeys.includes("fileNumber")) payload.fileNumber = editForm.fileNumber.trim();
    if (changedKeys.includes("fileTitle")) payload.title = editForm.fileTitle.trim();
    if (changedKeys.includes("workDescription")) payload.description = editForm.workDescription.trim() || null;
    if (changedKeys.includes("amount")) payload.amount = editForm.amount;
    if (changedKeys.includes("riskFlag")) payload.riskFlag = editForm.riskFlag;
    if (reason.trim()) payload.reason = reason.trim();

    try {
      setSaveLoading(true);
      setSaveError("");
      await updateFileApi(fileId, payload);

      // Optimistic local state update (Option A)
      const updatedFile = {
        ...file,
        ...(payload.fileNumber !== undefined ? { fileNumber: payload.fileNumber } : {}),
        ...(payload.title !== undefined ? { fileTitle: payload.title } : {}),
        ...(payload.description !== undefined ? { workDescription: payload.description } : {}),
        ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
        ...(payload.riskFlag !== undefined ? { riskFlag: payload.riskFlag } : {}),
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

  const handleMasterDataSave = async () => {
    try {
      setSavingMasterData(true); // ✅
      const updatedFile = {
        ...file,
        masterData: { ...(file.masterData || {}), ...masterDataForm },
      };
      updateFile(updatedFile);
      setFile(updatedFile);
      setEditMasterData(false);
    } finally {
      setSavingMasterData(false); // ✅
    }
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
                  {/* {!editMasterData && !isFinalized && file.supplierId !== DEFAULT_SUPPLIER_ID && (
                    <button
                      onClick={() => { setMasterDataForm({ ...(file.masterData || {}) }); setEditMasterData(true); }}
                      className="text-xs font-medium text-[#1a2744] border border-[#1a2744] px-3 py-1 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                  )} */}
                </div>

                {editMasterData ? (
                  <>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-3 mb-4">
                      {[
                        ["supplierName", "Supplier Name"],
                        ["pan", "PAN"],
                        ["gstNumber", "GST Number"],
                        ["epfRegNo", "EPF Registration No."],
                        ["esicRegNo", "ESIC Registration No."],
                        ["labourLicenseNo", "Labour License No."],
                        ["nameOfDepartment", "Name of Department"],
                        ["fileNo", "File No."],
                        ["nameOfFund", "Name of Fund"],
                      ].map(([key, label]) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                          <input
                            type="text"
                            value={masterDataForm[key] ?? ""}
                            onChange={(e) => setMasterDataForm(prev => ({ ...prev, [key]: e.target.value }))}
                            className={inputClass}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2.5">
                      <button onClick={handleMasterDataSave} className="bg-[#1a2744] text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-[#243358] transition-colors">
                        Save
                      </button>
                      <button onClick={() => setEditMasterData(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5 rounded-lg border border-gray-200 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </>
                ) : file.supplierId === DEFAULT_SUPPLIER_ID || !file.supplierId ? (
                  // ── Default / no supplier linked ────────────────────────────────
                  <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-4">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-800">Supplier details not filled</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Please enter the actual supplier details for this audit.
                      </p>
                      {!isFinalized && (
                        <button
                          onClick={() => { setMasterDataForm({}); setEditMasterData(true); }}
                          className="mt-3 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-1.5 rounded-lg transition-colors"
                        >
                          + Enter Supplier Details
                        </button>
                      )}
                    </div>
                  </div>
                ) : file.masterData && Object.values(file.masterData).some(Boolean) ? (
                  // ── Real supplier data ───────────────────────────────────────────
                  <div className="grid grid-cols-3 gap-x-8">
                    {[
                      ["Supplier Name", file.masterData.supplierName],
                      ["PAN", file.masterData.pan],
                      ["GST Number", file.masterData.gstNumber],
                      ["EPF Reg. No.", file.masterData.epfRegNo],
                      ["ESIC Reg. No.", file.masterData.esicRegNo],
                      ["Labour License No.", file.masterData.labourLicenseNo],
                      ["Name of Department", file.masterData.nameOfDepartment],
                      ["File No.", file.masterData.fileNo],
                      ["Name of Fund", file.masterData.nameOfFund],
                    ].map(([label, value]) => (
                      <Row key={label} label={label} value={value} />
                    ))}
                  </div>

                  // ── Edit button for real supplier ────────────────────────────────
                  // (already shown in the header above when supplierId !== DEFAULT)

                ) : (
                  // ── Real supplier but all fields empty ───────────────────────────
                  <p className="text-sm text-gray-400 italic">
                    No master data added yet.{" "}
                    {!isFinalized && (
                      <button
                        onClick={() => { setMasterDataForm({}); setEditMasterData(true); }}
                        className="text-[#1a2744] underline"
                      >
                        Add now
                      </button>
                    )}
                  </p>
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
            checklistList.filter(cl => allAttachments.some(a => a._checklistId === cl.id)).map(cl => {
              const atts = allAttachments.filter(a => a._checklistId === cl.id);
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
                                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isDownloading ? "text-gray-400 cursor-not-allowed"
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
              {formLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Loading checklist…</div>
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
                {/* Header bar button */}
                {!isFinalized && (
                  <button
                    onClick={handleNewChecklist}
                    disabled={creatingChecklist}
                    className="bg-[#1a2744] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#243358] transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creatingChecklist ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                        </svg>
                        Creating…
                      </>
                    ) : "+ New Checklist"}
                  </button>
                )}

                {/* Empty state button */}
                {!isFinalized && (
                  <button
                    onClick={handleNewChecklist}
                    disabled={creatingChecklist}
                    className="bg-[#1a2744] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#243358] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creatingChecklist ? "Creating…" : "+ New Checklist"}
                  </button>
                )}
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
              <h3 className="text-sm font-semibold text-gray-700">{queriesSummary?.total ?? fileQueries.length} {(queriesSummary?.total ?? fileQueries.length) === 1 ? "query" : "queries"} on this file</h3>
              {(queriesSummary?.statusCounts?.Open || 0) > 0 && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-600">{queriesSummary.statusCounts.Open} Open</span>}
            </div>
            <button onClick={() => setShowQueryForm(true)} className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"><span className="text-lg leading-none">+</span>Raise Query</button>
          </div>

          {queriesLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Loading queries…</div>
          ) : queriesError ? (
            <div className="bg-white rounded-xl border border-gray-200 py-14 flex flex-col items-center gap-3">
              <p className="text-sm text-red-500">{queriesError}</p>
              <button onClick={fetchQueries} className="text-sm font-medium text-[#1a2744] border border-[#1a2744]/25 px-4 py-2 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors">Retry</button>
            </div>
          ) : fileQueries.length === 0 ? (
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
                      <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedQuery(q)}>
                        <td className="px-5 py-3.5 max-w-xs"><p className="text-sm font-medium text-gray-800 leading-snug">{q.title}</p><p className="text-xs font-mono text-gray-400 mt-0.5">{q.queryNumber}</p></td>
                        <td className="px-5 py-3.5 whitespace-nowrap"><p className="text-sm text-gray-700">{q.assignedTo?.name || "—"}</p></td>
                        <td className="px-5 py-3.5"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_STYLES[q.priority] || ""}`}>{q.priority}</span></td>
                        <td className="px-5 py-3.5"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${QUERY_STATUS_STYLES[q.status] || ""}`}>{q.status}</span></td>
                        <td className="px-5 py-3.5 whitespace-nowrap">{age !== null && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${age > 7 ? "bg-orange-50 text-orange-400" : "bg-gray-100 text-gray-400"}`}>{age}d</span>}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDateDisplay(q.dueDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {showQueryForm && <QueryCreationPanel fileId={fileId} fileNumber={file.fileNumber} fileTitle={file.fileTitle} onClose={() => setShowQueryForm(false)} onCreated={(nq) => { setFileQueries(prev => [nq, ...prev]); setShowQueryForm(false); fetchQueries(); }} />}
          {selectedQuery && <QueryDetailPanel query={selectedQuery} onClose={() => setSelectedQuery(null)} />}
        </div>
      )}

      {showFinalizeModal && <OtpModal onConfirm={handleFinalizeConfirm} onCancel={() => setShowFinalizeModal(false)} />}
    </div>
  );
};

export default FileDetailPage;