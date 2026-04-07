import { useState } from "react";

const ALLOTTED_ULBS = [
  { id: 1, name: "Raipur Municipal Corporation", city: "Raipur" },
  { id: 2, name: "Bilaspur Municipal Corporation", city: "Bilaspur" },
  { id: 3, name: "Durg Municipal Council", city: "Durg" },
  { id: 4, name: "Korba Municipal Council", city: "Korba" },
  { id: 5, name: "Rajnandgaon Municipal Council", city: "Rajnandgaon" },
  { id: 6, name: "Jagdalpur Municipal Corporation", city: "Jagdalpur" },
  { id: 7, name: "Ambikapur Municipal Corporation", city: "Ambikapur" },
  { id: 8, name: "Chirmiri Municipal Council", city: "Chirmiri" },
];

const HISTORY = [
  {
    date: "05/03/2026", day: "Thursday",
    visits: [
      { ulb: "Raipur Municipal Corporation", time: "09:14 AM" },
      { ulb: "Bilaspur Municipal Corporation", time: "02:30 PM" },
    ],
  },
  {
    date: "04/03/2026", day: "Wednesday",
    visits: [{ ulb: "Durg Municipal Council", time: "10:05 AM" }],
  },
  {
    date: "03/03/2026", day: "Tuesday",
    visits: [
      { ulb: "Korba Municipal Council", time: "09:45 AM" },
      { ulb: "Rajnandgaon Municipal Council", time: "03:15 PM" },
    ],
  },
  {
    date: "28/02/2026", day: "Saturday",
    visits: [{ ulb: "Raipur Municipal Corporation", time: "10:30 AM" }],
  },
];

const AttendancePage = () => {
  const [tab, setTab] = useState("today");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [checkins, setCheckins] = useState({ 1: { time: "09:22 AM" } });
  const [expandedId, setExpandedId] = useState(null);

  const handleCheckIn = (id) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setCheckins((prev) => ({ ...prev, [id]: { time: timeStr } }));
    setExpandedId(null);
  };

  const visitedCount = Object.keys(checkins).length;
  const total = ALLOTTED_ULBS.length;

  const sorted = [...ALLOTTED_ULBS].sort((a, b) => {
    const aVisited = !!checkins[a.id];
    const bVisited = !!checkins[b.id];
    return aVisited - bVisited;
  });

  const filtered = sorted.filter((ulb) => {
    const q = search.toLowerCase();
    const matchSearch = !q || ulb.name.toLowerCase().includes(q) || ulb.city.toLowerCase().includes(q);
    const matchFilter =
      filter === "All" ||
      (filter === "Pending" && !checkins[ulb.id]) ||
      (filter === "Visited" && !!checkins[ulb.id]);
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-sm text-gray-400 mt-1">Mark your visit at each allotted ULB</p>
        </div>
        <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2">
          Friday, 06 March 2026
        </div>
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
          {/* Search + filter + progress */}
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[180px]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search ULBs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm text-gray-700 outline-none w-full placeholder-gray-400"
              />
            </div>
            <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
              {["All", "Pending", "Visited"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filter === f ? "bg-[#1a2744] text-white" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400">{visitedCount}/{total} visited</span>
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1a2744] rounded-full transition-all"
                  style={{ width: `${(visitedCount / total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["ULB", "City", "Status", "Check-in Time", ""].map((col, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 text-sm py-16">No ULBs match your search.</td>
                  </tr>
                ) : (
                  filtered.map((ulb) => {
                    const checkin = checkins[ulb.id];
                    const isExpanded = expandedId === ulb.id;
                    return (
                      <>
                        <tr
                          key={ulb.id}
                          className={`border-b border-gray-50 transition-colors ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-5 py-3.5 font-medium text-gray-800">{ulb.name}</td>
                          <td className="px-5 py-3.5 text-gray-400">{ulb.city}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              checkin ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-500"
                            }`}>
                              {checkin ? "Visited" : "Pending"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-sm">
                            {checkin ? checkin.time : "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            {!checkin && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : ulb.id)}
                                className="flex items-center gap-1.5 text-xs font-medium text-[#1a2744] border border-[#1a2744]/30 px-3 py-1.5 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors whitespace-nowrap"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Check In
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Inline check-in row */}
                        {isExpanded && (
                          <tr key={`${ulb.id}-expand`} className="border-b border-gray-50 bg-gray-50">
                            <td colSpan={5} className="px-5 py-4">
                              <div className="flex items-center gap-4">
                                <div className="border-2 border-dashed border-gray-200 rounded-lg px-6 py-3 flex items-center gap-3 flex-1 max-w-sm cursor-pointer hover:border-gray-300 transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4m0 0l-4 4m4-4v12" />
                                  </svg>
                                  <div>
                                    <p className="text-xs font-medium text-gray-500">Upload geo-tagged photo</p>
                                    <p className="text-xs text-gray-300">JPG or PNG</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCheckIn(ulb.id)}
                                  className="bg-[#1a2744] hover:bg-[#243460] text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Confirm Check-In
                                </button>
                                <button
                                  onClick={() => setExpandedId(null)}
                                  className="text-gray-400 hover:text-gray-600 text-xs px-3 py-2 rounded-lg border border-gray-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Past Attendance</p>
          </div>
          {HISTORY.map((day, i) => (
            <div key={i} className={`px-5 py-4 ${i !== HISTORY.length - 1 ? "border-b border-gray-50" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-gray-700">{day.date}</span>
                  <span className="text-xs text-gray-400 ml-2">{day.day}</span>
                </div>
                <span className="text-xs text-gray-400">{day.visits.length} ULB{day.visits.length > 1 ? "s" : ""} visited</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {day.visits.map((v, j) => (
                  <div key={j} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                    <span className="text-xs text-gray-600">{v.ulb}</span>
                    <span className="text-xs text-gray-400">· {v.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
