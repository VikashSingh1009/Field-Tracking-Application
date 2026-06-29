// src/pages/MasterCategory.jsx
// ─────────────────────────────────────────────────────────────
// Individual Master Category Page
// Used by all child routes: /admin/masters/location-type etc.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence }          from 'framer-motion';
import { toast }                            from 'sonner';
import {
  Plus, Search, Edit2, Trash2,
  Power, PowerOff, X, AlertCircle,
  RefreshCw, MapPin, Layers, Shield,
  Zap, Flag, Grid3X3, Tag, CheckSquare
} from 'lucide-react';
import API from '../api/client';

/* ═══════════════════════════════════════════════════════════════
   CATEGORIES CONFIG
   Maps category key → display config
═══════════════════════════════════════════════════════════════ */
const CATEGORY_CONFIG = {
  location_type: {
    label:       'Location Type',
    icon:        MapPin,
    color:       'violet',
    description: 'Types of field locations (Entry/Exit, Square, etc.)',
    examples:    ['Entry/Exit', 'Square', 'Tri Junction', 'Surveillance Point'],
  },
  phase_type: {
    label:       'Phase Type',
    icon:        Layers,
    color:       'fuchsia',
    description: 'Project phase classifications',
    examples:    ['Phase 1', 'Phase 2', 'Pilot', 'Final'],
  },
  vendor_type: {
    label:       'Vendor Type',
    icon:        Shield,
    color:       'teal',
    description: 'Types of vendors/contractors',
    examples:    ['Civil', 'Electrical', 'IT', 'Security'],
  },
  activity_type: {
    label:       'Activity Type',
    icon:        Zap,
    color:       'amber',
    description: 'Types of field activities',
    examples:    ['Survey', 'Installation', 'Maintenance', 'Inspection'],
  },
  priority: {
    label:       'Priority',
    icon:        Flag,
    color:       'rose',
    description: 'Task and activity priority levels',
    examples:    ['Low', 'Medium', 'High', 'Critical'],
  },
  zone: {
    label:       'Zone',
    icon:        Grid3X3,
    color:       'blue',
    description: 'Geographic zones for field operations',
    examples:    ['Zone A', 'Zone B', 'North Zone', 'South Zone'],
  },
  status: {
    label:       'Status',
    icon:        CheckSquare,
    color:       'emerald',
    description: 'Custom status values for tasks',
    examples:    ['Pending', 'In Progress', 'Completed', 'On Hold'],
  },
  category: {
    label:       'Category',
    icon:        Tag,
    color:       'indigo',
    description: 'General classification categories',
    examples:    ['Infrastructure', 'Safety', 'Urban', 'Rural'],
  },
};

/* ═══════════════════════════════════════════════════════════════
   COLOR MAP
═══════════════════════════════════════════════════════════════ */
const COLOR_MAP = {
  violet:  {
    topBar: 'bg-violet-500',  icon: 'text-violet-600',
    iconBg: 'bg-violet-50',   btn: 'bg-violet-600 hover:bg-violet-700',
    ring:   'focus:border-violet-500 focus:ring-violet-500/10',
    badge:  'bg-violet-50 text-violet-700 border-violet-100',
    dot:    'bg-violet-500',  light: 'bg-violet-50', border: 'border-violet-200',
    shadow: 'shadow-violet-500/20',
  },
  fuchsia: {
    topBar: 'bg-fuchsia-500', icon: 'text-fuchsia-600',
    iconBg: 'bg-fuchsia-50',  btn: 'bg-fuchsia-600 hover:bg-fuchsia-700',
    ring:   'focus:border-fuchsia-500 focus:ring-fuchsia-500/10',
    badge:  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    dot:    'bg-fuchsia-500', light: 'bg-fuchsia-50', border: 'border-fuchsia-200',
    shadow: 'shadow-fuchsia-500/20',
  },
  teal: {
    topBar: 'bg-teal-500',    icon: 'text-teal-600',
    iconBg: 'bg-teal-50',     btn: 'bg-teal-600 hover:bg-teal-700',
    ring:   'focus:border-teal-500 focus:ring-teal-500/10',
    badge:  'bg-teal-50 text-teal-700 border-teal-100',
    dot:    'bg-teal-500',    light: 'bg-teal-50', border: 'border-teal-200',
    shadow: 'shadow-teal-500/20',
  },
  amber: {
    topBar: 'bg-amber-500',   icon: 'text-amber-600',
    iconBg: 'bg-amber-50',    btn: 'bg-amber-600 hover:bg-amber-700',
    ring:   'focus:border-amber-500 focus:ring-amber-500/10',
    badge:  'bg-amber-50 text-amber-700 border-amber-100',
    dot:    'bg-amber-500',   light: 'bg-amber-50', border: 'border-amber-200',
    shadow: 'shadow-amber-500/20',
  },
  rose: {
    topBar: 'bg-rose-500',    icon: 'text-rose-600',
    iconBg: 'bg-rose-50',     btn: 'bg-rose-600 hover:bg-rose-700',
    ring:   'focus:border-rose-500 focus:ring-rose-500/10',
    badge:  'bg-rose-50 text-rose-700 border-rose-100',
    dot:    'bg-rose-500',    light: 'bg-rose-50', border: 'border-rose-200',
    shadow: 'shadow-rose-500/20',
  },
  blue: {
    topBar: 'bg-blue-500',    icon: 'text-blue-600',
    iconBg: 'bg-blue-50',     btn: 'bg-blue-600 hover:bg-blue-700',
    ring:   'focus:border-blue-500 focus:ring-blue-500/10',
    badge:  'bg-blue-50 text-blue-700 border-blue-100',
    dot:    'bg-blue-500',    light: 'bg-blue-50', border: 'border-blue-200',
    shadow: 'shadow-blue-500/20',
  },
  emerald: {
    topBar: 'bg-emerald-500', icon: 'text-emerald-600',
    iconBg: 'bg-emerald-50',  btn: 'bg-emerald-600 hover:bg-emerald-700',
    ring:   'focus:border-emerald-500 focus:ring-emerald-500/10',
    badge:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    dot:    'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200',
    shadow: 'shadow-emerald-500/20',
  },
  indigo: {
    topBar: 'bg-indigo-500',  icon: 'text-indigo-600',
    iconBg: 'bg-indigo-50',   btn: 'bg-indigo-600 hover:bg-indigo-700',
    ring:   'focus:border-indigo-500 focus:ring-indigo-500/10',
    badge:  'bg-indigo-50 text-indigo-700 border-indigo-100',
    dot:    'bg-indigo-500',  light: 'bg-indigo-50', border: 'border-indigo-200',
    shadow: 'shadow-indigo-500/20',
  },
};

/* ═══════════════════════════════════════════════════════════════
   CONFIRM DELETE MODAL
═══════════════════════════════════════════════════════════════ */
const ConfirmModal = ({ item, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center
                  justify-center p-4">
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      onClick={onCancel}
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      exit={{ opacity: 0,    scale: 0.95, y: 10 }}
      className="relative bg-white rounded-2xl shadow-2xl
                 p-6 w-full max-w-sm z-10"
    >
      <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center
                      justify-center mx-auto mb-4">
        <AlertCircle size={22} className="text-rose-600" />
      </div>
      <div className="text-center mb-6">
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Delete Value?
        </h3>
        <p className="text-sm text-slate-500">
          Delete{' '}
          <span className="font-semibold text-slate-700">
            "{item?.label}"
          </span>
          ? This cannot be undone.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm font-semibold
                     text-slate-600 bg-slate-100 hover:bg-slate-200
                     rounded-xl transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm font-semibold text-white
                     bg-rose-600 hover:bg-rose-700 rounded-xl transition-all
                     flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white
                              border-t-transparent rounded-full animate-spin" />
            : <Trash2 size={14} />
          }
          Delete
        </button>
      </div>
    </motion.div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   ADD / EDIT MODAL
═══════════════════════════════════════════════════════════════ */
const MasterFormModal = ({ mode, config, colors, editItem, onClose, onSuccess }) => {
  const [form,   setForm]   = useState({
    label:       editItem?.label       || '',
    description: editItem?.description || '',
    sort_order:  editItem?.sort_order  ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.label.trim())            e.label = 'Label is required';
    if (form.label.trim().length < 2)  e.label = 'At least 2 characters';
    if (form.label.trim().length > 100) e.label = 'Max 100 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      if (mode === 'add') {
        await API.post('/admin/masters', {
          category:    config.key,
          value:       form.label.trim().toLowerCase().replace(/\s+/g, '_'),
          label:       form.label.trim(),
          description: form.description.trim() || null,
          sort_order:  parseInt(form.sort_order) || 0,
        });
        toast.success(`"${form.label.trim()}" added! ✅`);
      } else {
        await API.put(`/admin/masters/${editItem.id}`, {
          label:       form.label.trim(),
          description: form.description.trim() || null,
          sort_order:  parseInt(form.sort_order) || 0,
        });
        toast.success(`"${form.label.trim()}" updated! ✅`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center
                    justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{ opacity: 0,    scale: 0.95, y: 10 }}
        className="relative bg-white rounded-2xl shadow-2xl
                   w-full max-w-md z-10 overflow-hidden"
      >
        {/* Top bar */}
        <div className={`h-1 w-full ${colors.topBar}`} />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center
                             justify-center ${colors.iconBg}`}>
              <Icon size={18} className={colors.icon} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {mode === 'add' ? 'Add New Value' : 'Edit Value'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {config.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400
                       hover:text-slate-600 hover:bg-slate-100 transition-all"
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
              Display Label <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.label}
              autoFocus
              onChange={(e) => {
                setForm({ ...form, label: e.target.value });
                if (errors.label) setErrors({ ...errors, label: '' });
              }}
              placeholder={`e.g. ${config.examples[0]}`}
              className={`w-full px-3.5 py-2.5 border-2 rounded-xl text-sm
                          transition-all outline-none focus:ring-4
                          ${errors.label
                            ? 'border-rose-400 focus:ring-rose-500/10'
                            : `border-slate-200 ${colors.ring}`
                          }`}
            />
            {errors.label && (
              <p className="text-xs text-rose-500 mt-1
                            flex items-center gap-1">
                <AlertCircle size={11} /> {errors.label}
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
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Brief description..."
              rows={2}
              className={`w-full px-3.5 py-2.5 border-2 rounded-xl text-sm
                          resize-none transition-all outline-none focus:ring-4
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
                setForm({ ...form, sort_order: e.target.value })
              }
              className={`w-full px-3.5 py-2.5 border-2 rounded-xl text-sm
                          transition-all outline-none focus:ring-4
                          border-slate-200 ${colors.ring}`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Lower number = appears first in dropdown
            </p>
          </div>

          {/* Quick examples */}
          {mode === 'add' && (
            <div className={`rounded-xl p-3 ${colors.light}
                             border ${colors.border}`}>
              <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                Common examples:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {config.examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setForm({ ...form, label: ex })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold
                                border transition-all hover:opacity-80 ${colors.badge}`}
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
                         text-slate-600 bg-slate-100 hover:bg-slate-200
                         rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-4 py-2.5 text-xs font-semibold text-white
                          rounded-xl transition-all shadow-md flex items-center
                          justify-center gap-2 disabled:opacity-60
                          ${colors.btn} ${colors.shadow}`}
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white
                                border-t-transparent rounded-full animate-spin" />
              ) : mode === 'add' ? (
                <><Plus size={13} /> Add Value</>
              ) : (
                <><Edit2 size={13} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN MASTER CATEGORY PAGE
═══════════════════════════════════════════════════════════════ */
const MasterCategory = ({ category }) => {

  // ✅ Get config for current category
  const config = {
    ...CATEGORY_CONFIG[category],
    key: category,
  };
  const colors = COLOR_MAP[config?.color || 'violet'];
  const Icon   = config?.icon || MapPin;

  /* ── States ───────────────────────────────────────────────── */
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [showAdd,     setShowAdd]     = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [deleteItem,  setDeleteItem]  = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const [togglingId,  setTogglingId]  = useState(null);

  /* ── Fetch Data ───────────────────────────────────────────── */
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);
    try {
      const res = await API.get(
        `/admin/masters?category=${category}`
      );
      setData(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  // ✅ Refetch when category changes (navigating between child routes)
  useEffect(() => {
    setSearch('');   // Reset search on category change
    fetchData();
  }, [fetchData, category]);

  /* ── Filter by search ─────────────────────────────────────── */
  const filtered = data.filter((m) =>
    m.label.toLowerCase().includes(search.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(search.toLowerCase())
  );

  /* ── Stats ────────────────────────────────────────────────── */
  const activeCount   = data.filter((m) => m.is_active).length;
  const inactiveCount = data.filter((m) => !m.is_active).length;

  /* ── Toggle Status ────────────────────────────────────────── */
  const handleToggle = async (item) => {
    setTogglingId(item.id);
    try {
      await API.patch(`/admin/masters/${item.id}/toggle`);
      toast.success(
        `"${item.label}" ${item.is_active ? 'deactivated' : 'activated'}!`
      );
      fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    } finally {
      setTogglingId(null);
    }
  };

  /* ── Delete ───────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeletingId(deleteItem.id);
    try {
      await API.delete(`/admin/masters/${deleteItem.id}`);
      toast.success(`"${deleteItem.label}" deleted!`);
      setDeleteItem(null);
      fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── If invalid category ──────────────────────────────────── */
  if (!config?.label) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Category not found</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ── Page Header ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-3">
          {/* ✅ Category Icon + Color */}
          <div className={`w-10 h-10 rounded-xl flex items-center
                           justify-center ${colors.iconBg}`}>
            <Icon size={18} className={colors.icon} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800
                           tracking-tight">
              {config.label}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {config.description}
            </p>
          </div>
        </div>

        {/* ── Header Actions ─────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 text-slate-500 bg-white border border-slate-200
                       hover:border-violet-300 hover:text-violet-600 rounded-xl
                       transition-all shadow-sm disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'animate-spin' : ''}
            />
          </button>

          {/* Add Button */}
          <button
            onClick={() => setShowAdd(true)}
            className={`px-4 py-2.5 text-xs font-semibold text-white
                        rounded-2xl flex items-center gap-2 transition-all
                        shadow-md ${colors.btn} ${colors.shadow}`}
          >
            <Plus size={14} /> Add {config.label}
          </button>
        </div>
      </motion.div>

      {/* ── Stats Row ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        {/* Total */}
        <div className="bg-white rounded-2xl p-4 border
                        border-slate-100 shadow-sm text-center">
          <p className="text-2xl font-extrabold text-slate-700">
            {loading ? '—' : data.length}
          </p>
          <p className="text-[11px] text-slate-400 font-semibold
                        uppercase tracking-wide mt-0.5">
            Total
          </p>
        </div>
        {/* Active */}
        <div className="bg-white rounded-2xl p-4 border
                        border-slate-100 shadow-sm text-center">
          <p className="text-2xl font-extrabold text-emerald-600">
            {loading ? '—' : activeCount}
          </p>
          <p className="text-[11px] text-slate-400 font-semibold
                        uppercase tracking-wide mt-0.5">
            Active
          </p>
        </div>
        {/* Inactive */}
        <div className="bg-white rounded-2xl p-4 border
                        border-slate-100 shadow-sm text-center">
          <p className="text-2xl font-extrabold text-slate-400">
            {loading ? '—' : inactiveCount}
          </p>
          <p className="text-[11px] text-slate-400 font-semibold
                        uppercase tracking-wide mt-0.5">
            Inactive
          </p>
        </div>
      </motion.div>

      {/* ── Search Bar ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100
                   shadow-sm p-4"
      >
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2
                                        -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${config.label}...`}
            className={`w-full pl-10 pr-4 py-2.5 border-2 border-slate-200
                        rounded-xl text-sm outline-none focus:ring-4
                        transition-all ${colors.ring}`}
          />
        </div>
      </motion.div>

      {/* ── Table ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-100
                   shadow-sm overflow-hidden"
      >
        {/* Top color bar */}
        <div className={`h-1 w-full ${colors.topBar}`} />

        {loading ? (
          <div className="flex flex-col items-center justify-center
                          py-20 gap-3">
            <div className="w-10 h-10 border-[3px] border-violet-500
                            border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">
              Loading {config.label}...
            </p>
          </div>

        ) : filtered.length === 0 ? (
          /* ── Empty State ──────────────────────────────── */
          <div className="py-20 flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center
                             justify-center ${colors.iconBg}`}>
              <Icon size={26} className={`${colors.icon} opacity-40`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">
                {search
                  ? `No results for "${search}"`
                  : `No ${config.label} values yet`
                }
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {search
                  ? 'Try a different search term'
                  : `Click "Add ${config.label}" to create first value`
                }
              </p>
            </div>
            {!search && (
              <button
                onClick={() => setShowAdd(true)}
                className={`px-4 py-2 text-xs font-semibold text-white
                            rounded-xl flex items-center gap-2 transition-all
                            shadow-md ${colors.btn}`}
              >
                <Plus size={12} /> Add First Value
              </button>
            )}
          </div>

        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/60">
                    <th className="px-5 py-3 text-left text-[11px] font-bold
                                   text-slate-400 uppercase tracking-widest w-12">
                      #
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold
                                   text-slate-400 uppercase tracking-widest">
                      Label
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold
                                   text-slate-400 uppercase tracking-widest">
                      DB Key
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold
                                   text-slate-400 uppercase tracking-widest">
                      Description
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold
                                   text-slate-400 uppercase tracking-widest w-16">
                      Order
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold
                                   text-slate-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold
                                   text-slate-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-50
                                 hover:bg-slate-50/60 transition-colors"
                    >
                      {/* # */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-bold text-slate-300">
                          {idx + 1}
                        </span>
                      </td>

                      {/* Label */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0
                            ${item.is_active ? colors.dot : 'bg-slate-300'}`}
                          />
                          <span className="text-[13px] font-semibold
                                           text-slate-700">
                            {item.label}
                          </span>
                        </div>
                      </td>

                      {/* DB Key */}
                      <td className="px-5 py-3.5">
                        <code className="px-2 py-0.5 bg-slate-100 text-slate-500
                                         rounded-lg text-[11px] font-mono">
                          {item.value}
                        </code>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <span className="text-[12px] text-slate-400
                                         truncate block">
                          {item.description || (
                            <span className="italic text-slate-300">—</span>
                          )}
                        </span>
                      </td>

                      {/* Sort Order */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-bold text-slate-400">
                          {item.sort_order ?? 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-xl text-[11px]
                          font-bold border
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
                            onClick={() => setEditItem(item)}
                            className="p-2 text-violet-600 bg-violet-50
                                       hover:bg-violet-100 rounded-xl
                                       transition-all"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Toggle */}
                          <button
                            onClick={() => handleToggle(item)}
                            disabled={togglingId === item.id}
                            className={`p-2 rounded-xl transition-all
                              disabled:opacity-60
                              ${item.is_active
                                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            title={item.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {togglingId === item.id ? (
                              <div className="w-3 h-3 border-2 border-current
                                              border-t-transparent rounded-full
                                              animate-spin" />
                            ) : item.is_active ? (
                              <PowerOff size={13} />
                            ) : (
                              <Power size={13} />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteItem(item)}
                            className="p-2 text-rose-600 bg-rose-50
                                       hover:bg-rose-100 rounded-xl
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
            </div>

            {/* Table Footer */}
            <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/30
                            flex items-center justify-between">
              <p className="text-[11px] text-slate-400 font-medium">
                Showing{' '}
                <span className="font-bold text-slate-600">
                  {filtered.length}
                </span>{' '}
                of{' '}
                <span className="font-bold text-slate-600">
                  {data.length}
                </span>{' '}
                {config.label} values
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-slate-400">
                    {activeCount} active
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="text-[11px] text-slate-400">
                    {inactiveCount} inactive
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════ */}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <MasterFormModal
            mode="add"
            config={config}
            colors={colors}
            onClose={() => setShowAdd(false)}
            onSuccess={() => fetchData(true)}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editItem && (
          <MasterFormModal
            mode="edit"
            config={config}
            colors={colors}
            editItem={editItem}
            onClose={() => setEditItem(null)}
            onSuccess={() => fetchData(true)}
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
    </div>
  );
};

export default MasterCategory;