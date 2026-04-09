import { useState, useEffect, useMemo, useCallback } from "react";

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */

const cls = (...parts) => parts.filter(Boolean).join(" ");

const inputBase =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition";

const cellInput =
  "w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition";

const fmtCurrency = (v) => {
  const n = Number(v);
  if (Number.isNaN(n) || v === "" || v === null || v === undefined) return "";
  return `₹${n.toLocaleString("en-IN")}`;
};

/** Resolve a computed field value from a formula object + current responses */
const computeField = (formula, getVal) => {
  if (!formula) return "";
  const num = (id) => Number(getVal(id)) || 0;

  if (formula.operation === "subtract") {
    const [a, b] = (formula.operands || []).map((o) => num(o.fieldId || o.columnId));
    return a - b;
  }
  if (formula.operation === "add") {
    return (formula.operands || []).reduce((s, o) => s + num(o.fieldId || o.columnId), 0);
  }
  return "";
};

/** Compute line-items summary using the actual amount column from section */
const computeLineItemSummary = (summary, amountColumnId, getRowVal) => {
  if (!summary?.formula) return 0;
  const f = summary.formula;
  // FIX: use dynamic amountColumnId instead of hardcoded "bd_amount"
  const getAmount = (rowId) => Number(getRowVal(rowId, amountColumnId)) || 0;

  let result = getAmount(f.base);
  (f.deductions  || []).forEach(rowId => { result -= getAmount(rowId); });
  (f.adjustments || []).forEach(rowId => { result += getAmount(rowId); });
  return result;
};

/* ══════════════════════════════════════════════════════════════
   FIELD RENDERER
   ══════════════════════════════════════════════════════════════ */

const FieldRenderer = ({ field, value, onChange, disabled }) => {
  const val = value ?? "";

  switch (field.type) {
    case "text":
      return (
        <input
          type="text"
          value={val}
          disabled={disabled}
          placeholder={field.placeholder || ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls(inputBase, disabled && "opacity-50 cursor-not-allowed")}
        />
      );

    case "textarea":
      return (
        <textarea
          value={val}
          disabled={disabled}
          placeholder={field.placeholder || ""}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className={cls(inputBase, "resize-none", disabled && "opacity-50 cursor-not-allowed")}
        />
      );

    case "number":
      if (field.computed || field.readonly) {
        return (
          <div className={cls(inputBase, "bg-gray-50 text-gray-500")}>
            {field.format === "currency" ? fmtCurrency(val) : val || "—"}
          </div>
        );
      }
      return (
        <input
          type="number"
          value={val}
          disabled={disabled}
          placeholder={field.placeholder || ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls(inputBase, disabled && "opacity-50 cursor-not-allowed")}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={val}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cls(inputBase, disabled && "opacity-50 cursor-not-allowed")}
        />
      );

    case "radio":
    case "yes_no_na": {
      const options = field.options || [
        { label: "Yes", value: "yes" },
        { label: "No",  value: "no"  },
      ];
      return (
        <div className="flex gap-1.5">
          {options.map((opt) => {
            const optVal   = typeof opt === "object" ? opt.value : opt;
            const optLabel = typeof opt === "object" ? opt.label : opt;
            const active   = val === optVal;

            let activeStyle = "bg-gray-400 text-white border-gray-400";
            if (optVal === "yes") activeStyle = "bg-green-500 text-white border-green-500";
            else if (optVal === "no") activeStyle = "bg-red-500 text-white border-red-500";

            return (
              <button
                key={optVal}
                type="button"
                disabled={disabled}
                onClick={() => onChange(active ? null : optVal)}
                className={cls(
                  "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
                  active
                    ? activeStyle
                    : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      );
    }

    case "dropdown":
    case "select": {
      const options = field.options || [];
      return (
        <select
          value={val}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cls(inputBase, disabled && "opacity-50 cursor-not-allowed")}
        >
          <option value="">Select…</option>
          {options.map((opt) => {
            const optVal   = typeof opt === "object" ? opt.value : opt;
            const optLabel = typeof opt === "object" ? opt.label : opt;
            return <option key={optVal} value={optVal}>{optLabel}</option>;
          })}
        </select>
      );
    }

    case "readonly":
      return (
        <div
          className={cls(
            "text-sm px-3 py-2 rounded-lg",
            field.flagType === "red_flag"
              ? "bg-red-50 text-red-600 border border-red-200 font-medium"
              : field.flagType === "success"
              ? "bg-green-50 text-green-700 border border-green-200 font-medium"
              : "bg-gray-50 text-gray-500 border border-gray-200"
          )}
        >
          {field.flagType === "red_flag" && <span className="mr-1.5">🚩</span>}
          {field.flagType === "success"  && <span className="mr-1.5">✅</span>}
          {field.defaultValue || val || "—"}
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={val}
          disabled={disabled}
          placeholder={field.placeholder || ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls(inputBase, disabled && "opacity-50 cursor-not-allowed")}
        />
      );
  }
};

/* ══════════════════════════════════════════════════════════════
   SECTION: Regular Fields + Conditional Groups
   ══════════════════════════════════════════════════════════════ */

const RegularSection = ({ section, responses, onFieldChange, disabled }) => {
  const fields            = section.fields || [];
  const conditionalGroups = section.conditionalGroups || [];

  const visibleConditionalFields = useMemo(() => {
    const result = [];
    for (const group of conditionalGroups) {
      const cond = group.showWhen;
      if (!cond) continue;
      const current = responses[cond.fieldId]?.value;
      if (current === cond.equals) result.push(...(group.fields || []));
    }
    return result;
  }, [conditionalGroups, responses]);

  const allFields = [...fields, ...visibleConditionalFields];

  // Auto-compute computed fields
  useEffect(() => {
    for (const field of allFields) {
      if (field.computed && field.formula) {
        const getVal   = (id) => responses[id]?.value ?? "";
        const computed = computeField(field.formula, getVal);
        const current  = responses[field.fieldId]?.value;
        if (String(computed) !== String(current ?? "")) {
          onFieldChange(field.fieldId, String(computed));
        }
      }
    }
  }, [allFields, responses, onFieldChange]);

  const useGrid = allFields.length <= 4 &&
    allFields.every((f) => f.type !== "textarea" && f.type !== "readonly");

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {section.title && (
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">{section.title}</p>
        </div>
      )}

      <div className={cls("px-5 py-4", useGrid && "grid grid-cols-3 gap-4")}>
        {allFields.map((field) => {
          const resp = responses[field.fieldId] || { value: null, remark: "" };

          if (useGrid) {
            return (
              <div key={field.fieldId}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <FieldRenderer
                  field={field}
                  value={resp.value}
                  onChange={(v) => onFieldChange(field.fieldId, v)}
                  disabled={disabled}
                />
              </div>
            );
          }

          return (
            <div
              key={field.fieldId}
              className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <div className="max-w-md">
                  <FieldRenderer
                    field={field}
                    value={resp.value}
                    onChange={(v) => onFieldChange(field.fieldId, v)}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SECTION: Dynamic Table  (type: "table")
   ══════════════════════════════════════════════════════════════ */

const TableSection = ({ section, responses, onFieldChange, disabled }) => {
  const columns = section.columns || [];
  const storageKey = `__table_${section.sectionId}`;
  const minRows = section.minRows || 1;

  const [rows, setRows] = useState(() => {
    try {
      const stored = responses[storageKey]?.value;
      if (stored) {
        const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return Array.from({ length: minRows }, () =>
      Object.fromEntries(columns.map((c) => [c.columnId, ""]))
    );
  });

  // Sync rows → shared responses state
  useEffect(() => {
    onFieldChange(storageKey, JSON.stringify(rows));
  }, [rows, storageKey]);

  const updateCell = (rowIdx, colId, value) => {
    setRows((prev) => {
      const updated = prev.map((r, i) =>
        i === rowIdx ? { ...r, [colId]: value } : r
      );
      // Auto-compute computed columns
      columns.forEach((col) => {
        if (col.computed && col.formula) {
          const getVal = (id) => updated[rowIdx][id] ?? "";
          updated[rowIdx][col.columnId] = String(computeField(col.formula, getVal));
        }
      });
      return updated;
    });
  };

  const addRow = () => {
    if (section.maxRows && rows.length >= section.maxRows) return;
    setRows((prev) => [
      ...prev,
      Object.fromEntries(columns.map((c) => [c.columnId, ""])),
    ]);
  };

  const removeRow = (idx) => {
    if (rows.length <= minRows) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {section.title && (
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">{section.title}</p>
          <span className="text-xs text-gray-400">
            {rows.length} row{rows.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5 w-10">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.columnId}
                  className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                  {col.computed && (
                    <span className="ml-1 text-[10px] text-gray-300 font-normal">(auto)</span>
                  )}
                </th>
              ))}
              {!disabled && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-gray-50 hover:bg-gray-50/30">
                <td className="px-3 py-2 text-xs text-gray-300 font-medium">{rIdx + 1}</td>
                {columns.map((col) => (
                  <td key={col.columnId} className="px-2 py-1.5">
                    {col.computed ? (
                      <span className="text-xs text-gray-500 px-2">
                        {col.format === "currency"
                          ? fmtCurrency(row[col.columnId])
                          : row[col.columnId] || "—"}
                      </span>
                    ) : col.type === "date" ? (
                      <input
                        type="date"
                        value={row[col.columnId] ?? ""}
                        disabled={disabled}
                        onChange={(e) => updateCell(rIdx, col.columnId, e.target.value)}
                        className={cls(cellInput, disabled && "opacity-50 cursor-not-allowed")}
                      />
                    ) : (
                      <input
                        type={col.type === "number" ? "number" : "text"}
                        value={row[col.columnId] ?? ""}
                        disabled={disabled}
                        onChange={(e) => updateCell(rIdx, col.columnId, e.target.value)}
                        className={cls(cellInput, disabled && "opacity-50 cursor-not-allowed")}
                      />
                    )}
                  </td>
                ))}
                {!disabled && (
                  <td className="px-2 py-1.5">
                    {rows.length > minRows && (
                      <button
                        type="button"
                        onClick={() => removeRow(rIdx)}
                        className="text-gray-300 hover:text-red-500 text-xs transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {section.allowAddRow !== false && !disabled && (
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            type="button"
            onClick={addRow}
            disabled={!!(section.maxRows && rows.length >= section.maxRows)}
            className="text-xs font-medium text-[#1a2744] hover:underline disabled:opacity-40 disabled:no-underline"
          >
            + Add Row
            {section.maxRows && (
              <span className="ml-1 text-gray-400 font-normal">
                ({rows.length}/{section.maxRows})
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SECTION: Checklist Table  (type: "checklist_table")
   ══════════════════════════════════════════════════════════════ */

const ChecklistTableSection = ({ section, responses, onFieldChange, disabled }) => {
  const items = section.items || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {section.title && (
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">{section.title}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 w-16">
                Sr No
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                Particular
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 w-32">
                Response
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 w-48">
                Remark
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const respFieldId = item.responseField?.fieldId;
              const remFieldId  = item.remarkField?.fieldId;
              const respVal     = responses[respFieldId]?.value ?? "";
              const remVal      = responses[remFieldId]?.value  ?? "";

              return (
                <tr key={item.itemId} className="border-b border-gray-50 align-top">
                  <td className="px-4 py-3 text-xs font-semibold text-gray-400">{item.srNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 leading-snug">{item.particular}</td>
                  <td className="px-3 py-2.5">
                    {item.responseField?.type === "dropdown" ? (
                      <select
                        value={respVal}
                        disabled={disabled}
                        onChange={(e) => onFieldChange(respFieldId, e.target.value)}
                        className={cls(cellInput, "py-2", disabled && "opacity-50 cursor-not-allowed")}
                      >
                        <option value="">Select…</option>
                        {(item.responseField.options || []).map((opt) => {
                          const v = typeof opt === "object" ? opt.value : opt;
                          const l = typeof opt === "object" ? opt.label : opt;
                          return <option key={v} value={v}>{l}</option>;
                        })}
                      </select>
                    ) : (
                      <FieldRenderer
                        field={item.responseField || { type: "text" }}
                        value={respVal}
                        onChange={(v) => onFieldChange(respFieldId, v)}
                        disabled={disabled}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      value={remVal}
                      disabled={disabled}
                      placeholder={item.remarkField?.placeholder || "Remark…"}
                      onChange={(e) => onFieldChange(remFieldId, e.target.value)}
                      className={cls(cellInput, "py-2", disabled && "opacity-50 cursor-not-allowed")}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SECTION: Line Items Table  (type: "line_items_table")
   FIX: was receiving onFieldChange but calling setResponses —
        now uses onFieldChange consistently AND computes summary
        using the actual amount columnId, not a hardcoded string
   ══════════════════════════════════════════════════════════════ */

const LineItemsTableSection = ({ section, responses, onFieldChange, disabled }) => {

  // Detect the amount column dynamically (first number column that isn't readonly)
  const amountColumn = useMemo(() =>
    section.columns?.find(c => c.type === "number" && c.columnId.includes("amount")) ||
    section.columns?.find(c => c.type === "number" && !c.computed),
    [section.columns]
  );
  const amountColumnId = amountColumn?.columnId ?? "bd_amount";

  // ── read a cell value from shared responses ────────────────────
  const getCellValue = (rowId, columnId) =>
    responses[`${rowId}_${columnId}`]?.value ?? "";

  // ── write a cell change into shared responses ──────────────────
  // FIX: was calling setResponses directly — now uses onFieldChange
  //      which correctly writes into the parent responses map
  const handleCellChange = (rowId, columnId, value) => {
    onFieldChange(`${rowId}_${columnId}`, value);
  };

  // ── compute summary using dynamic amount column ────────────────
  const summaryValue = useMemo(() => {
    if (!section.summary?.formula) return null;
    const getRowVal = (rowId, colId) => getCellValue(rowId, colId);
    return computeLineItemSummary(section.summary, amountColumnId, getRowVal);
  }, [section.summary, amountColumnId, responses]);

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "—";
    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const cellIn =
    "w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2744] disabled:bg-gray-50 disabled:text-gray-400 bg-white";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {section.title && (
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">{section.title}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          {/* ── header ── */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              {section.columns.map(col => (
                <th
                  key={col.columnId}
                  className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── data rows ── */}
          <tbody>
            {section.rows.map((row) => (
              <tr
                key={row.rowId}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                {section.columns.map(col => {
                  // readonly columns — pull display value from row definition
                  if (col.type === "readonly") {
                    const displayVal =
                      col.columnId.includes("sr_no") ? row.srNo  :
                      col.columnId.includes("head")   ? row.head  :
                      row[col.columnId] ?? "—";

                    return (
                      <td key={col.columnId} className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">
                        {displayVal}
                      </td>
                    );
                  }

                  const currentValue = getCellValue(row.rowId, col.columnId);

                  return (
                    <td key={col.columnId} className="px-2 py-1.5">
                      <input
                        type={col.type === "number" ? "number" : "text"}
                        value={currentValue}
                        disabled={disabled || !row.isEditable}
                        placeholder={col.format === "currency" ? "0.00" : col.type === "number" ? "0" : ""}
                        onChange={e => handleCellChange(row.rowId, col.columnId, e.target.value)}
                        className={cls(cellIn, (disabled || !row.isEditable) && "opacity-50 cursor-not-allowed")}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          {/* ── computed summary row ── */}
          {section.summary && (
            <tfoot>
              <tr className="bg-[#1a2744]/5 border-t-2 border-[#1a2744]/20">
                {section.columns.map((col) => {
                  if (col.columnId.includes("sr_no")) {
                    return (
                      <td key={col.columnId} className="px-4 py-3 text-xs text-gray-400 font-medium">
                        Net
                      </td>
                    );
                  }
                  if (col.columnId.includes("head")) {
                    return (
                      <td key={col.columnId} className="px-4 py-3 text-sm font-semibold text-gray-700">
                        {section.summary.head}
                      </td>
                    );
                  }
                  // FIX: was checking for literal "bd_amount" — now uses dynamic amountColumnId
                  if (col.columnId === amountColumnId) {
                    return (
                      <td key={col.columnId} className="px-4 py-3">
                        <span className="text-sm font-bold text-[#1a2744]">
                          {summaryValue !== null ? formatCurrency(summaryValue) : "—"}
                        </span>
                      </td>
                    );
                  }
                  return <td key={col.columnId} className="px-4 py-3" />;
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SECTION: Document Checklist  (type: "document_checklist")
   FIX: was completely missing from SectionRenderer — added now
   ══════════════════════════════════════════════════════════════ */

const DocumentChecklistSection = ({ section, responses, onFieldChange, disabled }) => {
  const items = section.items || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {section.title && (
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">{section.title}</p>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {items.map((item) => {
          const fieldId = item.checkField?.fieldId;
          const checked = responses[fieldId]?.value === "true" ||
                          responses[fieldId]?.value === true;

          return (
            <div
              key={item.itemId}
              className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors"
            >
              {/* Sr No */}
              <span className="text-xs font-semibold text-gray-400 w-8 shrink-0">
                {item.srNo}
              </span>

              {/* Document name */}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-700">{item.document}</span>
                {item.conditionNote && (
                  <span className="ml-2 text-xs text-amber-500 italic">
                    {item.conditionNote}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className="text-xs text-gray-400 shrink-0">
                {item.checkField?.label || "Checked"}
              </span>

              {/* Checkbox */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onFieldChange(fieldId, checked ? "false" : "true")}
                className={cls(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                  checked
                    ? "bg-[#1a2744] border-[#1a2744]"
                    : "border-gray-300 hover:border-[#1a2744]",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {checked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SECTION ROUTER
   FIX: added document_checklist case; LineItemsTableSection now
        receives onFieldChange (not setResponses) consistently
   ══════════════════════════════════════════════════════════════ */

const SectionRenderer = ({ section, responses, onFieldChange, disabled }) => {
  switch (section.type) {

    case "table":
      return (
        <TableSection
          section={section}
          responses={responses}
          onFieldChange={onFieldChange}
          disabled={disabled}
        />
      );

    case "checklist_table":
      return (
        <ChecklistTableSection
          section={section}
          responses={responses}
          onFieldChange={onFieldChange}
          disabled={disabled}
        />
      );

    case "line_items_table":
      // FIX: was missing — was never rendered; also passes onFieldChange
      return (
        <LineItemsTableSection
          section={section}
          responses={responses}
          onFieldChange={onFieldChange}   // ✅ consistent prop name
          disabled={disabled}
        />
      );

    case "document_checklist":
      // FIX: was completely absent from this router
      return (
        <DocumentChecklistSection
          section={section}
          responses={responses}
          onFieldChange={onFieldChange}
          disabled={disabled}
        />
      );

    default:
      return (
        <RegularSection
          section={section}
          responses={responses}
          onFieldChange={onFieldChange}
          disabled={disabled}
        />
      );
  }
};

/* ══════════════════════════════════════════════════════════════
   MAIN: DynamicChecklistForm
   ══════════════════════════════════════════════════════════════ */

const DynamicChecklistForm = ({
  form,
  responses,
  setResponses,
  onSave,
  saving,
  disabled,
}) => {
  if (!form || !form.sections) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
        No checklist template loaded.
      </div>
    );
  }

  const sections = useMemo(
    () => [...form.sections].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [form.sections]
  );

  // Stable callback — writes any field into responses by fieldId/key
  const handleFieldChange = useCallback(
    (fieldId, value) => {
      setResponses((prev) => ({
        ...prev,
        [fieldId]: { ...prev[fieldId], value },
      }));
    },
    [setResponses]
  );

  // Progress: count regular fields + checklist_table response fields
  const { total, answered } = useMemo(() => {
    let t = 0, a = 0;
    for (const sec of sections) {
      if (sec.fields) {
        for (const f of sec.fields) {
          if (f.type === "readonly" || f.computed) continue;
          t++;
          const v = responses[f.fieldId]?.value;
          if (v !== null && v !== undefined && v !== "") a++;
        }
      }
      if (sec.type === "checklist_table" && sec.items) {
        for (const item of sec.items) {
          t++;
          const v = responses[item.responseField?.fieldId]?.value;
          if (v !== null && v !== undefined && v !== "") a++;
        }
      }
    }
    return { total: t, answered: a };
  }, [sections, responses]);

  // Active red flags
  const redFlags = useMemo(() => {
    const flags  = [];
    const flagIds = form.metadata?.redFlagFields || [];
    for (const id of flagIds) {
      for (const sec of sections) {
        for (const cg of sec.conditionalGroups || []) {
          const parentVal = responses[cg.showWhen?.fieldId]?.value;
          if (parentVal === cg.showWhen?.equals) {
            for (const f of cg.fields || []) {
              if (f.fieldId === id && f.flagType === "red_flag") {
                flags.push(f.defaultValue || f.label);
              }
            }
          }
        }
      }
    }
    return flags;
  }, [form, sections, responses]);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header / Progress ── */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {form.formTitle || form.title || "Audit Checklist"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {answered} of {total} items responded
            {form.version && (
              <span className="ml-2 text-gray-300">v{form.version}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {redFlags.length > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600">
              🚩 {redFlags.length} Red Flag{redFlags.length !== 1 ? "s" : ""}
            </span>
          )}
          <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a2744] rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 tabular-nums">
            {total > 0 ? Math.round((answered / total) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* ── Sections ── */}
      {sections.map((section, idx) => (
        <SectionRenderer
          key={section.sectionId || idx}
          section={section}
          responses={responses}
          onFieldChange={handleFieldChange}
          disabled={disabled}
        />
      ))}

      {/* ── Save button ── */}
      {!disabled && onSave && (
        <div className="flex justify-end pb-4">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Checklist"}
          </button>
        </div>
      )}
    </div>
  );
};

export default DynamicChecklistForm;