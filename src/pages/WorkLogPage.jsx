import { useState } from "react";

const ACTIVITY_TYPES = ["File Upload", "Query Resolution", "Meeting", "Travel", "Other"];

const ULB_OPTIONS = [
  "Raipur Municipal Corporation",
  "Bilaspur Municipal Corporation",
  "Durg Municipal Council",
  "Korba Municipal Council",
  "Rajnandgaon Municipal Council",
];

const ACTIVITY_BADGE = {
  "File Upload": "bg-blue-100 text-blue-600",
  "Query Resolution": "bg-purple-100 text-purple-600",
  "Meeting": "bg-amber-100 text-amber-600",
  "Travel": "bg-cyan-100 text-cyan-600",
  "Other": "bg-gray-100 text-gray-500",
};

const INITIAL_ENTRIES = [
  {
    id: 1,
    status: "Submitted",
    ulb: "Raipur Municipal Corporation",
    activity: "File Upload",
    duration: "2h 30m",
    tasks: [
      { name: "Road works tender files", workDone: "Uploaded 4 expenditure files, verified document completeness and tagged each with correct tracking ID." },
      { name: "Water supply file indexing", workDone: "Created 2 new file entries, filled all metadata fields and attached scanned copies." },
    ],
  },
  {
    id: 2,
    status: "Draft",
    ulb: "Bilaspur Municipal Corporation",
    activity: "Query Resolution",
    duration: "1h 15m",
    tasks: [
      { name: "Missing vouchers — Durg road project", workDone: "Coordinated with accounts officer, received 3 missing vouchers via email, uploaded to system." },
    ],
  },
  {
    id: 3,
    status: "Draft",
    ulb: "Raipur Municipal Corporation",
    activity: "Meeting",
    duration: "45m",
    tasks: [
      { name: "ULB coordination meeting", workDone: "Attended meeting with ULB data entry team. Discussed pending file list and set timelines for next week." },
    ],
  },
];

const HISTORY = [
  {
    date: "05/03/2026", day: "Thursday", status: "Submitted", hours: "6h 30m",
    entries: [
      {
        id: 1, ulb: "Raipur Municipal Corporation", activity: "File Upload", duration: "3h 00m",
        tasks: [
          { name: "Sanitation project files", workDone: "Uploaded 6 files related to sanitation tender. Cross-verified amounts with ULB register." },
          { name: "Road repair files", workDone: "Indexed 3 road repair files, flagged 1 as High risk due to missing contractor details." },
        ],
      },
      {
        id: 2, ulb: "Bilaspur Municipal Corporation", activity: "Query Resolution", duration: "2h 00m",
        tasks: [
          { name: "Payment voucher discrepancy", workDone: "Resolved discrepancy in payment vouchers by coordinating with finance department. Updated 2 file records." },
        ],
      },
      {
        id: 3, ulb: "Raipur Municipal Corporation", activity: "Travel", duration: "1h 30m",
        tasks: [
          { name: "Commute to Bilaspur", workDone: "Travel from Raipur to Bilaspur office and return." },
        ],
      },
    ],
  },
  {
    date: "04/03/2026", day: "Wednesday", status: "Submitted", hours: "4h 00m",
    entries: [
      {
        id: 1, ulb: "Durg Municipal Council", activity: "File Upload", duration: "2h 30m",
        tasks: [
          { name: "Street light contract files", workDone: "Uploaded 5 street light contract files. Verified tender amounts and contractor registration numbers." },
        ],
      },
      {
        id: 2, ulb: "Durg Municipal Council", activity: "Meeting", duration: "1h 30m",
        tasks: [
          { name: "Pre-audit review meeting", workDone: "Attended pre-audit review with ULB officer. Noted 4 files requiring additional documentation." },
        ],
      },
    ],
  },
  {
    date: "03/03/2026", day: "Tuesday", status: "Submitted", hours: "7h 15m",
    entries: [
      {
        id: 1, ulb: "Korba Municipal Council", activity: "File Upload", duration: "3h 45m",
        tasks: [
          { name: "Power infrastructure files", workDone: "Indexed 8 files for power infrastructure project. Flagged 2 as Medium risk." },
          { name: "Drainage project", workDone: "Uploaded 3 drainage project files and completed all metadata." },
        ],
      },
      {
        id: 2, ulb: "Rajnandgaon Municipal Council", activity: "Query Resolution", duration: "2h 30m",
        tasks: [
          { name: "Tender amount mismatch", workDone: "Investigated tender amount mismatch. Escalated to senior for review after confirming discrepancy." },
        ],
      },
      {
        id: 3, ulb: "Korba Municipal Council", activity: "Travel", duration: "1h 00m",
        tasks: [
          { name: "Commute", workDone: "Travel between Korba and Rajnandgaon offices." },
        ],
      },
    ],
  },
];

const EMPTY_TASK = { name: "", workDone: "" };
const EMPTY_FORM = { ulb: "", activity: "", duration: "", tasks: [{ ...EMPTY_TASK }] };

// ── Slide-in panel ──────────────────────────────────────────────────
const EntryPanel = ({ entry, onClose, onSave }) => {
  const [form, setForm] = useState(
    entry
      ? { ulb: entry.ulb, activity: entry.activity, duration: entry.duration, tasks: entry.tasks.map((t) => ({ ...t })) }
      : { ...EMPTY_FORM, tasks: [{ ...EMPTY_TASK }] }
  );

  const updateTask = (i, field, value) => {
    const tasks = [...form.tasks];
    tasks[i] = { ...tasks[i], [field]: value };
    setForm({ ...form, tasks });
  };

  const addTask = () => setForm({ ...form, tasks: [...form.tasks, { ...EMPTY_TASK }] });
  const removeTask = (i) => setForm({ ...form, tasks: form.tasks.filter((_, idx) => idx !== i) });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-120 bg-white h-full shadow-xl flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">{entry ? "Edit Entry" : "Add Entry"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
          {/* ULB */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ULB</label>
            <select
              value={form.ulb}
              onChange={(e) => setForm({ ...form, ulb: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744]"
            >
              <option value="">Select ULB</option>
              {ULB_OPTIONS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>

          {/* Activity + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <select
                value={form.activity}
                onChange={(e) => setForm({ ...form, activity: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744]"
              >
                <option value="">Select</option>
                {ACTIVITY_TYPES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                type="text"
                placeholder="e.g. 1h 30m"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744]"
              />
            </div>
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Tasks</label>
              <span className="text-xs text-gray-400">{form.tasks.length} task{form.tasks.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-3">
              {form.tasks.map((task, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder={`Task ${i + 1} name`}
                      value={task.name}
                      onChange={(e) => updateTask(i, "name", e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#1a2744]"
                    />
                    {form.tasks.length > 1 && (
                      <button onClick={() => removeTask(i)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Describe work done for this task..."
                    value={task.workDone}
                    onChange={(e) => updateTask(i, "workDone", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#1a2744] resize-none"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addTask}
              className="mt-2 flex items-center gap-1.5 text-xs text-[#1a2744] font-medium hover:opacity-70 transition-opacity"
            >
              <span className="text-base leading-none">+</span>
              Add another task
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => { onSave(form); onClose(); }}
            className="w-full bg-[#1a2744] hover:bg-[#243460] text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {entry ? "Save Changes" : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── History detail panel ────────────────────────────────────────────
const HistoryDetailPanel = ({ day, onClose }) => (
  <div className="fixed inset-0 z-50 flex">
    <div className="flex-1 bg-black/30" onClick={onClose} />
    <div className="w-130 bg-white h-full shadow-xl flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{day.date}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{day.day} · {day.entries.length} entries · {day.hours}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-600">{day.status}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {day.entries.map((entry, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ACTIVITY_BADGE[entry.activity] || "bg-gray-100 text-gray-500"}`}>
                  {entry.activity}
                </span>
                <span className="text-xs text-gray-400">{entry.duration}</span>
              </div>
              <span className="text-xs font-medium text-gray-600">{entry.ulb}</span>
            </div>
            <div className="px-4 py-3 space-y-3">
              {entry.tasks.map((task, j) => (
                <div key={j}>
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">{task.name}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{task.workDone}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── WorkLogPage ─────────────────────────────────────────────────────
const WorkLogPage = () => {
  const [tab, setTab] = useState("today");
  const [dayStatus, setDayStatus] = useState("Draft");
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [historyDetail, setHistoryDetail] = useState(null);

  const handleSave = (form) => {
    if (editingEntry) {
      setEntries(entries.map((e) => e.id === editingEntry.id ? { ...e, ...form } : e));
    } else {
      setEntries([...entries, { id: Date.now(), status: "Draft", ...form }]);
    }
    setEditingEntry(null);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setPanelOpen(true);
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    setPanelOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Work Log</h1>
          <p className="text-sm text-gray-400 mt-1">Daily timesheet of field activities</p>
        </div>
        {tab === "today" && dayStatus === "Draft" && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Add Entry
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
        {[{ key: "today", label: "Today" }, { key: "history", label: "History" }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-[#1a2744] text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "today" ? (
        <div className="flex flex-col gap-4 flex-1">
          {/* Date + status bar */}
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Friday, 06 March 2026</p>
              <p className="text-xs text-gray-400 mt-0.5">{entries.length} entries · 4h 30m logged</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                dayStatus === "Draft" ? "bg-orange-100 text-orange-500" : "bg-green-100 text-green-600"
              }`}>
                {dayStatus}
              </span>
              {dayStatus === "Draft" && (
                <button
                  onClick={() => { setDayStatus("Submitted"); setEntries(entries.map((e) => ({ ...e, status: "Submitted" }))); }}
                  className="bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Submit Day
                </button>
              )}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 text-sm mb-1">No entries yet for today.</p>
              <p className="text-gray-300 text-xs">Click "Add Entry" to log your first activity.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ACTIVITY_BADGE[entry.activity] || "bg-gray-100 text-gray-500"}`}>
                      {entry.activity}
                    </span>
                    <span className="text-xs text-gray-400">{entry.duration}</span>
                    <span className="text-xs text-gray-500 font-medium">{entry.ulb}</span>
                  </div>
                  {entry.status === "Draft" && (
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-xs font-medium text-[#1a2744] border border-[#1a2744]/30 px-3 py-1 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors shrink-0 ml-2"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {entry.tasks.map((task, i) => (
                    <div key={i} className="pl-3 border-l-2 border-gray-100">
                      <p className="text-xs font-semibold text-gray-700">{task.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{task.workDone}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Past Work Logs</p>
          </div>
          {HISTORY.map((day, i) => (
            <div
              key={i}
              onClick={() => setHistoryDetail(day)}
              className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${i !== HISTORY.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <div>
                <span className="text-sm font-semibold text-gray-700">{day.date}</span>
                <span className="text-xs text-gray-400 ml-2">{day.day}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{day.entries.length} entries · {day.hours}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-600">{day.status}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit entry panel */}
      {panelOpen && (
        <EntryPanel
          entry={editingEntry}
          onClose={() => { setPanelOpen(false); setEditingEntry(null); }}
          onSave={handleSave}
        />
      )}

      {/* History detail panel */}
      {historyDetail && (
        <HistoryDetailPanel
          day={historyDetail}
          onClose={() => setHistoryDetail(null)}
        />
      )}
    </div>
  );
};

export default WorkLogPage;
