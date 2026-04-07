import { saveAttachments } from "./db";

const SEED_FLAG = "ulb_demo_seeded_v1";
const VERSION_HISTORY_KEY = "ulb_version_history";
const TARGET_FILE = "RMC/2024/WRK/0011";

// ── Fake document blobs ────────────────────────────────────────────
const makePdfBlob = (content) =>
  new Blob([content], { type: "application/pdf" });

const makeXlsxBlob = (content) =>
  new Blob([content], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

const DEMO_DOCUMENTS = [
  {
    name: "work_order_RMC_0011.pdf",
    mimeType: "application/pdf",
    fileType: "pdf",
    blob: makePdfBlob(
      `WORK ORDER — RMC/2024/WRK/0011\n` +
      `Road Repair Contract — Main Bazar to Station Road\n` +
      `Raipur Municipal Corporation\n\n` +
      `Scope: Repair and resurfacing of 3.2 km stretch from Main Bazar Chowk\n` +
      `to Railway Station Road, Raipur.\n\n` +
      `Contract Value: ₹12,00,000\n` +
      `Contractor: M/s Sharma Infrastructure Pvt. Ltd.\n` +
      `Start Date: 15/01/2026\n` +
      `Completion Date: 30/04/2026\n\n` +
      `Authorised by: Deputy Commissioner, RMC\n` +
      `Date of Issue: 10/01/2026`
    ),
  },
  {
    name: "contractor_agreement_signed.pdf",
    mimeType: "application/pdf",
    fileType: "pdf",
    blob: makePdfBlob(
      `CONTRACTOR AGREEMENT\n` +
      `File No: RMC/2024/WRK/0011\n\n` +
      `This agreement is entered into between Raipur Municipal Corporation\n` +
      `and M/s Sharma Infrastructure Pvt. Ltd. for the execution of road\n` +
      `repair and resurfacing works on the Main Bazar to Station Road stretch.\n\n` +
      `Terms & Conditions:\n` +
      `1. The contractor shall complete the work within the stipulated timeline.\n` +
      `2. All materials shall conform to IS specifications.\n` +
      `3. Quality tests shall be conducted at every 500 m interval.\n` +
      `4. Geotagged photographs shall be submitted at each progress stage.\n` +
      `5. Defect liability period: 24 months from date of completion.\n\n` +
      `Signed by Contractor: _________________  Date: 12/01/2026\n` +
      `Signed by ULB Officer: ________________  Date: 13/01/2026`
    ),
  },
  {
    name: "measurement_book_MB_0089.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileType: "xlsx",
    blob: makeXlsxBlob(
      `Measurement Book — MB No. RMC/MB/2024/0089\n` +
      `File: RMC/2024/WRK/0011\n\n` +
      `Item\tDescription\t\t\t\tUnit\tQty (MB)\tQty (Bill)\tVariance\n` +
      `1\tExcavation of existing surface\t\t\tSqm\t3200\t\t3200\t\t0%\n` +
      `2\tProviding WBM Grade-III 75mm thick\t\tSqm\t3200\t\t3200\t\t0%\n` +
      `3\tProviding DBM 50mm thick\t\t\tSqm\t3200\t\t3150\t\t1.56%\n` +
      `4\tProviding BC 25mm (wearing course)\t\tSqm\t3200\t\t3200\t\t0%\n` +
      `5\tEdge stone fixing\t\t\t\tRmt\t6400\t\t6380\t\t0.31%\n\n` +
      `Measured by: Rajan Tiwari, Non-ULB Field Exec\n` +
      `Date: 28/02/2026\n` +
      `Checked by: Vikram Singh, Team Lead\n` +
      `Date: 01/03/2026`
    ),
  },
];

// ── Version history entries ────────────────────────────────────────
const DEMO_VERSION_HISTORY = [
  {
    changedAt: "03/03/2026, 11:15:00 AM",
    changedBy: "Vikram Singh",
    userRole: "Team Lead",
    reason: "Updated risk flag after reviewing contractor's past compliance record.",
    changes: [
      {
        field: "riskFlag",
        fieldLabel: "Risk Flag",
        oldValue: "Low",
        newValue: "Medium",
      },
    ],
  },
  {
    changedAt: "06/03/2026, 03:40:00 PM",
    changedBy: "Muskan Agarwal",
    userRole: "Chartered Accountant",
    reason: "Clarified scope to include side drain repair as discussed in site visit.",
    changes: [
      {
        field: "workDescription",
        fieldLabel: "Work Description",
        oldValue: "Repair and resurfacing of 3.2 km stretch from Main Bazar to Station Road",
        newValue: "Repair and resurfacing of 3.2 km stretch from Main Bazar to Station Road, including side drain restoration at chainage 1.2–1.8 km",
      },
    ],
  },
  {
    changedAt: "09/03/2026, 10:05:00 AM",
    changedBy: "Vikram Singh",
    userRole: "Team Lead",
    reason: "Amount revised after contractor submitted revised BOQ with approved variation order.",
    changes: [
      {
        field: "amount",
        fieldLabel: "Amount",
        oldValue: "1150000",
        newValue: "1200000",
      },
      {
        field: "riskFlag",
        fieldLabel: "Risk Flag",
        oldValue: "Medium",
        newValue: "Medium",
      },
    ],
  },
];

// ── Seed function ──────────────────────────────────────────────────
export const seedDemoData = async () => {
  if (localStorage.getItem(SEED_FLAG)) return;

  try {
    // Seed documents into IndexedDB
    await saveAttachments(TARGET_FILE, DEMO_DOCUMENTS.map((d) => ({
      ...d,
      size: d.blob.size,
    })));

    // Seed version history into localStorage
    const existing = JSON.parse(localStorage.getItem(VERSION_HISTORY_KEY) || "{}");
    existing[TARGET_FILE] = DEMO_VERSION_HISTORY;
    localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(existing));

    localStorage.setItem(SEED_FLAG, "1");
  } catch (e) {
    console.warn("Demo seed failed:", e);
  }
};
