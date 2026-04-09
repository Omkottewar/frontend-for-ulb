import { useState } from "react";
import { createSupplier } from "../services/supplierService";
import { updateFileSupplier } from "../services/fileService";
import toast from "react-hot-toast";
const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition placeholder-gray-400";

const EMPTY_FORM = {
  supplierName: "",
  pan: "",
  gstNumber: "",
  epfRegNo: "",
  esicRegNo: "",
  labourLicenseNo: "",
  nameOfDepartment: "",
  fileNo: "",
  nameOfFund: "",
};

export default function MasterDataPage({ file, onBack, onContinue }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [skipped, setSkipped] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBack = () => {
    if (window.confirm("Go back? Master data will not be saved for this file.")) {
      onBack();
    }
  };

  const handleSkip = () => {
    setSkipped(true);
    onContinue({});
  };
const handleSubmit = async () => {
  try {

    // 1️⃣ Create supplier
    const supplierRes = await createSupplier(form);

    // 2️⃣ Link supplier to file
    await updateFileSupplier(file.id, supplierRes.supplier.id);

    // 3️⃣ Continue workflow
    onContinue(supplierRes.supplier);

  } catch (err) {
    console.error(err);
    toast.error("Failed to save supplier");
  }
};

  return (
    <div>
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        ← Back to Files
      </button>
      <h1 className="text-2xl font-bold text-gray-800">Master Data</h1>
      <p className="text-sm text-gray-400 mt-1 mb-6">
        Supplier and fund details for{" "}
        <span className="font-medium text-gray-600">{file.fileNumber}</span>
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Supplier &amp; Fund Information
        </h2>

        {/* Row 1: Supplier Name | PAN | GST Number */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Supplier Name
            </label>
            <input
              type="text"
              name="supplierName"
              value={form.supplierName}
              onChange={handleChange}
              placeholder="Enter supplier name"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              PAN
            </label>
            <input
              type="text"
              name="pan"
              value={form.pan}
              onChange={handleChange}
              placeholder="e.g. AABCS1429B"
              maxLength={10}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              GST Number
            </label>
            <input
              type="text"
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
              placeholder="e.g. 22AABCS1429B1ZT"
              className={inputClass}
            />
          </div>
        </div>

        {/* Row 2: EPF | ESIC | Labour License */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              EPF Registration No.
            </label>
            <input
              type="text"
              name="epfRegNo"
              value={form.epfRegNo}
              onChange={handleChange}
              placeholder="Enter EPF reg. no."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ESIC Registration No.
            </label>
            <input
              type="text"
              name="esicRegNo"
              value={form.esicRegNo}
              onChange={handleChange}
              placeholder="Enter ESIC reg. no."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Labour License No.
            </label>
            <input
              type="text"
              name="labourLicenseNo"
              value={form.labourLicenseNo}
              onChange={handleChange}
              placeholder="Enter labour license no."
              className={inputClass}
            />
          </div>
        </div>

        {/* Row 3: Department | File No. | Name of Fund */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name of Department
            </label>
            <input
              type="text"
              name="nameOfDepartment"
              value={form.nameOfDepartment}
              onChange={handleChange}
              placeholder="Enter department name"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              File No.
            </label>
            <input
              type="text"
              name="fileNo"
              value={form.fileNo}
              onChange={handleChange}
              placeholder="Enter file number"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name of Fund
            </label>
            <input
              type="text"
              name="nameOfFund"
              value={form.nameOfFund}
              onChange={handleChange}
              placeholder="e.g. XIV Finance Commission"
              className={inputClass}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip for now
            <span className="block text-xs text-gray-300 mt-0.5">
              Master data can be filled from the file's Details tab
            </span>
          </button>
          <button
            onClick={handleSubmit}
            className="bg-[#1a2744] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#243358] transition-colors"
          >
            Save &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
