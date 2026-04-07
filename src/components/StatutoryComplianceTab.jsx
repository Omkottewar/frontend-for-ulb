import { useState } from "react";

const COMPLIANCE_TYPES = ["GST", "TDS", "PF", "ESI", "Labour Cess", "Professional Tax", "Stamp Duty", "Other"];

const STATUS_STYLES = {
  Complied: { badge: "bg-green-100 text-green-600", dot: "bg-green-500" },
  Pending: { badge: "bg-amber-100 text-amber-600", dot: "bg-amber-400" },
  "Non-Compliant": { badge: "bg-red-100 text-red-600", dot: "bg-red-500" },
};

// Mock attachment data per compliance id
const MOCK_ATTACHMENTS = {
  c1: [{ name: "gst_certificate.pdf", size: "42 KB", ext: "pdf" }],
  c2: [],
  c3: [{ name: "labour_cess_notice.pdf", size: "18 KB", ext: "pdf" }],
};

const EMPTY_FORM = { complianceType: "GST", details: "", status: "Pending" };

export default function StatutoryComplianceTab({ compliances, setCompliances, isCA, isFinalized, onFinalize }) {
  const [expanded, setExpanded] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formAttachments, setFormAttachments] = useState([]);
  const [formDragOver, setFormDragOver] = useState(false);
  // per-compliance attachment state (mock — session only)
  const [attachments, setAttachments] = useState(MOCK_ATTACHMENTS);

  const compliedCount = compliances.filter((c) => c.status === "Complied").length;
  const hasNonCompliant = compliances.some((c) => c.status === "Non-Compliant");
  const canFinalize = isCA && !isFinalized && !hasNonCompliant;

  const finalizeDisabledReason = isFinalized
    ? null
    : hasNonCompliant
    ? "Resolve all Non-Compliant items before finalizing"
    : null;

  // ── helpers ──────────────────────────────────────────────────────
  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormAttachments([]);
    setShowAddForm(true);
    setExpanded(null);
  };

  const openEditForm = (c) => {
    setEditingId(c.id);
    setForm({ complianceType: c.complianceType, details: c.details, status: c.status });
    setFormAttachments([]);
    setShowAddForm(false);
    setExpanded(null);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormAttachments([]);
  };

  const saveEntry = () => {
    if (!form.details.trim()) return;
    if (editingId) {
      // merge any newly attached files into existing entry's attachments
      if (formAttachments.length > 0) {
        setAttachments((prev) => ({
          ...prev,
          [editingId]: [...(prev[editingId] || []), ...formAttachments],
        }));
      }
      setCompliances((prev) =>
        prev.map((c) => c.id === editingId ? { ...c, ...form } : c)
      );
      setEditingId(null);
    } else {
      const newEntry = {
        id: `c${Date.now()}`,
        ...form,
        addedBy: "CA Sharma",
        addedAt: new Date().toLocaleDateString("en-IN"),
      };
      setCompliances((prev) => [...prev, newEntry]);
      setAttachments((prev) => ({ ...prev, [newEntry.id]: formAttachments }));
      setShowAddForm(false);
    }
    setForm(EMPTY_FORM);
    setFormAttachments([]);
  };

  const deleteEntry = (id) => {
    setCompliances((prev) => prev.filter((c) => c.id !== id));
    setAttachments((prev) => { const n = { ...prev }; delete n[id]; return n; });
    if (expanded === id) setExpanded(null);
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
    if (editingId) cancelForm();
  };

  // ── mock file attach (UI only) ────────────────────────────────────
  const handleAttach = (compId, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const mapped = files.map((f) => ({
      name: f.name,
      size: f.size < 1024 * 1024
        ? `${(f.size / 1024).toFixed(0)} KB`
        : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      ext: f.name.split(".").pop().toLowerCase(),
    }));
    setAttachments((prev) => ({ ...prev, [compId]: [...(prev[compId] || []), ...mapped] }));
    e.target.value = "";
  };

  const mapFiles = (rawFiles) =>
    Array.from(rawFiles).map((f) => ({
      name: f.name,
      size: f.size < 1024 * 1024
        ? `${(f.size / 1024).toFixed(0)} KB`
        : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      ext: f.name.split(".").pop().toLowerCase(),
    }));

  // ── inline add/edit form ──────────────────────────────────────────
  const ComplianceForm = ({ id }) => (
    <div className="bg-white border border-[#1a2744]/20 rounded-xl overflow-hidden shadow-sm">
      {/* Form header */}
      <div className="bg-[#1a2744]/5 px-5 py-3 border-b border-[#1a2744]/10">
        <p className="text-sm font-semibold text-[#1a2744]">
          {id ? "Edit Compliance Entry" : "New Compliance Entry"}
        </p>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Row 1: Type + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Compliance Type</label>
            <select
              value={form.complianceType}
              onChange={(e) => setForm((f) => ({ ...f, complianceType: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] transition"
            >
              {COMPLIANCE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <div className="flex gap-1.5 h-9.5">
              {["Pending", "Complied", "Non-Compliant"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`flex-1 text-xs font-semibold rounded-lg border transition-colors ${
                    form.status === s
                      ? s === "Complied" ? "bg-green-500 text-white border-green-500"
                        : s === "Non-Compliant" ? "bg-red-500 text-white border-red-500"
                        : "bg-amber-400 text-white border-amber-400"
                      : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 bg-white"
                  }`}
                >
                  {s === "Non-Compliant" ? "Non-Comp." : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Details */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Details / Calculation</label>
          <textarea
            value={form.details}
            onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
            placeholder="Describe the compliance calculation, applicable rates, certificate numbers, challan numbers, etc."
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] resize-none transition"
          />
        </div>

        {/* Row 3: Supporting Documents — drag-drop zone */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Supporting Documents
            {formAttachments.length > 0 && (
              <span className="ml-1.5 text-[#1a2744] font-semibold">({formAttachments.length} file{formAttachments.length > 1 ? "s" : ""} selected)</span>
            )}
          </label>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setFormDragOver(true); }}
            onDragLeave={() => setFormDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setFormDragOver(false);
              setFormAttachments((prev) => [...prev, ...mapFiles(e.dataTransfer.files)]);
            }}
            className={`relative border-2 border-dashed rounded-xl transition-colors ${
              formDragOver
                ? "border-[#1a2744] bg-[#1a2744]/5"
                : "border-gray-200 bg-gray-50 hover:border-gray-300"
            }`}
          >
            <label className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer">
              {/* Upload icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${formDragOver ? "bg-[#1a2744]/10" : "bg-gray-100"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-colors ${formDragOver ? "text-[#1a2744]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium transition-colors ${formDragOver ? "text-[#1a2744]" : "text-gray-500"}`}>
                  {formDragOver ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">or <span className="text-[#1a2744] underline font-medium">click to browse</span></p>
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (!e.target.files?.length) return;
                  setFormAttachments((prev) => [...prev, ...mapFiles(e.target.files)]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {/* Attached file list */}
          {formAttachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {formAttachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                    {att.ext}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 truncate">{att.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{att.size}</span>
                  <button
                    type="button"
                    onClick={() => setFormAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={cancelForm}
            className="text-sm font-medium text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveEntry}
            disabled={!form.details.trim()}
            className="text-sm font-medium bg-[#1a2744] text-white px-5 py-2 rounded-lg hover:bg-[#243460] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {id ? "Save Changes" : "Save Entry"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        {/* LEFT: informative */}
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">
            {compliances.length > 0
              ? `${compliances.length} compliance ${compliances.length === 1 ? "entry" : "entries"}`
              : "No compliance entries yet"}
          </h3>
          {/* Summary pill */}
          {compliances.length > 0 && (
            <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 ${
              hasNonCompliant ? "bg-red-100 text-red-600" : compliedCount === compliances.length ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasNonCompliant ? "bg-red-500" : compliedCount === compliances.length ? "bg-green-500" : "bg-amber-400"}`} />
              {hasNonCompliant
                ? `${compliances.filter(c => c.status === "Non-Compliant").length} Non-Compliant`
                : `${compliedCount} of ${compliances.length} Complied`}
            </span>
          )}
        </div>

        {/* RIGHT: action buttons */}
        <div className="flex items-center gap-2">
          {/* Add Compliance Entry — always visible for CA */}
          {isCA && !isFinalized && (
            <button
              onClick={showAddForm || editingId ? cancelForm : openAddForm}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                showAddForm || editingId
                  ? "border-gray-200 text-gray-400 hover:border-gray-300"
                  : "border-[#1a2744] text-[#1a2744] hover:bg-[#1a2744] hover:text-white"
              }`}
            >
              {showAddForm || editingId ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Entry
                </>
              )}
            </button>
          )}

          {/* Finalize button */}
          {isCA && !isFinalized && (
            <button
              onClick={canFinalize ? onFinalize : undefined}
              disabled={!canFinalize}
              title={finalizeDisabledReason || ""}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                canFinalize
                  ? "bg-[#1a2744] hover:bg-[#243460] text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Finalize File
            </button>
          )}

          {/* Finalized badge */}
          {isFinalized && (
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              File Finalized
            </span>
          )}
        </div>
      </div>

      {/* Add form — always at top, no scrolling needed */}
      {showAddForm && <ComplianceForm />}

      {/* Empty state */}
      {compliances.length === 0 && !showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl py-14 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">No compliance entries added yet.</p>
          {isCA && !isFinalized && (
            <p className="text-xs text-gray-300">Add entries if statutory compliance applies, or finalize directly if not required.</p>
          )}
        </div>
      )}

      {/* Compliance cards */}
      {compliances.length > 0 && (
        <div className="space-y-2">
          {compliances.map((c) => {
            const isOpen = expanded === c.id;
            const isEditing = editingId === c.id;
            const cardAttachments = attachments[c.id] || [];
            const s = STATUS_STYLES[c.status] || STATUS_STYLES.Pending;

            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Card header */}
                <div
                  className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                  onClick={() => !isEditing && toggleExpand(c.id)}
                >
                  {/* Status dot */}
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />

                  {/* Type & meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{c.complianceType}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{c.details}</p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.badge}`}>
                      {c.status}
                    </span>
                    <span className="text-xs text-gray-300">
                      {c.addedBy} • {c.addedAt}
                    </span>

                    {/* Edit */}
                    {isCA && !isFinalized && (
                      <button
                        onClick={() => openEditForm(c)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-[#1a2744] hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}

                    {/* Delete */}
                    {isCA && !isFinalized && (
                      <button
                        onClick={() => deleteEntry(c.id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}

                    {/* Chevron */}
                    <button
                      onClick={() => !isEditing && toggleExpand(c.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <div className="px-5 pb-4 border-t border-gray-100">
                    <div className="pt-4">
                      <ComplianceForm id={c.id} />
                    </div>
                  </div>
                )}

                {/* Expanded content */}
                {isOpen && !isEditing && (
                  <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-4">
                    {/* Full details */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Details</p>
                      <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed">
                        {c.details}
                      </div>
                    </div>

                    {/* Attachments */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                        Supporting Documents {cardAttachments.length > 0 && `(${cardAttachments.length})`}
                      </p>
                      {cardAttachments.length === 0 ? (
                        <p className="text-xs text-gray-300 italic">No documents attached.</p>
                      ) : (
                        <div className="space-y-1">
                          {cardAttachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                              <span className="text-xs font-semibold text-gray-400 uppercase bg-white border border-gray-200 px-1.5 py-0.5 rounded shrink-0">
                                {att.ext}
                              </span>
                              <span className="text-sm text-gray-700 flex-1 truncate">{att.name}</span>
                              <span className="text-xs text-gray-400 shrink-0">{att.size}</span>
                              <button className="text-xs text-[#1a2744] font-medium hover:underline shrink-0">
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Attach button — CA only, non-finalized */}
                      {isCA && !isFinalized && (
                        <label className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#1a2744] cursor-pointer hover:underline w-fit">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Attach Document
                          <input type="file" className="hidden" multiple onChange={(e) => handleAttach(c.id, e)} />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View-only notice */}
      {isFinalized && (
        <div className="flex items-center gap-2 text-xs text-purple-500 bg-purple-50 border border-purple-100 rounded-lg px-4 py-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          This file has been finalized. Compliance records are read-only.
        </div>
      )}

      {/* Non-CA read-only notice */}
      {!isCA && !isFinalized && compliances.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View only — statutory compliance is managed by the Chartered Accountant.
        </div>
      )}
    </div>
  );
}
