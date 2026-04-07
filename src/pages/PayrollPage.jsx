import { useState, useMemo } from "react";
import { DUMMY_ALLOCATION_USERS, DUMMY_ULBS } from "../utils/dummyData";
import {
  DUMMY_SALARY_CONFIG,
  DUMMY_ATTENDANCE,
  DUMMY_PAYROLL_RECORDS,
} from "../utils/payrollData";

// ── Constants ───────────────────────────────────────────────────────
const ROLE_COLORS = {
  "Team Lead":               "bg-blue-100 text-blue-700",
  "Chartered Accountant":    "bg-purple-100 text-purple-700",
  "ULB Field Executive":     "bg-green-100 text-green-700",
  "Non-ULB Field Executive": "bg-orange-100 text-orange-600",
};

const MONTHS = [
  { value: "2026-01", label: "January 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-03", label: "March 2026" },
];

// ── Helpers ─────────────────────────────────────────────────────────
function ini(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function calcPayroll(att, monthlySalary) {
  const dailyRate       = monthlySalary / att.totalWorkingDays;
  const paidDays        = att.presentDays + att.paidLeaves;
  const earnedSalary    = round2(monthlySalary * paidDays / att.totalWorkingDays);
  const overtimePay     = round2(att.overtimeHours * (dailyRate / 8) * 1.5);
  const unpaidDeduction = round2(att.unpaidLeaves * dailyRate);
  const netSalary       = round2(earnedSalary + overtimePay - unpaidDeduction);
  return { dailyRate: round2(dailyRate), paidDays, earnedSalary, overtimePay, unpaidDeduction, netSalary };
}

function fmtCurrency(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function monthLabel(monthStr) {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function getUlbName(ulbId) {
  return DUMMY_ULBS.find((u) => u.id === ulbId)?.name ?? "—";
}

function attPct(att) {
  return Math.round((att.presentDays + att.paidLeaves) / att.totalWorkingDays * 100);
}

// ── Shared UI ────────────────────────────────────────────────────────
function Avatar({ name }) {
  return (
    <div className="w-7 h-7 rounded-full bg-[#1a2744]/10 text-[#1a2744] flex items-center justify-center text-xs font-bold shrink-0">
      {ini(name)}
    </div>
  );
}

function RolePill({ role }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-600"}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
      status === "Done" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
    }`}>
      {status}
    </span>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white outline-none focus:border-[#1a2744]/40 w-48"
      />
    </div>
  );
}

function SelectFilter({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-[#1a2744]/40 ${className}`}
    >
      {children}
    </select>
  );
}

function Modal({ title, subtitle, onClose, wide, children, footer }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full flex flex-col ${wide ? "max-w-lg" : "max-w-md"}`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-4">✕</button>
        </div>
        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100">{footer}</div>}
      </div>
    </div>
  );
}

function BreakupRow({ label, value, positive, negative, bold }) {
  const cls = bold
    ? "font-semibold text-gray-800"
    : positive
    ? "text-green-600 font-medium"
    : negative
    ? "text-red-500 font-medium"
    : "text-gray-700";
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${cls}`}>{value}</span>
    </div>
  );
}

// ── Modals ───────────────────────────────────────────────────────────
function SalaryBreakupModal({ record, employee, onClose }) {
  const calc = calcPayroll(record, record.monthlySalary);
  const grossSalary = round2(calc.earnedSalary + calc.overtimePay);

  return (
    <Modal
      title="Salary Breakup"
      subtitle={`${employee.name} · ${monthLabel(record.month)}`}
      onClose={onClose}
      footer={
        <button onClick={onClose} className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          Close
        </button>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Earnings</p>
          <BreakupRow label="Base Monthly Salary" value={fmtCurrency(record.monthlySalary)} />
          <BreakupRow label={`Paid Days (${calc.paidDays} of ${record.totalWorkingDays})`} value={`${calc.paidDays} days`} />
          <BreakupRow label="Earned Salary" value={fmtCurrency(calc.earnedSalary)} />
          <BreakupRow label="Overtime Pay" value={calc.overtimePay > 0 ? `+ ${fmtCurrency(calc.overtimePay)}` : "₹0"} positive={calc.overtimePay > 0} />
          <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-200">
            <span className="text-sm font-medium text-gray-700">Gross Salary</span>
            <span className="text-sm font-semibold text-gray-800">{fmtCurrency(grossSalary)}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Deductions</p>
          <BreakupRow
            label={`Unpaid Leave (${record.unpaidLeaves} day${record.unpaidLeaves !== 1 ? "s" : ""})`}
            value={calc.unpaidDeduction > 0 ? `− ${fmtCurrency(calc.unpaidDeduction)}` : "₹0"}
            negative={calc.unpaidDeduction > 0}
          />
        </div>

        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
          <span className="text-base font-semibold text-gray-800">Net Salary</span>
          <span className="text-xl font-bold text-green-600">{fmtCurrency(calc.netSalary)}</span>
        </div>
      </div>
    </Modal>
  );
}

function PayslipModal({ record, employee, onClose }) {
  const calc = calcPayroll(record, record.monthlySalary);
  const grossSalary = round2(calc.earnedSalary + calc.overtimePay);

  return (
    <Modal
      title="Payslip"
      subtitle={`${employee.name} · ${monthLabel(record.month)}`}
      onClose={onClose}
      wide
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Close
          </button>
          <button onClick={() => window.print()} className="flex-1 py-2 bg-[#1a2744] text-white rounded-lg text-sm font-medium hover:bg-[#1a2744]/90">
            Print
          </button>
        </div>
      }
    >
      {/* Payslip header */}
      <div className="bg-[#1a2744] rounded-xl px-5 py-4 mb-5 text-white">
        <p className="text-xs font-medium text-white/60 uppercase tracking-wide">BNM Chhattisgarh — ULB Audit System</p>
        <p className="text-base font-bold mt-1">Payslip — {monthLabel(record.month)}</p>
      </div>

      {/* Employee info */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          ["Employee Name", employee.name],
          ["Employee ID", employee.id],
          ["Role", employee.role],
          ["District", employee.district],
          ["Payment Mode", "Bank Transfer"],
          ["Month", monthLabel(record.month)],
        ].map(([label, val]) => (
          <div key={label}>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-medium text-gray-800">{val}</p>
          </div>
        ))}
      </div>

      {/* Attendance summary */}
      <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Attendance</p>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            ["Working Days", record.totalWorkingDays],
            ["Present", record.presentDays],
            ["Paid Leave", record.paidLeaves],
            ["Unpaid Leave", record.unpaidLeaves],
            ["OT Hours", record.overtimeHours],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-base font-bold text-[#1a2744]">{val}</p>
              <p className="text-xs text-gray-400 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings & Deductions */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Earnings</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Earned Salary</span>
              <span className="font-medium text-gray-800">{fmtCurrency(calc.earnedSalary)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Overtime Pay</span>
              <span className="font-medium text-gray-800">{fmtCurrency(calc.overtimePay)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5 mt-1">
              <span className="text-gray-700">Total</span>
              <span className="text-gray-800">{fmtCurrency(grossSalary)}</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Deductions</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Unpaid Leave</span>
              <span className="font-medium text-red-500">{fmtCurrency(calc.unpaidDeduction)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5 mt-1">
              <span className="text-gray-700">Total</span>
              <span className="text-red-500">{fmtCurrency(calc.unpaidDeduction)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net salary */}
      <div className="bg-green-50 rounded-xl px-5 py-4 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">Net Salary</span>
        <span className="text-2xl font-bold text-green-600">{fmtCurrency(calc.netSalary)}</span>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Generated on 12/03/2026 · This is a computer-generated payslip
      </p>
    </Modal>
  );
}

function AddRevisionModal({ salaryConfigs, employees, onAdd, onClose }) {
  const [userId, setUserId]       = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [remark, setRemark]       = useState("");

  const selectedCfg = salaryConfigs.find((c) => c.userId === userId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userId || !newSalary || !effectiveFrom) return;
    onAdd({ userId, newSalary: Number(newSalary), effectiveFrom, remark });
  };

  return (
    <Modal
      title="Add Salary Revision"
      subtitle="Changes take effect from the specified date"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            form="revision-form"
            className="flex-1 py-2 bg-[#1a2744] text-white rounded-lg text-sm font-medium hover:bg-[#1a2744]/90"
          >
            Save Revision
          </button>
        </div>
      }
    >
      <form id="revision-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Employee</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-[#1a2744]/40"
          >
            <option value="">Select employee…</option>
            {salaryConfigs.map((cfg) => {
              const emp = employees.find((e) => e.id === cfg.userId);
              return (
                <option key={cfg.userId} value={cfg.userId}>
                  {emp?.name} — {emp?.role}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Current Salary</label>
          <input
            value={selectedCfg ? fmtCurrency(selectedCfg.monthlySalary) : "—"}
            disabled
            className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">New Salary (₹)</label>
          <input
            type="number"
            value={newSalary}
            onChange={(e) => setNewSalary(e.target.value)}
            required
            min={1}
            placeholder="e.g. 65000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-[#1a2744]/40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Effective From</label>
          <input
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-[#1a2744]/40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Remark (optional)</label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="e.g. Annual increment"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-[#1a2744]/40"
          />
        </div>
      </form>
    </Modal>
  );
}

// ── Tab 1: Salary Register ───────────────────────────────────────────
function SalaryRegisterTab({ payrollRecords, setPayrollRecords, salaryConfigs, employees }) {
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [search, setSearch]               = useState("");
  const [ulbFilter, setUlbFilter]         = useState("");
  const [statusFilter, setStatusFilter]   = useState("All");
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [breakupRecord, setBreakupRecord] = useState(null);
  const [payslipRecord, setPayslipRecord] = useState(null);

  const ulbOptions = useMemo(() => {
    const ids = [...new Set(salaryConfigs.map((c) => c.ulbId))];
    return ids.map((id) => ({ id, name: getUlbName(id) }));
  }, [salaryConfigs]);

  const enriched = useMemo(() => {
    return payrollRecords
      .filter((r) => r.month === selectedMonth)
      .map((r) => {
        const emp = employees.find((e) => e.id === r.userId);
        const cfg = salaryConfigs.find((c) => c.userId === r.userId);
        const grossSalary = round2(r.earnedSalary + r.overtimePay);
        return { ...r, emp, cfg, grossSalary };
      });
  }, [payrollRecords, selectedMonth, employees, salaryConfigs]);

  const filtered = useMemo(() => {
    return enriched.filter((r) => {
      const matchSearch = !search || r.emp?.name.toLowerCase().includes(search.toLowerCase());
      const matchUlb    = !ulbFilter || r.cfg?.ulbId === ulbFilter;
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      return matchSearch && matchUlb && matchStatus;
    });
  }, [enriched, search, ulbFilter, statusFilter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function markDone(recordId) {
    setPayrollRecords((prev) => prev.map((r) => r.id === recordId ? { ...r, status: "Done" } : r));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(recordId); return n; });
  }

  function handleBulkMarkDone() {
    setPayrollRecords((prev) => prev.map((r) => selectedIds.has(r.id) ? { ...r, status: "Done" } : r));
    setSelectedIds(new Set());
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SelectFilter value={selectedMonth} onChange={setSelectedMonth} className="w-44">
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </SelectFilter>
        <SearchInput value={search} onChange={setSearch} placeholder="Search employee…" />
        <SelectFilter value={ulbFilter} onChange={setUlbFilter}>
          <option value="">All ULBs</option>
          {ulbOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </SelectFilter>
        <SelectFilter value={statusFilter} onChange={setStatusFilter}>
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Done">Done</option>
        </SelectFilter>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1a2744]/5 rounded-lg border border-[#1a2744]/10 mb-3">
          <span className="text-sm text-gray-700">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkMarkDone}
            className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Mark Selected as Done
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-gray-400 hover:text-gray-600 ml-auto">
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-[#1a2744]" />
              </th>
              {["Employee", "Role", "ULB", "Wk Days", "Present", "Pd L", "Unp L", "OT Hrs", "Gross", "Deduction", "Net Salary", "Status", "Actions"].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-10 text-center text-sm text-gray-400">No records found</td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {r.status === "Pending" && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="accent-[#1a2744]"
                    />
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.emp?.name ?? "?"} />
                    <span className="font-medium text-gray-800 whitespace-nowrap">{r.emp?.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3"><RolePill role={r.emp?.role} /></td>
                <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap max-w-[160px] truncate">{getUlbName(r.cfg?.ulbId)}</td>
                <td className="px-3 py-3 text-center text-gray-700">{r.totalWorkingDays}</td>
                <td className="px-3 py-3 text-center text-gray-700">{r.presentDays}</td>
                <td className="px-3 py-3 text-center text-green-600">{r.paidLeaves}</td>
                <td className="px-3 py-3 text-center text-red-500">{r.unpaidLeaves}</td>
                <td className="px-3 py-3 text-center text-blue-600">{r.overtimeHours}</td>
                <td className="px-3 py-3 text-right font-medium text-gray-800 whitespace-nowrap">{fmtCurrency(r.grossSalary)}</td>
                <td className="px-3 py-3 text-right text-red-500 whitespace-nowrap">{r.unpaidDeduction > 0 ? `− ${fmtCurrency(r.unpaidDeduction)}` : "—"}</td>
                <td className="px-3 py-3 text-right font-semibold text-green-700 whitespace-nowrap">{fmtCurrency(r.netSalary)}</td>
                <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setBreakupRecord(r)}
                      className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                    >
                      Breakup
                    </button>
                    {r.status === "Pending" && (
                      <button
                        onClick={() => markDone(r.id)}
                        className="text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                      >
                        Mark Done
                      </button>
                    )}
                    <button
                      onClick={() => setPayslipRecord(r)}
                      className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                    >
                      Payslip
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {breakupRecord && (
        <SalaryBreakupModal
          record={breakupRecord}
          employee={breakupRecord.emp}
          onClose={() => setBreakupRecord(null)}
        />
      )}
      {payslipRecord && (
        <PayslipModal
          record={payslipRecord}
          employee={payslipRecord.emp}
          onClose={() => setPayslipRecord(null)}
        />
      )}
    </div>
  );
}

// ── Tab 2: Attendance ────────────────────────────────────────────────
function AttendanceTab({ salaryConfigs, employees }) {
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [search, setSearch]               = useState("");
  const [ulbFilter, setUlbFilter]         = useState("");
  const [historyUserId, setHistoryUserId] = useState(null);

  const ulbOptions = useMemo(() => {
    const ids = [...new Set(salaryConfigs.map((c) => c.ulbId))];
    return ids.map((id) => ({ id, name: getUlbName(id) }));
  }, [salaryConfigs]);

  const monthRecords = useMemo(() => {
    return DUMMY_ATTENDANCE
      .filter((a) => a.month === selectedMonth)
      .map((a) => {
        const emp = employees.find((e) => e.id === a.userId);
        const cfg = salaryConfigs.find((c) => c.userId === a.userId);
        return { ...a, emp, cfg, pct: attPct(a) };
      });
  }, [selectedMonth, employees, salaryConfigs]);

  const filtered = useMemo(() => {
    return monthRecords.filter((r) => {
      const matchSearch = !search || r.emp?.name.toLowerCase().includes(search.toLowerCase());
      const matchUlb    = !ulbFilter || r.cfg?.ulbId === ulbFilter;
      return matchSearch && matchUlb;
    });
  }, [monthRecords, search, ulbFilter]);

  const historyEmployee = employees.find((e) => e.id === historyUserId);
  const historyRecords  = DUMMY_ATTENDANCE.filter((a) => a.userId === historyUserId);

  function pctColor(pct) {
    if (pct >= 90) return "text-green-600";
    if (pct >= 75) return "text-amber-600";
    return "text-red-500";
  }

  if (historyUserId && historyEmployee) {
    const cfg = salaryConfigs.find((c) => c.userId === historyUserId);
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setHistoryUserId(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Attendance
          </button>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <Avatar name={historyEmployee.name} />
            <span className="font-semibold text-gray-800">{historyEmployee.name}</span>
            <RolePill role={historyEmployee.role} />
            <span className="text-sm text-gray-400">· {getUlbName(cfg?.ulbId)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Month", "Working Days", "Present", "Paid Leave", "Unpaid Leave", "OT Hours", "Attendance %"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyRecords.map((a) => {
                const pct = attPct(a);
                return (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{monthLabel(a.month)}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{a.totalWorkingDays}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{a.presentDays}</td>
                    <td className="px-4 py-3 text-center text-green-600">{a.paidLeaves}</td>
                    <td className="px-4 py-3 text-center text-red-500">{a.unpaidLeaves}</td>
                    <td className="px-4 py-3 text-center text-blue-600">{a.overtimeHours}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${pctColor(pct)}`}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SelectFilter value={selectedMonth} onChange={setSelectedMonth} className="w-44">
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </SelectFilter>
        <SearchInput value={search} onChange={setSearch} placeholder="Search employee…" />
        <SelectFilter value={ulbFilter} onChange={setUlbFilter}>
          <option value="">All ULBs</option>
          {ulbOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </SelectFilter>
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Employee", "Role", "ULB", "Wk Days", "Present", "Paid L", "Unpaid L", "OT Hrs", "Att%", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">No records found</td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.emp?.name ?? "?"} />
                    <span className="font-medium text-gray-800 whitespace-nowrap">{r.emp?.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><RolePill role={r.emp?.role} /></td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap max-w-[150px] truncate">{getUlbName(r.cfg?.ulbId)}</td>
                <td className="px-4 py-3 text-center text-gray-700">{r.totalWorkingDays}</td>
                <td className="px-4 py-3 text-center text-gray-700">{r.presentDays}</td>
                <td className="px-4 py-3 text-center text-green-600">{r.paidLeaves}</td>
                <td className="px-4 py-3 text-center text-red-500">{r.unpaidLeaves}</td>
                <td className="px-4 py-3 text-center text-blue-600">{r.overtimeHours}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${
                    r.pct >= 90 ? "text-green-600" : r.pct >= 75 ? "text-amber-600" : "text-red-500"
                  }`}>{r.pct}%</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setHistoryUserId(r.userId)}
                    className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                  >
                    View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 3: Reports ───────────────────────────────────────────────────
const REPORT_DEFS = [
  {
    id: "monthly-register",
    title: "Monthly Salary Register",
    description: "View salary details for all employees for a selected month",
    icon: (
      <svg className="w-5 h-5 text-[#1a2744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 4v16M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    id: "payroll-history",
    title: "Employee Payroll History",
    description: "Select an employee to view their payroll across all months",
    icon: (
      <svg className="w-5 h-5 text-[#1a2744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A4 4 0 018 17h8a4 4 0 012.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "pending",
    title: "Pending Salary Report",
    description: "Employees with pending salary processing for the selected month",
    icon: (
      <svg className="w-5 h-5 text-[#1a2744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "attendance-history",
    title: "Attendance History",
    description: "Employee-wise attendance across all months",
    icon: (
      <svg className="w-5 h-5 text-[#1a2744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3M16 7V3M3 11h18M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

function ReportsTab({ payrollRecords, salaryConfigs, employees }) {
  const [activeReport, setActiveReport]     = useState(null);
  const [reportMonth, setReportMonth]       = useState("2026-03");
  const [reportEmployee, setReportEmployee] = useState("");
  const [toastVisible, setToastVisible]     = useState(false);

  function handleExport() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  const currentDef = REPORT_DEFS.find((d) => d.id === activeReport);

  function enrichRecord(r) {
    const emp = employees.find((e) => e.id === r.userId);
    const cfg = salaryConfigs.find((c) => c.userId === r.userId);
    return { ...r, emp, cfg, grossSalary: round2(r.earnedSalary + r.overtimePay) };
  }

  // Report data
  const reportData = useMemo(() => {
    if (activeReport === "monthly-register") {
      return payrollRecords.filter((r) => r.month === reportMonth).map(enrichRecord);
    }
    if (activeReport === "payroll-history") {
      if (!reportEmployee) return [];
      return payrollRecords.filter((r) => r.userId === reportEmployee).map(enrichRecord);
    }
    if (activeReport === "pending") {
      return payrollRecords.filter((r) => r.month === reportMonth && r.status === "Pending").map(enrichRecord);
    }
    if (activeReport === "attendance-history") {
      const userId = reportEmployee || null;
      return DUMMY_ATTENDANCE
        .filter((a) => !userId || a.userId === userId)
        .map((a) => {
          const emp = employees.find((e) => e.id === a.userId);
          const cfg = salaryConfigs.find((c) => c.userId === a.userId);
          return { ...a, emp, cfg, pct: attPct(a) };
        });
    }
    return [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport, reportMonth, reportEmployee, payrollRecords]);

  if (!activeReport) {
    return (
      <div className="grid grid-cols-2 gap-4 auto-rows-min">
        {REPORT_DEFS.map((def) => (
          <div key={def.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1a2744]/8 flex items-center justify-center">
              {def.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">{def.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{def.description}</p>
            </div>
            <button
              onClick={() => setActiveReport(def.id)}
              className="mt-auto text-sm font-medium px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 text-left"
            >
              View Report →
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Report header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveReport(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Reports
          </button>
          <span className="text-gray-300">|</span>
          <h2 className="text-base font-semibold text-gray-800">{currentDef?.title}</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v1a2 2 0 002 2h14a2 2 0 002-2v-1" />
          </svg>
          Export
        </button>
      </div>

      {/* Context filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {(activeReport === "monthly-register" || activeReport === "pending") && (
          <SelectFilter value={reportMonth} onChange={setReportMonth} className="w-44">
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </SelectFilter>
        )}
        {(activeReport === "payroll-history" || activeReport === "attendance-history") && (
          <SelectFilter value={reportEmployee} onChange={setReportEmployee} className="w-56">
            <option value="">All employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </SelectFilter>
        )}
      </div>

      {/* Report table */}
      <div className="flex-1 min-h-0 overflow-auto bg-white rounded-xl border border-gray-200">
        {(activeReport === "monthly-register" || activeReport === "pending" || activeReport === "payroll-history") && (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100">
                {["Employee", "Role", "ULB", "Month", "Wk Days", "Present", "Pd L", "Unp L", "Gross", "Deduction", "Net Salary", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-sm text-gray-400">No records</td></tr>
              )}
              {reportData.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.emp?.name ?? "?"} />
                      <span className="font-medium text-gray-800 whitespace-nowrap">{r.emp?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RolePill role={r.emp?.role} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap max-w-[150px] truncate">{getUlbName(r.cfg?.ulbId)}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{monthLabel(r.month)}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{r.totalWorkingDays}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{r.presentDays}</td>
                  <td className="px-4 py-3 text-center text-green-600">{r.paidLeaves}</td>
                  <td className="px-4 py-3 text-center text-red-500">{r.unpaidLeaves}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800 whitespace-nowrap">{fmtCurrency(r.grossSalary)}</td>
                  <td className="px-4 py-3 text-right text-red-500 whitespace-nowrap">{r.unpaidDeduction > 0 ? `− ${fmtCurrency(r.unpaidDeduction)}` : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700 whitespace-nowrap">{fmtCurrency(r.netSalary)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeReport === "attendance-history" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Employee", "Role", "ULB", "Month", "Wk Days", "Present", "Paid L", "Unpaid L", "OT Hrs", "Att%"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">No records</td></tr>
              )}
              {reportData.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={a.emp?.name ?? "?"} />
                      <span className="font-medium text-gray-800 whitespace-nowrap">{a.emp?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RolePill role={a.emp?.role} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{getUlbName(a.cfg?.ulbId)}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{monthLabel(a.month)}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{a.totalWorkingDays}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{a.presentDays}</td>
                  <td className="px-4 py-3 text-center text-green-600">{a.paidLeaves}</td>
                  <td className="px-4 py-3 text-center text-red-500">{a.unpaidLeaves}</td>
                  <td className="px-4 py-3 text-center text-blue-600">{a.overtimeHours}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${a.pct >= 90 ? "text-green-600" : a.pct >= 75 ? "text-amber-600" : "text-red-500"}`}>
                      {a.pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Export toast */}
      {toastVisible && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Exported successfully
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Salary Revisions ──────────────────────────────────────────
function SalaryRevisionsTab({ salaryConfigs, setSalaryConfigs, employees }) {
  const [search, setSearch]           = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const allRevisions = useMemo(() => {
    return salaryConfigs
      .flatMap((cfg) =>
        cfg.salaryRevisions.map((rev) => ({
          ...rev,
          userId: cfg.userId,
          emp: employees.find((e) => e.id === cfg.userId),
          cfg,
        }))
      )
      .sort((a, b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom));
  }, [salaryConfigs, employees]);

  const filtered = useMemo(() => {
    if (!search) return allRevisions;
    return allRevisions.filter((r) => r.emp?.name.toLowerCase().includes(search.toLowerCase()));
  }, [allRevisions, search]);

  function handleAddRevision({ userId, newSalary, effectiveFrom, remark }) {
    setSalaryConfigs((prev) =>
      prev.map((cfg) => {
        if (cfg.userId !== userId) return cfg;
        const newRev = {
          id: `sr-${userId}-${Date.now()}`,
          effectiveFrom,
          oldSalary: cfg.monthlySalary,
          newSalary,
          remark,
        };
        return {
          ...cfg,
          monthlySalary: newSalary,
          salaryRevisions: [...cfg.salaryRevisions, newRev],
        };
      })
    );
    setAddModalOpen(false);
  }

  function fmtDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters + Add button */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search employee…" />
        <button
          onClick={() => setAddModalOpen(true)}
          className="ml-auto px-4 py-2 bg-[#1a2744] text-white rounded-lg text-sm font-medium hover:bg-[#1a2744]/90"
        >
          + Add Revision
        </button>
      </div>

      {filtered.length === 0 && !search && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">No salary revisions recorded yet</p>
        </div>
      )}

      {(filtered.length > 0 || search) && (
        <div className="flex-1 min-h-0 overflow-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Employee", "Role", "ULB", "Old Salary", "New Salary", "Change", "Effective From", "Remark"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">No matching revisions</td></tr>
              )}
              {filtered.map((r) => {
                const change = r.newSalary - r.oldSalary;
                return (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.emp?.name ?? "?"} />
                        <span className="font-medium text-gray-800 whitespace-nowrap">{r.emp?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RolePill role={r.emp?.role} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap max-w-[140px] truncate">{getUlbName(r.cfg?.ulbId)}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtCurrency(r.oldSalary)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{fmtCurrency(r.newSalary)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {change >= 0 ? "+" : ""}
                        {fmtCurrency(change)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(r.effectiveFrom)}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{r.remark || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {addModalOpen && (
        <AddRevisionModal
          salaryConfigs={salaryConfigs}
          employees={employees}
          onAdd={handleAddRevision}
          onClose={() => setAddModalOpen(false)}
        />
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
const TABS = [
  { id: "salary",     label: "Salary Register" },
  { id: "attendance", label: "Attendance" },
  { id: "reports",    label: "Reports" },
  { id: "revisions",  label: "Salary Revisions" },
];

export default function PayrollPage() {
  const [tab, setTab]                       = useState("salary");
  const [payrollRecords, setPayrollRecords] = useState(DUMMY_PAYROLL_RECORDS);
  const [salaryConfigs, setSalaryConfigs]   = useState(DUMMY_SALARY_CONFIG);
  const employees                           = DUMMY_ALLOCATION_USERS;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Payroll</h1>
        <p className="text-sm text-gray-400 mt-1">Manage salary, attendance, and payroll records</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-[#1a2744] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {tab === "salary" && (
          <SalaryRegisterTab
            payrollRecords={payrollRecords}
            setPayrollRecords={setPayrollRecords}
            salaryConfigs={salaryConfigs}
            employees={employees}
          />
        )}
        {tab === "attendance" && (
          <AttendanceTab
            salaryConfigs={salaryConfigs}
            employees={employees}
          />
        )}
        {tab === "reports" && (
          <ReportsTab
            payrollRecords={payrollRecords}
            salaryConfigs={salaryConfigs}
            employees={employees}
          />
        )}
        {tab === "revisions" && (
          <SalaryRevisionsTab
            salaryConfigs={salaryConfigs}
            setSalaryConfigs={setSalaryConfigs}
            employees={employees}
          />
        )}
      </div>
    </div>
  );
}
