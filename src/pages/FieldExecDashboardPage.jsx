import { getSession } from "../utils/auth";

// ── Hardcoded data ───────────────────────────────────────────────────
const ATTENDANCE = { present: 19, total: 22 };
const SALARY = { base: 25000, perDay: 25000 / 22 };

const WORK_SUMMARY = {
  done: { filesUploaded: 34, ulbsCovered: 5 },
  pending: { filesPending: 12, overdueTasks: 2, total: 14 },
};

const EXPENSE_OVERVIEW = [
  { label: "Total Claimed", amount: 7550, count: 8, color: "text-gray-800" },
  { label: "Pending", amount: 3400, count: 3, color: "text-orange-500" },
  { label: "Approved", amount: 830, count: 2, color: "text-blue-600" },
  { label: "Reimbursed", amount: 3000, count: 2, color: "text-green-600" },
];

const RECENT_TASKS = [
  { id: "TSK-001", title: "Complete file upload for Bilaspur water supply tender", priority: "High", status: "In Progress", due: "08/03/2026" },
  { id: "TSK-002", title: "Follow up on missing vouchers — Durg road project", priority: "High", status: "To Do", due: "07/03/2026" },
  { id: "TSK-003", title: "Collect attendance photo confirmation from Korba ULB", priority: "Medium", status: "To Do", due: "10/03/2026" },
  { id: "TSK-005", title: "Prepare list of pending files for Rajnandgaon", priority: "Medium", status: "In Progress", due: "09/03/2026" },
];

// ── Helpers ──────────────────────────────────────────────────────────
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

// ── Circular Progress ────────────────────────────────────────────────
const CircularProgress = ({ value, max, size = 80, strokeWidth = 7 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? value / max : 0;
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#1a2744" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
};

// ── FieldExecDashboardPage ───────────────────────────────────────────
const FieldExecDashboardPage = ({ onNavigate }) => {
  const session = getSession();
  const firstName = session?.name?.split(" ")[0] || "User";

  const attendancePct = Math.round((ATTENDANCE.present / ATTENDANCE.total) * 100);
  const earnedSalary = Math.round(SALARY.perDay * ATTENDANCE.present);

  return (
    <div className="flex flex-col gap-6">

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Good morning, {firstName}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Monday, 09 March 2026 · Here's your overview</p>
        </div>
        <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2">
          March 2026
        </span>
      </div>

      {/* Row 1 — four stat cards */}
      <div className="grid grid-cols-4 gap-4">

        {/* Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="relative shrink-0">
            <CircularProgress value={ATTENDANCE.present} max={ATTENDANCE.total} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#1a2744]">
              {attendancePct}%
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Attendance</p>
            <p className="text-2xl font-bold text-gray-800">
              {ATTENDANCE.present}
              <span className="text-sm font-normal text-gray-400">/{ATTENDANCE.total}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">days present</p>
          </div>
        </div>

        {/* Salary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">Earned Salary</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">₹{earnedSalary.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 mt-1">of ₹{SALARY.base.toLocaleString("en-IN")} base · {ATTENDANCE.present}/{ATTENDANCE.total} days</p>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${attendancePct}%` }}
            />
          </div>
        </div>

        {/* Work Done */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">Files Uploaded</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{WORK_SUMMARY.done.filesUploaded}</p>
            <p className="text-xs text-gray-400 mt-1">files uploaded this month</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-gray-500 font-medium">{WORK_SUMMARY.done.ulbsCovered} ULBs covered</span>
          </div>
        </div>

        {/* Work Pending */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">Files Pending</p>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">{WORK_SUMMARY.pending.total}</p>
            <p className="text-xs text-gray-400 mt-1">files yet to be uploaded</p>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Files pending upload</span>
              <span className="font-medium text-orange-500">{WORK_SUMMARY.pending.filesPending}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Overdue tasks</span>
              <span className="font-medium text-red-500">{WORK_SUMMARY.pending.overdueTasks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — Expenses + Tasks overview */}
      <div className="grid grid-cols-2 gap-4">

        {/* Expenses overview */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Expenses</h2>
              <p className="text-xs text-gray-400 mt-0.5">March 2026 · 8 receipts raised</p>
            </div>
            <button
              onClick={() => onNavigate("Expenses")}
              className="flex items-center gap-1.5 text-xs font-medium text-[#1a2744] border border-[#1a2744]/25 px-3 py-1.5 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors"
            >
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="px-5 py-4 grid grid-cols-2 gap-3">
            {EXPENSE_OVERVIEW.map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>₹{item.amount.toLocaleString("en-IN")}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.count} {item.count === 1 ? "receipt" : "receipts"}</p>
              </div>
            ))}
          </div>

          {/* Mini breakdown bar */}
          <div className="px-5 pb-5">
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              <div className="bg-green-400 rounded-l-full" style={{ width: "40%" }} title="Reimbursed" />
              <div className="bg-blue-400" style={{ width: "11%" }} title="Approved" />
              <div className="bg-orange-400" style={{ width: "45%" }} title="Pending" />
              <div className="bg-red-400 rounded-r-full" style={{ width: "4%" }} title="Rejected" />
            </div>
            <div className="flex items-center gap-4 mt-2">
              {[
                { label: "Reimbursed", color: "bg-green-400" },
                { label: "Approved", color: "bg-blue-400" },
                { label: "Pending", color: "bg-orange-400" },
                { label: "Rejected", color: "bg-red-400" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${l.color} shrink-0`} />
                  <span className="text-xs text-gray-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks overview */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Tasks</h2>
              <p className="text-xs text-gray-400 mt-0.5">4 active · 1 completed this month</p>
            </div>
            <button
              onClick={() => onNavigate("Tasks")}
              className="flex items-center gap-1.5 text-xs font-medium text-[#1a2744] border border-[#1a2744]/25 px-3 py-1.5 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors"
            >
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex-1 px-5 py-3 space-y-2.5">
            {RECENT_TASKS.map((task) => (
              <div key={task.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 font-medium leading-snug truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Due {task.due}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status]}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Mini progress footer */}
          <div className="px-5 py-4 border-t border-gray-50 flex items-center gap-4">
            {[
              { label: "To Do", count: 2, color: "text-gray-500", dot: "bg-gray-300" },
              { label: "In Progress", count: 2, color: "text-blue-600", dot: "bg-blue-400" },
              { label: "Done", count: 1, color: "text-green-600", dot: "bg-green-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className={`text-xs font-medium ${s.color}`}>{s.count}</span>
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldExecDashboardPage;
