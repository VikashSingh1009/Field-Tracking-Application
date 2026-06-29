// AssignWorkers.jsx
// Admin can assign Workers to Supervisors
// Matches existing UI style from Users.jsx

import { useState, useEffect, useCallback } from "react";
import API from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  Wrench,
  Search,
  UserPlus,
  UserMinus,
  ChevronRight,
  Loader,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  AlertCircle,
  ArrowRight,
  Check,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   STAT CARD — Reused same pattern as Users.jsx
═══════════════════════════════════════════════════════════════ */
const StatCard = ({ value, label, icon: Icon, bg, text }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="relative bg-white rounded-2xl p-4 border border-slate-100
               shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
  >
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${bg} opacity-60`} />
    <div className="flex items-center justify-between mb-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50">
        <Icon size={17} className={text} />
      </div>
    </div>
    <p className={`text-2xl font-extrabold tracking-tight ${text}`}>{value}</p>
    <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">
      {label}
    </p>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   WORKER CARD — Single worker row (assigned or unassigned)
═══════════════════════════════════════════════════════════════ */
const WorkerCard = ({ worker, mode, onAssign, onRemove, isSelected,
  onToggleSelect, selectedSupervisorId }) => {

  const [actionLoading, setActionLoading] = useState(false);

  // Single remove button handler
  const handleRemove = async () => {
    if (!window.confirm(`Remove ${worker.full_name} from supervisor?`)) return;
    setActionLoading(true);
    try {
      await onRemove(worker.id);
    } finally {
      setActionLoading(false);
    }
  };

  // Single assign button handler
  const handleAssign = async () => {
    if (!selectedSupervisorId) {
      toast.error("Please select a supervisor first!");
      return;
    }
    setActionLoading(true);
    try {
      await onAssign(worker.id);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`flex items-center justify-between px-4 py-3 rounded-xl
                 border transition-all duration-200 group
                 ${mode === "unassigned"
          ? isSelected
            ? "bg-violet-50 border-violet-300 shadow-sm"
            : "bg-slate-50 border-slate-200 hover:border-violet-200 hover:bg-violet-50/50"
          : "bg-emerald-50/60 border-emerald-100 hover:border-emerald-200"
        }`}
    >
      {/* Left — Checkbox (unassigned) + Avatar + Name */}
      <div className="flex items-center gap-3">

        {/* Checkbox — only for unassigned workers (bulk select) */}
        {mode === "unassigned" && (
          <button
            onClick={() => onToggleSelect(worker.id)}
            className={`w-5 h-5 rounded-md border-2 flex items-center
                       justify-center transition-all flex-shrink-0
                       ${isSelected
                ? "bg-violet-600 border-violet-600"
                : "border-slate-300 hover:border-violet-400"
              }`}
          >
            {isSelected && <Check size={11} className="text-white" />}
          </button>
        )}

        {/* Avatar */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center
                        text-white text-xs font-bold shadow-sm flex-shrink-0
                        ${mode === "assigned"
            ? "bg-gradient-to-br from-emerald-500 to-teal-600"
            : "bg-gradient-to-br from-slate-400 to-slate-500"
          }`}>
          {worker.full_name?.[0]?.toUpperCase()}
        </div>

        {/* Name + Phone */}
        <div>
          <p className="text-[13px] font-semibold text-slate-700 leading-tight">
            {worker.full_name}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            📞 {worker.phone}
          </p>
        </div>
      </div>

      {/* Right — Action Button */}
      <div className="flex-shrink-0">
        {mode === "assigned" ? (
          // Remove button
          <button
            onClick={handleRemove}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px]
                       font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100
                       rounded-xl border border-rose-100 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove from supervisor"
          >
            {actionLoading
              ? <Loader size={11} className="animate-spin" />
              : <UserMinus size={11} />
            }
            Remove
          </button>
        ) : (
          // Assign button (single)
          <button
            onClick={handleAssign}
            disabled={actionLoading || !selectedSupervisorId}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px]
                       font-semibold text-violet-600 bg-violet-50
                       hover:bg-violet-100 rounded-xl border border-violet-100
                       transition-all disabled:opacity-50
                       disabled:cursor-not-allowed"
            title={!selectedSupervisorId
              ? "Select a supervisor first"
              : "Assign to selected supervisor"
            }
          >
            {actionLoading
              ? <Loader size={11} className="animate-spin" />
              : <UserPlus size={11} />
            }
            Assign
          </button>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SUPERVISOR CARD — Clickable card in left panel
═══════════════════════════════════════════════════════════════ */
const SupervisorCard = ({ supervisor, isSelected, onClick }) => (
  <motion.button
    whileHover={{ x: 2 }}
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5
               rounded-xl border transition-all duration-200 text-left
               ${isSelected
        ? "bg-violet-600 border-violet-600 shadow-md shadow-violet-500/20"
        : "bg-white border-slate-200 hover:border-violet-200 hover:bg-violet-50/50"
      }`}
  >
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                      text-white text-sm font-bold shadow-sm flex-shrink-0
                      ${isSelected
          ? "bg-white/20"
          : "bg-gradient-to-br from-blue-500 to-indigo-600"
        }`}>
        {supervisor.full_name?.[0]?.toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <p className={`text-[13px] font-semibold truncate leading-tight
                      ${isSelected ? "text-white" : "text-slate-700"}`}>
          {supervisor.full_name}
        </p>
        <p className={`text-[10px] font-medium
                      ${isSelected ? "text-violet-200" : "text-slate-400"}`}>
          📞 {supervisor.phone}
        </p>
      </div>
    </div>

    {/* Worker Count Badge */}
    <div className={`flex items-center gap-1.5 flex-shrink-0
                    ${isSelected ? "text-white" : ""}`}>
      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold
                       border transition-all
                       ${isSelected
          ? "bg-white/20 border-white/30 text-white"
          : "bg-blue-50 border-blue-100 text-blue-700"
        }`}>
        {supervisor.worker_count ?? supervisor.my_workers?.length ?? 0} workers
      </span>
      <ChevronRight
        size={14}
        className={isSelected ? "text-white" : "text-slate-400"}
      />
    </div>
  </motion.button>
);

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════════ */
const EmptyState = ({ icon: Icon, title, subtitle, iconColor = "text-slate-300" }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
      <Icon size={24} className={iconColor} />
    </div>
    <p className="text-sm text-slate-400 font-semibold">{title}</p>
    {subtitle && (
      <p className="text-xs text-slate-300 text-center max-w-[200px]">{subtitle}</p>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — AssignWorkers
═══════════════════════════════════════════════════════════════ */
const AssignWorkers = () => {

  /* ── Data States ──────────────────────────────────────────── */
  const [supervisors,       setSupervisors]       = useState([]);
  const [unassignedWorkers, setUnassignedWorkers] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  /* ── UI States ────────────────────────────────────────────── */
  const [loading,        setLoading]        = useState(true);
  const [bulkLoading,    setBulkLoading]    = useState(false);
  const [supervisorSearch, setSupervisorSearch] = useState("");
  const [workerSearch,   setWorkerSearch]   = useState("");
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]); // for bulk assign

  /* ── Stats ────────────────────────────────────────────────── */
  const totalSupervisors = supervisors.length;
  const totalAssigned = supervisors.reduce(
    (sum, s) => sum + (s.my_workers?.length ?? 0), 0
  );
  const totalUnassigned = unassignedWorkers.length;
  const totalWorkers = totalAssigned + totalUnassigned;

  /* ── Fetch All Data ───────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedWorkerIds([]); // clear selection on refresh

      // Fetch both in parallel
      const [supRes, unassignedRes] = await Promise.all([
        API.get("/admin/supervisors-with-workers"),
        API.get("/admin/unassigned-workers"),
      ]);

      const supData = supRes.data.data || [];
      setSupervisors(supData);
      setUnassignedWorkers(unassignedRes.data.data || []);

      // If a supervisor was selected, refresh their data too
      if (selectedSupervisor) {
        const refreshed = supData.find((s) => s.id === selectedSupervisor.id);
        if (refreshed) setSelectedSupervisor(refreshed);
      }

    } catch (err) {
      console.error("fetchAll error:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []); // no dependency on selectedSupervisor to avoid infinite loop

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Assign Single Worker ─────────────────────────────────── */
  const handleAssignWorker = async (workerId) => {
    if (!selectedSupervisor) {
      toast.error("Please select a supervisor first!");
      return;
    }
    try {
      await API.post(`/admin/users/${workerId}/assign-supervisor`, {
        supervisor_id: selectedSupervisor.id,
      });
      toast.success("Worker assigned successfully! ✅");
      await fetchAll();

      // Refresh selectedSupervisor from updated list
      setSupervisors((prev) => {
        const updated = prev.find((s) => s.id === selectedSupervisor.id);
        if (updated) setSelectedSupervisor(updated);
        return prev;
      });

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign worker");
    }
  };

  /* ── Remove Single Worker ─────────────────────────────────── */
  const handleRemoveWorker = async (workerId) => {
    try {
      await API.delete(`/admin/users/${workerId}/remove-supervisor`);
      toast.success("Worker removed from supervisor ✅");
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove worker");
    }
  };

  /* ── Bulk Assign Workers ──────────────────────────────────── */
  const handleBulkAssign = async () => {
    if (!selectedSupervisor) {
      toast.error("Please select a supervisor first!");
      return;
    }
    if (selectedWorkerIds.length === 0) {
      toast.error("Please select at least one worker!");
      return;
    }

    setBulkLoading(true);
    try {
      await API.post("/admin/users/bulk-assign", {
        supervisor_id: selectedSupervisor.id,
        worker_ids:    selectedWorkerIds,
      });
      toast.success(
        `✅ ${selectedWorkerIds.length} worker(s) assigned to ${selectedSupervisor.full_name}!`
      );
      setSelectedWorkerIds([]);
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk assign failed");
    } finally {
      setBulkLoading(false);
    }
  };

  /* ── Toggle Single Worker Selection ──────────────────────── */
  const toggleWorkerSelect = (workerId) => {
    setSelectedWorkerIds((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  /* ── Select All / Deselect All ────────────────────────────── */
  const handleSelectAll = () => {
    const filtered = filteredUnassignedWorkers.map((w) => w.id);
    const allSelected = filtered.every((id) => selectedWorkerIds.includes(id));

    if (allSelected) {
      // Deselect all filtered workers
      setSelectedWorkerIds((prev) =>
        prev.filter((id) => !filtered.includes(id))
      );
    } else {
      // Select all filtered workers
      setSelectedWorkerIds((prev) => [...new Set([...prev, ...filtered])]);
    }
  };

  /* ── Filtered Lists ───────────────────────────────────────── */
  const filteredSupervisors = supervisors.filter((s) =>
    s.full_name?.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
    s.phone?.includes(supervisorSearch)
  );

  const filteredUnassignedWorkers = unassignedWorkers.filter((w) =>
    w.full_name?.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.phone?.includes(workerSearch)
  );

  // Workers currently assigned to selected supervisor
  const assignedWorkers = selectedSupervisor?.my_workers || [];
  const filteredAssignedWorkers = assignedWorkers.filter((w) =>
    w.full_name?.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.phone?.includes(workerSearch)
  );

  // Check if all filtered unassigned workers are selected
  const allFilteredSelected =
    filteredUnassignedWorkers.length > 0 &&
    filteredUnassignedWorkers.every((w) => selectedWorkerIds.includes(w.id));

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Assign Workers to Supervisors
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Select a supervisor → assign or remove workers
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold
                     bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200
                     transition-all border border-slate-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          value={totalWorkers}    label="Total Workers"
          icon={Wrench}           bg="bg-violet-500"   text="text-violet-600"
        />
        <StatCard
          value={totalSupervisors} label="Supervisors"
          icon={Shield}           bg="bg-blue-500"     text="text-blue-600"
        />
        <StatCard
          value={totalAssigned}   label="Assigned"
          icon={CheckCircle2}     bg="bg-emerald-500"  text="text-emerald-600"
        />
        <StatCard
          value={totalUnassigned} label="Unassigned"
          icon={AlertCircle}      bg="bg-amber-500"    text="text-amber-600"
        />
      </div>

      {/* ── Info Banner (when no supervisor selected) ──────── */}
      {!selectedSupervisor && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-blue-50 border border-blue-100
                     rounded-2xl px-5 py-4"
        >
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center
                          justify-center flex-shrink-0">
            <ArrowRight size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-700">
              Select a Supervisor to Get Started
            </p>
            <p className="text-xs text-blue-500 font-medium mt-0.5">
              Click any supervisor on the left to view and manage their workers
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Main Two-Panel Layout ──────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center
                        py-24 gap-4 bg-white rounded-2xl border border-slate-100">
          <div className="w-12 h-12 border-[3px] border-violet-500
                          border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            Loading assignment data...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ═══════════════════════════════════════════════════
              LEFT PANEL — Supervisors List
          ═══════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 bg-white rounded-2xl border
                       border-slate-100 shadow-sm overflow-hidden
                       flex flex-col"
          >
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex
                                  items-center justify-center">
                    <UserCheck size={15} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      Supervisors
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {filteredSupervisors.length} of {totalSupervisors}
                    </p>
                  </div>
                </div>

                {/* Selected indicator */}
                {selectedSupervisor && (
                  <button
                    onClick={() => {
                      setSelectedSupervisor(null);
                      setSelectedWorkerIds([]);
                      setWorkerSearch("");
                    }}
                    className="flex items-center gap-1 text-[10px] font-semibold
                               text-rose-500 hover:text-rose-700 bg-rose-50
                               hover:bg-rose-100 px-2.5 py-1.5 rounded-xl
                               transition-all border border-rose-100"
                  >
                    <XCircle size={10} /> Clear
                  </button>
                )}
              </div>

              {/* Supervisor Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2
                                              -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={supervisorSearch}
                  onChange={(e) => setSupervisorSearch(e.target.value)}
                  placeholder="Search supervisors..."
                  className="w-full pl-8 pr-4 py-2 border-2 border-slate-200
                             rounded-xl text-xs focus:outline-none
                             focus:ring-4 focus:ring-violet-500/10
                             focus:border-violet-500 transition-all"
                />
              </div>
            </div>

            {/* Supervisor Cards List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2
                            max-h-[520px] min-h-[200px]">
              {filteredSupervisors.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="No supervisors found"
                  subtitle="Try a different search"
                />
              ) : (
                <AnimatePresence>
                  {filteredSupervisors.map((sup) => (
                    <SupervisorCard
                      key={sup.id}
                      supervisor={sup}
                      isSelected={selectedSupervisor?.id === sup.id}
                      onClick={() => {
                        setSelectedSupervisor(sup);
                        setSelectedWorkerIds([]);
                        setWorkerSearch("");
                      }}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════════════════
              RIGHT PANEL — Workers (Assigned + Unassigned)
          ═══════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 space-y-4"
          >

            {/* ── Assigned Workers Panel ─────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100
                           shadow-sm overflow-hidden">

              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex
                                    items-center justify-center">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">
                        {selectedSupervisor
                          ? `${selectedSupervisor.full_name}'s Workers`
                          : "Assigned Workers"
                        }
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {selectedSupervisor
                          ? `${assignedWorkers.length} worker(s) currently assigned`
                          : "Select a supervisor to view"
                        }
                      </p>
                    </div>
                  </div>

                  {/* Supervisor badge */}
                  {selectedSupervisor && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5
                                     bg-blue-50 border border-blue-100 rounded-xl
                                     text-[11px] font-bold text-blue-700">
                      <Shield size={11} />
                      {selectedSupervisor.full_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Assigned Workers List */}
              <div className="p-4">
                {!selectedSupervisor ? (
                  <EmptyState
                    icon={ArrowRight}
                    title="No supervisor selected"
                    subtitle="Click a supervisor on the left to view their assigned workers"
                    iconColor="text-slate-200"
                  />
                ) : filteredAssignedWorkers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No workers assigned yet"
                    subtitle="Assign workers from the panel below"
                    iconColor="text-slate-200"
                  />
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    <AnimatePresence>
                      {filteredAssignedWorkers.map((worker) => (
                        <WorkerCard
                          key={worker.id}
                          worker={worker}
                          mode="assigned"
                          onRemove={handleRemoveWorker}
                          selectedSupervisorId={selectedSupervisor?.id}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* ── Unassigned Workers Panel ───────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100
                           shadow-sm overflow-hidden">

              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between
                                flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex
                                    items-center justify-center">
                      <AlertCircle size={15} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">
                        Unassigned Workers
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {totalUnassigned} worker(s) not assigned to any supervisor
                      </p>
                    </div>
                  </div>

                  {/* Bulk Assign Button */}
                  {selectedWorkerIds.length > 0 && (
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={handleBulkAssign}
                      disabled={bulkLoading || !selectedSupervisor}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs
                                 font-semibold bg-violet-600 text-white
                                 rounded-2xl hover:bg-violet-700 transition-all
                                 shadow-md shadow-violet-500/20 disabled:opacity-50
                                 disabled:cursor-not-allowed"
                    >
                      {bulkLoading
                        ? <Loader size={13} className="animate-spin" />
                        : <UserPlus size={13} />
                      }
                      Assign {selectedWorkerIds.length} Selected
                      {selectedSupervisor &&
                        ` → ${selectedSupervisor.full_name}`
                      }
                    </motion.button>
                  )}
                </div>

                {/* Search + Select All Row */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {/* Worker Search */}
                  <div className="relative flex-1 min-w-[180px]">
                    <Search size={13} className="absolute left-3 top-1/2
                                                  -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      placeholder="Search unassigned workers..."
                      className="w-full pl-8 pr-4 py-2 border-2 border-slate-200
                                 rounded-xl text-xs focus:outline-none
                                 focus:ring-4 focus:ring-violet-500/10
                                 focus:border-violet-500 transition-all"
                    />
                  </div>

                  {/* Select All Toggle */}
                  {filteredUnassignedWorkers.length > 0 && (
                    <button
                      onClick={handleSelectAll}
                      className={`flex items-center gap-1.5 px-3.5 py-2 text-xs
                                 font-semibold rounded-xl border transition-all
                                 ${allFilteredSelected
                          ? "bg-violet-100 border-violet-200 text-violet-700"
                          : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center
                                       justify-center border-2 transition-all
                                       ${allFilteredSelected
                          ? "bg-violet-600 border-violet-600"
                          : "border-slate-400"
                        }`}>
                        {allFilteredSelected &&
                          <Check size={9} className="text-white" />
                        }
                      </div>
                      {allFilteredSelected ? "Deselect All" : "Select All"}
                    </button>
                  )}

                  {/* Selected count chip */}
                  {selectedWorkerIds.length > 0 && (
                    <span className="px-3 py-1.5 bg-violet-50 border
                                     border-violet-200 rounded-xl text-[11px]
                                     font-bold text-violet-700">
                      {selectedWorkerIds.length} selected
                    </span>
                  )}
                </div>

                {/* Supervisor hint */}
                {!selectedSupervisor && (
                  <p className="mt-2.5 flex items-center gap-1.5 text-[11px]
                                text-amber-600 font-semibold bg-amber-50
                                border border-amber-100 rounded-xl px-3 py-2">
                    <AlertCircle size={11} />
                    Select a supervisor from the left panel before assigning workers
                  </p>
                )}
              </div>

              {/* Unassigned Workers List */}
              <div className="p-4">
                {filteredUnassignedWorkers.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title={
                      workerSearch
                        ? "No workers match your search"
                        : "All workers are assigned! 🎉"
                    }
                    subtitle={
                      workerSearch
                        ? "Try a different search"
                        : "Every worker has been assigned to a supervisor"
                    }
                    iconColor="text-emerald-300"
                  />
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    <AnimatePresence>
                      {filteredUnassignedWorkers.map((worker) => (
                        <WorkerCard
                          key={worker.id}
                          worker={worker}
                          mode="unassigned"
                          onAssign={handleAssignWorker}
                          isSelected={selectedWorkerIds.includes(worker.id)}
                          onToggleSelect={toggleWorkerSelect}
                          selectedSupervisorId={selectedSupervisor?.id}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AssignWorkers;