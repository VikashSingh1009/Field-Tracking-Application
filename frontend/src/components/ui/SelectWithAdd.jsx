// src/components/ui/SelectWithAdd.jsx
// ✅ Dropdown + "+" button combined component

import { Plus } from "lucide-react";

const SelectWithAdd = ({
    label,
    name,
    value,
    onChange,
    options,
    placeholder,
    onAddClick,      // ✅ Opens quick add popup
    showAdd = true,  // ✅ Show/hide add button
    required = false
}) => (
    <div>
        {/* ── Label Row ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-600">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {/* ── Quick Add Button ───────────────────────────── */}
            {showAdd && (
                <button
                    type="button"
                    onClick={onAddClick}
                    className="flex items-center gap-1 text-[10px] 
                               font-semibold text-violet-600 
                               hover:text-violet-700 bg-violet-50 
                               hover:bg-violet-100 px-2 py-1 
                               rounded-lg transition-all"
                    title={`Add new ${label}`}
                >
                    <Plus size={10} />
                    Add New
                </button>
            )}
        </div>

        {/* ── Select Dropdown ───────────────────────────────── */}
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-3.5 py-2.5 border-2 border-slate-200 
                       rounded-xl text-sm focus:outline-none 
                       focus:ring-4 focus:ring-violet-500/10 
                       focus:border-violet-500 bg-white transition-all"
        >
            <option value="">{placeholder || `Select ${label}...`}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);

export default SelectWithAdd;