import { useState, useRef, useEffect } from "react";
import { createFile } from "../services/filesService";
import { uploadAttachments } from "../services/attachmentsService";
import { getUlbs } from "../services/masterDataService";
import { CONTRACT_TYPES } from "../assets/data";
import { ULB_OFFICERS } from "../assets/data";
import { MANDATORY_SLOTS } from "../assets/data";



const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ─── Searchable Dropdown ─── */

const SearchableDropdown = ({ options, value, onChange, placeholder }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option);
    setQuery(option);
    setOpen(false);
  };

  const handleBlur = (e) => {
    if (!containerRef.current.contains(e.relatedTarget)) setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <input
        type="text"
        value={query || value}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((o) => (
            <li
              key={o}
              onMouseDown={() => handleSelect(o)}
              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ─── Step Indicator ─── */

const StepIndicator = ({ metaSubmitted }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="flex items-center gap-2">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${metaSubmitted
          ? "bg-green-100 text-green-700"
          : "bg-[#1a2744] text-white"
          }`}
      >
        {metaSubmitted ? "✓" : "1"}
      </span>
      <span className={`text-sm font-medium ${metaSubmitted ? "text-green-700" : "text-gray-800"}`}>
        File Metadata
      </span>
    </div>

    <div className="w-10 h-px bg-gray-300" />

    <div className="flex items-center gap-2">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${metaSubmitted
          ? "bg-[#1a2744] text-white"
          : "bg-gray-200 text-gray-400"
          }`}
      >
        2
      </span>
      <span className={`text-sm font-medium ${metaSubmitted ? "text-gray-800" : "text-gray-400"}`}>
        Upload Attachments
      </span>
    </div>
  </div>
);

/* ─── Main Page ─── */

const NewFilePage = ({ onBack, onSubmit }) => {
  // ── Meta state
  const [form, setForm] = useState({
    fileNumber: "",
    contractType: "",
    ulb: "",
    officer: "",
    fileTitle: "",
    workDescription: "",
    amount: "",
    riskFlag: "Low",
  });

  const [ulbOptions, setUlbOptions] = useState([]);
  const [fileId, setFileId] = useState(null);
  const [checklistId, setChecklistId] = useState(null);
  const [metaSubmitted, setMetaSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Attachment state
  const [mandatoryPhotos, setMandatoryPhotos] = useState({
    page1: null,
    last3: null,
    last2: null,
    last1: null,
  });
  const [pagePhotos, setPagePhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docDragOver, setDocDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Refs
  const mandatoryRefs = {
    page1: useRef(null),
    last3: useRef(null),
    last2: useRef(null),
    last1: useRef(null),
  };
  const pagePhotoRef = useRef(null);
  const docInputRef = useRef(null);

  useEffect(() => {
    const loadUlbs = async () => {
      try {
        const res = await getUlbs();
        setUlbOptions(res.data.ulbs || []);
      } catch (err) {
        console.error("Failed to load ULBs", err);
      }
    };
    loadUlbs();
  }, []);

  // ── Meta handlers
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submitMetaData = async () => {
    if (!form.fileNumber || !form.contractType || !form.ulb || !form.fileTitle) {
      alert("Please fill required fields");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        fileNumber: form.fileNumber,
        contractTypeId: form.contractType,
        ulbId: form.ulb,
        officerName: "55555555-5555-5555-5555-555555555555",
        templateId: CONTRACT_TYPES.find((c) => c.id === form.contractType)?.template_id,
        fileTitle: form.fileTitle,
        workDescription: form.workDescription,
        amount: form.amount,
        riskFlag: form.riskFlag,
        supplierId: "44444444-4444-4444-4444-000000000002",
      };

      const res = await createFile(payload);

      setFileId(res.fileId);
      setChecklistId(res.checklistId);
      setMetaSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to create file");
    } finally {
      setSaving(false);
    }
  };

  // ── Attachment handlers
  const handleMandatoryUpload = (key, files) => {
    const file = files[0];
    if (file) setMandatoryPhotos((prev) => ({ ...prev, [key]: file }));
  };

  const addPagePhoto = (files) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setPagePhotos((prev) => [
      ...prev,
      ...incoming.map((f) => ({ file: f, description: "" })),
    ]);
  };

  const updatePagePhotoDesc = (index, desc) => {
    setPagePhotos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, description: desc } : p))
    );
  };

  const removePagePhoto = (index) =>
    setPagePhotos((prev) => prev.filter((_, i) => i !== index));

  const addDocuments = (files) => {
    const incoming = Array.from(files).filter(
      (f) => !documents.find((x) => x.name === f.name && x.size === f.size)
    );
    setDocuments((prev) => [...prev, ...incoming]);
  };

  const removeDocument = (index) =>
    setDocuments((prev) => prev.filter((_, i) => i !== index));

  const handleDocDrop = (e) => {
    e.preventDefault();
    setDocDragOver(false);
    addDocuments(e.dataTransfer.files);
  };
  const uploadAllAttachments = async () => {
    if (!fileId || !checklistId) {
      alert("Submit metadata first");
      return;
    }

    const attachments = [];

    if (mandatoryPhotos.page1)
      attachments.push({ field: "firstPage", file: mandatoryPhotos.page1 });
    if (mandatoryPhotos.last3)
      attachments.push({ field: "lastPage", file: mandatoryPhotos.last3 });
    if (mandatoryPhotos.last2)
      attachments.push({ field: "lastPage", file: mandatoryPhotos.last2 });
    if (mandatoryPhotos.last1)
      attachments.push({ field: "lastPage", file: mandatoryPhotos.last1 });

    pagePhotos.forEach((p) =>
      attachments.push({ field: "intermediatePages", file: p.file })
    );
    documents.forEach((doc) =>
      attachments.push({ field: "documents", file: doc })
    );

    if (attachments.length === 0) {
      alert("Please add at least one attachment");
      return;
    }

    try {
      setUploading(true);
      const res = await uploadAttachments(fileId, checklistId, attachments);

      if (!res.success) {
        throw new Error(res.message);
      }
      alert("Attachments uploaded successfully");
      onSubmit?.({
        ...form,
        id: fileId,
        status: "Pre-Audit",
        attachmentCount: attachments.length,
      });
    } catch (err) {
      console.error("Upload error:", err);
      console.error("Response:", err?.response?.data);
      console.error("Status:", err?.response?.status);
      alert("Upload failed: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm";

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 mb-5">
        ← Back to Files
      </button>

      <h1 className="text-2xl font-bold mb-1">New File</h1>
      <p className="text-sm text-gray-400 mb-6">Index a new audit file</p>

      <StepIndicator metaSubmitted={metaSubmitted} />

      {/* ──────────────────────────────────────────────────────
           STEP 1 — METADATA
           ────────────────────────────────────────────────────── */}

      <div
        className={`bg-white border rounded-xl p-6 transition-opacity ${metaSubmitted ? "opacity-60 pointer-events-none" : ""
          }`}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          File Metadata
        </h2>

        {/* Row 1 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              File Number <span className="text-red-500">*</span>
            </label>
            <input
              name="fileNumber"
              value={form.fileNumber}
              onChange={handleChange}
              placeholder="File Number"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Contract Type <span className="text-red-500">*</span>
            </label>
            <select
              name="contractType"
              value={form.contractType}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select Contract</option>
              {CONTRACT_TYPES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              ULB <span className="text-red-500">*</span>
            </label>
            <select
              name="ulb"
              value={form.ulb}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select ULB</option>
              {ulbOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Officer
            </label>
            <SearchableDropdown
              options={ULB_OFFICERS}
              value={form.officer}
              onChange={(val) => setForm({ ...form, officer: val })}
              placeholder="Officer"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              File Title <span className="text-red-500">*</span>
            </label>
            <input
              name="fileTitle"
              value={form.fileTitle}
              onChange={handleChange}
              placeholder="File Title"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Amount
            </label>
            <input
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Amount"
              type="number"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Risk Flag
            </label>
            <select
              name="riskFlag"
              value={form.riskFlag}
              onChange={handleChange}
              className={inputClass}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Work Description
          </label>
          <textarea
            name="workDescription"
            value={form.workDescription}
            onChange={handleChange}
            placeholder="Work Description"
            rows={3}
            className={inputClass}
          />
        </div>

        {!metaSubmitted && (
          <button
            onClick={submitMetaData}
            disabled={saving}
            className="mt-5 bg-[#1a2744] text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Submit Metadata"}
          </button>
        )}

        {metaSubmitted && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
            <span className="text-lg">✓</span> Metadata saved — File #{form.fileNumber}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────
           STEP 2 — ATTACHMENTS  (visible only after meta saved)
           ────────────────────────────────────────────────────── */}

      {metaSubmitted && (
        <div className="bg-white border rounded-xl p-6 mt-5 animate-[fadeIn_0.3s_ease]">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            Upload Attachments
          </h2>

          {/* ── Mandatory Page Photos ── */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Mandatory Page Photos
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {MANDATORY_SLOTS.map((slot) => (
                <div key={slot.key}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={mandatoryRefs[slot.key]}
                    className="hidden"
                    onChange={(e) =>
                      handleMandatoryUpload(slot.key, e.target.files)
                    }
                  />

                  {mandatoryPhotos[slot.key] ? (
                    <div className="relative border rounded-lg overflow-hidden group">
                      <img
                        src={URL.createObjectURL(mandatoryPhotos[slot.key])}
                        alt={slot.label}
                        className="w-full h-28 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          onClick={() => mandatoryRefs[slot.key].current.click()}
                          className="text-white text-xs bg-white/20 px-2 py-1 rounded"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() =>
                            setMandatoryPhotos((p) => ({
                              ...p,
                              [slot.key]: null,
                            }))
                          }
                          className="text-white text-xs bg-red-500/60 px-2 py-1 rounded"
                        >
                          Remove
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                        {slot.label}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => mandatoryRefs[slot.key].current.click()}
                      className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#1a2744] hover:text-[#1a2744] transition"
                    >
                      <span className="text-2xl leading-none mb-1">+</span>
                      <span className="text-xs">{slot.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Intermediate Page Photos ── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Intermediate Page Photos
              </h3>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={pagePhotoRef}
                className="hidden"
                onChange={(e) => addPagePhoto(e.target.files)}
              />
              <button
                onClick={() => pagePhotoRef.current.click()}
                className="text-xs text-[#1a2744] font-medium hover:underline"
              >
                + Add Photos
              </button>
            </div>

            {pagePhotos.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
                No intermediate pages added yet
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {pagePhotos.map((p, i) => (
                  <div key={i} className="border rounded-lg overflow-hidden relative group">
                    <img
                      src={URL.createObjectURL(p.file)}
                      alt={`page-${i}`}
                      className="w-full h-28 object-cover"
                    />
                    <button
                      onClick={() => removePagePhoto(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                    <input
                      type="text"
                      placeholder="Description…"
                      value={p.description}
                      onChange={(e) => updatePagePhotoDesc(i, e.target.value)}
                      className="w-full border-t px-2 py-1.5 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Documents ── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Documents</h3>
              <input
                type="file"
                multiple
                ref={docInputRef}
                className="hidden"
                onChange={(e) => addDocuments(e.target.files)}
              />
              <button
                onClick={() => docInputRef.current.click()}
                className="text-xs text-[#1a2744] font-medium hover:underline"
              >
                + Add Documents
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDocDragOver(true);
              }}
              onDragLeave={() => setDocDragOver(false)}
              onDrop={handleDocDrop}
              className={`border-2 border-dashed rounded-lg p-4 transition ${docDragOver
                ? "border-[#1a2744] bg-blue-50"
                : "border-gray-200"
                }`}
            >
              {documents.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-2">
                  Drag & drop files here, or click "+ Add Documents"
                </p>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-700 truncate">
                        <span className="text-gray-400">📄</span>
                        <span className="truncate">{doc.name}</span>
                        <span className="text-xs text-gray-400">
                          {formatSize(doc.size)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeDocument(i)}
                        className="text-gray-400 hover:text-red-500 text-sm"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Upload Button ── */}
          <button
            onClick={uploadAllAttachments}
            disabled={uploading}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload Attachments"}
          </button>
        </div>
      )}
    </div>
  );
};

export default NewFilePage;