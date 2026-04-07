import React from "react";

const FilesFilters = ({ filters, setFilters, allULBs }) => {
  const inputClass =
    "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-[#1a2744] bg-white";

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 mb-4 flex-wrap">

      {/* Search */}
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[180px]">
        <input
          type="text"
          placeholder="Search files..."
          value={filters.search}
          onChange={(e) =>
            setFilters((p) => ({ ...p, search: e.target.value }))
          }
          className="text-sm text-gray-700 outline-none w-full placeholder-gray-400"
        />
      </div>

      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) =>
          setFilters((p) => ({ ...p, status: e.target.value }))
        }
        className={inputClass}
      >
        <option value="">All Status</option>
        {[
          "Pre-Audit",
          "Post-Audit",
          "Indexed",
          "Closed",
          "Under Review",
          "Finalized",
        ].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      {/* Risk */}
      <select
        value={filters.risk}
        onChange={(e) =>
          setFilters((p) => ({ ...p, risk: e.target.value }))
        }
        className={inputClass}
      >
        <option value="">All Risk</option>
        {["Low", "Medium", "High"].map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>

      {/* ULB */}
      <select
        value={filters.ulb}
        onChange={(e) =>
          setFilters((p) => ({ ...p, ulb: e.target.value }))
        }
        className={inputClass}
      >
        <option value="">All ULBs</option>
        {allULBs.map((u) => (
          <option key={u}>{u}</option>
        ))}
      </select>

    </div>
  );
};

export default FilesFilters;