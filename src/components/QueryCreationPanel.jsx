import { useState, useEffect } from "react";
import { getSession } from "../utils/auth";
import {
  getAssignableUsers,
  createQuery,
  uploadQueryAttachments,
} from "../services/queriesService";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition placeholder-gray-400";

export default function QueryCreationPanel({ fileId, fileNumber, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedToId: "",
    priority: "Medium",
    dueDate: "",
  });
  const [attachments, setAttachments] = useState([]);   // display metadata: { name, size, ext }
  const [rawFiles, setRawFiles] = useState([]);          // raw File objects for upload
  const [dragOver, setDragOver] = useState(false);

  // Assignable users (API-driven)
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const session = getSession();

  // ── Fetch assignable users on mount ──
  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    const load = async () => {
      try {
        setUsersLoading(true);
        setUsersError(null);
        const data = await getAssignableUsers(fileId);
        if (!cancelled) setAssignableUsers(data.assignableUsers);
      } catch (err) {
        console.error("Failed to load assignable users:", err);
        if (!cancelled) setUsersError(err.message || "Failed to load team members.");
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [fileId]);

  // ── Form helpers ──
  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addFiles = (files) => {
    const mapped = files.map((f) => ({
      name: f.name,
      size:
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`,
      ext: f.name.split(".").pop().toLowerCase(),
    }));
    setAttachments((prev) => [...prev, ...mapped]);
    setRawFiles((prev) => [...prev, ...files]);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setRawFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      // Step 1: Create query
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        assignedTo: form.assignedToId,
        priority: form.priority,
        dueDate: form.dueDate,
        checklistId: null,
        userId: session?.id,
      };

      const created = await createQuery(fileId, payload);

      // Step 2: Upload attachments if any
      if (rawFiles.length > 0 && created.id) {
        try {
          await uploadQueryAttachments(created.id, rawFiles);
        } catch (uploadErr) {
          // Query was created successfully but attachment upload failed
          console.error("Attachment upload failed:", uploadErr);
        }
      }

      onCreated(created);
    } catch (err) {
      console.error("Failed to create query:", err);
      setSubmitError(err.message || "Failed to raise query. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.title.trim() && form.assignedToId && form.dueDate;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="w-96 bg-white h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Raise Query</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[240px]">{fileNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
          {/* Query Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Query Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. TDS certificate missing for challan #0118"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the issue in detail. Include document names, page numbers, or specific discrepancies..."
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assign To <span className="text-red-500">*</span>
            </label>
            {usersLoading ? (
              <div className={`${inputClass} text-gray-400`}>Loading team members…</div>
            ) : usersError ? (
              <div className="text-sm text-red-500">{usersError}</div>
            ) : (
              <select
                value={form.assignedToId}
                onChange={(e) => handleChange("assignedToId", e.target.value)}
                className={inputClass}
              >
                <option value="">Select team member</option>
                {assignableUsers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} — {m.roleName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {["Low", "Medium", "High"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleChange("priority", p)}
                  className={`flex-1 text-xs font-semibold rounded-lg border py-2 transition-colors ${
                    form.priority === p
                      ? p === "High"
                        ? "bg-red-500 text-white border-red-500"
                        : p === "Medium"
                        ? "bg-orange-400 text-white border-orange-400"
                        : "bg-green-500 text-white border-green-500"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Attachments
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl py-5 px-4 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-[#1a2744] bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50"
              }`}
            >
              <label className="cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <p className="text-sm text-gray-400">
                  <span className="text-[#1a2744] font-medium">Click to browse</span> or drag files here
                </p>
                <p className="text-xs text-gray-300 mt-1">PDF, XLSX, DOCX, JPG up to 10 MB</p>
                <input type="file" multiple className="hidden" onChange={handleFileInput} />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                      {att.ext}
                    </span>
                    <span className="text-sm text-gray-700 flex-1 truncate">{att.name}</span>
                    <span className="text-xs text-gray-400">{att.size}</span>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
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

          {/* Submit error */}
          {submitError && (
            <p className="text-sm text-red-500">{submitError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Raising Query…" : "Raise Query"}
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}