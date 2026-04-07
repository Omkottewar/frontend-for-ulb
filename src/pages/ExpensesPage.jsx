import { useState } from "react";

const EXPENSES = [
  { id: "EXP-001", category: "Travel", description: "Fuel for Raipur to Bilaspur trip", amount: 1200, date: "05/03/2026", status: "Reimbursed", receipt: true },
  { id: "EXP-002", category: "Stationery", description: "USB pendrive for file transfer", amount: 650, date: "05/03/2026", status: "Approved", receipt: true },
  { id: "EXP-003", category: "Travel", description: "Fuel for Durg field visit", amount: 850, date: "04/03/2026", status: "Pending", receipt: true },
  { id: "EXP-004", category: "Food", description: "Working lunch during site visit", amount: 320, date: "04/03/2026", status: "Rejected", receipt: false },
  { id: "EXP-005", category: "Travel", description: "Fuel for Korba visit", amount: 2100, date: "03/03/2026", status: "Pending", receipt: true },
  { id: "EXP-006", category: "Other", description: "Printing charges for audit documents", amount: 180, date: "03/03/2026", status: "Approved", receipt: true },
  { id: "EXP-007", category: "Travel", description: "Fuel for Rajnandgaon trip", amount: 1800, date: "01/03/2026", status: "Reimbursed", receipt: true },
  { id: "EXP-008", category: "Stationery", description: "File folders and markers", amount: 450, date: "28/02/2026", status: "Pending", receipt: false },
];

const STATUS_STYLES = {
  Pending: "bg-orange-100 text-orange-500",
  Approved: "bg-blue-100 text-blue-600",
  Rejected: "bg-red-100 text-red-500",
  Reimbursed: "bg-green-100 text-green-600",
};

const STATS = [
  { label: "Total Raised", count: 8, amount: 7550, color: "text-gray-800" },
  { label: "Pending", count: 3, amount: 3400, color: "text-orange-500" },
  { label: "Approved", count: 2, amount: 830, color: "text-blue-600" },
  { label: "Reimbursed", count: 2, amount: 3000, color: "text-green-600" },
];

const ExpensesPage = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");

  const filtered = filterStatus === "All" ? EXPENSES : EXPENSES.filter((e) => e.status === filterStatus);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
          <p className="text-sm text-gray-400 mt-1">Track and raise reimbursement requests</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Raise Expense
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-2">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>₹{s.amount.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 mt-1">{s.count} receipt{s.count !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-4 w-fit">
        {["All", "Pending", "Approved", "Rejected", "Reimbursed"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterStatus(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === t ? "bg-[#1a2744] text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["ID", "Category", "Description", "Amount", "Date", "Receipt", "Status"].map((col) => (
                <th key={col} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-700 whitespace-nowrap">{e.id}</td>
                <td className="px-5 py-3.5 text-gray-600">{e.category}</td>
                <td className="px-5 py-3.5 text-gray-500 max-w-[220px] truncate">{e.description}</td>
                <td className="px-5 py-3.5 font-medium text-gray-700 whitespace-nowrap">₹{e.amount.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{e.date}</td>
                <td className="px-5 py-3.5">
                  {e.receipt
                    ? <span className="text-xs text-blue-500 font-medium cursor-pointer hover:underline">View</span>
                    : <span className="text-xs text-gray-300">—</span>
                  }
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[e.status]}`}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Raise Expense slide-in */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => { setShowForm(false); setCategory(""); }} />
          <div className="w-96 bg-white h-full shadow-xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Raise Expense</h2>
              <button onClick={() => { setShowForm(false); setCategory(""); }} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744]"
                >
                  <option value="">Select category</option>
                  {["Travel", "Stationery", "Food", "Other"].map((c) => <option key={c}>{c}</option>)}
                </select>
                {category === "Other" && (
                  <input
                    type="text"
                    placeholder="Specify category..."
                    className="mt-2 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744]"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" placeholder="0" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} placeholder="Brief description of expense..." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-gray-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4m0 0l-4 4m4-4v12" />
                  </svg>
                  <p className="text-xs text-gray-400">Click to upload receipt</p>
                  <p className="text-xs text-gray-300 mt-1">JPG, PNG or PDF</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => { setShowForm(false); setCategory(""); }}
                className="w-full bg-[#1a2744] hover:bg-[#243460] text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
