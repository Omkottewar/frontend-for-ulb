import { useState } from "react";
import { DUMMY_QUERIES } from "../utils/dummyData";
import QueryDetailPanel from "../components/QueryDetailPanel";

// ── helpers ──────────────────────────────────────────────────────────────────

const getAgeing = (dateStr) => {
  if (!dateStr) return null;
  const [d, m, y] = dateStr.split("/").map(Number);
  const created = new Date(y, m - 1, d);
  const today = new Date(2026, 2, 10);
  return Math.floor((today - created) / (1000 * 60 * 60 * 24));
};

const isOverdue = (dueDateStr, status) => {
  if (status === "Resolved" || !dueDateStr) return false;
  const [d, m, y] = dueDateStr.split("/").map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(2026, 2, 10);
  return today > due;
};

// ── style maps ────────────────────────────────────────────────────────────────

const PRIORITY_STYLES = {
  High:   "bg-red-100 text-red-500",
  Medium: "bg-orange-100 text-orange-500",
  Low:    "bg-green-100 text-green-600",
};

const STATUS_STYLES = {
  Open:          "bg-blue-100 text-blue-600",
  "In Progress": "bg-amber-100 text-amber-600",
  Resolved:      "bg-green-100 text-green-600",
};

// ── component ─────────────────────────────────────────────────────────────────

export default function QueriesPage() {
  const [queries] = useState(DUMMY_QUERIES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [ulbFilter, setUlbFilter] = useState("");
  const [selectedQuery, setSelectedQuery] = useState(null);

  const uniqueULBs = [...new Set(queries.map((q) => q.ulb))];

  const filtered = queries.filter((q) => {
    const matchSearch =
      !search ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.id.toLowerCase().includes(search.toLowerCase()) ||
      q.fileNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.assignedTo.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = !statusFilter   || q.status === statusFilter;
    const matchPriority = !priorityFilter || q.priority === priorityFilter;
    const matchULB      = !ulbFilter      || q.ulb === ulbFilter;
    return matchSearch && matchStatus && matchPriority && matchULB;
  });

  const countByStatus = (s) => queries.filter((q) => q.status === s).length;

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Queries</h1>
          <p className="text-sm text-gray-400 mt-1">All queries raised across audit files</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-600">
            {countByStatus("Open")} Open
          </span>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-600">
            {countByStatus("In Progress")} In Progress
          </span>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-100 text-green-600">
            {countByStatus("Resolved")} Resolved
          </span>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 mb-4 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, file, assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm text-gray-700 outline-none w-full placeholder-gray-400"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#1a2744] bg-white min-w-[130px]"
        >
          <option value="">All Status</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#1a2744] bg-white min-w-[130px]"
        >
          <option value="">All Priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>

        {/* ULB filter */}
        <select
          value={ulbFilter}
          onChange={(e) => setUlbFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#1a2744] bg-white min-w-[200px]"
        >
          <option value="">All ULBs</option>
          {uniqueULBs.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>

        {(search || statusFilter || priorityFilter || ulbFilter) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); setUlbFilter(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-100">
              {["Query", "File", "Assigned To", "Priority", "Status", "Age", "Due Date"].map((col) => (
                <th key={col} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 text-sm py-16">
                  No queries found
                </td>
              </tr>
            ) : (
              filtered.map((q) => {
                const age = getAgeing(q.createdAt);
                const overdue = isOverdue(q.dueDate, q.status);
                return (
                  <tr
                    key={q.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedQuery(q)}
                  >
                    {/* Query title + ID */}
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{q.title}</p>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">{q.id}</p>
                    </td>

                    {/* File */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-mono text-[#1a2744]">{q.fileNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5 max-w-[160px] truncate">{q.ulb}</p>
                    </td>

                    {/* Assigned To */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {q.assignedTo.name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">{q.assignedTo.name}</p>
                          <p className="text-xs text-gray-400">{q.assignedTo.role}</p>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_STYLES[q.priority]}`}>
                        {q.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[q.status]}`}>
                        {q.status}
                      </span>
                    </td>

                    {/* Age */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {age !== null && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${age > 7 ? "bg-orange-50 text-orange-400" : "bg-gray-100 text-gray-400"}`}>
                          {age}d
                        </span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${overdue ? "bg-red-50 text-red-400" : "text-gray-400"}`}>
                        {q.dueDate}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selectedQuery && (
        <QueryDetailPanel
          query={selectedQuery}
          onClose={() => setSelectedQuery(null)}
        />
      )}
    </div>
  );
}
