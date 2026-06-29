// src/pages/Masters.jsx
// ─────────────────────────────────────────────────────────────
// Master Management Module
// Admin can manage all dropdown values from one place
// No hardcoded dropdowns — everything controlled from here
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence }          from 'framer-motion';
import { toast }                            from 'sonner';
import {
    Plus, Search, Edit2, Trash2,
    Power, PowerOff, X, Layers,
    MapPin, Zap, Flag, Tag,
    Grid3X3, Shield, CheckSquare,
    ChevronRight, AlertCircle,
    ToggleLeft, ToggleRight,
    SlidersHorizontal, RefreshCw
} from 'lucide-react';
import API from '../api/client';

// ──────────────────────────────────────────────────────────────
// MASTER CATEGORIES CONFIG
// Add new categories here — UI auto-updates
// ──────────────────────────────────────────────────────────────
const CATEGORIES = [
    {
        key:         'location_type',
        label:       'Location Type',
        icon:        MapPin,
        color:       'violet',
        description: 'Types of field locations (Entry/Exit, Square, etc.)',
        examples:    ['Entry/Exit', 'Square', 'Tri Junction', 'Surveillance Point']
    },
    {
        key:         'zone',
        label:       'Zone',
        icon:        Grid3X3,
        color:       'blue',
        description: 'Geographic zones for field operations',
        examples:    ['Zone A', 'Zone B', 'North Zone', 'South Zone']
    },
    {
        key:         'priority',
        label:       'Priority',
        icon:        Flag,
        color:       'rose',
        description: 'Task and activity priority levels',
        examples:    ['Low', 'Medium', 'High', 'Critical']
    },
    {
        key:         'activity_type',
        label:       'Activity Type',
        icon:        Zap,
        color:       'amber',
        description: 'Types of field activities',
        examples:    ['Survey', 'Installation', 'Maintenance', 'Inspection']
    },
    {
        key:         'status',
        label:       'Status',
        icon:        CheckSquare,
        color:       'emerald',
        description: 'Custom status values for tasks',
        examples:    ['Pending', 'In Progress', 'Completed', 'On Hold']
    },
    {
        key:         'category',
        label:       'Category',
        icon:        Tag,
        color:       'indigo',
        description: 'General classification categories',
        examples:    ['Infrastructure', 'Safety', 'Urban', 'Rural']
    },
    {
        key:         'vendor_type',
        label:       'Vendor Type',
        icon:        Shield,
        color:       'teal',
        description: 'Types of vendors/contractors',
        examples:    ['Civil', 'Electrical', 'IT', 'Security']
    },
    {
        key:         'phase_type',
        label:       'Phase Type',
        icon:        Layers,
        color:       'fuchsia',
        description: 'Project phase classifications',
        examples:    ['Phase 1', 'Phase 2', 'Pilot', 'Final']
    }
];

// ──────────────────────────────────────────────────────────────
// COLOR MAP — maps color key to Tailwind classes
// ──────────────────────────────────────────────────────────────
const COLOR_MAP = {
    violet: {
        tab:     'bg-violet-600 text-white shadow-violet-500/20',
        tabIdle: 'text-violet-600 bg-violet-50 border-violet-100',
        icon:    'text-violet-600',
        iconBg:  'bg-violet-50',
        badge:   'bg-violet-50 text-violet-700 border-violet-100',
        dot:     'bg-violet-500',
        ring:    'focus:border-violet-500 focus:ring-violet-500/10',
        btn:     'bg-violet-600 hover:bg-violet-700 shadow-violet-500/20',
        light:   'bg-violet-50',
        border:  'border-violet-200',
        topBar:  'bg-violet-500'
    },
    blue: {
        tab:     'bg-blue-600 text-white shadow-blue-500/20',
        tabIdle: 'text-blue-600 bg-blue-50 border-blue-100',
        icon:    'text-blue-600',
        iconBg:  'bg-blue-50',
        badge:   'bg-blue-50 text-blue-700 border-blue-100',
        dot:     'bg-blue-500',
        ring:    'focus:border-blue-500 focus:ring-blue-500/10',
        btn:     'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
        light:   'bg-blue-50',
        border:  'border-blue-200',
        topBar:  'bg-blue-500'
    },
    rose: {
        tab:     'bg-rose-600 text-white shadow-rose-500/20',
        tabIdle: 'text-rose-600 bg-rose-50 border-rose-100',
        icon:    'text-rose-600',
        iconBg:  'bg-rose-50',
        badge:   'bg-rose-50 text-rose-700 border-rose-100',
        dot:     'bg-rose-500',
        ring:    'focus:border-rose-500 focus:ring-rose-500/10',
        btn:     'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
        light:   'bg-rose-50',
        border:  'border-rose-200',
        topBar:  'bg-rose-500'
    },
    amber: {
        tab:     'bg-amber-600 text-white shadow-amber-500/20',
        tabIdle: 'text-amber-600 bg-amber-50 border-amber-100',
        icon:    'text-amber-600',
        iconBg:  'bg-amber-50',
        badge:   'bg-amber-50 text-amber-700 border-amber-100',
        dot:     'bg-amber-500',
        ring:    'focus:border-amber-500 focus:ring-amber-500/10',
        btn:     'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
        light:   'bg-amber-50',
        border:  'border-amber-200',
        topBar:  'bg-amber-500'
    },
    emerald: {
        tab:     'bg-emerald-600 text-white shadow-emerald-500/20',
        tabIdle: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        icon:    'text-emerald-600',
        iconBg:  'bg-emerald-50',
        badge:   'bg-emerald-50 text-emerald-700 border-emerald-100',
        dot:     'bg-emerald-500',
        ring:    'focus:border-emerald-500 focus:ring-emerald-500/10',
        btn:     'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
        light:   'bg-emerald-50',
        border:  'border-emerald-200',
        topBar:  'bg-emerald-500'
    },
    indigo: {
        tab:     'bg-indigo-600 text-white shadow-indigo-500/20',
        tabIdle: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        icon:    'text-indigo-600',
        iconBg:  'bg-indigo-50',
        badge:   'bg-indigo-50 text-indigo-700 border-indigo-100',
        dot:     'bg-indigo-500',
        ring:    'focus:border-indigo-500 focus:ring-indigo-500/10',
        btn:     'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20',
        light:   'bg-indigo-50',
        border:  'border-indigo-200',
        topBar:  'bg-indigo-500'
    },
    teal: {
        tab:     'bg-teal-600 text-white shadow-teal-500/20',
        tabIdle: 'text-teal-600 bg-teal-50 border-teal-100',
        icon:    'text-teal-600',
        iconBg:  'bg-teal-50',
        badge:   'bg-teal-50 text-teal-700 border-teal-100',
        dot:     'bg-teal-500',
        ring:    'focus:border-teal-500 focus:ring-teal-500/10',
        btn:     'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20',
        light:   'bg-teal-50',
        border:  'border-teal-200',
        topBar:  'bg-teal-500'
    },
    fuchsia: {
        tab:     'bg-fuchsia-600 text-white shadow-fuchsia-500/20',
        tabIdle: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100',
        icon:    'text-fuchsia-600',
        iconBg:  'bg-fuchsia-50',
        badge:   'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
        dot:     'bg-fuchsia-500',
        ring:    'focus:border-fuchsia-500 focus:ring-fuchsia-500/10',
        btn:     'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-500/20',
        light:   'bg-fuchsia-50',
        border:  'border-fuchsia-200',
        topBar:  'bg-fuchsia-500'
    }
};

// ──────────────────────────────────────────────────────────────
// CONFIRM DELETE MODAL
// ──────────────────────────────────────────────────────────────
const ConfirmModal = ({ item, onConfirm, onCancel, loading }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onCancel}
        />
        {/* Modal */}
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0,    scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10"
        >
            {/* Icon */}
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={22} className="text-rose-600" />
            </div>

            <div className="text-center mb-6">
                <h3 className="text-base font-bold text-slate-800 mb-1">
                    Delete Master Value?
                </h3>
                <p className="text-sm text-slate-500">
                    You are about to delete{' '}
                    <span className="font-semibold text-slate-700">
                        "{item?.label}"
                    </span>
                    . This action cannot be undone.
                </p>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold
                               text-slate-600 bg-slate-100
                               hover:bg-slate-200 rounded-xl transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold
                               text-white bg-rose-600 hover:bg-rose-700
                               rounded-xl transition-all flex items-center
                               justify-center gap-2 disabled:opacity-60"
                >
                    {loading
                        ? <div className="w-4 h-4 border-2 border-white
                                          border-t-transparent rounded-full
                                          animate-spin" />
                        : <Trash2 size={14} />
                    }
                    Delete
                </button>
            </div>
        </motion.div>
    </div>
);

// ──────────────────────────────────────────────────────────────
// ADD / EDIT MODAL
// ──────────────────────────────────────────────────────────────
const MasterFormModal = ({
    mode,           // 'add' | 'edit'
    category,       // current category config object
    editItem,       // existing item (edit mode only)
    onClose,
    onSuccess
}) => {
    const colors = COLOR_MAP[category.color];

    const [form, setForm]     = useState({
        label:       editItem?.label       || '',
        description: editItem?.description || '',
        sort_order:  editItem?.sort_order  ?? 0,
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // ── Validation ─────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.label.trim())
            e.label = 'Label is required';
        if (form.label.trim().length < 2)
            e.label = 'Label must be at least 2 characters';
        if (form.label.trim().length > 100)
            e.label = 'Label cannot exceed 100 characters';
        return e;
    };

    // ── Submit ─────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);
        try {
            if (mode === 'add') {
                // Create new master
                await API.post('/admin/masters', {
                    category:    category.key,
                    value:       form.label.trim()
                                     .toLowerCase()
                                     .replace(/\s+/g, '_'),
                    label:       form.label.trim(),
                    description: form.description.trim() || null,
                    sort_order:  parseInt(form.sort_order) || 0
                });
                toast.success(`"${form.label.trim()}" added to ${category.label}!`);
            } else {
                // Update existing
                await API.put(`/admin/masters/${editItem.id}`, {
                    label:       form.label.trim(),
                    description: form.description.trim() || null,
                    sort_order:  parseInt(form.sort_order) || 0
                });
                toast.success(`"${form.label.trim()}" updated!`);
            }

            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Box */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1,    y: 0  }}
                exit={{ opacity: 0,    scale: 0.95, y: 10 }}
                className="relative bg-white rounded-2xl shadow-2xl
                           w-full max-w-md z-10 overflow-hidden"
            >
                {/* Top color bar */}
                <div className={`h-1 w-full ${colors.topBar}`} />

                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center
                                         justify-center ${colors.iconBg}`}>
                            <category.icon size={18} className={colors.icon} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">
                                {mode === 'add' ? 'Add New Value' : 'Edit Value'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {category.label}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400
                                   hover:text-slate-600 hover:bg-slate-100
                                   transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">

                    {/* Label */}
                    <div>
                        <label className="block text-xs font-semibold
                                          text-slate-600 mb-1.5">
                            Display Label{' '}
                            <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.label}
                            onChange={(e) => {
                                setForm({ ...form, label: e.target.value });
                                if (errors.label)
                                    setErrors({ ...errors, label: '' });
                            }}
                            placeholder={
                                `e.g. ${category.examples[0]}`
                            }
                            className={`w-full px-3.5 py-2.5 border-2 rounded-xl
                                        text-sm transition-all outline-none
                                        focus:ring-4
                                        ${errors.label
                                            ? 'border-rose-400 focus:ring-rose-500/10'
                                            : `border-slate-200 ${colors.ring}`
                                        }`}
                        />
                        {errors.label && (
                            <p className="text-xs text-rose-500 mt-1
                                          flex items-center gap-1">
                                <AlertCircle size={11} />
                                {errors.label}
                            </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">
                            This is what users will see in dropdowns
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold
                                          text-slate-600 mb-1.5">
                            Description{' '}
                            <span className="text-slate-400 font-normal">
                                (optional)
                            </span>
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm({ ...form, description: e.target.value })
                            }
                            placeholder="Brief description of this value..."
                            rows={2}
                            className={`w-full px-3.5 py-2.5 border-2 rounded-xl
                                        text-sm resize-none transition-all
                                        outline-none focus:ring-4
                                        border-slate-200 ${colors.ring}`}
                        />
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="block text-xs font-semibold
                                          text-slate-600 mb-1.5">
                            Sort Order
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={form.sort_order}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    sort_order: e.target.value
                                })
                            }
                            placeholder="0"
                            className={`w-full px-3.5 py-2.5 border-2 rounded-xl
                                        text-sm transition-all outline-none
                                        focus:ring-4 border-slate-200 ${colors.ring}`}
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            Lower number = appears first in dropdown
                        </p>
                    </div>

                    {/* Examples hint */}
                    {mode === 'add' && (
                        <div className={`rounded-xl p-3 ${colors.light}
                                         border ${colors.border}`}>
                            <p className="text-[11px] font-semibold
                                          text-slate-500 mb-1.5">
                                Common examples for {category.label}:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {category.examples.map((ex) => (
                                    <button
                                        key={ex}
                                        type="button"
                                        onClick={() =>
                                            setForm({ ...form, label: ex })
                                        }
                                        className={`px-2.5 py-1 rounded-lg text-[11px]
                                                    font-semibold border transition-all
                                                    hover:opacity-80 ${colors.badge}`}
                                    >
                                        {ex}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-xs font-semibold
                                       text-slate-600 bg-slate-100
                                       hover:bg-slate-200 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex-1 px-4 py-2.5 text-xs font-semibold
                                        text-white rounded-xl transition-all
                                        shadow-md flex items-center justify-center
                                        gap-2 disabled:opacity-60 ${colors.btn}`}
                        >
                            {saving ? (
                                <div className="w-3.5 h-3.5 border-2 border-white
                                                border-t-transparent rounded-full
                                                animate-spin" />
                            ) : (
                                mode === 'add'
                                    ? <Plus size={13} />
                                    : <Edit2 size={13} />
                            )}
                            {mode === 'add' ? 'Add Value' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────
// CATEGORY PANEL — Table for one category
// ──────────────────────────────────────────────────────────────
const CategoryPanel = ({ category, allData, onRefresh }) => {
    const colors  = COLOR_MAP[category.color];
    const Icon    = category.icon;

    const [search,        setSearch]        = useState('');
    const [showAddModal,  setShowAddModal]  = useState(false);
    const [editItem,      setEditItem]      = useState(null);
    const [deleteItem,    setDeleteItem]    = useState(null);
    const [deletingId,    setDeletingId]    = useState(null);
    const [togglingId,    setTogglingId]    = useState(null);

    // Filter data for this category
    const items = allData.filter(
        (m) => m.category === category.key
    );

    // Apply search
    const filtered = items.filter((m) =>
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(search.toLowerCase())
    );

    const activeCount   = items.filter((m) => m.is_active).length;
    const inactiveCount = items.filter((m) => !m.is_active).length;

    // ── Toggle Status ───────────────────────────────────────
    const handleToggle = async (item) => {
        setTogglingId(item.id);
        try {
            await API.patch(`/admin/masters/${item.id}/toggle`);
            toast.success(
                `"${item.label}" ${item.is_active ? 'deactivated' : 'activated'}`
            );
            onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Toggle failed');
        } finally {
            setTogglingId(null);
        }
    };

    // ── Delete ──────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteItem) return;
        setDeletingId(deleteItem.id);
        try {
            await API.delete(`/admin/masters/${deleteItem.id}`);
            toast.success(`"${deleteItem.label}" deleted`);
            setDeleteItem(null);
            onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
            >
                {/* Panel Header */}
                <div className="bg-white rounded-2xl border border-slate-100
                                shadow-sm overflow-hidden">
                    <div className={`h-1 w-full ${colors.topBar}`} />

                    <div className="p-5 flex items-center
                                    justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center
                                             justify-center ${colors.iconBg}`}>
                                <Icon size={18} className={colors.icon} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">
                                    {category.label}
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    {category.description}
                                </p>
                            </div>
                        </div>

                        {/* Mini Stats */}
                        <div className="flex items-center gap-3">
                            <div className="text-center px-3 py-1.5
                                            bg-slate-50 rounded-xl
                                            border border-slate-100">
                                <p className="text-sm font-bold text-slate-700">
                                    {items.length}
                                </p>
                                <p className="text-[10px] text-slate-400
                                              font-medium uppercase tracking-wide">
                                    Total
                                </p>
                            </div>
                            <div className="text-center px-3 py-1.5
                                            bg-emerald-50 rounded-xl
                                            border border-emerald-100">
                                <p className="text-sm font-bold text-emerald-700">
                                    {activeCount}
                                </p>
                                <p className="text-[10px] text-emerald-500
                                              font-medium uppercase tracking-wide">
                                    Active
                                </p>
                            </div>
                            <div className="text-center px-3 py-1.5
                                            bg-slate-50 rounded-xl
                                            border border-slate-100">
                                <p className="text-sm font-bold text-slate-500">
                                    {inactiveCount}
                                </p>
                                <p className="text-[10px] text-slate-400
                                              font-medium uppercase tracking-wide">
                                    Inactive
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search + Add */}
                <div className="bg-white rounded-2xl border border-slate-100
                                shadow-sm p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search
                                size={14}
                                className="absolute left-3.5 top-1/2
                                           -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={`Search ${category.label}...`}
                                className={`w-full pl-9 pr-4 py-2.5 border-2
                                            border-slate-200 rounded-xl text-sm
                                            outline-none focus:ring-4
                                            transition-all ${colors.ring}`}
                            />
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={() => setShowAddModal(true)}
                            className={`px-4 py-2.5 text-xs font-semibold text-white
                                        rounded-xl flex items-center gap-2
                                        transition-all shadow-md ${colors.btn}`}
                        >
                            <Plus size={13} />
                            Add {category.label}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100
                                shadow-sm overflow-hidden">
                    {filtered.length === 0 ? (
                        /* Empty State */
                        <div className="py-16 flex flex-col
                                        items-center justify-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center
                                             justify-center ${colors.iconBg}`}>
                                <Icon size={22} className={`${colors.icon} opacity-40`} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-600">
                                    {search
                                        ? `No results for "${search}"`
                                        : `No ${category.label} values yet`
                                    }
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {search
                                        ? 'Try a different search term'
                                        : `Click "Add ${category.label}" to create your first value`
                                    }
                                </p>
                            </div>
                            {!search && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className={`px-4 py-2 text-xs font-semibold
                                                text-white rounded-xl flex items-center
                                                gap-2 transition-all shadow-md ${colors.btn}`}
                                >
                                    <Plus size={12} />
                                    Add First Value
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/60">
                                        <th className="px-5 py-3 text-left text-[11px]
                                                       font-bold text-slate-400
                                                       uppercase tracking-widest">
                                            #
                                        </th>
                                        <th className="px-5 py-3 text-left text-[11px]
                                                       font-bold text-slate-400
                                                       uppercase tracking-widest">
                                            Label
                                        </th>
                                        <th className="px-5 py-3 text-left text-[11px]
                                                       font-bold text-slate-400
                                                       uppercase tracking-widest">
                                            Value (DB Key)
                                        </th>
                                        <th className="px-5 py-3 text-left text-[11px]
                                                       font-bold text-slate-400
                                                       uppercase tracking-widest">
                                            Description
                                        </th>
                                        <th className="px-5 py-3 text-left text-[11px]
                                                       font-bold text-slate-400
                                                       uppercase tracking-widest">
                                            Order
                                        </th>
                                        <th className="px-5 py-3 text-left text-[11px]
                                                       font-bold text-slate-400
                                                       uppercase tracking-widest">
                                            Status
                                        </th>
                                        <th className="px-5 py-3 text-left text-[11px]
                                                       font-bold text-slate-400
                                                       uppercase tracking-widest">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            className="border-t border-slate-50
                                                       hover:bg-slate-50/60
                                                       transition-colors group"
                                        >
                                            {/* # */}
                                            <td className="px-5 py-3.5">
                                                <span className="text-[12px]
                                                                  font-bold
                                                                  text-slate-300">
                                                    {idx + 1}
                                                </span>
                                            </td>

                                            {/* Label */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full
                                                                      flex-shrink-0
                                                                      ${item.is_active
                                                                          ? colors.dot
                                                                          : 'bg-slate-300'
                                                                      }`}
                                                    />
                                                    <span className="text-[13px]
                                                                      font-semibold
                                                                      text-slate-700">
                                                        {item.label}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Value */}
                                            <td className="px-5 py-3.5">
                                                <code className="px-2 py-0.5 bg-slate-100
                                                                  text-slate-500 rounded-lg
                                                                  text-[11px] font-mono">
                                                    {item.value}
                                                </code>
                                            </td>

                                            {/* Description */}
                                            <td className="px-5 py-3.5 max-w-[200px]">
                                                <span className="text-[12px]
                                                                  text-slate-400
                                                                  truncate block">
                                                    {item.description || (
                                                        <span className="italic
                                                                          text-slate-300">
                                                            —
                                                        </span>
                                                    )}
                                                </span>
                                            </td>

                                            {/* Sort Order */}
                                            <td className="px-5 py-3.5">
                                                <span className="text-[12px]
                                                                  font-bold
                                                                  text-slate-400">
                                                    {item.sort_order ?? 0}
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-xl
                                                                   text-[11px] font-bold
                                                                   border
                                                                   ${item.is_active
                                                                       ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                       : 'bg-slate-50 text-slate-500 border-slate-200'
                                                                   }`}>
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    {/* Edit */}
                                                    <button
                                                        onClick={() =>
                                                            setEditItem(item)
                                                        }
                                                        className="p-2 text-violet-600
                                                                   bg-violet-50
                                                                   hover:bg-violet-100
                                                                   rounded-xl
                                                                   transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>

                                                    {/* Toggle */}
                                                    <button
                                                        onClick={() => handleToggle(item)}
                                                        disabled={togglingId === item.id}
                                                        className={`p-2 rounded-xl
                                                                    transition-all
                                                                    disabled:opacity-60
                                                                    ${item.is_active
                                                                        ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                                                        : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                                                    }`}
                                                        title={
                                                            item.is_active
                                                                ? 'Deactivate'
                                                                : 'Activate'
                                                        }
                                                    >
                                                        {togglingId === item.id ? (
                                                            <div className="w-3 h-3
                                                                             border-2
                                                                             border-current
                                                                             border-t-transparent
                                                                             rounded-full
                                                                             animate-spin" />
                                                        ) : item.is_active ? (
                                                            <PowerOff size={13} />
                                                        ) : (
                                                            <Power size={13} />
                                                        )}
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() =>
                                                            setDeleteItem(item)
                                                        }
                                                        className="p-2 text-rose-600
                                                                   bg-rose-50
                                                                   hover:bg-rose-100
                                                                   rounded-xl
                                                                   transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Table Footer */}
                            <div className="px-5 py-3 border-t border-slate-50
                                            bg-slate-50/30 flex items-center
                                            justify-between">
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Showing{' '}
                                    <span className="font-bold text-slate-600">
                                        {filtered.length}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-bold text-slate-600">
                                        {items.length}
                                    </span>{' '}
                                    {category.label} values
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full
                                                      bg-emerald-400" />
                                    <span className="text-[11px] text-slate-400">
                                        {activeCount} active
                                    </span>
                                    <span className="w-2 h-2 rounded-full
                                                      bg-slate-300 ml-1" />
                                    <span className="text-[11px] text-slate-400">
                                        {inactiveCount} inactive
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <MasterFormModal
                        mode="add"
                        category={category}
                        onClose={() => setShowAddModal(false)}
                        onSuccess={onRefresh}
                    />
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editItem && (
                    <MasterFormModal
                        mode="edit"
                        category={category}
                        editItem={editItem}
                        onClose={() => setEditItem(null)}
                        onSuccess={onRefresh}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {deleteItem && (
                    <ConfirmModal
                        item={deleteItem}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteItem(null)}
                        loading={deletingId === deleteItem?.id}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// ──────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ──────────────────────────────────────────────────────────────
const Masters = () => {
    const [allData,      setAllData]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [activeTab,    setActiveTab]    = useState(CATEGORIES[0].key);
    const [refreshing,   setRefreshing]   = useState(false);

    // ── Fetch all masters ───────────────────────────────────
    const fetchMasters = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else         setRefreshing(true);

        try {
            const res = await API.get('/admin/masters');
            setAllData(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load masters');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchMasters(); }, [fetchMasters]);

    // ── Compute overall stats ───────────────────────────────
    const totalMasters  = allData.length;
    const activeMasters = allData.filter((m) => m.is_active).length;

    // Count per category (for tab badges)
    const countByCategory = {};
    CATEGORIES.forEach((cat) => {
        countByCategory[cat.key] = allData.filter(
            (m) => m.category === cat.key
        ).length;
    });

    const activeCategory = CATEGORIES.find((c) => c.key === activeTab);

    return (
        <div className="space-y-5">

            {/* ── PAGE HEADER ─────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between flex-wrap gap-3"
            >
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 bg-violet-100 rounded-xl
                                        flex items-center justify-center">
                            <SlidersHorizontal
                                size={16}
                                className="text-violet-600"
                            />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800
                                       tracking-tight">
                            Master Management
                        </h2>
                    </div>
                    <p className="text-xs text-slate-400 font-medium ml-10.5">
                        Manage all dropdown values — no developer support needed
                    </p>
                </div>

                {/* Refresh */}
                <button
                    onClick={() => fetchMasters(true)}
                    disabled={refreshing}
                    className="p-2.5 text-slate-500 bg-white border
                               border-slate-200 hover:border-violet-300
                               hover:text-violet-600 rounded-xl
                               transition-all shadow-sm disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw
                        size={15}
                        className={refreshing ? 'animate-spin' : ''}
                    />
                </button>
            </motion.div>

            {/* ── SUMMARY STAT CARDS ──────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
                {/* Total Masters */}
                <div className="bg-white rounded-2xl p-4 border
                                border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-violet-50 rounded-xl
                                        flex items-center justify-center">
                            <Layers size={16} className="text-violet-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-violet-600">
                        {loading ? '—' : totalMasters}
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold
                                  uppercase tracking-wide mt-0.5">
                        Total Values
                    </p>
                </div>

                {/* Active Masters */}
                <div className="bg-white rounded-2xl p-4 border
                                border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-emerald-50 rounded-xl
                                        flex items-center justify-center">
                            <ToggleRight
                                size={16}
                                className="text-emerald-600"
                            />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-600">
                        {loading ? '—' : activeMasters}
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold
                                  uppercase tracking-wide mt-0.5">
                        Active
                    </p>
                </div>

                {/* Inactive Masters */}
                <div className="bg-white rounded-2xl p-4 border
                                border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-slate-50 rounded-xl
                                        flex items-center justify-center">
                            <ToggleLeft
                                size={16}
                                className="text-slate-500"
                            />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-500">
                        {loading ? '—' : totalMasters - activeMasters}
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold
                                  uppercase tracking-wide mt-0.5">
                        Inactive
                    </p>
                </div>

                {/* Total Categories */}
                <div className="bg-white rounded-2xl p-4 border
                                border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl
                                        flex items-center justify-center">
                            <Grid3X3
                                size={16}
                                className="text-indigo-600"
                            />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-indigo-600">
                        {CATEGORIES.length}
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold
                                  uppercase tracking-wide mt-0.5">
                        Categories
                    </p>
                </div>
            </motion.div>

            {/* ── TAB NAVIGATION ──────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-100
                           shadow-sm p-2 overflow-x-auto"
            >
                <div className="flex items-center gap-1.5 min-w-max">
                    {CATEGORIES.map((cat) => {
                        const colors  = COLOR_MAP[cat.color];
                        const isActive = activeTab === cat.key;
                        const count   = countByCategory[cat.key] || 0;
                        const CatIcon = cat.icon;

                        return (
                            <button
                                key={cat.key}
                                onClick={() => setActiveTab(cat.key)}
                                className={`
                                    flex items-center gap-2 px-3.5 py-2.5
                                    rounded-xl text-[12px] font-semibold
                                    transition-all duration-200 whitespace-nowrap
                                    ${isActive
                                        ? `${colors.tab} shadow-md`
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <CatIcon size={13} />
                                <span>{cat.label}</span>

                                {/* Count badge */}
                                {count > 0 && (
                                    <span className={`
                                        px-1.5 py-0.5 rounded-full text-[10px]
                                        font-bold min-w-[18px] text-center
                                        ${isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                        }
                                    `}>
                                        {count}
                                    </span>
                                )}

                                {isActive && (
                                    <ChevronRight size={12} className="ml-0.5 opacity-70" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* ── TAB CONTENT ─────────────────────────────── */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-100
                                shadow-sm flex flex-col items-center
                                justify-center py-24 gap-4">
                    <div className="w-10 h-10 border-[3px] border-violet-500
                                    border-t-transparent rounded-full
                                    animate-spin" />
                    <p className="text-sm text-slate-400 font-medium">
                        Loading masters...
                    </p>
                </div>
            ) : (
                activeCategory && (
                    <CategoryPanel
                        key={activeTab}        // re-mount on tab switch
                        category={activeCategory}
                        allData={allData}
                        onRefresh={() => fetchMasters(true)}
                    />
                )
            )}
        </div>
    );
};

export default Masters;