import { useState } from "react";

const TABS = ["ULB Creation", "Checklist Creation"];

const HOD_OPTIONS = ["Commissioner", "Chief Municipal Officer"];

const CG_DISTRICTS = [
  "Balod",
  "Baloda Bazar",
  "Balrampur",
  "Bastar",
  "Bemetara",
  "Bijapur",
  "Bilaspur",
  "Dantewada",
  "Dhamtari",
  "Durg",
  "Gariaband",
  "Gaurela-Pendra-Marwahi",
  "Janjgir-Champa",
  "Jashpur",
  "Kabirdham",
  "Kanker",
  "Khairagarh-Chhuikhadan-Gandai",
  "Kondagaon",
  "Korba",
  "Koriya",
  "Mahasamund",
  "Manendragarh-Chirmiri-Bharatpur",
  "Mohla-Manpur-Ambagarh Chowki",
  "Mungeli",
  "Narayanpur",
  "Raigarh",
  "Raipur",
  "Rajnandgaon",
  "Sakti",
  "Sarangarh-Bilaigarh",
  "Sukma",
  "Surajpur",
  "Surguja",
];

const inp =
  "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 focus:border-[#1a2744]/40 bg-white";
const lbl = "block text-sm font-medium text-gray-700 mb-1";

const emptyForm = { ulbName: "", hod: "", hodCustom: "", hodName: "", district: "" };

// Convert a saved hod string back into form state (handle custom values)
const hodToFormState = (savedHod) => {
  if (!savedHod) return { hod: "", hodCustom: "" };
  if (HOD_OPTIONS.includes(savedHod)) return { hod: savedHod, hodCustom: "" };
  return { hod: "Other", hodCustom: savedHod };
};

const MasterCreationPage = () => {
  const [activeTab, setActiveTab] = useState("ULB Creation");
  const [ulbList, setUlbList] = useState([]);

  // Form visibility & mode
  const [showForm, setShowForm] = useState(false);
  const [editingSerial, setEditingSerial] = useState(null); // null = adding new

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const isEditing = editingSerial !== null;
  const nextSerial = `ULB-${String(ulbList.length + 1).padStart(3, "0")}`;
  const displaySerial = isEditing ? editingSerial : nextSerial;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const effectiveHod = form.hod === "Other" ? form.hodCustom.trim() : form.hod;

  const validate = () => {
    if (!form.ulbName.trim()) return "Name of ULB is required.";
    if (!form.hod) return "Head of Department is required.";
    if (form.hod === "Other" && !form.hodCustom.trim()) return "Please enter the custom designation.";
    if (!form.hodName.trim()) return "Name of Head of Department is required.";
    if (!form.district) return "District is required.";
    return null;
  };

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setEditingSerial(null);
    setError("");
    setShowForm(true);
  };

  const handleOpenEdit = (row) => {
    const { hod, hodCustom } = hodToFormState(row.hod);
    setForm({ ulbName: row.ulbName, hod, hodCustom, hodName: row.hodName, district: row.district });
    setEditingSerial(row.serial);
    setError("");
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSerial(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSave = () => {
    const err = validate();
    if (err) return setError(err);

    if (isEditing) {
      setUlbList((prev) =>
        prev.map((row) =>
          row.serial === editingSerial
            ? { ...row, ulbName: form.ulbName.trim(), hod: effectiveHod, hodName: form.hodName.trim(), district: form.district }
            : row
        )
      );
    } else {
      setUlbList((prev) => [
        ...prev,
        {
          serial: nextSerial,
          ulbName: form.ulbName.trim(),
          hod: effectiveHod,
          hodName: form.hodName.trim(),
          district: form.district,
        },
      ]);
    }

    setShowForm(false);
    setEditingSerial(null);
    setForm(emptyForm);
    setError("");
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page title */}
      <div className="mb-5 shrink-0">
        <h1 className="text-xl font-bold text-[#1a2744]">Master Creation</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage master records for ULBs and checklists.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); handleCancel(); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-[#1a2744] text-[#1a2744]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "ULB Creation" && (
          <div className="space-y-5">
            {/* Inline form — shown when adding or editing */}
            {showForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-5">
                  {isEditing ? `Edit ULB — ${editingSerial}` : "New ULB Details"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Serial No. */}
                  <div>
                    <label className={lbl}>Serial No.</label>
                    <input
                      type="text"
                      value={displaySerial}
                      readOnly
                      className={`${inp} bg-gray-50 text-gray-400 cursor-not-allowed`}
                    />
                  </div>

                  {/* Name of ULB */}
                  <div>
                    <label className={lbl}>
                      Name of ULB <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Raipur Municipal Corporation"
                      value={form.ulbName}
                      onChange={(e) => handleChange("ulbName", e.target.value)}
                      className={inp}
                    />
                  </div>

                  {/* Head of Department */}
                  <div>
                    <label className={lbl}>
                      Head of Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.hod}
                      onChange={(e) => handleChange("hod", e.target.value)}
                      className={`${inp} ${!form.hod ? "text-gray-400" : "text-gray-900"}`}
                    >
                      <option value="" disabled>Select designation</option>
                      {HOD_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {form.hod === "Other" && (
                      <input
                        type="text"
                        placeholder="Enter custom designation"
                        value={form.hodCustom}
                        onChange={(e) => handleChange("hodCustom", e.target.value)}
                        className={`${inp} mt-2`}
                      />
                    )}
                  </div>

                  {/* Name of Head of Department */}
                  <div>
                    <label className={lbl}>
                      Name of Head of Department <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      value={form.hodName}
                      onChange={(e) => handleChange("hodName", e.target.value)}
                      className={inp}
                    />
                  </div>

                  {/* District */}
                  <div>
                    <label className={lbl}>
                      District <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.district}
                      onChange={(e) => handleChange("district", e.target.value)}
                      className={`${inp} ${!form.district ? "text-gray-400" : "text-gray-900"}`}
                    >
                      <option value="" disabled>Select district</option>
                      {CG_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-[#1a2744] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#243460] transition-colors"
                  >
                    {isEditing ? "Save Changes" : "Add ULB"}
                  </button>
                </div>
              </div>
            )}

            {/* Created ULBs table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">
                  Created ULBs{ulbList.length > 0 ? ` (${ulbList.length})` : ""}
                </h2>
                {!showForm && (
                  <button
                    onClick={handleOpenAdd}
                    className="bg-[#1a2744] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#243460] transition-colors flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add New ULB
                  </button>
                )}
              </div>

              {ulbList.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-gray-400">No ULBs created yet.</p>
                  {!showForm && (
                    <button
                      onClick={handleOpenAdd}
                      className="mt-3 text-sm text-[#1a2744] font-medium hover:underline"
                    >
                      Add your first ULB
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Serial No.</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name of ULB</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Head of Department</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name of Head</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">District</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ulbList.map((row, i) => (
                        <tr
                          key={row.serial}
                          className={`border-b border-gray-50 ${
                            editingSerial === row.serial ? "bg-amber-50/60" : i % 2 === 1 ? "bg-gray-50/50" : ""
                          }`}
                        >
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">{row.serial}</td>
                          <td className="px-5 py-3 font-medium text-gray-800">{row.ulbName}</td>
                          <td className="px-5 py-3 text-gray-600">{row.hod}</td>
                          <td className="px-5 py-3 text-gray-600">{row.hodName}</td>
                          <td className="px-5 py-3 text-gray-600">{row.district}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleOpenEdit(row)}
                              className="text-xs text-[#1a2744] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={showForm && editingSerial !== row.serial}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Checklist Creation" && (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Checklist Creation</p>
              <p className="text-xs text-gray-400 mt-1">Coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterCreationPage;
