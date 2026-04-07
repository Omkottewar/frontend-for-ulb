import { useState, useRef, useEffect } from "react";

const EXPENSE_CLAIMS = [
  { id: "EXP-001", employeeId: "u3", employeeName: "Arjun Mehta", role: "ULB Field Executive", ulb: "Raipur Municipal Corporation", category: "Travel", description: "Fuel for Raipur to Bilaspur field visit", amount: 1200, expenseDate: "05/03/2026", submittedOn: "06/03/2026", receipt: true, status: "Reimbursed", remarks: "Verified with vehicle log." },
  { id: "EXP-002", employeeId: "u4", employeeName: "Priya Sharma", role: "Non-ULB Field Executive", ulb: "Bilaspur Municipal Corporation", category: "Stationery", description: "USB pendrive for file transfer", amount: 650, expenseDate: "05/03/2026", submittedOn: "06/03/2026", receipt: true, status: "Approved", remarks: "" },
  { id: "EXP-003", employeeId: "u3", employeeName: "Arjun Mehta", role: "ULB Field Executive", ulb: "Raipur Municipal Corporation", category: "Travel", description: "Fuel for Durg field visit", amount: 850, expenseDate: "04/03/2026", submittedOn: "05/03/2026", receipt: true, status: "Pending", remarks: "" },
  { id: "EXP-004", employeeId: "u5", employeeName: "Rohan Das", role: "ULB Field Executive", ulb: "Korba Municipal Corporation", category: "Food", description: "Working lunch during site visit", amount: 320, expenseDate: "04/03/2026", submittedOn: "04/03/2026", receipt: false, status: "Rejected", remarks: "No receipt attached. Resubmit with bill." },
  { id: "EXP-005", employeeId: "u6", employeeName: "Neha Gupta", role: "Non-ULB Field Executive", ulb: "Durg Municipal Corporation", category: "Travel", description: "Fuel for Korba inter-district visit", amount: 2100, expenseDate: "03/03/2026", submittedOn: "04/03/2026", receipt: true, status: "Pending", remarks: "" },
  { id: "EXP-006", employeeId: "u4", employeeName: "Priya Sharma", role: "Non-ULB Field Executive", ulb: "Bilaspur Municipal Corporation", category: "Other", description: "Printing charges for audit documents", amount: 180, expenseDate: "03/03/2026", submittedOn: "03/03/2026", receipt: true, status: "Approved", remarks: "" },
  { id: "EXP-007", employeeId: "u5", employeeName: "Rohan Das", role: "ULB Field Executive", ulb: "Korba Municipal Corporation", category: "Travel", description: "Fuel for Rajnandgaon trip", amount: 1800, expenseDate: "01/03/2026", submittedOn: "02/03/2026", receipt: true, status: "Reimbursed", remarks: "Approved and disbursed." },
  { id: "EXP-008", employeeId: "u6", employeeName: "Neha Gupta", role: "Non-ULB Field Executive", ulb: "Durg Municipal Corporation", category: "Stationery", description: "File folders and markers for site", amount: 450, expenseDate: "28/02/2026", submittedOn: "01/03/2026", receipt: false, status: "Pending", remarks: "" },
  { id: "EXP-009", employeeId: "u3", employeeName: "Arjun Mehta", role: "ULB Field Executive", ulb: "Raipur Municipal Corporation", category: "Food", description: "Team dinner during extended audit day", amount: 760, expenseDate: "27/02/2026", submittedOn: "28/02/2026", receipt: true, status: "Rejected", remarks: "Team expenses require pre-approval." },
  { id: "EXP-010", employeeId: "u7", employeeName: "Kavita Joshi", role: "ULB Field Executive", ulb: "Rajnandgaon Municipal Council", category: "Travel", description: "Auto fare for last-mile connectivity", amount: 340, expenseDate: "26/02/2026", submittedOn: "27/02/2026", receipt: true, status: "Pending", remarks: "" },
];

const STATUS_STYLES = {
  Pending: "bg-orange-100 text-orange-500",
  Approved: "bg-blue-100 text-blue-600",
  Rejected: "bg-red-100 text-red-500",
  Reimbursed: "bg-green-100 text-green-600",
};

const CATEGORIES = ["All", "Travel", "Stationery", "Food", "Other"];
const STATUS_TABS = ["All", "Pending", "Approved", "Rejected", "Reimbursed"];

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value}</p>
  </div>
);

const ExpenseApprovalPage = () => {
  const [claims, setClaims] = useState(EXPENSE_CLAIMS);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [drawerRemarks, setDrawerRemarks] = useState("");
  const employeeRef = useRef(null);

  const uniqueEmployees = [...new Set(EXPENSE_CLAIMS.map((c) => c.employeeName))];
  const filteredEmployeeOptions = uniqueEmployees.filter((name) =>
    name.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (employeeRef.current && !employeeRef.current.contains(e.target)) {
        setEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = claims.filter((c) => {
    if (filterStatus !== "All" && c.status !== filterStatus) return false;
    if (filterEmployee !== "All" && c.employeeName !== filterEmployee) return false;
    if (filterCategory !== "All" && c.category !== filterCategory) return false;
    if (filterDate && !c.expenseDate.includes(filterDate)) return false;
    return true;
  });

  const openDrawer = (claim) => {
    setSelectedClaim(claim);
    setDrawerRemarks(claim.remarks || "");
  };

  const closeDrawer = () => {
    setSelectedClaim(null);
    setDrawerRemarks("");
  };

  const updateClaim = (id, patch) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
    if (selectedClaim?.id === id) setSelectedClaim((prev) => ({ ...prev, ...patch }));
  };

  const handleApprove = () => {
    updateClaim(selectedClaim.id, { status: "Approved", remarks: drawerRemarks });
    closeDrawer();
  };

  const handleReject = () => {
    updateClaim(selectedClaim.id, { status: "Rejected", remarks: drawerRemarks });
    closeDrawer();
  };

  const handleReimburse = () => {
    updateClaim(selectedClaim.id, { status: "Reimbursed", remarks: drawerRemarks });
    closeDrawer();
  };

  const isReadOnly = selectedClaim && (selectedClaim.status === "Rejected" || selectedClaim.status === "Reimbursed");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expense Approvals</h1>
          <p className="text-sm text-gray-400 mt-1">Review and action submitted expense claims</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-4 w-fit">
        {STATUS_TABS.map((t) => (
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

      {/* Filter controls */}
      <div className="flex items-center gap-3 mb-4">
        {/* Employee searchable combo */}
        <div className="relative" ref={employeeRef}>
          <div
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-text min-w-[200px]"
            onClick={() => setEmployeeDropdownOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder={filterEmployee === "All" ? "All Employees" : filterEmployee}
              value={employeeSearch}
              onChange={(e) => { setEmployeeSearch(e.target.value); setEmployeeDropdownOpen(true); if (!e.target.value) setFilterEmployee("All"); }}
              onFocus={() => setEmployeeDropdownOpen(true)}
              className="outline-none text-sm text-gray-700 bg-transparent w-full placeholder-gray-400"
            />
            {filterEmployee !== "All" && (
              <button onClick={(e) => { e.stopPropagation(); setFilterEmployee("All"); setEmployeeSearch(""); }} className="text-gray-300 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {employeeDropdownOpen && (
            <ul className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
              <li
                onClick={() => { setFilterEmployee("All"); setEmployeeSearch(""); setEmployeeDropdownOpen(false); }}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${filterEmployee === "All" ? "text-[#1a2744] font-medium" : "text-gray-600"}`}
              >
                All Employees
              </li>
              {filteredEmployeeOptions.length === 0 && (
                <li className="px-4 py-2 text-sm text-gray-400">No match</li>
              )}
              {filteredEmployeeOptions.map((name) => (
                <li
                  key={name}
                  onClick={() => { setFilterEmployee(name); setEmployeeSearch(""); setEmployeeDropdownOpen(false); }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${filterEmployee === name ? "text-[#1a2744] font-medium" : "text-gray-600"}`}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Category */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
          ))}
        </select>

        {/* Date */}
        <input
          type="text"
          placeholder="Filter by date (DD/MM/YYYY)"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none placeholder-gray-400 w-52"
        />

        {/* Clear all */}
        {(filterEmployee !== "All" || filterCategory !== "All" || filterDate) && (
          <button
            onClick={() => { setFilterEmployee("All"); setEmployeeSearch(""); setFilterCategory("All"); setFilterDate(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-auto flex-1">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["Expense ID", "Employee", "Role", "ULB", "Category", "Description", "Amount", "Expense Date", "Submitted On", "Receipt", "Status", "Actions"].map((col) => (
                <th key={col} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center py-12 text-sm text-gray-400">No expense claims match the current filters.</td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5 font-medium text-gray-700 whitespace-nowrap">{c.id}</td>
                <td className="px-4 py-3.5 text-gray-800 font-medium whitespace-nowrap">{c.employeeName}</td>
                <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{c.role}</td>
                <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap max-w-[140px] truncate">{c.ulb}</td>
                <td className="px-4 py-3.5 text-gray-600">{c.category}</td>
                <td className="px-4 py-3.5 text-gray-500 max-w-[180px] truncate">{c.description}</td>
                <td className="px-4 py-3.5 font-medium text-gray-700 whitespace-nowrap">₹{c.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">{c.expenseDate}</td>
                <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">{c.submittedOn}</td>
                <td className="px-4 py-3.5">
                  {c.receipt
                    ? <span className="text-xs text-blue-500 font-medium cursor-pointer hover:underline">View</span>
                    : <span className="text-xs text-gray-300">—</span>
                  }
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  {c.status === "Pending" && (
                    <button
                      onClick={() => openDrawer(c)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#1a2744] text-[#1a2744] hover:bg-[#1a2744] hover:text-white transition-colors"
                    >
                      Review
                    </button>
                  )}
                  {c.status === "Approved" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDrawer(c)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 transition-colors"
                      >
                        Mark Reimbursed
                      </button>
                      <button
                        onClick={() => openDrawer(c)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        View
                      </button>
                    </div>
                  )}
                  {(c.status === "Rejected" || c.status === "Reimbursed") && (
                    <button
                      onClick={() => openDrawer(c)}
                      className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Drawer */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={closeDrawer} />
          <div className="w-[440px] bg-white h-full shadow-xl flex flex-col">
            {/* Drawer header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Review Expense</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selectedClaim.id}</p>
              </div>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Status badge */}
              <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[selectedClaim.status]}`}>
                {selectedClaim.status}
              </span>

              {/* Employee details */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Employee Details</p>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
                  <Field label="Name" value={selectedClaim.employeeName} />
                  <Field label="Role" value={selectedClaim.role} />
                  <Field label="ULB" value={selectedClaim.ulb} />
                </div>
              </div>

              {/* Expense details */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Expense Details</p>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
                  <Field label="Category" value={selectedClaim.category} />
                  <Field label="Amount" value={`₹${selectedClaim.amount.toLocaleString("en-IN")}`} />
                  <Field label="Expense Date" value={selectedClaim.expenseDate} />
                  <Field label="Submitted On" value={selectedClaim.submittedOn} />
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Description</p>
                    <p className="text-sm text-gray-800">{selectedClaim.description}</p>
                  </div>
                </div>
              </div>

              {/* Receipt placeholder */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Receipt</p>
                {selectedClaim.receipt ? (
                  <div className="border border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs text-gray-400">Receipt preview not available in demo</p>
                    <p className="text-xs text-gray-300 mt-1">{selectedClaim.id}_receipt.pdf</p>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-400">No receipt uploaded</p>
                  </div>
                )}
              </div>

              {/* Existing remarks (read-only) */}
              {selectedClaim.remarks && isReadOnly && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Remarks</p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
                    {selectedClaim.remarks}
                  </div>
                </div>
              )}

              {/* Remarks textarea (editable for Pending / Approved) */}
              {!isReadOnly && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Remarks</p>
                  {selectedClaim.remarks && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 mb-2">
                      {selectedClaim.remarks}
                    </div>
                  )}
                  <textarea
                    rows={3}
                    value={drawerRemarks}
                    onChange={(e) => setDrawerRemarks(e.target.value)}
                    placeholder="Add remarks or observations..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-[#1a2744] resize-none"
                  />
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              {isReadOnly ? (
                <button
                  onClick={closeDrawer}
                  className="w-full border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              ) : selectedClaim.status === "Pending" ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    className="flex-1 bg-[#1a2744] hover:bg-[#243460] text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 border border-red-400 text-red-500 hover:bg-red-50 font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Reject
                  </button>
                </div>
              ) : selectedClaim.status === "Approved" ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleReimburse}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Mark as Reimbursed
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 border border-red-400 text-red-500 hover:bg-red-50 font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseApprovalPage;
