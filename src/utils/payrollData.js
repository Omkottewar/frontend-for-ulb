// ── Salary configuration per employee ──────────────────────────────
// ulbId derived from team→ULB assignments:
//   t1 (u3,u4,u5,u6)    → ulb1 Raipur Municipal Corporation
//   t2 (u7,u9,u11)      → ulb3 Durg Municipal Corporation
//   t3 (u8,u10,u12,u13) → ulb4 Jagdalpur Municipal Council
//   u14 (unassigned)    → ulb5 Korba Municipal Corporation

export const DUMMY_SALARY_CONFIG = [
  {
    userId: "u3",
    monthlySalary: 62000,
    ulbId: "ulb1",
    salaryRevisions: [
      { id: "sr-u3-1", effectiveFrom: "2025-01-01", oldSalary: 57000, newSalary: 62000, remark: "Annual increment FY 2025-26" },
    ],
  },
  {
    userId: "u7",
    monthlySalary: 58000,
    ulbId: "ulb3",
    salaryRevisions: [
      { id: "sr-u7-1", effectiveFrom: "2025-04-01", oldSalary: 53000, newSalary: 58000, remark: "Annual increment" },
    ],
  },
  {
    userId: "u8",
    monthlySalary: 60000,
    ulbId: "ulb4",
    salaryRevisions: [
      { id: "sr-u8-1", effectiveFrom: "2024-07-01", oldSalary: 54000, newSalary: 57000, remark: "Performance review" },
      { id: "sr-u8-2", effectiveFrom: "2025-01-01", oldSalary: 57000, newSalary: 60000, remark: "Annual increment FY 2025-26" },
    ],
  },
  {
    userId: "u4",
    monthlySalary: 52000,
    ulbId: "ulb1",
    salaryRevisions: [
      { id: "sr-u4-1", effectiveFrom: "2025-07-01", oldSalary: 46000, newSalary: 52000, remark: "Role expansion — additional audit responsibilities" },
    ],
  },
  {
    userId: "u9",
    monthlySalary: 44000,
    ulbId: "ulb3",
    salaryRevisions: [],
  },
  {
    userId: "u10",
    monthlySalary: 50000,
    ulbId: "ulb4",
    salaryRevisions: [
      { id: "sr-u10-1", effectiveFrom: "2025-04-01", oldSalary: 44000, newSalary: 50000, remark: "Annual increment" },
    ],
  },
  {
    userId: "u5",
    monthlySalary: 38000,
    ulbId: "ulb1",
    salaryRevisions: [
      { id: "sr-u5-1", effectiveFrom: "2025-01-01", oldSalary: 34000, newSalary: 38000, remark: "Annual increment FY 2025-26" },
    ],
  },
  {
    userId: "u11",
    monthlySalary: 40000,
    ulbId: "ulb3",
    salaryRevisions: [
      { id: "sr-u11-1", effectiveFrom: "2025-07-01", oldSalary: 36000, newSalary: 40000, remark: "Performance review" },
    ],
  },
  {
    userId: "u12",
    monthlySalary: 32000,
    ulbId: "ulb4",
    salaryRevisions: [],
  },
  {
    userId: "u6",
    monthlySalary: 36000,
    ulbId: "ulb1",
    salaryRevisions: [
      { id: "sr-u6-1", effectiveFrom: "2025-01-01", oldSalary: 32000, newSalary: 36000, remark: "Annual increment FY 2025-26" },
    ],
  },
  {
    userId: "u13",
    monthlySalary: 32000,
    ulbId: "ulb4",
    salaryRevisions: [
      { id: "sr-u13-1", effectiveFrom: "2025-04-01", oldSalary: 28000, newSalary: 32000, remark: "Annual increment" },
    ],
  },
  {
    userId: "u14",
    monthlySalary: 28000,
    ulbId: "ulb5",
    salaryRevisions: [],
  },
];

// ── Attendance records: 12 employees × 3 months = 36 records ───────
// Working days: Jan 2026 = 26, Feb 2026 = 20, Mar 2026 = 26

export const DUMMY_ATTENDANCE = [
  // ── January 2026 (26 working days) ──
  { id: "att-u3-2026-01",  userId: "u3",  month: "2026-01", totalWorkingDays: 26, presentDays: 24, paidLeaves: 1, unpaidLeaves: 1, overtimeHours: 6 },
  { id: "att-u7-2026-01",  userId: "u7",  month: "2026-01", totalWorkingDays: 26, presentDays: 23, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 4 },
  { id: "att-u8-2026-01",  userId: "u8",  month: "2026-01", totalWorkingDays: 26, presentDays: 25, paidLeaves: 1, unpaidLeaves: 0, overtimeHours: 8 },
  { id: "att-u4-2026-01",  userId: "u4",  month: "2026-01", totalWorkingDays: 26, presentDays: 24, paidLeaves: 2, unpaidLeaves: 0, overtimeHours: 2 },
  { id: "att-u9-2026-01",  userId: "u9",  month: "2026-01", totalWorkingDays: 26, presentDays: 18, paidLeaves: 2, unpaidLeaves: 6, overtimeHours: 0 },
  { id: "att-u10-2026-01", userId: "u10", month: "2026-01", totalWorkingDays: 26, presentDays: 22, paidLeaves: 3, unpaidLeaves: 1, overtimeHours: 3 },
  { id: "att-u5-2026-01",  userId: "u5",  month: "2026-01", totalWorkingDays: 26, presentDays: 23, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 0 },
  { id: "att-u11-2026-01", userId: "u11", month: "2026-01", totalWorkingDays: 26, presentDays: 24, paidLeaves: 1, unpaidLeaves: 1, overtimeHours: 5 },
  { id: "att-u12-2026-01", userId: "u12", month: "2026-01", totalWorkingDays: 26, presentDays: 20, paidLeaves: 3, unpaidLeaves: 3, overtimeHours: 0 },
  { id: "att-u6-2026-01",  userId: "u6",  month: "2026-01", totalWorkingDays: 26, presentDays: 24, paidLeaves: 1, unpaidLeaves: 1, overtimeHours: 3 },
  { id: "att-u13-2026-01", userId: "u13", month: "2026-01", totalWorkingDays: 26, presentDays: 22, paidLeaves: 2, unpaidLeaves: 2, overtimeHours: 0 },
  { id: "att-u14-2026-01", userId: "u14", month: "2026-01", totalWorkingDays: 26, presentDays: 16, paidLeaves: 2, unpaidLeaves: 8, overtimeHours: 0 },

  // ── February 2026 (20 working days) ──
  { id: "att-u3-2026-02",  userId: "u3",  month: "2026-02", totalWorkingDays: 20, presentDays: 19, paidLeaves: 1, unpaidLeaves: 0, overtimeHours: 5 },
  { id: "att-u7-2026-02",  userId: "u7",  month: "2026-02", totalWorkingDays: 20, presentDays: 17, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 3 },
  { id: "att-u8-2026-02",  userId: "u8",  month: "2026-02", totalWorkingDays: 20, presentDays: 20, paidLeaves: 0, unpaidLeaves: 0, overtimeHours: 6 },
  { id: "att-u4-2026-02",  userId: "u4",  month: "2026-02", totalWorkingDays: 20, presentDays: 18, paidLeaves: 2, unpaidLeaves: 0, overtimeHours: 2 },
  { id: "att-u9-2026-02",  userId: "u9",  month: "2026-02", totalWorkingDays: 20, presentDays: 14, paidLeaves: 2, unpaidLeaves: 4, overtimeHours: 0 },
  { id: "att-u10-2026-02", userId: "u10", month: "2026-02", totalWorkingDays: 20, presentDays: 17, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 1 },
  { id: "att-u5-2026-02",  userId: "u5",  month: "2026-02", totalWorkingDays: 20, presentDays: 18, paidLeaves: 1, unpaidLeaves: 1, overtimeHours: 0 },
  { id: "att-u11-2026-02", userId: "u11", month: "2026-02", totalWorkingDays: 20, presentDays: 19, paidLeaves: 1, unpaidLeaves: 0, overtimeHours: 4 },
  { id: "att-u12-2026-02", userId: "u12", month: "2026-02", totalWorkingDays: 20, presentDays: 16, paidLeaves: 2, unpaidLeaves: 2, overtimeHours: 0 },
  { id: "att-u6-2026-02",  userId: "u6",  month: "2026-02", totalWorkingDays: 20, presentDays: 18, paidLeaves: 1, unpaidLeaves: 1, overtimeHours: 2 },
  { id: "att-u13-2026-02", userId: "u13", month: "2026-02", totalWorkingDays: 20, presentDays: 17, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 0 },
  { id: "att-u14-2026-02", userId: "u14", month: "2026-02", totalWorkingDays: 20, presentDays: 12, paidLeaves: 2, unpaidLeaves: 6, overtimeHours: 0 },

  // ── March 2026 (26 working days — projected) ──
  { id: "att-u3-2026-03",  userId: "u3",  month: "2026-03", totalWorkingDays: 26, presentDays: 22, paidLeaves: 2, unpaidLeaves: 2, overtimeHours: 4 },
  { id: "att-u7-2026-03",  userId: "u7",  month: "2026-03", totalWorkingDays: 26, presentDays: 20, paidLeaves: 3, unpaidLeaves: 3, overtimeHours: 2 },
  { id: "att-u8-2026-03",  userId: "u8",  month: "2026-03", totalWorkingDays: 26, presentDays: 23, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 5 },
  { id: "att-u4-2026-03",  userId: "u4",  month: "2026-03", totalWorkingDays: 26, presentDays: 22, paidLeaves: 2, unpaidLeaves: 2, overtimeHours: 3 },
  { id: "att-u9-2026-03",  userId: "u9",  month: "2026-03", totalWorkingDays: 26, presentDays: 16, paidLeaves: 3, unpaidLeaves: 7, overtimeHours: 0 },
  { id: "att-u10-2026-03", userId: "u10", month: "2026-03", totalWorkingDays: 26, presentDays: 20, paidLeaves: 3, unpaidLeaves: 3, overtimeHours: 1 },
  { id: "att-u5-2026-03",  userId: "u5",  month: "2026-03", totalWorkingDays: 26, presentDays: 21, paidLeaves: 2, unpaidLeaves: 3, overtimeHours: 0 },
  { id: "att-u11-2026-03", userId: "u11", month: "2026-03", totalWorkingDays: 26, presentDays: 22, paidLeaves: 2, unpaidLeaves: 2, overtimeHours: 3 },
  { id: "att-u12-2026-03", userId: "u12", month: "2026-03", totalWorkingDays: 26, presentDays: 18, paidLeaves: 3, unpaidLeaves: 5, overtimeHours: 0 },
  { id: "att-u6-2026-03",  userId: "u6",  month: "2026-03", totalWorkingDays: 26, presentDays: 21, paidLeaves: 2, unpaidLeaves: 3, overtimeHours: 2 },
  { id: "att-u13-2026-03", userId: "u13", month: "2026-03", totalWorkingDays: 26, presentDays: 20, paidLeaves: 2, unpaidLeaves: 4, overtimeHours: 0 },
  { id: "att-u14-2026-03", userId: "u14", month: "2026-03", totalWorkingDays: 26, presentDays: 14, paidLeaves: 2, unpaidLeaves: 10, overtimeHours: 0 },
];

// ── Pre-computed payroll records ─────────────────────────────────────
// Formula:
//   dailyRate       = monthlySalary / totalWorkingDays
//   earnedSalary    = monthlySalary × (presentDays + paidLeaves) / totalWorkingDays
//   overtimePay     = overtimeHours × (dailyRate / 8) × 1.5
//   unpaidDeduction = unpaidLeaves × dailyRate
//   netSalary       = earnedSalary + overtimePay - unpaidDeduction
//
// Status: Jan=all Done, Feb=Done except u9+u14 (Pending), Mar=all Pending

export const DUMMY_PAYROLL_RECORDS = [
  // ── January 2026 ──
  { id: "pay-u3-2026-01",  userId: "u3",  month: "2026-01", monthlySalary: 62000, totalWorkingDays: 26, presentDays: 24, paidLeaves: 1, unpaidLeaves: 1, overtimeHours: 6,  earnedSalary: 59615.38, overtimePay: 2682.69,  unpaidDeduction: 2384.62, netSalary: 59913.45, status: "Done" },
  { id: "pay-u7-2026-01",  userId: "u7",  month: "2026-01", monthlySalary: 58000, totalWorkingDays: 26, presentDays: 23, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 4,  earnedSalary: 55769.23, overtimePay: 1673.08,  unpaidDeduction: 2230.77, netSalary: 55211.54, status: "Done" },
  { id: "pay-u8-2026-01",  userId: "u8",  month: "2026-01", monthlySalary: 60000, totalWorkingDays: 26, presentDays: 25, paidLeaves: 1, unpaidLeaves: 0, overtimeHours: 8,  earnedSalary: 60000.00, overtimePay: 3461.54,  unpaidDeduction: 0,       netSalary: 63461.54, status: "Done" },
  { id: "pay-u4-2026-01",  userId: "u4",  month: "2026-01", monthlySalary: 52000, totalWorkingDays: 26, presentDays: 24, paidLeaves: 2, unpaidLeaves: 0, overtimeHours: 2,  earnedSalary: 52000.00, overtimePay: 750.00,   unpaidDeduction: 0,       netSalary: 52750.00, status: "Done" },
  { id: "pay-u9-2026-01",  userId: "u9",  month: "2026-01", monthlySalary: 44000, totalWorkingDays: 26, presentDays: 18, paidLeaves: 2, unpaidLeaves: 6, overtimeHours: 0,  earnedSalary: 33846.15, overtimePay: 0,        unpaidDeduction: 10153.85,netSalary: 23692.30, status: "Done" },
  { id: "pay-u10-2026-01", userId: "u10", month: "2026-01", monthlySalary: 50000, totalWorkingDays: 26, presentDays: 22, paidLeaves: 3, unpaidLeaves: 1, overtimeHours: 3,  earnedSalary: 48076.92, overtimePay: 1081.73,  unpaidDeduction: 1923.08, netSalary: 47235.57, status: "Done" },
  { id: "pay-u5-2026-01",  userId: "u5",  month: "2026-01", monthlySalary: 38000, totalWorkingDays: 26, presentDays: 23, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 0,  earnedSalary: 36538.46, overtimePay: 0,        unpaidDeduction: 1461.54, netSalary: 35076.92, status: "Done" },
  { id: "pay-u11-2026-01", userId: "u11", month: "2026-01", monthlySalary: 40000, totalWorkingDays: 26, presentDays: 24, paidLeaves: 1, unpaidLeaves: 1, overtimeHours: 5,  earnedSalary: 38461.54, overtimePay: 1442.31,  unpaidDeduction: 1538.46, netSalary: 38365.39, status: "Done" },
  { id: "pay-u12-2026-01", userId: "u12", month: "2026-01", monthlySalary: 32000, totalWorkingDays: 26, presentDays: 20, paidLeaves: 3, unpaidLeaves: 3, overtimeHours: 0,  earnedSalary: 28307.69, overtimePay: 0,        unpaidDeduction: 3692.31, netSalary: 24615.38, status: "Done" },
  { id: "pay-u6-2026-01",  userId: "u6",  month: "2026-01", monthlySalary: 36000, totalWorkingDays: 26, presentDays: 24, paidLeaves: 1, unpaidLeaves: 1, overtimeHours: 3,  earnedSalary: 34615.38, overtimePay: 778.85,   unpaidDeduction: 1384.62, netSalary: 34009.61, status: "Done" },
  { id: "pay-u13-2026-01", userId: "u13", month: "2026-01", monthlySalary: 32000, totalWorkingDays: 26, presentDays: 22, paidLeaves: 2, unpaidLeaves: 2, overtimeHours: 0,  earnedSalary: 29538.46, overtimePay: 0,        unpaidDeduction: 2461.54, netSalary: 27076.92, status: "Done" },
  { id: "pay-u14-2026-01", userId: "u14", month: "2026-01", monthlySalary: 28000, totalWorkingDays: 26, presentDays: 16, paidLeaves: 2, unpaidLeaves: 8, overtimeHours: 0,  earnedSalary: 19384.62, overtimePay: 0,        unpaidDeduction: 8615.38, netSalary: 10769.24, status: "Done" },

  // ── February 2026 ──
  { id: "pay-u3-2026-02",  userId: "u3",  month: "2026-02", monthlySalary: 62000, totalWorkingDays: 20, presentDays: 19, paidLeaves: 1, unpaidLeaves: 0, overtimeHours: 5,  earnedSalary: 62000.00, overtimePay: 2906.25,  unpaidDeduction: 0,       netSalary: 64906.25, status: "Done" },
  { id: "pay-u7-2026-02",  userId: "u7",  month: "2026-02", monthlySalary: 58000, totalWorkingDays: 20, presentDays: 17, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 3,  earnedSalary: 55100.00, overtimePay: 1631.25,  unpaidDeduction: 2900.00, netSalary: 53831.25, status: "Done" },
  { id: "pay-u8-2026-02",  userId: "u8",  month: "2026-02", monthlySalary: 60000, totalWorkingDays: 20, presentDays: 20, paidLeaves: 0, unpaidLeaves: 0, overtimeHours: 6,  earnedSalary: 60000.00, overtimePay: 3375.00,  unpaidDeduction: 0,       netSalary: 63375.00, status: "Done" },
  { id: "pay-u4-2026-02",  userId: "u4",  month: "2026-02", monthlySalary: 52000, totalWorkingDays: 20, presentDays: 18, paidLeaves: 2, unpaidLeaves: 0, overtimeHours: 2,  earnedSalary: 52000.00, overtimePay: 975.00,   unpaidDeduction: 0,       netSalary: 52975.00, status: "Done" },
  { id: "pay-u9-2026-02",  userId: "u9",  month: "2026-02", monthlySalary: 44000, totalWorkingDays: 20, presentDays: 14, paidLeaves: 2, unpaidLeaves: 4, overtimeHours: 0,  earnedSalary: 35200.00, overtimePay: 0,        unpaidDeduction: 8800.00, netSalary: 26400.00, status: "Pending" },
  { id: "pay-u10-2026-02", userId: "u10", month: "2026-02", monthlySalary: 50000, totalWorkingDays: 20, presentDays: 17, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 1,  earnedSalary: 47500.00, overtimePay: 468.75,   unpaidDeduction: 2500.00, netSalary: 45468.75, status: "Done" },
  { id: "pay-u5-2026-02",  userId: "u5",  month: "2026-02", monthlySalary: 38000, totalWorkingDays: 20, presentDays: 18, paidLeaves: 1, unpaidLeaves: 1, overtimeHours: 0,  earnedSalary: 36100.00, overtimePay: 0,        unpaidDeduction: 1900.00, netSalary: 34200.00, status: "Done" },
  { id: "pay-u11-2026-02", userId: "u11", month: "2026-02", monthlySalary: 40000, totalWorkingDays: 20, presentDays: 19, paidLeaves: 1, unpaidLeaves: 0, overtimeHours: 4,  earnedSalary: 40000.00, overtimePay: 1500.00,  unpaidDeduction: 0,       netSalary: 41500.00, status: "Done" },
  { id: "pay-u12-2026-02", userId: "u12", month: "2026-02", monthlySalary: 32000, totalWorkingDays: 20, presentDays: 16, paidLeaves: 2, unpaidLeaves: 2, overtimeHours: 0,  earnedSalary: 28800.00, overtimePay: 0,        unpaidDeduction: 3200.00, netSalary: 25600.00, status: "Done" },
  { id: "pay-u6-2026-02",  userId: "u6",  month: "2026-02", monthlySalary: 36000, totalWorkingDays: 20, presentDays: 18, paidLeaves: 1, unpaidLeaves: 1, overtimeHours: 2,  earnedSalary: 34200.00, overtimePay: 675.00,   unpaidDeduction: 1800.00, netSalary: 33075.00, status: "Done" },
  { id: "pay-u13-2026-02", userId: "u13", month: "2026-02", monthlySalary: 32000, totalWorkingDays: 20, presentDays: 17, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 0,  earnedSalary: 30400.00, overtimePay: 0,        unpaidDeduction: 1600.00, netSalary: 28800.00, status: "Done" },
  { id: "pay-u14-2026-02", userId: "u14", month: "2026-02", monthlySalary: 28000, totalWorkingDays: 20, presentDays: 12, paidLeaves: 2, unpaidLeaves: 6, overtimeHours: 0,  earnedSalary: 19600.00, overtimePay: 0,        unpaidDeduction: 8400.00, netSalary: 11200.00, status: "Pending" },

  // ── March 2026 (all Pending) ──
  { id: "pay-u3-2026-03",  userId: "u3",  month: "2026-03", monthlySalary: 62000, totalWorkingDays: 26, presentDays: 22, paidLeaves: 2, unpaidLeaves: 2, overtimeHours: 4,  earnedSalary: 57230.77, overtimePay: 1788.46,  unpaidDeduction: 4769.23, netSalary: 54250.00, status: "Pending" },
  { id: "pay-u7-2026-03",  userId: "u7",  month: "2026-03", monthlySalary: 58000, totalWorkingDays: 26, presentDays: 20, paidLeaves: 3, unpaidLeaves: 3, overtimeHours: 2,  earnedSalary: 51307.69, overtimePay: 836.54,   unpaidDeduction: 6692.31, netSalary: 45451.92, status: "Pending" },
  { id: "pay-u8-2026-03",  userId: "u8",  month: "2026-03", monthlySalary: 60000, totalWorkingDays: 26, presentDays: 23, paidLeaves: 2, unpaidLeaves: 1, overtimeHours: 5,  earnedSalary: 57692.31, overtimePay: 2163.46,  unpaidDeduction: 2307.69, netSalary: 57548.08, status: "Pending" },
  { id: "pay-u4-2026-03",  userId: "u4",  month: "2026-03", monthlySalary: 52000, totalWorkingDays: 26, presentDays: 22, paidLeaves: 2, unpaidLeaves: 2, overtimeHours: 3,  earnedSalary: 48000.00, overtimePay: 1125.00,  unpaidDeduction: 4000.00, netSalary: 45125.00, status: "Pending" },
  { id: "pay-u9-2026-03",  userId: "u9",  month: "2026-03", monthlySalary: 44000, totalWorkingDays: 26, presentDays: 16, paidLeaves: 3, unpaidLeaves: 7, overtimeHours: 0,  earnedSalary: 32153.85, overtimePay: 0,        unpaidDeduction: 11846.15,netSalary: 20307.70, status: "Pending" },
  { id: "pay-u10-2026-03", userId: "u10", month: "2026-03", monthlySalary: 50000, totalWorkingDays: 26, presentDays: 20, paidLeaves: 3, unpaidLeaves: 3, overtimeHours: 1,  earnedSalary: 44230.77, overtimePay: 360.58,   unpaidDeduction: 5769.23, netSalary: 38822.12, status: "Pending" },
  { id: "pay-u5-2026-03",  userId: "u5",  month: "2026-03", monthlySalary: 38000, totalWorkingDays: 26, presentDays: 21, paidLeaves: 2, unpaidLeaves: 3, overtimeHours: 0,  earnedSalary: 33615.38, overtimePay: 0,        unpaidDeduction: 4384.62, netSalary: 29230.76, status: "Pending" },
  { id: "pay-u11-2026-03", userId: "u11", month: "2026-03", monthlySalary: 40000, totalWorkingDays: 26, presentDays: 22, paidLeaves: 2, unpaidLeaves: 2, overtimeHours: 3,  earnedSalary: 36923.08, overtimePay: 865.38,   unpaidDeduction: 3076.92, netSalary: 34711.54, status: "Pending" },
  { id: "pay-u12-2026-03", userId: "u12", month: "2026-03", monthlySalary: 32000, totalWorkingDays: 26, presentDays: 18, paidLeaves: 3, unpaidLeaves: 5, overtimeHours: 0,  earnedSalary: 25846.15, overtimePay: 0,        unpaidDeduction: 6153.85, netSalary: 19692.30, status: "Pending" },
  { id: "pay-u6-2026-03",  userId: "u6",  month: "2026-03", monthlySalary: 36000, totalWorkingDays: 26, presentDays: 21, paidLeaves: 2, unpaidLeaves: 3, overtimeHours: 2,  earnedSalary: 31846.15, overtimePay: 519.23,   unpaidDeduction: 4153.85, netSalary: 28211.53, status: "Pending" },
  { id: "pay-u13-2026-03", userId: "u13", month: "2026-03", monthlySalary: 32000, totalWorkingDays: 26, presentDays: 20, paidLeaves: 2, unpaidLeaves: 4, overtimeHours: 0,  earnedSalary: 27076.92, overtimePay: 0,        unpaidDeduction: 4923.08, netSalary: 22153.84, status: "Pending" },
  { id: "pay-u14-2026-03", userId: "u14", month: "2026-03", monthlySalary: 28000, totalWorkingDays: 26, presentDays: 14, paidLeaves: 2, unpaidLeaves: 10, overtimeHours: 0, earnedSalary: 17230.77, overtimePay: 0,        unpaidDeduction: 10769.23,netSalary: 6461.54,  status: "Pending" },
];
