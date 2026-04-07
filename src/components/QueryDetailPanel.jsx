import { useState, useEffect, useCallback } from "react";
import {
  getQueryDetail,
  getQueryReplies,
  getQueryParticipants,
  getQueryActivityLog,
  createReply,
  resolveQuery,
  getEligibleParticipants,
  addQueryParticipant,
  downloadQueryAttachment,
} from "../services/queriesService";

// ── helpers ──────────────────────────────────────────────────────────────────

const initials = (name) =>
  name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

const getAgeing = (dateStr) => {
  if (!dateStr) return null;
  let created;
  if (dateStr.includes("T") || dateStr.includes("-")) {
    created = new Date(dateStr);
  } else {
    const [d, m, y] = dateStr.split("/").map(Number);
    created = new Date(y, m - 1, d);
  }
  if (isNaN(created.getTime())) return null;
  return Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
};

const isOverdue = (dueDateStr, status) => {
  if (status === "Resolved" || !dueDateStr) return false;
  let due;
  if (dueDateStr.includes("T") || dueDateStr.includes("-")) {
    due = new Date(dueDateStr);
  } else {
    const [d, m, y] = dueDateStr.split("/").map(Number);
    due = new Date(y, m - 1, d);
  }
  if (isNaN(due.getTime())) return false;
  return Date.now() > due.getTime();
};

const formatDate = (isoStr) => {
  if (!isoStr) return "—";
  if (isoStr.includes("/")) return isoStr;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString("en-IN");
};

const formatDateTime = (isoStr) => {
  if (!isoStr) return "—";
  if (isoStr.includes("/")) return isoStr;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return `${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getExtension = (fileName) =>
  fileName ? fileName.split(".").pop().toLowerCase() : "";

const PRIORITY_STYLES = {
  High: "bg-red-100 text-red-500",
  Medium: "bg-orange-100 text-orange-500",
  Low: "bg-green-100 text-green-600",
};

const STATUS_STYLES = {
  Open: "bg-blue-100 text-blue-600",
  "In Progress": "bg-amber-100 text-amber-600",
  Resolved: "bg-green-100 text-green-600",
};

const LOG_ICON_STYLES = {
  created: "bg-[#1a2744] text-white",
  assigned: "bg-blue-100 text-blue-600",
  replied: "bg-gray-100 text-gray-500",
  participant: "bg-purple-100 text-purple-600",
  status: "bg-amber-100 text-amber-600",
  resolved: "bg-green-100 text-green-600",
};

const LOG_LABELS = {
  created: "raised this query",
  assigned: "assigned the query",
  replied: "replied",
  participant: "added a participant",
  status: "updated status",
  resolved: "marked as resolved",
};

// ── sub-components ────────────────────────────────────────────────────────────

function AttachmentList({ attachments }) {
  if (!attachments || attachments.length === 0) return null;

  const handleDownload = async (attachmentId) => {
    if (!attachmentId || attachmentId.startsWith("temp-")) return;
    try {
      const data = await downloadQueryAttachment(attachmentId);
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to download attachment:", err);
    }
  };

  return (
    <div className="mt-3 space-y-1.5">
      {attachments.map((att) => (
        <div
          key={att.id || att.fileName}
          onClick={() => handleDownload(att.id)}
          className={`flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2 ${att.id && !att.id.startsWith("temp-") ? "cursor-pointer hover:border-gray-300" : ""}`}
        >
          <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
            {getExtension(att.fileName)}
          </span>
          <span className="text-sm text-gray-700 flex-1 truncate">
            {att.fileName}
          </span>
          <span className="text-xs text-gray-400">
            {formatFileSize(att.fileSize)}
          </span>
          {att.id && !att.id.startsWith("temp-") && (
            <span className="text-xs text-[#1a2744] font-medium shrink-0">Download</span>
          )}
        </div>
      ))}
    </div>
  );
}

function LogIcon({ type }) {
  const icons = {
    created: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    assigned: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    replied: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    participant: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    status: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    resolved: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  };
  return icons[type] || icons.replied;
}

// ── main component ────────────────────────────────────────────────────────────

export default function QueryDetailPanel({ query, onClose }) {
  const queryId = query.id;

  // ── API-driven state ──
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState(null);

  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [repliesCursor, setRepliesCursor] = useState(null);
  const [repliesHasMore, setRepliesHasMore] = useState(false);
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);

  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);

  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // ── Local UI state ──
  const [activeTab, setActiveTab] = useState("thread");
  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState([]);  // display: { name, size, ext }
  const [replyRawFiles, setReplyRawFiles] = useState([]);         // raw File objects for upload
  const [replyDragOver, setReplyDragOver] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Resolve modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  // Add participant state
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);

  // ── Derived values (detail first, fallback to list-level prop) ──
  const title = detail?.title || query.title;
  const queryNumber = detail?.queryNumber || query.queryNumber;
  const priority = detail?.priority || query.priority;
  const status = detail?.status || query.status;
  const dueDate = detail?.dueDate || query.dueDate;
  const createdAt = detail?.createdAt || query.createdAt;
  const assignedTo = detail?.assignedTo || query.assignedTo;
  const raisedBy = detail?.raisedBy || null;
  const description = detail?.description || "";
  const queryAttachments = detail?.attachments || [];
  const resolvedAt = detail?.resolvedAt || null;
  const daysTaken = detail?.daysTaken ?? null;
  const resolvedBy = detail?.resolvedBy || null;

  const age = getAgeing(createdAt);
  const overdue = isOverdue(dueDate, status);

  // ── Fetch: query detail ──
  const fetchDetail = useCallback(async () => {
    if (!queryId) return;
    try {
      setDetailLoading(true);
      setDetailError(null);
      const data = await getQueryDetail(queryId);
      setDetail(data);
    } catch (err) {
      console.error("Failed to load query detail:", err);
      setDetailError(err.message || "Failed to load query details.");
    } finally {
      setDetailLoading(false);
    }
  }, [queryId]);

  // ── Fetch: replies ──
  const fetchReplies = useCallback(async () => {
    if (!queryId) return;
    try {
      setRepliesLoading(true);
      const data = await getQueryReplies(queryId);
      setReplies(data.replies);
      setRepliesHasMore(data.pagination.hasMore);
      setRepliesCursor(data.pagination.nextCursor);
    } catch (err) {
      console.error("Failed to load replies:", err);
    } finally {
      setRepliesLoading(false);
    }
  }, [queryId]);

  // ── Fetch: participants ──
  const fetchParticipants = useCallback(async () => {
    if (!queryId) return;
    try {
      setParticipantsLoading(true);
      const data = await getQueryParticipants(queryId);
      setParticipants(data.participants);
    } catch (err) {
      console.error("Failed to load participants:", err);
    } finally {
      setParticipantsLoading(false);
    }
  }, [queryId]);

  // ── Fetch: activity log ──
  const fetchActivityLog = useCallback(async () => {
    if (!queryId) return;
    try {
      setActivityLoading(true);
      const data = await getQueryActivityLog(queryId);
      setActivityLog(data.activityLog);
    } catch (err) {
      console.error("Failed to load activity log:", err);
    } finally {
      setActivityLoading(false);
    }
  }, [queryId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);
  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);
  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Activity log: fetch only when user opens the tab (lazy load)
  const [activityFetched, setActivityFetched] = useState(false);
  useEffect(() => {
    if (activeTab === "activity" && !activityFetched) {
      setActivityFetched(true);
      fetchActivityLog();
    }
  }, [activeTab, activityFetched, fetchActivityLog]);

  // ── Load more replies (older) ──
  const loadMoreReplies = async () => {
    if (!repliesCursor || loadingMoreReplies) return;
    try {
      setLoadingMoreReplies(true);
      const data = await getQueryReplies(queryId, 10, repliesCursor);
      setReplies((prev) => [...prev, ...data.replies]);
      setRepliesHasMore(data.pagination.hasMore);
      setRepliesCursor(data.pagination.nextCursor);
    } catch (err) {
      console.error("Failed to load more replies:", err);
    } finally {
      setLoadingMoreReplies(false);
    }
  };

  // ── Write handlers (API-driven) ──

  const handleReplyAttach = (e) => {
    const files = Array.from(e.target.files);
    const mapped = files.map((f) => ({
      name: f.name,
      size:
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`,
      ext: f.name.split(".").pop().toLowerCase(),
    }));
    setReplyAttachments((prev) => [...prev, ...mapped]);
    setReplyRawFiles((prev) => [...prev, ...files]);
  };

  const handleReplyFileDrop = (e) => {
    e.preventDefault();
    setReplyDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const mapped = files.map((f) => ({
      name: f.name,
      size:
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`,
      ext: f.name.split(".").pop().toLowerCase(),
    }));
    setReplyAttachments((prev) => [...prev, ...mapped]);
    setReplyRawFiles((prev) => [...prev, ...files]);
  };

  const removeReplyAttachment = (index) => {
    setReplyAttachments((prev) => prev.filter((_, i) => i !== index));
    setReplyRawFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || sendingReply) return;
    try {
      setSendingReply(true);
      const data = await createReply(queryId, replyText.trim(), replyRawFiles);
      // Prepend new reply (newest first)
      setReplies((prev) => [data, ...prev]);
      // Update status locally if server transitioned it
      if (data.statusTransition) {
        setDetail((prev) =>
          prev ? { ...prev, status: data.statusTransition.to } : prev
        );
      }
      setReplyText("");
      setReplyAttachments([]);
      setReplyRawFiles([]);
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Failed to send reply. Please try again.");
    } finally {
      setSendingReply(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!resolutionText.trim() || resolving) return;
    try {
      setResolving(true);
      setResolveError(null);
      const data = await resolveQuery(queryId, resolutionText.trim());
      // Update detail locally from server response
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: data.status,
              resolvedAt: data.resolvedAt,
              resolvedBy: data.resolvedBy,
              resolutionText: data.resolutionText,
              daysTaken: data.daysTaken,
            }
          : prev
      );
      setShowResolveModal(false);
      setResolutionText("");
    } catch (err) {
      console.error("Failed to resolve query:", err);
      setResolveError(err.message || "Failed to resolve query.");
    } finally {
      setResolving(false);
    }
  };

  // ── Add participant handlers ──

  const openParticipantModal = async () => {
    setShowParticipantModal(true);
    setSelectedParticipantId("");
    try {
      setEligibleLoading(true);
      const data = await getEligibleParticipants(queryId);
      setEligibleUsers(data.eligibleParticipants);
    } catch (err) {
      console.error("Failed to load eligible participants:", err);
      setEligibleUsers([]);
    } finally {
      setEligibleLoading(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedParticipantId || addingParticipant) return;
    try {
      setAddingParticipant(true);
      const added = await addQueryParticipant(queryId, selectedParticipantId);
      // Add to participants list locally
      setParticipants((prev) => [...prev, added]);
      // Remove from eligible list
      setEligibleUsers((prev) => prev.filter((u) => u.userId !== selectedParticipantId));
      setSelectedParticipantId("");
      setShowParticipantModal(false);
    } catch (err) {
      console.error("Failed to add participant:", err);
      alert("Failed to add participant. Please try again.");
    } finally {
      setAddingParticipant(false);
    }
  };

  // ── Render ──

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="w-[680px] bg-white h-full shadow-xl flex flex-col relative overflow-hidden">
        {/* ── HEADER ── */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs text-gray-400">
              {queryNumber}
            </span>
            <h2 className="text-base font-semibold text-gray-800 mt-0.5 leading-snug">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_STYLES[priority] || ""}`}
            >
              {priority}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[status] || ""}`}
            >
              {status}
            </span>
            <button
              onClick={onClose}
              className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── META BAR ── */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-x-6 gap-y-2">
          {/* Raised By */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
              Raised By
            </p>
            {detailLoading && !raisedBy ? (
              <p className="text-xs text-gray-300">Loading…</p>
            ) : raisedBy ? (
              <>
                <p className="text-xs text-gray-700 font-medium">
                  {raisedBy.name}
                </p>
                <p className="text-[10px] text-gray-400">
                  {raisedBy.roleName}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
              Assigned To
            </p>
            <p className="text-xs text-gray-700 font-medium">
              {assignedTo?.name || "—"}
            </p>
            <p className="text-[10px] text-gray-400">
              {assignedTo?.roleName || ""}
            </p>
          </div>

          {/* Created */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
              Created
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-gray-700">{formatDate(createdAt)}</p>
              {age !== null && (
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${age > 7 ? "bg-orange-50 text-orange-400" : "bg-gray-100 text-gray-400"}`}
                >
                  {age}d
                </span>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
              Due Date
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-gray-700">{formatDate(dueDate)}</p>
              {overdue && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-400">
                  Overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── PARTICIPANTS ── */}
        <div className="px-6 py-2.5 border-b border-gray-100 flex items-center gap-2">
          {participantsLoading ? (
            <p className="text-xs text-gray-300">Loading participants…</p>
          ) : (
            <>
              <div className="flex -space-x-1.5">
                {participants.map((p, i) => (
                  <div
                    key={p.id}
                    className={`w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-[9px] font-bold flex items-center justify-center border-2 border-white ${i > 0 ? "-ml-1.5" : ""}`}
                  >
                    {initials(p.name)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 ml-1">
                {participants.map((p) => (
                  <span
                    key={p.id}
                    className="text-xs text-gray-500 after:content-[','] last:after:content-['']"
                  >
                    {p.name.split(" ")[0]}
                  </span>
                ))}
              </div>
              {status !== "Resolved" && (
                <button
                  onClick={openParticipantModal}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-[#1a2744] border border-[#1a2744]/25 px-2.5 py-1.5 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add
                </button>
              )}
            </>
          )}
        </div>

        {/* ── TABS ── */}
        <div className="px-6 flex gap-1 border-b border-gray-200">
          {[
            {
              key: "thread",
              label: `Thread (${replies.length + 1})`,
            },
            { key: "activity", label: "Activity Log" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === key
                  ? "border-[#1a2744] text-[#1a2744]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "thread" && (
            <div className="px-6 py-5">
              {/* Detail loading error */}
              {detailError && (
                <div className="bg-white rounded-xl border border-gray-200 py-8 flex flex-col items-center gap-3 mb-5">
                  <p className="text-sm text-red-500">{detailError}</p>
                  <button
                    onClick={fetchDetail}
                    className="text-sm font-medium text-[#1a2744] border border-[#1a2744]/25 px-4 py-2 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Original query card */}
              {detailLoading ? (
                <div className="bg-[#1a2744]/5 border border-[#1a2744]/10 rounded-xl p-4 mb-5 text-center">
                  <p className="text-sm text-gray-400">
                    Loading query details…
                  </p>
                </div>
              ) : !detailError && (
                <div className="bg-[#1a2744]/5 border border-[#1a2744]/10 rounded-xl p-4 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {raisedBy && (
                        <>
                          <div className="w-7 h-7 rounded-full bg-[#1a2744] text-white text-[10px] font-bold flex items-center justify-center">
                            {initials(raisedBy.name)}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-800">
                              {raisedBy.name}
                            </span>
                            <span className="text-xs text-gray-400 ml-1.5">
                              {raisedBy.roleName}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {description}
                  </p>
                  <AttachmentList attachments={queryAttachments} />
                </div>
              )}

              {/* Replies */}
              {repliesLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-300">Loading replies…</p>
                </div>
              ) : replies.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-300">No replies yet</p>
                </div>
              ) : (
                replies.map((reply) => (
                  <div key={reply.id} className="flex gap-3 mb-5">
                    <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {initials(reply.repliedBy?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-gray-800">
                          {reply.repliedBy?.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {reply.repliedBy?.roleName}
                        </span>
                        <span className="text-xs text-gray-300 ml-auto">
                          {formatDateTime(reply.repliedAt)}
                        </span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {reply.replyText}
                        </p>
                        <AttachmentList attachments={reply.attachments} />
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Load more (older replies) */}
              {repliesHasMore && (
                <div className="text-center mt-1 mb-4">
                  <button
                    onClick={loadMoreReplies}
                    disabled={loadingMoreReplies}
                    className="text-xs font-medium text-[#1a2744] border border-[#1a2744]/25 px-4 py-2 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors disabled:opacity-40"
                  >
                    {loadingMoreReplies
                      ? "Loading…"
                      : "Load older replies"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="px-6 py-5">
              {activityLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-300">
                    Loading activity log…
                  </p>
                </div>
              ) : activityLog.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-300">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {activityLog.map((entry, i) => (
                    <div key={entry.id} className="flex gap-3 relative">
                      {/* Vertical connector */}
                      {i < activityLog.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-100 z-0" />
                      )}
                      {/* Icon */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 z-10 ${LOG_ICON_STYLES[entry.actionType] || LOG_ICON_STYLES.replied}`}
                      >
                        <LogIcon type={entry.actionType} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-5">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">
                            {entry.actor?.name || "System"}
                          </span>
                          <span className="text-sm text-gray-500">
                            {LOG_LABELS[entry.actionType] ||
                              entry.actionType}
                          </span>
                        </div>
                        {entry.detail && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {entry.detail}
                          </p>
                        )}
                        <p className="text-xs text-gray-300 mt-1">
                          {formatDateTime(entry.performedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        {status === "Resolved" ? (
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700">
                  Query Resolved
                </p>
                <p className="text-xs text-green-500 mt-0.5">
                  {resolvedBy?.name && `Resolved by ${resolvedBy.name} on `}{formatDateTime(resolvedAt)}
                  {daysTaken !== null &&
                    ` · Took ${daysTaken} day${daysTaken !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-100">
            {/* Reply input */}
            <div className="px-6 py-3">
              <div
                className={`border rounded-xl overflow-hidden transition-colors ${replyDragOver ? "border-[#1a2744] bg-blue-50" : "border-gray-200"}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setReplyDragOver(true);
                }}
                onDragLeave={() => setReplyDragOver(false)}
                onDrop={handleReplyFileDrop}
              >
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  placeholder="write a reply…"
                  className="w-full px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 resize-none outline-none focus:ring-0 border-none"
                />
                {replyAttachments.length > 0 && (
                  <div className="px-3 pb-2 space-y-1">
                    {replyAttachments.map((att, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-gray-500"
                      >
                        <span className="font-semibold text-gray-400 uppercase bg-gray-100 px-1 py-0.5 rounded text-[10px]">
                          {att.ext}
                        </span>
                        <span className="truncate">{att.name}</span>
                        <button
                          onClick={() => removeReplyAttachment(i)}
                          className="text-gray-300 hover:text-red-400 transition-colors ml-auto"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
                  <label className="text-xs text-gray-400 hover:text-[#1a2744] cursor-pointer transition-colors flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attach
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleReplyAttach}
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setShowResolveModal(true); setResolveError(null); setResolutionText(""); }}
                      className="flex items-center gap-1 text-xs font-medium text-green-600 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Resolve
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sendingReply}
                      className="bg-[#1a2744] hover:bg-[#243460] text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {sendingReply ? "Sending…" : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Resolve Confirmation Modal ── */}
        {showResolveModal && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-5 w-80 mx-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Resolve Query</h3>
              <p className="text-xs text-gray-400 mb-4">Provide resolution notes before marking this query as resolved.</p>
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows={3}
                placeholder="describe how this query was resolved…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent resize-none placeholder-gray-400 mb-2"
              />
              {resolveError && (
                <p className="text-xs text-red-500 mb-2">{resolveError}</p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowResolveModal(false); setResolutionText(""); setResolveError(null); }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkResolved}
                  disabled={!resolutionText.trim() || resolving}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  {resolving ? "Resolving…" : "Confirm Resolve"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Participant Modal ── */}
        {showParticipantModal && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-5 w-80 mx-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Add Participant</h3>
              <p className="text-xs text-gray-400 mb-4">They will be notified and gain access to this query thread.</p>
              {eligibleLoading ? (
                <p className="text-sm text-gray-400 py-4 text-center">Loading team members…</p>
              ) : eligibleUsers.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No eligible users to add.</p>
              ) : (
                <select
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] mb-4"
                >
                  <option value="">Select team member</option>
                  {eligibleUsers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} — {m.roleName}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowParticipantModal(false); setSelectedParticipantId(""); }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddParticipant}
                  disabled={!selectedParticipantId || addingParticipant}
                  className="bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  {addingParticipant ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}