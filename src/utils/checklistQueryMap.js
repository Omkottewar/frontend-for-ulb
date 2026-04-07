/**
 * Maps checklist question keys → auto-generated query { title, description }.
 *
 * Key conventions:
 *  - Manpower form simple Yes/No fields: "gem", "fin", "tpub", "tcomm", "so", "att", "epf"
 *  - Manpower audit checklist rows (Section 6): "ar_0" … "ar_8"  (ar_8 triggers on "Pending")
 *  - SSI sub-item 1.5.1: "ssi"
 *  - Generic checklist (FileDetailPage): "checklist_1" … "checklist_9"
 */
export const CHECKLIST_QUERY_MAP = {
  // ── Manpower form — Section 2: Purchase & Tender ──────────────────────────
  gem: {
    title: "Item not available in GEM",
    description:
      "The item required for procurement is not listed or available on the Government e-Marketplace (GEM). A non-availability report and justification for the alternate procurement method must be submitted and verified.",
  },
  fin: {
    title: "Financial approval not available",
    description:
      "No valid financial approval was found for this procurement. Financial sanction from the appropriate authority is mandatory before initiating any purchase or tender process.",
  },
  tpub: {
    title: "Tender not published",
    description:
      "The tender for this procurement was not published in the required newspapers or official portals. Publication is mandatory for transparency and to invite competitive bids as per procurement rules.",
  },
  tcomm: {
    title: "Tender committee approval not obtained",
    description:
      "Approval from the Tender Committee was not obtained before finalising the tender. This committee approval is required to validate the technical and financial evaluation of bids.",
  },

  // ── Manpower form — Section 3: Supply Order ───────────────────────────────
  so: {
    title: "Supply order not available",
    description:
      "The supply order document was not found or not provided during the audit. A valid supply order is required for verification of procurement compliance and supplier obligations.",
  },

  // ── Manpower form — Section 4: Attendance & EPF/ESIC ─────────────────────
  att: {
    title: "Attendance not verified",
    description:
      "Attendance records for the workers or staff covered under this file could not be verified. Attendance registers must be physically checked and signed off by the authorised supervisor.",
  },
  epf: {
    title: "EPF & ESIC not paid",
    description:
      "EPF and/or ESIC challan payments were not made or the challans were not available for verification. Timely payment of statutory contributions is mandatory for all eligible workers.",
  },

  // ── Manpower form — Section 6: Audit Checklist (ar_0 … ar_8) ─────────────
  ar_0: {
    title: "Attendance system not proper",
    description:
      "The attendance system in place does not meet the required standards. Proper attendance tracking (register, biometric, or equivalent) must be maintained as per applicable rules.",
  },
  ar_1: {
    title: "Comparative statements not prepared/approved",
    description:
      "Comparative statements for procurement were either not prepared or not approved by the appropriate authority. These statements are required to justify the selection of the vendor/supplier.",
  },
  ar_2: {
    title: "Agreements/PO/tender copies not inspected",
    description:
      "Copies of agreements, purchase orders, or tender documents for purchases exceeding ₹1 lakh were not inspected by the Auditor. These documents must be made available for audit verification.",
  },
  ar_3: {
    title: "Earnest Money/Security Deposit below 3%",
    description:
      "The Earnest Money Deposit or Security Deposit collected is less than 3% of the estimated purchase value. The minimum EMD/SD requirement must be enforced to ensure vendor commitment and contract performance.",
  },
  ar_4: {
    title: "SSI priority not given as per rules",
    description:
      "Priority was not given to industries registered as Small-Scale Industrial Units (SSI) as required under applicable procurement rules. Compliance with SSI preference norms must be demonstrated.",
  },
  ssi: {
    title: "SSI EMD exemption not given",
    description:
      "SSI-registered units that qualified were not given exemption from depositing Earnest Money Deposit (EMD) as per the applicable rules. This exemption is a mandatory benefit for eligible SSI units.",
  },
  ar_5: {
    title: "Plant & machinery supplier not DGA&D registered",
    description:
      "Important plant and machinery was purchased from a supplier not registered with the Directorate General of Acquisition & Disposal (DGA&D). Procurement from DGA&D-registered suppliers is required for such items.",
  },
  ar_6: {
    title: "Payment not made within 20 days of invoice",
    description:
      "Payment to the supplier/contractor was not made within 20 days of receipt of invoice or goods, as required. Delayed payment without valid reason may attract interest liability.",
  },
  ar_7: {
    title: "Interest not paid for delayed payment",
    description:
      "In case of late payment without valid justification, interest at the prevailing bank rate was not paid along with the payment. This is a statutory obligation and must be fulfilled.",
  },
  ar_8: {
    title: "Excel calculation sheet pending",
    description:
      "The calculation in the prescribed Excel sheet has not been completed. This sheet is required as part of the audit closure process and must be finalised before the checklist can be signed off.",
  },

  // ── Generic checklist (FileDetailPage CHECKLIST_ITEMS, id 1–9) ────────────
  checklist_1: {
    title: "Attendance system not proper",
    description:
      "The attendance system in place does not meet the required standards. Proper attendance tracking (register, biometric, or equivalent) must be maintained as per applicable rules.",
  },
  checklist_2: {
    title: "Comparative statements not prepared/approved",
    description:
      "Comparative statements for procurement were either not prepared or not approved by the appropriate authority. These statements are required to justify the selection of the vendor/supplier.",
  },
  checklist_3: {
    title: "Agreements/PO/tender copies not inspected",
    description:
      "Copies of agreements, purchase orders, or tender documents for purchases exceeding ₹1 lakh were not inspected by the Auditor. These documents must be made available for audit verification.",
  },
  checklist_4: {
    title: "Earnest Money/Security Deposit below 3%",
    description:
      "The Earnest Money Deposit or Security Deposit collected is less than 3% of the estimated purchase value. The minimum EMD/SD requirement must be enforced to ensure vendor commitment and contract performance.",
  },
  checklist_5: {
    title: "SSI priority / EMD exemption not given",
    description:
      "Priority was not given to SSI-registered industries as required, and/or the applicable EMD exemption was not granted. Compliance with SSI preference and exemption norms must be demonstrated.",
  },
  checklist_6: {
    title: "Plant & machinery supplier not DGA&D registered",
    description:
      "Important plant and machinery was purchased from a supplier not registered with DGA&D. Procurement from DGA&D-registered suppliers is required for such items.",
  },
  checklist_7: {
    title: "Payment not made within 20 days of invoice",
    description:
      "Payment to the supplier/contractor was not made within 20 days of receipt of invoice or goods. Delayed payment without valid reason may attract interest liability.",
  },
  checklist_8: {
    title: "Interest not paid for delayed payment",
    description:
      "In case of late payment without valid justification, interest at the prevailing bank rate was not paid along with the payment. This is a statutory obligation.",
  },
  checklist_9: {
    title: "Excel calculation sheet pending",
    description:
      "The calculation in the prescribed Excel sheet has not been completed. This sheet is required as part of the audit closure process.",
  },
};
