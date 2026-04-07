import { useState } from "react";
import FileDetailPage from "./FileDetailPage";

const RISK_STYLES = {
  High: "bg-red-100 text-red-600",
  Medium: "bg-orange-100 text-orange-500",
  Low: "bg-green-100 text-green-600",
};

// Same demo finalized file as in FilesPage
const DEMO_FINALIZED = {
  fileNumber: "RMC/2024/WRK/0008",
  fileTitle: "Water Supply Pipeline Rehabilitation",
  ulb: "Raipur Municipal Corporation",
  workDescription: "Rehabilitation of 12 km water supply pipeline in Zone 3",
  amount: 850000,
  riskFlag: "Low",
  contractType: "Works",
  status: "Finalized",
  date: "08/03/2026",
  attachmentCount: 0,
  finalized: true,
  finalizedAt: "10/03/2026",
  finalizedBy: "CA Sharma",
};

const loadFinalizedFiles = () => {
  try {
    const all = JSON.parse(localStorage.getItem("ulb_files") || "[]");
    const finalized = all.filter((f) => f.finalized || f.status === "Finalized");
    const demoExists = finalized.some((f) => f.fileNumber === DEMO_FINALIZED.fileNumber);
    return demoExists ? finalized : [DEMO_FINALIZED, ...finalized];
  } catch {
    return [DEMO_FINALIZED];
  }
};

const PreAuditPage = () => {
  const [files] = useState(loadFinalizedFiles);
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [filterULB, setFilterULB] = useState("");

  const allULBs = [...new Set(files.map((f) => f.ulb).filter(Boolean))];

  const filtered = files.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.fileNumber?.toLowerCase().includes(q) ||
      f.fileTitle?.toLowerCase().includes(q) ||
      f.ulb?.toLowerCase().includes(q);
    return (
      matchSearch &&
      (!filterRisk || f.riskFlag === filterRisk) &&
      (!filterULB || f.ulb === filterULB)
    );
  });

  if (selectedFile) {
    return (
      <FileDetailPage
        file={selectedFile}
        onBack={() => setSelectedFile(null)}
        onFileUpdated={() => {}}
        onFileFinalized={() => {}}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pre-Audit</h1>
        <p className="text-sm text-gray-400 mt-1">Files finalized by CA and ready for audit</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-45">
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm text-gray-700 outline-none w-full placeholder-gray-400"
          />
        </div>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#1a2744] bg-white min-w-30"
        >
          <option value="">All Risk</option>
          {["Low", "Medium", "High"].map((r) => <option key={r}>{r}</option>)}
        </select>
        <select
          value={filterULB}
          onChange={(e) => setFilterULB(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#1a2744] bg-white min-w-32.5"
        >
          <option value="">All ULBs</option>
          {allULBs.map((u) => <option key={u}>{u}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["File Number", "Title", "ULB", "Amount", "Risk", "Finalized By", "Finalized On", "Observations"].map((col) => (
                <th key={col} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 text-sm py-16">
                  {files.length === 0
                    ? "No files have been finalized yet."
                    : "No files match your filters."}
                </td>
              </tr>
            ) : (
              filtered.map((f, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedFile(f)}
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium text-[#1a2744]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {f.fileNumber}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 max-w-45">
                    <p className="truncate">{f.fileTitle || "—"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{f.ulb || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                    {f.amount ? `₹${Number(f.amount).toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${RISK_STYLES[f.riskFlag] || "bg-gray-100 text-gray-500"}`}>
                      {f.riskFlag || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">{f.finalizedBy || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{f.finalizedAt || "—"}</td>
                  <td className="px-5 py-3.5 max-w-55">
                    {f.caObservations ? (
                      <div className="flex items-start gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{f.caObservations}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 italic">None</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreAuditPage;
