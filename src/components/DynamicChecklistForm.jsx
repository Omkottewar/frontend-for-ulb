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

/** Compute line-items summary */
const computeLineItemSummary = (summary, getRowVal) => {
  if (!summary?.formula) return 0;
  const f = summary.formula;
  const base = Number(getRowVal(f.base, "bd_amount")) || 0;
  const deductions = (f.deductions || []).reduce(
    (s, id) => s + (Number(getRowVal(id, "bd_amount")) || 0),
    0
  );
  const adjustments = (f.adjustments || []).reduce(
    (s, id) => s + (Number(getRowVal(id, "bd_amount")) || 0),
    0
  );
  return base - deductions + adjustments;
};

/* ══════════════════════════════════════════════════════════════
   FIELD RENDERER
   Renders a single field based on its type
   ══════════════════════════════════════════════════════════════ */

const FieldRenderer = ({ field, value, onChange, disabled }) => {
  const val = value ?? "";

  switch (field.type) {
    /* ── Text ── */
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

    /* ── Number ── */
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

    /* ── Date ── */
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

    /* ── Radio (yes/no style) ── */
    case "radio":
    case "yes_no_na": {
      const options = field.options || [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ];
      return (
        <div className="flex gap-1.5">
          {options.map((opt) => {
            const optVal = typeof opt === "object" ? opt.value : opt;
            const optLabel = typeof opt === "object" ? opt.label : opt;
            const active = val === optVal;

            let activeStyle = "bg-gray-400 text-white border-gray-400";
            if (optLabel === "Yes" || optVal === "yes")
              activeStyle = "bg-green-500 text-white border-green-500";
            else if (optLabel === "No" || optVal === "no")
              activeStyle = "bg-red-500 text-white border-red-500";

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

    /* ── Dropdown / Select ── */
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
            const optVal = typeof opt === "object" ? opt.value : opt;
            const optLabel = typeof opt === "object" ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
      );
    }

    /* ── Readonly / Red flag ── */
    case "readonly":
      return (
        <div
          className={cls(
            "text-sm px-3 py-2 rounded-lg",
            field.flagType === "red_flag"
              ? "bg-red-50 text-red-600 border border-red-200 font-medium"
              : "bg-gray-50 text-gray-500 border border-gray-200"
          )}
        >
          {field.flagType === "red_flag" && (
            <span className="mr-1.5">🚩</span>
          )}
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
  const fields = section.fields || [];
  const conditionalGroups = section.conditionalGroups || [];

  // Determine which conditional fields to show
  const visibleConditionalFields = useMemo(() => {
    const result = [];
    for (const group of conditionalGroups) {
      const cond = group.showWhen;
      if (!cond) continue;
      const current = responses[cond.fieldId]?.value;
      if (current === cond.equals) {
        result.push(...(group.fields || []));
      }
    }
    return result;
  }, [conditionalGroups, responses]);

  const allFields = [...fields, ...visibleConditionalFields];

  // Auto-compute computed fields
  useEffect(() => {
    for (const field of allFields) {
      if (field.computed && field.formula) {
        const getVal = (id) => responses[id]?.value ?? "";
        const computed = computeField(field.formula, getVal);
        const current = responses[field.fieldId]?.value;
        if (String(computed) !== String(current ?? "")) {
          onFieldChange(field.fieldId, String(computed));
        }
      }
    }
  }, [allFields, responses, onFieldChange]);

  // Layout: if <=3 fields of simple types, use grid
  const useGrid = allFields.length <= 4 && allFields.every(
    (f) => f.type !== "textarea" && f.type !== "readonly"
  );

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
   SECTION: Dynamic Table (e.g. Payment Summary)
   ══════════════════════════════════════════════════════════════ */

const TableSection = ({ section, responses, onFieldChange, disabled }) => {
  const columns = section.columns || [];
  const storageKey = `__table_${section.sectionId}`;
  const minRows = section.minRows || 1;

  // Parse stored rows from responses or initialize
  const [rows, setRows] = useState(() => {
    try {
      const stored = responses[storageKey]?.value;
      if (stored) {
        const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    // Initialize empty rows
    return Array.from({ length: minRows }, () =>
      Object.fromEntries(columns.map((c) => [c.columnId, ""]))
    );
  });

  // Sync rows back to responses
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
          <span className="text-xs text-gray-400">{rows.length} row{rows.length !== 1 ? "s" : ""}</span>
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
            disabled={section.maxRows && rows.length >= section.maxRows}
            className="text-xs font-medium text-[#1a2744] hover:underline disabled:opacity-40 disabled:no-underline"
          >
            + Add Row
          </button>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SECTION: Checklist Table (e.g. Verification Checklist)
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
              const remFieldId = item.remarkField?.fieldId;
              const respVal = responses[respFieldId]?.value ?? "";
              const remVal = responses[remFieldId]?.value ?? "";

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
   SECTION: Line Items Table (e.g. Bill Details)
   ══════════════════════════════════════════════════════════════ */

const LineItemsTableSection = ({ section, responses, onFieldChange, disabled }) => {
  const columns = section.columns || [];
  const rows = section.rows || [];
  const summary = section.summary;

  const editableColumns = columns.filter(
    (c) => c.type !== "readonly"
  );

  const getRowVal = (rowId, colId) => {
    return responses[`${rowId}__${colId}`]?.value ?? "";
  };

  const summaryValue = useMemo(() => {
    if (!summary) return 0;
    return computeLineItemSummary(summary, getRowVal);
  }, [summary, responses]);

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
              {columns.map((col) => (
                <th
                  key={col.columnId}
                  className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowId} className="border-b border-gray-50 align-top">
                {columns.map((col) => {
                  // Readonly columns show fixed data
                  if (col.type === "readonly") {
                    const staticVal =
                      col.columnId.endsWith("sr_no") ? row.srNo :
                      col.columnId.endsWith("head") ? row.head : "";
                    return (
                      <td key={col.columnId} className="px-4 py-3 text-sm text-gray-700">
                        {col.columnId.endsWith("sr_no") ? (
                          <span className="text-xs font-semibold text-gray-400">{staticVal}</span>
                        ) : (
                          staticVal
                        )}
                      </td>
                    );
                  }

                  // Editable columns
                  const key = `${row.rowId}__${col.columnId}`;
                  const val = responses[key]?.value ?? "";

                  return (
                    <td key={col.columnId} className="px-3 py-2">
                      <input
                        type={col.type === "number" ? "number" : "text"}
                        value={val}
                        disabled={disabled || !row.isEditable}
                        onChange={(e) => onFieldChange(key, e.target.value)}
                        className={cls(
                          cellInput,
                          "py-2",
                          (disabled || !row.isEditable) && "opacity-50 cursor-not-allowed"
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Summary row */}
            {summary && (
              <tr className="bg-[#1a2744]/5 border-t-2 border-[#1a2744]/20">
                {columns.map((col, cIdx) => {
                  if (col.type === "readonly" && col.columnId.endsWith("sr_no")) {
                    return <td key={col.columnId} className="px-4 py-3" />;
                  }
                  if (col.type === "readonly" && col.columnId.endsWith("head")) {
                    return (
                      <td key={col.columnId} className="px-4 py-3 text-sm font-semibold text-gray-800">
                        {summary.head}
                      </td>
                    );
                  }
                  if (col.columnId.endsWith("amount")) {
                    return (
                      <td key={col.columnId} className="px-4 py-3 text-sm font-bold text-[#1a2744]">
                        {fmtCurrency(summaryValue)}
                      </td>
                    );
                  }
                  return <td key={col.columnId} className="px-4 py-3" />;
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SECTION ROUTER
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
      return (
        <LineItemsTableSection
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

  // Count progress across ALL field types
  const { total, answered } = useMemo(() => {
    let t = 0;
    let a = 0;

    for (const sec of sections) {
      // Regular fields
      if (sec.fields) {
        for (const f of sec.fields) {
          if (f.type === "readonly" || f.computed) continue;
          t++;
          const v = responses[f.fieldId]?.value;
          if (v !== null && v !== undefined && v !== "") a++;
        }
      }

      // Checklist table items
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

  // Stable callback for field changes
  const handleFieldChange = useCallback(
    (fieldId, value) => {
      setResponses((prev) => ({
        ...prev,
        [fieldId]: { ...prev[fieldId], value },
      }));
    },
    [setResponses]
  );

  // Collect red flags
  const redFlags = useMemo(() => {
    const flags = [];
    const flagIds = form.metadata?.redFlagFields || [];
    for (const id of flagIds) {
      // A red flag is "active" if the parent conditional made it visible
      // Check if the flag field's section conditional is currently matching
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
      {/* Header / Progress */}
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
              className="h-full bg-[#1a2744] rounded-full transition-all"
              style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 tabular-nums">
            {total > 0 ? Math.round((answered / total) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, idx) => (
        <SectionRenderer
          key={section.sectionId || idx}
          section={section}
          responses={responses}
          onFieldChange={handleFieldChange}
          disabled={disabled}
        />
      ))}

      {/* Save */}
      {!disabled && onSave && (
        <div className="flex justify-end">
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