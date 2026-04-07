import { useState } from "react";

// ── Style constants ────────────────────────────────────────────────────────
const inp =
  "w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 bg-white " +
  "focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors duration-150";
const lbl = "block text-xs font-medium text-gray-500 mb-1";
const tdinp =
  "bg-transparent border border-transparent rounded w-full px-1.5 py-1 text-sm text-gray-800 " +
  "focus:border-gray-300 focus:bg-white outline-none transition-colors";

// ── Helper components ──────────────────────────────────────────────────────
function F({ label, style, children }) {
  return (
    <div style={style}>
      <label className={lbl}>{label}</label>
      {children}
    </div>
  );
}

function RedFlag({ children }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md px-3.5 py-2.5 text-xs text-red-600 font-medium flex items-center gap-2">
      <span>⚑</span> {children}
    </div>
  );
}

function GreenOk({ children }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md px-3.5 py-2 text-xs text-green-700 font-medium flex items-center gap-2">
      <span>✓</span> {children}
    </div>
  );
}

function Cond({ show, red, children }) {
  if (!show) return null;
  return (
    <div
      className={`border-l-2 ${red ? "border-red-400" : "border-blue-400"} pl-4 flex flex-col gap-3 mt-0.5`}
      style={{ animation: "mcFadeSlide .18s ease" }}
    >
      {children}
    </div>
  );
}

function RG({ name, val, set }) {
  return (
    <div className="flex gap-4 items-center pt-0.5">
      {["yes", "no"].map((v) => (
        <label key={v} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="radio"
            name={name}
            value={v}
            checked={val === v}
            onChange={() => set(v)}
            className="accent-[#1a2744]"
          />
          {v === "yes" ? "Yes" : "No"}
        </label>
      ))}
    </div>
  );
}

function Card({ title, extra, body, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-3.5 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
        {extra}
      </div>
      <div className={body !== undefined ? body : "p-5 flex flex-col gap-3.5"}>{children}</div>
    </div>
  );
}

function Sec({ n, title, first, children }) {
  return (
    <>
      <div className={`flex items-center gap-2.5 ${first ? "mt-0" : "mt-8"} mb-3.5`}>
        <div className="w-6 h-6 bg-[#1a2744] text-white rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
          {n}
        </div>
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      {children}
    </>
  );
}

// ── Inner form (remounts on clear via key) ─────────────────────────────────
function ChecklistForm({ onNegativeResponse, onChecklistRemark, checklistNo, checkerName, date, onCheckerNameChange, onDateChange }) {
  // Conditional visibility
  const [gem, setGem] = useState(null);
  const [mode, setMode] = useState("");
  const [fin, setFin] = useState(null);
  const [tpub, setTpub] = useState(null);
  const [tcomm, setTcomm] = useState(null);
  const [so, setSo] = useState(null);
  const [ext, setExt] = useState(null);
  const [att, setAtt] = useState(null);
  const [epf, setEpf] = useState(null);

  // Fund calc
  const [fa, setFa] = useState("");
  const [fb, setFb] = useState("");

  // Bill deductions
  const [bd, setBd] = useState({ d11: "", d12: "", d13: "", d14: "", d15: "", d16: "", d17: "" });
  const bdf = (k) => (e) => setBd((p) => ({ ...p, [k]: e.target.value }));
  const netAmt = (
    (parseFloat(bd.d11) || 0) -
    ["d12", "d13", "d14", "d15", "d16", "d17"].reduce((s, k) => s + (parseFloat(bd[k]) || 0), 0)
  ).toFixed(2);

  // Bill summary rows
  const [rows, setRows] = useState([
    { id: 1, bn: "", ns: "", ba: "", gp: "", dh: "", da: "" },
    { id: 2, bn: "", ns: "", ba: "", gp: "", dh: "", da: "" },
  ]);
  const upd = (id, f, v) => setRows((p) => p.map((r) => (r.id === id ? { ...r, [f]: v } : r)));
  const netPay = (r) => ((parseFloat(r.gp) || 0) - (parseFloat(r.da) || 0)).toFixed(2);

  // Audit checklist
  const [ar, setAr] = useState(Array(9).fill(""));
  const [arm, setArm] = useState(Array(9).fill(""));
  const [ssiR, setSsiR] = useState("");
  const [ssiM, setSsiM] = useState("");

  // Documents
  const [d1, setD1] = useState(new Set());
  const [d2, setD2] = useState(new Set());
  const tog = (setter, item) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });

  const docs1 = ["Attendance Register", "Cheque Issue Register", "Cash Book", "Work File", "Grant Register (if applicable)"];
  const docs2 = ["Invoice", "Attendance Register", "Labour License — Validity of Work", "EPF and ESIC Challan", "Payment Confirmation Sheet", "Bank Statement"];

  const auditItems = [
    { no: "1.1", txt: "Whether attendance system is proper." },
    { no: "1.2", txt: "Whether comparative statements prepared and approved by appropriate authority." },
    { no: "1.3", txt: "Whether copy of agreements / PO / tender for purchases more than ₹1 lakh was inspected by the Auditor." },
    { no: "1.4", txt: "Whether Earnest Money / Security Deposit is 3% or more of the estimated purchase value." },
    { no: "1.5", txt: "Whether Industries registered as Small-Scale Industrial Units were given priority as per rules." },
    { no: "1.6", txt: "Whether important plant & machinery purchased from supplier registered with DGA&D." },
    { no: "1.7", txt: "Whether payment is likely to be made within 20 days of invoice / goods received." },
    { no: "1.8", txt: "Whether in case of late payment without reason, interest at prevailing bank rate to be paid along with payment." },
    { no: "1.9", txt: "Prepare calculation in prescribed Excel sheet.", opts: ["Done", "Pending", "N/A"] },
  ];
  const defOpts = ["Yes", "No", "N/A"];
  const thOrange = { background: "#fde8cc", color: "#1e2235" };

  return (
    <div>
      {/* ── Checklist header strip ── */}
      <div className="bg-white border border-gray-200 rounded-lg mb-3.5 px-5 py-3 flex items-end gap-6">
        <div className="shrink-0 pb-0.5">
          <span className="block text-xs font-medium text-gray-400 mb-1">Checklist No.</span>
          <span className="text-sm font-semibold text-[#1a2744]">{checklistNo}</span>
        </div>
        <div className="h-6 w-px bg-gray-200 shrink-0" />
        <F label="Name of Checker" style={{ width: 220 }}>
          <input
            className={inp}
            type="text"
            placeholder="Enter name"
            value={checkerName ?? ""}
            onChange={(e) => onCheckerNameChange?.(e.target.value)}
          />
        </F>
        <F label="Date" style={{ width: 160 }}>
          <input
            className={inp}
            type="date"
            value={date ?? new Date().toISOString().split("T")[0]}
            onChange={(e) => onDateChange?.(e.target.value)}
          />
        </F>
      </div>

      {/* ── 1. PURCHASE & TENDER ── */}
      <Sec n="1" title="Purchase & Tender" first>
        <Card title="GEM Availability & Mode of Purchase">
          <div className="grid grid-cols-2 gap-3.5">
            <F label="Item Availability in GEM">
              <RG name="gem" val={gem} set={(v) => { setGem(v); onNegativeResponse?.("gem", v === "no"); }} />
            </F>
            <F label="Mode of Purchase">
              <select
                className={inp + " cursor-pointer max-w-[220px]"}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="quotation">By Quotation</option>
                <option value="tender">By Tender</option>
              </select>
            </F>
          </div>
          <Cond show={gem === "yes"}><GreenOk>Item available in GEM — OK</GreenOk></Cond>
          <Cond show={gem === "no"} red>
            <F label="Non-Availability Report">
              <div className="flex gap-4 pt-0.5">
                {["Available", "Not Available"].map((v) => (
                  <label key={v} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
                    <input type="radio" name="nar" className="accent-[#1a2744]" /> {v}
                  </label>
                ))}
              </div>
            </F>
          </Cond>
          <Cond show={mode === "quotation"}>
            <div className="grid grid-cols-2 gap-3.5">
              <F label="Quotation Ref. No."><input className={inp} type="text" /></F>
              <F label="Quotation Date"><input className={inp} type="date" /></F>
            </div>
            <F label="Quotation Details">
              <textarea className={inp + " resize-y min-h-[60px]"} placeholder="Enter details…" />
            </F>
          </Cond>
          <Cond show={mode === "tender"}>
            <div className="grid grid-cols-2 gap-3.5">
              <F label="Tender No."><input className={inp} type="text" /></F>
              <F label="Tender Date"><input className={inp} type="date" /></F>
            </div>
            <F label="Tender Details">
              <textarea className={inp + " resize-y min-h-[60px]"} placeholder="Enter details…" />
            </F>
          </Cond>
        </Card>

        <Card title="Financial Approval">
          <div className="grid grid-cols-2 gap-3.5">
            <F label="Estimated Amount (₹)"><input className={inp} type="number" placeholder="0.00" /></F>
            <F label="Source of Fund"><input className={inp} type="text" /></F>
          </div>
          <F label="Financial Approval Available?">
            <RG name="fin" val={fin} set={(v) => { setFin(v); onNegativeResponse?.("fin", v === "no"); }} />
          </F>
          <Cond show={fin === "yes"}>
            <div className="grid grid-cols-4 gap-3.5">
              <F label="Approval Number"><input className={inp} type="text" /></F>
              <F label="Approval Date"><input className={inp} type="date" /></F>
              <F label="Approved Value (₹)"><input className={inp} type="number" /></F>
              <F label="Name of Approver"><input className={inp} type="text" /></F>
            </div>
            <F label="Authority of Approver" style={{ maxWidth: 320 }}>
              <input className={inp} type="text" />
            </F>
          </Cond>
          <Cond show={fin === "no"} red>
            <RedFlag>Financial approval not available</RedFlag>
          </Cond>
        </Card>

        <Card title="Tender Publishing & Committee Approval">
          <div className="grid grid-cols-2 gap-3.5">
            <F label="Tender Published?"><RG name="tpub" val={tpub} set={(v) => { setTpub(v); onNegativeResponse?.("tpub", v === "no"); }} /></F>
            <F label="Tender Committee Approval?"><RG name="tcomm" val={tcomm} set={(v) => { setTcomm(v); onNegativeResponse?.("tcomm", v === "no"); }} /></F>
          </div>
          <Cond show={tpub === "yes"}>
            <div className="grid grid-cols-2 gap-3.5">
              <F label="Publication Date"><input className={inp} type="date" /></F>
              <F label="Newspaper(s)"><input className={inp} type="text" placeholder="Name of newspaper(s)" /></F>
            </div>
          </Cond>
          <Cond show={tpub === "no"} red><RedFlag>Publishing details not available</RedFlag></Cond>
          <Cond show={tcomm === "yes"}>
            <div className="grid grid-cols-4 gap-3.5">
              <F label="Approval Number"><input className={inp} type="text" /></F>
              <F label="Approval Date"><input className={inp} type="date" /></F>
              <F label="Approved Value (₹)"><input className={inp} type="number" /></F>
              <F label="Name of Approver"><input className={inp} type="text" /></F>
            </div>
            <F label="Authority of Approver" style={{ maxWidth: 320 }}>
              <input className={inp} type="text" />
            </F>
          </Cond>
          <Cond show={tcomm === "no"} red><RedFlag>Tender Committee approval not available</RedFlag></Cond>
        </Card>
      </Sec>

      {/* ── 3. SUPPLY ORDER ── */}
      <Sec n="2" title="Supply Order">
        <Card title="Supply Order Details">
          <F label="Supply Order Available?"><RG name="so" val={so} set={(v) => { setSo(v); onNegativeResponse?.("so", v === "no"); }} /></F>
          <Cond show={so === "no"} red><RedFlag>Supply order not available</RedFlag></Cond>
          <Cond show={so === "yes"}>
            <div className="grid grid-cols-4 gap-3.5">
              <F label="Supply Order No."><input className={inp} type="text" /></F>
              <F label="Supply Order Date"><input className={inp} type="date" /></F>
              <F label="Date of Supply as per PO"><input className={inp} type="date" /></F>
              <F label="Actual Date of Supply"><input className={inp} type="date" /></F>
            </div>
            <F label="Extended Date Required?"><RG name="ext" val={ext} set={setExt} /></F>
            <Cond show={ext === "yes"}>
              <div className="grid grid-cols-2 gap-3.5">
                <F label="Extended Date"><input className={inp} type="date" /></F>
                <F label="Remark for Extension"><input className={inp} type="text" placeholder="Reason / remark" /></F>
              </div>
            </Cond>
          </Cond>
        </Card>
      </Sec>

      {/* ── 4. ATTENDANCE & EPF / ESIC ── */}
      <Sec n="3" title="Attendance & EPF / ESIC">
        <Card title="Attendance & Compliance">
          <div className="grid grid-cols-2 gap-3.5">
            <F label="Attendance Verified?"><RG name="att" val={att} set={(v) => { setAtt(v); onNegativeResponse?.("att", v === "no"); }} /></F>
            <F label="EPF & ESIC Paid?"><RG name="epf" val={epf} set={(v) => { setEpf(v); onNegativeResponse?.("epf", v === "no"); }} /></F>
          </div>
          <Cond show={att === "yes"}><GreenOk>Attendance verified — OK</GreenOk></Cond>
          <Cond show={att === "no"} red><RedFlag>Attendance not available</RedFlag></Cond>
          <Cond show={epf === "yes"}><GreenOk>EPF & ESIC Challan available — OK</GreenOk></Cond>
          <Cond show={epf === "no"} red><RedFlag>EPF / ESIC Challan not available</RedFlag></Cond>
        </Card>
      </Sec>

      {/* ── 5. BILL DETAILS ── */}
      <Sec n="4" title="Bill Details">
        <Card title="Bill Information">
          <div className="grid grid-cols-3 gap-3.5">
            <F label="Bill Type">
              <select className={inp + " cursor-pointer"}>
                <option value="">— Select —</option>
                <option>RA Bill</option>
                <option>Final Bill</option>
              </select>
            </F>
            <F label="Bill Number"><input className={inp} type="text" placeholder="Enter bill number" /></F>
            <F label="Bill Amount (₹)"><input className={inp} type="number" placeholder="0.00" /></F>
          </div>
        </Card>

        <Card title="Availability of Remaining Fund">
          <div className="grid grid-cols-3 gap-3.5">
            <F label="Amount Sanctioned (a) ₹">
              <input className={inp} type="number" placeholder="0.00" value={fa} onChange={(e) => setFa(e.target.value)} />
            </F>
            <F label="Payment Till Date (b) ₹">
              <input className={inp} type="number" placeholder="0.00" value={fb} onChange={(e) => setFb(e.target.value)} />
            </F>
            <F label="Remaining Balance (a−b) ₹">
              <input
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-semibold text-green-600 bg-gray-50 outline-none"
                type="number"
                readOnly
                placeholder="Auto"
                value={fa !== "" || fb !== "" ? ((parseFloat(fa) || 0) - (parseFloat(fb) || 0)).toFixed(2) : ""}
              />
            </F>
          </div>
        </Card>

        {/* Bill Details deduction table */}
        <Card title="Bill Details" body="">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-[70px] px-3.5 py-2.5 text-left text-xs font-semibold border-r border-b border-gray-200" style={thOrange}>S.No</th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold border-r border-b border-gray-200" style={thOrange}>Head</th>
                  <th className="w-[110px] px-3.5 py-2.5 text-left text-xs font-semibold border-r border-b border-gray-200" style={thOrange}>Rate</th>
                  <th className="w-[130px] px-3.5 py-2.5 text-left text-xs font-semibold border-r border-b border-gray-200" style={thOrange}>Amount</th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold border-b border-gray-200" style={thOrange}>Remark</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { no: "1.1", head: "Gross Amount as approved by Auditor / Accounts Officer", key: "d11" },
                  { no: "1.2", head: "Security Deposit", key: "d12" },
                  { no: "1.3", head: "Income Tax", key: "d13" },
                  { no: "1.4", head: "Penalty / LD", key: "d14" },
                  { no: "1.5", head: "Advance Adjusted", key: "d15" },
                  { no: "1.6", head: "Under / Over Payment in Last Bill", key: "d16" },
                  { no: "1.7", head: "Difference in Amount as per agreement and total invoice till date", key: "d17" },
                ].map((row) => (
                  <tr key={row.no} className="border-b border-gray-100">
                    <td className="px-3.5 py-1.5 text-center text-xs text-gray-400 border-r border-gray-200">{row.no}</td>
                    <td className="px-3.5 py-1.5 text-sm text-gray-800 border-r border-gray-200">{row.head}</td>
                    <td className="px-1.5 py-1 border-r border-gray-200">
                      <input className={tdinp} type="text" placeholder="—" />
                    </td>
                    <td className="px-1.5 py-1 border-r border-gray-200">
                      <input className={tdinp} type="number" placeholder="0.00" value={bd[row.key]} onChange={bdf(row.key)} />
                    </td>
                    <td className="px-1.5 py-1"><input className={tdinp} type="text" /></td>
                  </tr>
                ))}
                <tr className="bg-green-50">
                  <td className="px-3.5 py-2 border-r border-gray-200" />
                  <td className="px-3.5 py-2 text-sm font-bold text-[#1e2235] border-r border-gray-200">Net Amount eligible for payment</td>
                  <td className="px-1.5 py-1 border-r border-gray-200" />
                  <td className="px-1.5 py-1 border-r border-gray-200">
                    <input
                      className="bg-transparent border-none outline-none text-sm font-bold text-green-700 w-full"
                      type="number"
                      readOnly
                      value={bd.d11 !== "" ? netAmt : ""}
                    />
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bill Summary Table */}
        <Card
          title="Bill Summary Table"
          extra={
            <button
              onClick={() =>
                setRows((p) => [...p, { id: Date.now(), bn: "", ns: "", ba: "", gp: "", dh: "", da: "" }])
              }
              className="bg-blue-50 text-blue-500 border border-blue-200 rounded-md px-3 py-1 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              + Add Row
            </button>
          }
          body=""
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th rowSpan={2} className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 border-r border-gray-200 w-[110px] align-bottom">Bill Number</th>
                  <th rowSpan={2} className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 border-r border-gray-200 w-[110px] align-bottom">Note Sheet No.</th>
                  <th rowSpan={2} className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 border-r border-gray-200 w-[130px] align-bottom">Bill Amount</th>
                  <th rowSpan={2} className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 border-r border-gray-200 w-[130px] align-bottom">Gross Payment</th>
                  <th colSpan={2} className="px-3.5 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 border-r border-gray-200">Deduction</th>
                  <th rowSpan={2} className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 w-[120px] align-bottom">Net Payment</th>
                  <th rowSpan={2} className="w-10 bg-gray-50 border-b border-gray-200" />
                </tr>
                <tr>
                  <th className="px-3.5 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 border-r border-gray-200 w-[130px]">Head</th>
                  <th className="px-3.5 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 border-r border-gray-200 w-[110px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="px-1.5 py-1 border-r border-gray-200"><input className={tdinp} type="text" placeholder="—" value={r.bn} onChange={(e) => upd(r.id, "bn", e.target.value)} /></td>
                    <td className="px-1.5 py-1 border-r border-gray-200"><input className={tdinp} type="text" placeholder="—" value={r.ns} onChange={(e) => upd(r.id, "ns", e.target.value)} /></td>
                    <td className="px-1.5 py-1 border-r border-gray-200"><input className={tdinp} type="number" placeholder="0.00" value={r.ba} onChange={(e) => upd(r.id, "ba", e.target.value)} /></td>
                    <td className="px-1.5 py-1 border-r border-gray-200"><input className={tdinp} type="number" placeholder="0.00" value={r.gp} onChange={(e) => upd(r.id, "gp", e.target.value)} /></td>
                    <td className="px-1.5 py-1 border-r border-gray-200"><input className={tdinp} type="text" placeholder="Head" value={r.dh} onChange={(e) => upd(r.id, "dh", e.target.value)} /></td>
                    <td className="px-1.5 py-1 border-r border-gray-200"><input className={tdinp} type="number" placeholder="0.00" value={r.da} onChange={(e) => upd(r.id, "da", e.target.value)} /></td>
                    <td className="px-1.5 py-1">
                      <input
                        className="bg-transparent border-none outline-none text-sm font-semibold text-green-700 w-full"
                        type="number"
                        readOnly
                        placeholder="0.00"
                        value={r.gp !== "" || r.da !== "" ? netPay(r) : ""}
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => { if (rows.length > 1) setRows((p) => p.filter((x) => x.id !== r.id)); }}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded px-1 py-0.5 text-base leading-none transition-colors"
                        title="Remove row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Sec>

      {/* ── 6. AUDIT CHECKLIST ── */}
      <Sec n="5" title="Audit Checklist">
        <Card title="Audit Checklist" body="">
          <div>
            <div className="grid grid-cols-[1fr_140px_1fr] gap-3.5 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Particulars</span>
              <span>Response</span>
              <span>Remark</span>
            </div>
            {auditItems.map((item, i) => (
              <div key={item.no}>
                <div className="grid grid-cols-[1fr_140px_1fr] gap-3.5 items-center px-5 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium mb-0.5">{item.no}</div>
                    <div className="text-sm text-gray-800 leading-snug">{item.txt}</div>
                  </div>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-md text-sm px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-400 cursor-pointer"
                    value={ar[i]}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAr((p) => p.map((x, j) => (j === i ? v : x)));
                      if (i === 4 && v !== "Yes") { setSsiR(""); setSsiM(""); onNegativeResponse?.("ssi", false); }
                      const isNeg = i === 8 ? v === "Pending" : v === "No";
                      onNegativeResponse?.(`ar_${i}`, isNeg, arm[i]);
                    }}
                  >
                    <option value="">—</option>
                    {(item.opts || defOpts).map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-md text-sm px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-400 outline-none"
                    type="text"
                    placeholder="Remark"
                    value={arm[i]}
                    onChange={(e) => {
                      const v = e.target.value;
                      setArm((p) => p.map((x, j) => (j === i ? v : x)));
                      const isNeg = i === 8 ? ar[i] === "Pending" : ar[i] === "No";
                      if (isNeg) onChecklistRemark?.(`ar_${i}`, v);
                    }}
                  />
                </div>
                {/* 1.5.1 sub-row */}
                {i === 4 && ar[4] === "Yes" && (
                  <div
                    className="grid grid-cols-[1fr_140px_1fr] gap-3.5 items-center px-5 py-2.5 border-b border-gray-100 bg-blue-50"
                    style={{ animation: "mcFadeSlide .18s ease" }}
                  >
                    <div className="pl-5">
                      <div className="text-[11px] text-gray-400 font-medium mb-0.5">1.5.1</div>
                      <div className="text-sm text-gray-700 leading-snug">If yes, whether they are given exemption from depositing EMD.</div>
                    </div>
                    <select
                      className="w-full bg-white border border-gray-200 rounded-md text-sm px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-400 cursor-pointer"
                      value={ssiR}
                      onChange={(e) => { setSsiR(e.target.value); onNegativeResponse?.("ssi", e.target.value === "No", ssiM); }}
                    >
                      <option value="">—</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-md text-sm px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-400 outline-none"
                      type="text"
                      placeholder="Remark"
                      value={ssiM}
                      onChange={(e) => { setSsiM(e.target.value); if (ssiR === "No") onChecklistRemark?.("ssi", e.target.value); }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </Sec>

      {/* ── 7. DOCUMENTS ── */}
      <Sec n="6" title="Documents">
        <Card title="Books of Accounts to be Updated">
          <div className="grid grid-cols-2 gap-2">
            {docs1.map((item) => {
              const checked = d1.has(item);
              return (
                <div
                  key={item}
                  onClick={() => tog(setD1, item)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md border text-sm cursor-pointer transition-colors ${
                    checked
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => tog(setD1, item)}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-[#1a2744] w-3.5 h-3.5 cursor-pointer shrink-0"
                  />
                  {item}
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Documents to be Collected from Supplier">
          <div className="grid grid-cols-2 gap-2">
            {docs2.map((item) => {
              const checked = d2.has(item);
              return (
                <div
                  key={item}
                  onClick={() => tog(setD2, item)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md border text-sm cursor-pointer transition-colors ${
                    checked
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => tog(setD2, item)}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-[#1a2744] w-3.5 h-3.5 cursor-pointer shrink-0"
                  />
                  {item}
                </div>
              );
            })}
          </div>
        </Card>
      </Sec>
    </div>
  );
}

// ── Exported component ─────────────────────────────────────────────────────
export default function ManpowerChecklistForm({ onNegativeResponse, onChecklistRemark, checklistNo = "CHK-001", checkerName, date, onCheckerNameChange, onDateChange, onSave }) {
  const [formKey, setFormKey] = useState(0);

  const handleClear = () => {
    if (window.confirm("Clear all form data?")) setFormKey((k) => k + 1);
  };

  const ActionButtons = () => (
    <div className="flex gap-2.5">
      <button
        onClick={handleClear}
        className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:border-gray-400 transition-colors"
      >
        Clear Form
      </button>
      <button
        onClick={() => window.print()}
        className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:border-gray-400 transition-colors flex items-center gap-1.5"
      >
        ⬇ Export / Print
      </button>
      {onSave && (
        <button
          onClick={onSave}
          className="bg-[#1a2744] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#2f3655] transition-colors"
        >
          Save Checklist
        </button>
      )}
    </div>
  );

  return (
    <div>
      <style>{`@keyframes mcFadeSlide { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Actions */}
      <div className="flex justify-end mb-5">
        <ActionButtons />
      </div>

      <ChecklistForm
        key={formKey}
        onNegativeResponse={onNegativeResponse}
        onChecklistRemark={onChecklistRemark}
        checklistNo={checklistNo}
        checkerName={checkerName}
        date={date}
        onCheckerNameChange={onCheckerNameChange}
        onDateChange={onDateChange}
      />

      {/* Bottom actions */}
      <div className="flex justify-end mt-7 pb-4">
        <ActionButtons />
      </div>
    </div>
  );
}
