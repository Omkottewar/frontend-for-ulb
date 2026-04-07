import React, { useState } from "react";
import DownloadDropdown from "./DownloadDropdown";

const FilesTable = ({ files, filesLoading, finalizedFiles, onOpenFile }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const RISK_STYLES = {
    High: "bg-red-100 text-red-600",
    Medium: "bg-orange-100 text-orange-500",
    Low: "bg-green-100 text-green-600",
  };

  const STATUS_STYLES = {
    "Pre-Audit": "bg-orange-100 text-orange-500",
    "Post-Audit": "bg-pink-100 text-pink-500",
    Indexed: "bg-cyan-100 text-cyan-600",
    Closed: "bg-gray-100 text-gray-500",
    "Under Review": "bg-blue-100 text-blue-500",
    Finalized: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-y-auto flex-1">
      <table className="w-full text-sm">
        
        {/* Header */}
        <thead>
          <tr className="border-b border-gray-100 sticky top-0 bg-white">
            {[
              "Tracking ID",
              "File Title",
              "ULB",
              "Amount",
              "Risk",
              "Status",
              "Date",
              "",
            ].map((col) => (
              <th
                key={col}
                className="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {filesLoading ? (
            <tr>
              <td
                colSpan={8}
                className="text-center text-gray-400 text-sm py-16"
              >
                Loading files...
              </td>
            </tr>
          ) : files.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="text-center text-gray-400 text-sm py-16"
              >
                No files found
              </td>
            </tr>
          ) : (
            files.map((f) => (
              <tr
                key={f.fileNumber}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => onOpenFile(f)}
                    className="font-medium text-[#1a2744] hover:underline"
                  >
                    {f.fileNumber}
                  </button>
                </td>

                <td className="px-5 py-3.5">{f.fileTitle || "—"}</td>
                <td className="px-5 py-3.5 text-gray-400">{f.ulbName || "—"}</td>

                <td className="px-5 py-3.5">
                  {f.amount
                    ? `₹${Number(f.amount).toLocaleString("en-IN")}`
                    : "—"}
                </td>

                <td className="px-5 py-3.5">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      RISK_STYLES[f.riskFlag] ||
                      "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {f.riskFlag || "—"}
                  </span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      STATUS_STYLES[f.status] ||
                      "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {f.status}
                  </span>
                </td>

                <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                  {f.createdAt
                    ? f.createdAt.split("T")[0].split("-").reverse().join("-")
                    : "—"}
                </td>

                {/* <td className="px-3 py-3.5 relative">

                  <button
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === f.fileNumber
                          ? null
                          : f.fileNumber
                      )
                    }
                    className="text-[#1a2744]"
                  >
                    ⬇
                  </button>

                  {openDropdown === f.fileNumber && (
                    <DownloadDropdown
                      fileNumber={f.fileNumber}
                      onClose={() => setOpenDropdown(null)}
                    />
                  )}

                </td> */}
              </tr>
            ))
          )}
        </tbody>

      </table>
    </div>
  );
};

export default FilesTable;