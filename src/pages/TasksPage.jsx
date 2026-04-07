import { useState } from "react";

const ASSIGNED_TASKS = [
  { id: "TSK-001", title: "Complete file upload for Bilaspur water supply tender", ulb: "Bilaspur Municipal Corporation", due: "08/03/2026", created: "01/03/2026", priority: "High", status: "In Progress", assignedBy: "Ramesh Kumar" },
  { id: "TSK-002", title: "Follow up on missing vouchers — Durg road project", ulb: "Durg Municipal Council", due: "07/03/2026", created: "28/02/2026", priority: "High", status: "To Do", assignedBy: "Ramesh Kumar" },
  { id: "TSK-003", title: "Collect attendance photo confirmation from Korba ULB", ulb: "Korba Municipal Council", due: "10/03/2026", created: "05/03/2026", priority: "Medium", status: "To Do", assignedBy: "Ramesh Kumar" },
  { id: "TSK-004", title: "Verify pre-audit status of 3 files in Raipur", ulb: "Raipur Municipal Corporation", due: "04/03/2026", created: "20/02/2026", priority: "Low", status: "Done", assignedBy: "Priya Sharma" },
];

const MY_TASKS = [
  { id: "TSK-005", title: "Prepare list of pending files for Rajnandgaon", ulb: "Rajnandgaon Municipal Council", due: "09/03/2026", created: "03/03/2026", priority: "Medium", status: "In Progress" },
  { id: "TSK-006", title: "Submit expense report for February travel", ulb: null, due: "07/03/2026", created: "01/03/2026", priority: "High", status: "To Do" },
  { id: "TSK-007", title: "Review new file indexing format with team", ulb: null, due: "12/03/2026", created: "07/03/2026", priority: "Low", status: "To Do" },
];

// DD/MM/YYYY → days elapsed from that date to today
const getAgeing = (dateStr) => {
  if (!dateStr) return null;
  const [d, m, y] = dateStr.split("/").map(Number);
  const created = new Date(y, m - 1, d);
  const today = new Date(2026, 2, 9); // hardcoded today: 09/03/2026
  return Math.floor((today - created) / (1000 * 60 * 60 * 24));
};

const PRIORITY_STYLES = {
  High: "bg-red-100 text-red-500",
  Medium: "bg-orange-100 text-orange-500",
  Low: "bg-green-100 text-green-600",
};

const STATUS_STYLES = {
  "To Do": "bg-gray-100 text-gray-500",
  "In Progress": "bg-blue-100 text-blue-600",
  "Done": "bg-green-100 text-green-600",
};

const TaskCard = ({ task, showAssignedBy }) => {
  const age = getAgeing(task.created);
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 ${task.status === "Done" ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-800 leading-snug">{task.title}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {age !== null && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${age > 7 ? "bg-orange-50 text-orange-400" : "bg-gray-100 text-gray-400"}`}>
              {age}d old
            </span>
          )}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400">
        {task.ulb && <span>{task.ulb}</span>}
        <span>Due {task.due}</span>
        {showAssignedBy && task.assignedBy && (
          <span className="text-gray-400">by {task.assignedBy}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[task.status]}`}>
          {task.status}
        </span>
<select className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white focus:ring-1 focus:ring-[#1a2744]">
          <option>To Do</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
      </div>
    </div>
  );
};

const TasksPage = () => {
  const [tab, setTab] = useState("assigned");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const tasks = tab === "assigned" ? ASSIGNED_TASKS : MY_TASKS;
  const filtered = statusFilter === "All" ? tasks : tasks.filter((t) => t.status === statusFilter);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
          <p className="text-sm text-gray-400 mt-1">Manage assigned and self-created tasks</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          New Task
        </button>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {[{ key: "assigned", label: "Assigned to Me" }, { key: "mine", label: "My Tasks" }].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setStatusFilter("All"); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-[#1a2744] text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {["All", "To Do", "In Progress", "Done"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-[#1a2744] text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Task grid */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No tasks found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 content-start">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} showAssignedBy={tab === "assigned"} />
          ))}
        </div>
      )}

      {/* New Task slide-in */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="w-96 bg-white h-full shadow-xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">New Task</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input type="text" placeholder="What needs to be done?" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ULB (optional)</label>
                <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744]">
                  <option value="">Not ULB-specific</option>
                  {["Raipur Municipal Corporation", "Bilaspur Municipal Corporation", "Durg Municipal Council", "Korba Municipal Council", "Rajnandgaon Municipal Council"].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744]">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} placeholder="Optional details..." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-400">Click to attach files</p>
                      <p className="text-xs text-gray-300 mt-0.5">PDF, Word, Excel, Images</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowForm(false)}
                className="w-full bg-[#1a2744] hover:bg-[#243460] text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
