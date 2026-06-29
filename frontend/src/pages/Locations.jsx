// Locations.jsx — Complete File with Quick Add Popup
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/client";
import Modal from "../components/ui/Modal";
import Pagination from "../components/ui/Pagination";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import {
  Eye, Edit, Trash2, Search, MapPin,
  Plus, UserCheck, UserPlus, X, Loader
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const emptyForm = {
  location_name:     "",
  corridor_name:     "",
  location_type:     "",
  serial_number:     "",
  proposed_solution: "",
  no_of_lanes:       "",
  no_of_roads:       "",
  phase_id:          "",
  vendor_id:         "",
  supervisor_id:     "",
};

/* ═══════════════════════════════════════════════════════════════
   QUICK ADD MODAL COMPONENT
   → Small popup to add Location Type / Phase / Vendor on the fly
═══════════════════════════════════════════════════════════════ */
const QuickAddModal = ({ title, label, placeholder, onClose, onAdd }) => {
  const [value,   setValue]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) {
      setError(`${label} is required`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onAdd(value.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ── Backdrop ───────────────────────────────────────────────
    <div className="fixed inset-0 z-[999] flex items-center justify-center 
                    bg-black/50 backdrop-blur-sm"
         onClick={onClose}>

      {/* ── Modal Box ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4"
           onClick={(e) => e.stopPropagation()}>

        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 
                        border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-100 rounded-xl flex 
                            items-center justify-center">
              <Plus size={15} className="text-violet-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg 
                       transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Form ──────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold 
                               text-slate-600 mb-1.5">
              {label} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
              placeholder={placeholder}
              autoFocus
              className="w-full px-3.5 py-2.5 border-2 border-slate-200 
                         rounded-xl text-sm focus:outline-none 
                         focus:ring-4 focus:ring-violet-500/10 
                         focus:border-violet-500 transition-all"
            />
            {/* ── Error ──────────────────────────────────────── */}
            {error && (
              <p className="mt-1.5 text-xs text-red-500 font-medium 
                            flex items-center gap-1">
                ⚠️ {error}
              </p>
            )}
          </div>

          {/* ── Buttons ─────────────────────────────────────── */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 
                         bg-slate-100 hover:bg-slate-200 rounded-xl 
                         transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="px-4 py-2.5 text-xs font-semibold text-white 
                         bg-violet-600 hover:bg-violet-700 rounded-xl 
                         flex items-center gap-2 transition-all 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-md shadow-violet-500/20"
            >
              {loading ? (
                <><Loader size={12} className="animate-spin" /> Adding...</>
              ) : (
                <><Plus size={12} /> Add</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SELECT WITH ADD BUTTON COMPONENT
   → Dropdown + "+ Add New" button combined
═══════════════════════════════════════════════════════════════ */
const SelectWithAdd = ({
  label, name, value, onChange,
  options, placeholder, onAddClick,
  showAdd = true, required = false
}) => (
  <div>
    {/* ── Label + Add New Button Row ───────────────────────── */}
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* ── "+ Add New" Button ─────────────────────────────── */}
      {showAdd && (
        <button
          type="button"
          onClick={onAddClick}
          className="flex items-center gap-1 text-[10px] font-semibold 
                     text-violet-600 hover:text-violet-800 bg-violet-50 
                     hover:bg-violet-100 px-2 py-1 rounded-lg 
                     transition-all border border-violet-100"
          title={`Add new ${label}`}
        >
          <Plus size={10} /> Add New
        </button>
      )}
    </div>

    {/* ── Dropdown ─────────────────────────────────────────── */}
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

/* ═══════════════════════════════════════════════════════════════
   LOCATION FORM FIELDS COMPONENT
   → Used in both Add & Edit modals
═══════════════════════════════════════════════════════════════ */
const LocationFormFields = ({
  formData, handleChange,
  phaseOptions, vendorOptions,
  supervisorOptions, locationTypeOptions,
  onQuickAdd  // ✅ Quick add handler
}) => (
  <div className="space-y-4">

    {/* ── Location Name ──────────────────────────────────── */}
    <Input
      label={<span>Location Name <span className="text-red-500">*</span></span>}
      name="location_name"
      value={formData.location_name}
      onChange={handleChange}
      placeholder="e.g. Main Crossing"
    />

    {/* ── Location Type + Quick Add ──────────────────────── */}
    <div className="grid grid-cols-2 gap-3">
      <SelectWithAdd
        label="Location Type"
        name="location_type"
        value={formData.location_type}
        onChange={handleChange}
        options={locationTypeOptions}
        placeholder="Select type..."
        onAddClick={() => onQuickAdd("location_type")}
      />
      <div />
    </div>

    {/* ── Corridor Name ──────────────────────────────────── */}
    <Input
      label="Corridor Name"
      name="corridor_name"
      value={formData.corridor_name}
      onChange={handleChange}
      placeholder="e.g. Bhubaneshwar to Puri Road"
    />

    {/* ── Phase + Vendor with Quick Add ──────────────────── */}
    <div className="grid grid-cols-2 gap-3">
      <SelectWithAdd
        label="Phase"
        name="phase_id"
        value={formData.phase_id}
        onChange={handleChange}
        options={phaseOptions}
        placeholder="Select phase..."
        onAddClick={() => onQuickAdd("phase")}
      />
      <SelectWithAdd
        label="Vendor"
        name="vendor_id"
        value={formData.vendor_id}
        onChange={handleChange}
        options={vendorOptions}
        placeholder="Select vendor..."
        onAddClick={() => onQuickAdd("vendor")}
      />
    </div>

    {/* ── Supervisor — No Quick Add ───────────────────────── */}
    <SelectWithAdd
      label="Supervisor"
      name="supervisor_id"
      value={formData.supervisor_id}
      onChange={handleChange}
      options={supervisorOptions}
      placeholder="Select supervisor..."
      showAdd={false}  // ✅ No quick add for supervisor
    />

    {/* ── Lanes + Roads ───────────────────────────────────── */}
    <div className="grid grid-cols-2 gap-3">
      <Input
        type="number" label="No. of Lanes"
        name="no_of_lanes" min="0"
        value={formData.no_of_lanes}
        onChange={handleChange} placeholder="e.g. 4"
      />
      <Input
        type="number" label="No. of Roads"
        name="no_of_roads" min="0"
        value={formData.no_of_roads}
        onChange={handleChange} placeholder="e.g. 2"
      />
    </div>

    {/* ── Proposed Solution ───────────────────────────────── */}
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        Proposed Solution
      </label>
      <textarea
        name="proposed_solution"
        value={formData.proposed_solution}
        onChange={handleChange}
        rows={2}
        placeholder="e.g. Signal Installation"
        className="w-full px-3.5 py-2.5 border-2 border-slate-200 
                   rounded-xl text-sm focus:outline-none 
                   focus:ring-4 focus:ring-violet-500/10 
                   focus:border-violet-500 resize-none transition-all"
      />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN LOCATIONS COMPONENT
═══════════════════════════════════════════════════════════════ */
const Locations = () => {
  const { role } = useAuth();
  const nav      = useNavigate();

  /* ── States ─────────────────────────────────────────────── */
  const [loading,        setLoading]        = useState(true);
  const [data,           setLocations]      = useState([]);
  const [search,         setSearch]         = useState("");
  const [page,           setPage]           = useState(1);
  const [limit,          setLimit]          = useState(10);
  const [pagination,     setPagination]     = useState(null);
  const [selected,       setSelected]       = useState([]);
  const [supervisors,    setSupervisors]    = useState([]);
  const [workers,        setWorkers]        = useState([]);
  const [phases,         setPhases]         = useState([]);
  const [vendors,        setVendors]        = useState([]);
  const [locationTypes,  setLocationTypes]  = useState([]);
  const [bulkModal,      setBulkModal]      = useState(false);
  const [bulkSupId,      setBulkSupId]      = useState("");
  const [saving,         setSaving]         = useState(false);
  const [workerModal,    setWorkerModal]    = useState(false);
  const [selWorkerId,    setSelWorkerId]    = useState("");
  const [addModal,       setAddModal]       = useState(false);
  const [editModal,      setEditModal]      = useState(false);
  const [deleteModal,    setDeleteModal]    = useState(false);
  const [viewModal,      setViewModal]      = useState(false);
  const [viewData,       setViewData]       = useState(null);
  const [formData,       setFormData]       = useState(emptyForm);
  const [activeLocation, setActive]         = useState(null);
  const [formError,      setFormError]      = useState("");
  const [crudLoading,    setCrudLoading]    = useState(false);

  // ✅ Quick Add Modal State
  const [quickAdd, setQuickAdd] = useState({
    open:        false,
    type:        null,
    title:       "",
    label:       "",
    placeholder: ""
  });

  const base          = role === "Admin" ? "/admin" : "/supervisor";
  const isFirstRender = useRef(true);

  /* ── Fetch Locations ──────────────────────────────────────── */
  const fetchData = useCallback(async (pg = 1, lmt = 10, srch = "") => {
    try {
      setLoading(true);
      const response = await API.get(`${base}/locations`, {
        params: { page: pg, limit: lmt, search: srch.trim() },
      });
      setLocations(response.data.data       || []);
      setPagination(response.data.pagination || null);
    } catch (err) {
      console.error("fetchData error:", err?.response?.data || err.message);
      setLocations([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    fetchData(page, limit, search);
  }, [page, limit, base, fetchData]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(1);
    fetchData(1, limit, search);
  }, [search]);

  /* ── Fetch All Dropdowns ─────────────────────────────────── */
  const fetchDropdowns = useCallback(() => {
    if (role === "Admin") {
      API.get("/admin/phases")
        .then((r) => setPhases(r.data.data || []))
        .catch(console.error);

      API.get("/admin/vendors")
        .then((r) => setVendors(r.data.data || []))
        .catch(console.error);

      API.get("/admin/users?role=Supervisor")
        .then((r) => setSupervisors(r.data.data || []))
        .catch(console.error);
    }

    if (role === "Supervisor") {
      API.get("/supervisor/workers")
        .then((r) => setWorkers(r.data.data || []))
        .catch(console.error);
    }

    // ✅ Location Types — both Admin & Supervisor need this
    API.get("/admin/lookups?category=location_type")
      .then((r) => {
        const types = (r.data.data || []).map((t) => ({
          value: t.value,
          label: t.label,
        }));
        setLocationTypes(types);
      })
      .catch(console.error);

  }, [role]);

  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  /* ══════════════════════════════════════════════════════════
     QUICK ADD HANDLERS
  ══════════════════════════════════════════════════════════ */

  // ── Open Quick Add Modal ─────────────────────────────────
  const openQuickAdd = (type) => {
    const config = {
      location_type: {
        title:       "Add New Location Type",
        label:       "Location Type Name",
        placeholder: "e.g. Square, Entry/Exit, Tri Junction..."
      },
      phase: {
        title:       "Add New Phase",
        label:       "Phase Name",
        placeholder: "e.g. Phase 1, Phase 2..."
      },
      vendor: {
        title:       "Add New Vendor",
        label:       "Vendor Name",
        placeholder: "e.g. ABC Contractors..."
      }
    };
    setQuickAdd({ open: true, type, ...config[type] });
  };

  // ── Close Quick Add Modal ────────────────────────────────
  const closeQuickAdd = () => {
    setQuickAdd({ 
      open: false, type: null,
      title: "", label: "", placeholder: "" 
    });
  };

  // ── Handle Quick Add Submit ──────────────────────────────
  const handleQuickAdd = async (value) => {
    const { type } = quickAdd;

    try {
      // ── Location Type → master_lookups ─────────────────
      if (type === "location_type") {
        await API.post("/admin/lookups", {
          category:   "location_type",
          value:      value.toLowerCase().replace(/\s+/g, "_"),
          label:      value,
          sort_order: 0
        });
        // ✅ Refresh location types dropdown
        const res   = await API.get("/admin/lookups?category=location_type");
        const types = (res.data.data || []).map((t) => ({
          value: t.value,
          label: t.label,
        }));
        setLocationTypes(types);
        toast.success(`✅ Location Type "${value}" added!`);
      }

      // ── Phase → phases table ────────────────────────────
      if (type === "phase") {
        await API.post("/admin/phases", { phase_name: value });
        // ✅ Refresh phases dropdown
        const res = await API.get("/admin/phases");
        setPhases(res.data.data || []);
        toast.success(`✅ Phase "${value}" added!`);
      }

      // ── Vendor → vendors table ──────────────────────────
      if (type === "vendor") {
        await API.post("/admin/vendors", { vendor_name: value });
        // ✅ Refresh vendors dropdown
        const res = await API.get("/admin/vendors");
        setVendors(res.data.data || []);
        toast.success(`✅ Vendor "${value}" added!`);
      }

    } catch (err) {
      // ✅ Throw so QuickAddModal shows the error
      throw new Error(
        err?.response?.data?.message || `Failed to add ${type}`
      );
    }
  };

  /* ── Pagination ──────────────────────────────────────────── */
  const handlePageChange  = (pg)  => { setSelected([]); setPage(pg); };
  const handleLimitChange = (lmt) => { setSelected([]); setLimit(lmt); setPage(1); };

  /* ── Checkbox ────────────────────────────────────────────── */
  const toggleAll = () =>
    selected.length === data.length
      ? setSelected([])
      : setSelected(data.map((d) => d.id));

  const toggleOne = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  /* ── Bulk Assign Supervisor ──────────────────────────────── */
  const bulkAssign = async () => {
    if (!bulkSupId) return toast.error("Select a supervisor");
    setSaving(true);
    try {
      let success = 0, failed = 0;
      for (const locId of selected) {
        try {
          await API.patch(
            `/admin/locations/${locId}/assign-supervisor`,
            { supervisor_id: parseInt(bulkSupId) }
          );
          success++;
        } catch { failed++; }
      }
      toast.success(
        `Assigned: ${success}${failed > 0 ? ` · Failed: ${failed}` : ""}`
      );
      setBulkModal(false); setSelected([]); setBulkSupId("");
      fetchData(page, limit, search);
    } finally { setSaving(false); }
  };

  /* ── Bulk Assign Worker ──────────────────────────────────── */
  const bulkAssignWorker = async () => {
    if (!selWorkerId) return toast.error("Please select a worker");
    setSaving(true);
    try {
      await API.patch("/supervisor/locations/bulk-assign-worker", {
        locationIds: selected,
        worker_id:   parseInt(selWorkerId),
      });
      toast.success(`Worker assigned to ${selected.length} locations!`);
      setWorkerModal(false); setSelected([]); setSelWorkerId("");
      fetchData(page, limit, search);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign worker");
    } finally { setSaving(false); }
  };

  /* ── Form Handler ────────────────────────────────────────── */
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  };

  /* ── Create ──────────────────────────────────────────────── */
  const openAdd = () => { setFormData(emptyForm); setFormError(""); setAddModal(true); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.location_name.trim()) {
      setFormError("Location name is required."); return;
    }
    setCrudLoading(true);
    try {
      await API.post("/admin/locations", {
        location_name:     formData.location_name.trim(),
        corridor_name:     formData.corridor_name.trim()     || null,
        location_type:     formData.location_type            || null,
        serial_number:     formData.serial_number.trim()     || null,
        proposed_solution: formData.proposed_solution.trim() || null,
        no_of_lanes:       parseInt(formData.no_of_lanes)    || 0,
        no_of_roads:       parseInt(formData.no_of_roads)    || 0,
        phase_id:          formData.phase_id                 || null,
        vendor_id:         formData.vendor_id                || null,
        supervisor_id:     formData.supervisor_id            || null,
      });
      toast.success("Location created successfully!");
      setAddModal(false);
      setFormData(emptyForm);
      fetchData(page, limit, search);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to create location.");
    } finally { setCrudLoading(false); }
  };

  /* ── View ────────────────────────────────────────────────── */
  const openView = async (loc) => {
    setActive(loc); setViewData(null); setViewModal(true);
    try {
      const response = await API.get(`${base}/locations/${loc.id}`);
      setViewData(response.data.data || response.data.location || loc);
    } catch { setViewData(loc); }
  };

  /* ── Edit ────────────────────────────────────────────────── */
  const openEdit = (loc) => {
    setActive(loc);
    setFormData({
      location_name:     loc.location_name     || "",
      corridor_name:     loc.corridor_name     || "",
      location_type:     loc.location_type     || "",
      serial_number:     String(loc.serial_number     || ""),
      proposed_solution: loc.proposed_solution || "",
      no_of_lanes:       String(loc.no_of_lanes       || ""),
      no_of_roads:       String(loc.no_of_roads       || ""),
      phase_id:          String(loc.phase_id           || ""),
      vendor_id:         String(loc.vendor_id          || ""),
      supervisor_id:     String(loc.supervisor_id      || ""),
    });
    setFormError(""); setEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.location_name.trim()) {
      setFormError("Location name is required."); return;
    }
    setCrudLoading(true);
    try {
      await API.put(`/admin/locations/${activeLocation.id}`, {
        location_name:     formData.location_name.trim(),
        corridor_name:     formData.corridor_name.trim()     || null,
        location_type:     formData.location_type            || null,
        serial_number:     formData.serial_number.trim()     || null,
        proposed_solution: formData.proposed_solution.trim() || null,
        no_of_lanes:       parseInt(formData.no_of_lanes)    || 0,
        no_of_roads:       parseInt(formData.no_of_roads)    || 0,
        phase_id:          formData.phase_id                 || null,
        vendor_id:         formData.vendor_id                || null,
        supervisor_id:     formData.supervisor_id            || null,
      });
      toast.success("Location updated!");
      setEditModal(false); setActive(null);
      fetchData(page, limit, search);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to update location.");
    } finally { setCrudLoading(false); }
  };

  /* ── Delete ──────────────────────────────────────────────── */
  const openDelete = (loc) => { setActive(loc); setDeleteModal(true); };

  const handleDelete = async () => {
    setCrudLoading(true);
    try {
      await API.delete(`/admin/locations/${activeLocation.id}`);
      toast.success("Location deleted.");
      setDeleteModal(false); setActive(null);
      setSelected((prev) => prev.filter((id) => id !== activeLocation.id));
      if (data.length === 1 && page > 1) setPage((prev) => prev - 1);
      else fetchData(page, limit, search);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete.");
    } finally { setCrudLoading(false); }
  };

  /* ── Computed Values ─────────────────────────────────────── */
  const totalLocs  = pagination?.total ?? data.length;
  const withSup    = data.filter((d) => d.supervisor).length;
  const withoutSup = data.length - withSup;

  /* ── Dropdown Options ────────────────────────────────────── */
  const phaseOptions = phases.map((p) => ({
    value: p.id,
    label: p.phase_name
  }));
  const vendorOptions = vendors.map((v) => ({
    value: v.id,
    label: v.vendor_name
  }));
  const supervisorOptions = supervisors.map((s) => ({
    value: s.id,
    label: `${s.full_name} — ${s.phone}`
  }));

  // ✅ Shared props for both Add & Edit form
  const formFieldProps = {
    formData,
    handleChange,
    phaseOptions,
    vendorOptions,
    supervisorOptions,
    locationTypeOptions: locationTypes,
    onQuickAdd: openQuickAdd,   // ✅ Pass quick add handler
  };

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
            {role === "Admin" ? "All Locations" : "My Locations"}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {totalLocs} total · {withSup} assigned · {withoutSup} unassigned
            {pagination && pagination.totalPages > 1 &&
              ` · Page ${pagination.page} of ${pagination.totalPages}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {role === "Admin" && selected.length > 0 && (
            <button
              onClick={() => setBulkModal(true)}
              className="px-4 py-2.5 text-xs font-semibold bg-violet-600 
                         text-white rounded-2xl hover:bg-violet-700 
                         flex items-center gap-2 transition-all 
                         shadow-md shadow-violet-500/20"
            >
              <UserCheck size={14} /> Assign Supervisor ({selected.length})
            </button>
          )}
          {role === "Supervisor" && selected.length > 0 && (
            <button
              onClick={() => setWorkerModal(true)}
              className="px-4 py-2.5 text-xs font-semibold bg-emerald-600 
                         text-white rounded-2xl hover:bg-emerald-700 
                         flex items-center gap-2 transition-all 
                         shadow-md shadow-emerald-500/20"
            >
              <UserPlus size={14} /> Assign Worker ({selected.length})
            </button>
          )}
          {role === "Admin" && (
            <button
              onClick={openAdd}
              className="px-4 py-2.5 text-xs font-semibold bg-violet-600 
                         text-white rounded-2xl hover:bg-violet-700 
                         flex items-center gap-2 transition-all 
                         shadow-md shadow-violet-500/20"
            >
              <Plus size={14} /> Add Location
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Search ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
      >
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 
                                        -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 
                       rounded-xl text-sm focus:outline-none 
                       focus:ring-4 focus:ring-violet-500/10 
                       focus:border-violet-500 transition-all"
          />
        </div>
      </motion.div>

      {/* ── Table ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 
                   overflow-hidden shadow-sm"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-[3px] border-violet-500 
                            border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">
              Loading locations...
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex 
                            items-center justify-center">
              <MapPin size={24} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              No locations found
            </p>
            <p className="text-xs text-slate-300">Try adjusting your search</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/40">
                    {(role === "Admin" || role === "Supervisor") && (
                      <th className="px-3 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selected.length === data.length && data.length > 0}
                          onChange={toggleAll}
                          className="rounded border-slate-300 accent-violet-600"
                        />
                      </th>
                    )}
                    <th className="px-5 py-3 text-left text-[11px] font-bold 
                                   text-slate-400 uppercase tracking-widest">
                      S.No
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold 
                                   text-slate-400 uppercase tracking-widest">
                      Location
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold 
                                   text-slate-400 uppercase tracking-widest">
                      Type
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold 
                                   text-slate-400 uppercase tracking-widest">
                      Phase
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold 
                                   text-slate-400 uppercase tracking-widest">
                      Vendor
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold 
                                   text-slate-400 uppercase tracking-widest">
                      Supervisor
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold 
                                   text-slate-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((loc, i) => (
                    <tr
                      key={loc.id}
                      onClick={() =>
                        role === "Supervisor" && nav(`${base}/locations/${loc.id}`)
                      }
                      className={`border-t border-slate-50 
                        hover:bg-slate-50/60 transition-colors
                        ${selected.includes(loc.id) ? "bg-violet-50/40" : ""}
                        ${role === "Supervisor" ? "cursor-pointer" : ""}`}
                    >
                      {(role === "Admin" || role === "Supervisor") && (
                        <td className="px-3 py-3.5"
                            onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.includes(loc.id)}
                            onChange={() => toggleOne(loc.id)}
                            className="rounded border-slate-300 accent-violet-600"
                          />
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-[11px] 
                                     text-slate-400 font-mono">
                        {loc.serial_number || (page - 1) * limit + i + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-semibold text-slate-700">
                          {loc.location_name}
                        </p>
                        {loc.corridor_name && (
                          <p className="text-[10px] text-slate-400 
                                        truncate max-w-[180px]">
                            {loc.corridor_name}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] 
                                     text-slate-500 font-medium">
                        {loc.location_type || "-"}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] 
                                     text-slate-500 font-medium">
                        {loc.phase?.phase_name || "-"}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] 
                                     text-slate-500 font-medium">
                        {loc.vendor?.vendor_name || "-"}
                      </td>
                      <td className="px-5 py-3.5">
                        {loc.supervisor?.full_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br 
                                            from-violet-500 to-purple-600 
                                            rounded-lg flex items-center 
                                            justify-center text-white 
                                            text-[10px] font-bold shadow-sm">
                              {loc.supervisor.full_name[0].toUpperCase()}
                            </div>
                            <span className="text-[12px] text-slate-600 
                                             font-medium">
                              {loc.supervisor.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-amber-500 
                                           font-semibold">
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              role === "Supervisor"
                                ? nav(`${base}/locations/${loc.id}`)
                                : openView(loc);
                            }}
                            className="p-2 text-violet-600 bg-violet-50 
                                       hover:bg-violet-100 rounded-xl transition-all"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          {role === "Admin" && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEdit(loc); }}
                                className="p-2 text-emerald-600 bg-emerald-50 
                                           hover:bg-emerald-100 rounded-xl transition-all"
                                title="Edit"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); openDelete(loc); }}
                                className="p-2 text-rose-600 bg-rose-50 
                                           hover:bg-rose-100 rounded-xl transition-all"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              limit={limit}
            />
          </>
        )}
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════ */}

      {/* ── Add Modal ──────────────────────────────────────── */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <div className="mb-5">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Add New Location
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Fill all details to create a new location
            </p>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <LocationFormFields {...formFieldProps} />
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 
                              rounded-2xl flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-500 shrink-0"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-rose-600 font-medium">{formError}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 
                           bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <Button type="submit" loading={crudLoading}
                      className="w-auto px-5 py-2.5 text-xs">
                Create Location
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────────────── */}
      {editModal && activeLocation && (
        <Modal onClose={() => setEditModal(false)}>
          <div className="mb-5">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Edit Location
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Updating:{" "}
              <span className="font-semibold text-slate-600">
                {activeLocation.location_name}
              </span>
            </p>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <LocationFormFields {...formFieldProps} />
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 
                              rounded-2xl flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-500 shrink-0"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-rose-600 font-medium">{formError}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 
                           bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <Button type="submit" loading={crudLoading}
                      className="w-auto px-5 py-2.5 text-xs 
                                 bg-emerald-600 hover:bg-emerald-700">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── View Modal ─────────────────────────────────────── */}
      {viewModal && activeLocation && (
        <Modal onClose={() => setViewModal(false)}>
          <div className="mb-5">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Location Details
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeLocation.location_name}
            </p>
          </div>
          {!viewData ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-[3px] border-violet-500 
                              border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 
                              p-4 rounded-2xl">
                {[
                  { l: "Location Name",     v: viewData.location_name },
                  { l: "Corridor",          v: viewData.corridor_name },
                  { l: "Type",              v: viewData.location_type },
                  { l: "Phase",             v: viewData.phase?.phase_name },
                  { l: "Vendor",            v: viewData.vendor?.vendor_name },
                  { l: "Supervisor",        v: viewData.supervisor?.full_name },
                  { l: "No. of Lanes",      v: viewData.no_of_lanes },
                  { l: "No. of Roads",      v: viewData.no_of_roads },
                  { l: "Proposed Solution", v: viewData.proposed_solution },
                  { l: "Overall Status",    v: viewData.overall_status },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-[10px] text-slate-400 uppercase 
                                  font-semibold tracking-wide">
                      {item.l}
                    </p>
                    <p className="text-[13px] text-slate-700 font-semibold mt-0.5">
                      {item.v || "-"}
                    </p>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">
                  Activities Status
                </h4>
                {(!viewData.activities || viewData.activities.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">
                    No activities found.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-2xl 
                                  overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5 text-[10px] font-bold 
                                         text-slate-400 uppercase tracking-wider">
                            Activity
                          </th>
                          <th className="px-3 py-2.5 text-[10px] font-bold 
                                         text-slate-400 uppercase tracking-wider 
                                         text-center">
                            Done?
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewData.activities.map((act, i) => {
                          const isDone = act.status === "Completed";
                          return (
                            <tr key={act.id || i}
                                className="hover:bg-slate-50/50">
                              <td className="px-3 py-2.5 text-xs 
                                             text-slate-700 font-medium">
                                {act.activity?.activity_name || "-"}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`px-2.5 py-1 rounded-full 
                                  text-[10px] font-bold
                                  ${isDone
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"}`}>
                                  {isDone ? "Yes" : "No"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => setViewModal(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 
                         bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ───────────────────────────────────── */}
      {deleteModal && activeLocation && (
        <Modal onClose={() => setDeleteModal(false)}>
          <div className="text-center">
            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex 
                            items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-rose-500" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 mb-1">
              Delete Location
            </h3>
            <p className="text-sm text-slate-500 mb-1">
              Are you sure you want to delete
            </p>
            <p className="text-sm font-bold text-slate-700 mb-3">
              "{activeLocation.location_name}"
            </p>
            <p className="text-xs text-rose-500 font-semibold mb-6">
              ⚠️ This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 
                           bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={crudLoading}
                className="px-5 py-2.5 text-xs font-semibold text-white 
                           bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 
                           rounded-2xl flex items-center gap-2 transition-all"
              >
                {crudLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white 
                                   border-t-transparent rounded-full animate-spin" />
                )}
                {crudLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Bulk Assign Supervisor Modal ───────────────────── */}
      {bulkModal && (
        <Modal onClose={() => setBulkModal(false)}>
          <div className="mb-5">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Bulk Assign Supervisor
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {selected.length} locations selected
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 mb-4 
                          max-h-32 overflow-y-auto">
            {selected.map((sId) => {
              const loc = data.find((d) => d.id === sId);
              return (
                <p key={sId}
                   className="text-[12px] text-slate-600 font-medium py-0.5">
                  • {loc?.location_name}
                </p>
              );
            })}
          </div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Select Supervisor
          </label>
          <select
            value={bulkSupId}
            onChange={(e) => setBulkSupId(e.target.value)}
            className="w-full px-3.5 py-2.5 border-2 border-slate-200 
                       rounded-xl text-sm focus:outline-none 
                       focus:ring-4 focus:ring-violet-500/10 
                       focus:border-violet-500 mb-4 transition-all"
          >
            <option value="">Choose...</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} — {s.phone}
              </option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setBulkModal(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 
                         bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={bulkAssign}
              disabled={saving}
              className="px-4 py-2.5 text-xs font-semibold text-white 
                         bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 
                         rounded-2xl flex items-center gap-2 transition-all"
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white 
                                 border-t-transparent rounded-full animate-spin" />
              )}
              {saving ? "Assigning..." : `Assign to ${selected.length} Locations`}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Bulk Assign Worker Modal ───────────────────────── */}
      {workerModal && (
        <Modal onClose={() => { setWorkerModal(false); setSelWorkerId(""); }}>
          <div className="mb-5">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Assign Worker
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {selected.length} location(s) selected
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 mb-4 
                          max-h-32 overflow-y-auto">
            {selected.map((sId) => {
              const loc = data.find((d) => d.id === sId);
              return (
                <p key={sId}
                   className="text-[12px] text-slate-600 font-medium py-0.5">
                  • {loc?.location_name}
                </p>
              );
            })}
          </div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Select Worker
          </label>
          <select
            value={selWorkerId}
            onChange={(e) => setSelWorkerId(e.target.value)}
            className="w-full px-3.5 py-2.5 border-2 border-slate-200 
                       rounded-xl text-sm focus:outline-none 
                       focus:ring-4 focus:ring-violet-500/10 
                       focus:border-violet-500 mb-4 transition-all"
          >
            <option value="">Choose Worker...</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name} — {w.phone}
              </option>
            ))}
          </select>
          {workers.length === 0 && (
            <p className="text-xs text-amber-500 font-medium mb-4">
              ⚠️ No workers found. Please add workers first.
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setWorkerModal(false); setSelWorkerId(""); }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 
                         bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={bulkAssignWorker}
              disabled={saving || !selWorkerId}
              className="px-4 py-2.5 text-xs font-semibold text-white 
                         bg-emerald-600 hover:bg-emerald-700 
                         disabled:bg-emerald-300 rounded-2xl 
                         flex items-center gap-2 transition-all"
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white 
                                 border-t-transparent rounded-full animate-spin" />
              )}
              {saving ? "Assigning..." : `Assign to ${selected.length} Locations`}
            </button>
          </div>
        </Modal>
      )}

      {/* 
          ✅ QUICK ADD MODAL — Renders on top of everything
      */}
      {quickAdd.open && (
        <QuickAddModal
          title={quickAdd.title}
          label={quickAdd.label}
          placeholder={quickAdd.placeholder}
          onClose={closeQuickAdd}
          onAdd={handleQuickAdd}
        />
      )}

    </div>
  );
};

export default Locations;
























// import { useState, useEffect, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import API from '../api/client';
// import Modal from '../components/ui/Modal';
// import Pagination from '../components/ui/Pagination';
// import Input from '../components/ui/Input';
// import Button from '../components/ui/Button';
// import { Eye, Edit, Trash2 } from 'lucide-react';

//     // constants 
// const emptyForm = {
//     location_name:     '',
//     corridor_name:     '',
//     location_type:     '',
//     serial_number:     '',
//     proposed_solution: '',
//     no_of_lanes:       '',
//     no_of_roads:       '',
//     phase_id:          '',
//     vendor_id:         '',
//     supervisor_id:     '',
// };

// const LOCATION_TYPES = [
//     'Entry/Exit',
//     'Square',
//     'Tri Junction',
//     'Approach Road to GR',
//     'Surveillance Point'
// ];



// // Reusable Select Field

// const SelectField = ({ label, name, value, onChange, options, placeholder }) => (
//     <div>
//         <label className="block text-xs font-semibold text-slate-600 mb-1.5">
//             {label}
//         </label>
//         <select
//             name={name}
//             value={value}
//             onChange={onChange}
//             className="w-full px-3.5 py-2.5 border border-slate-200 
//                        rounded-lg text-sm focus:outline-none 
//                        focus:ring-2 focus:ring-blue-500/20 
//                        focus:border-blue-500 bg-white"
//         >
//             <option value="">{placeholder || `Select ${label}...`}</option>
//             {options.map(opt => (
//                 <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                 </option>
//             ))}
//         </select>
//     </div>
// );


// // all form feilds - used in both add and edit modal 
// const LocationFormFields = ({
//     formData,
//     handleChange,
//     phaseOptions,
//     vendorOptions,
//     supervisorOptions
// }) => (
//     <div className="space-y-3">
//         {/*   Location Name — full width */}
//         <Input
//             label={<span>Location Name <span className="text-red-500">*</span></span>}
//             name="location_name"
//             value={formData.location_name}
//             onChange={handleChange}
//             placeholder="e.g. Main Crossing"
//         />

//         {/*  Location Type — 2 col layout maintained for alignment */}
//         <div className="grid grid-cols-2 gap-3">
//             <SelectField
//                 label="Location Type"
//                 name="location_type"
//                 value={formData.location_type}
//                 onChange={handleChange}
//                 options={LOCATION_TYPES.map(t => ({ value: t, label: t }))}
//                 placeholder="Select type..."
//             />
//             <div></div> {/* Empty div to maintain grid alignment previously used for Serial Number */}
//         </div>

//         {/*   Corridor Name — full width */}
//         <Input
//             label="Corridor Name"
//             name="corridor_name"
//             value={formData.corridor_name}
//             onChange={handleChange}
//             placeholder="e.g. Bhubaneshwar to Puri Road"
//         />

//         {/*   Phase + Vendor — 2 col */}
//         <div className="grid grid-cols-2 gap-3">
//             <SelectField
//                 label="Phase"
//                 name="phase_id"
//                 value={formData.phase_id}
//                 onChange={handleChange}
//                 options={phaseOptions}
//                 placeholder="Select phase..."
//             />
//             <SelectField
//                 label="Vendor"
//                 name="vendor_id"
//                 value={formData.vendor_id}
//                 onChange={handleChange}
//                 options={vendorOptions}
//                 placeholder="Select vendor..."
//             />
//         </div>

//         {/*   Supervisor — full width */}
//         <SelectField
//             label="Supervisor"
//             name="supervisor_id"
//             value={formData.supervisor_id}
//             onChange={handleChange}
//             options={supervisorOptions}
//             placeholder="Select supervisor..."
//         />

//         {/*   Lanes + Roads — 2 col */}
//         <div className="grid grid-cols-2 gap-3">
//             <Input
//                 type="number"
//                 label="No. of Lanes"
//                 name="no_of_lanes"
//                 min="0"
//                 value={formData.no_of_lanes}
//                 onChange={handleChange}
//                 placeholder="e.g. 4"
//             />
//             <Input
//                 type="number"
//                 label="No. of Roads"
//                 name="no_of_roads"
//                 min="0"
//                 value={formData.no_of_roads}
//                 onChange={handleChange}
//                 placeholder="e.g. 2"
//             />
//         </div>

//         {/*   Proposed Solution — full width textarea */}
//         <div>
//             <label className="block text-xs font-semibold text-slate-600 mb-1.5">
//                 Proposed Solution
//             </label>
//             <textarea
//                 name="proposed_solution"
//                 value={formData.proposed_solution}
//                 onChange={handleChange}
//                 rows={2}
//                 placeholder="e.g. Signal Installation"
//                 className="w-full px-3 py-2 border border-slate-200 
//                            rounded-lg text-sm focus:outline-none 
//                            focus:ring-2 focus:ring-blue-500/20 
//                            focus:border-blue-500 resize-none"
//             />
//         </div>
//     </div>
// );

// // main components 
// const Locations = () => {
//     const { role } = useAuth();
//     const nav = useNavigate();

//     const [loading, setLoading]         = useState(true);
//     const [data, setLocations]               = useState([]);
//     const [search, setSearch]           = useState('');
//     const [page, setPage]               = useState(1);
//     const [limit, setLimit]             = useState(10);
//     const [pagination, setPagination]   = useState(null);
//     const [selected, setSelected]       = useState([]);
//     const [supervisors, setSupervisors] = useState([]);
//     const [workers, setWorkers]         = useState([]);
//     const [phases, setPhases]           = useState([]);
//     const [vendors, setVendors]         = useState([]);
//     const [bulkModal, setBulkModal]     = useState(false);
//     const [bulkSupId, setBulkSupId]     = useState('');
//     const [saving, setSaving]           = useState(false);
//     const [workerModal, setWorkerModal] = useState(false);
//     const [selWorkerId, setSelWorkerId] = useState('');
//     const [addModal, setAddModal]       = useState(false);
//     const [editModal, setEditModal]     = useState(false);
//     const [deleteModal, setDeleteModal] = useState(false);
//     const [viewModal, setViewModal]     = useState(false);
//     const [viewData, setViewData]       = useState(null);
//     const [formData, setFormData]       = useState(emptyForm);
//     const [activeLocation, setActive]   = useState(null);
//     const [formError, setFormError]     = useState('');
//     const [crudLoading, setCrudLoading] = useState(false);

//     const base          = role === 'Admin' ? '/admin' : '/supervisor';
//     const isFirstRender = useRef(true);

//     // fetch locations 
//     const fetchData = useCallback(async (pg = 1, lmt = 10, srch = '') => {
//         try {
//             setLoading(true);
//             const response = await API.get(`${base}/locations`, {
//                 params: { page: pg, limit: lmt, search: srch.trim() }
//             });
//             setLocations(response.data.data || []);
//             setPagination(response.data.pagination || null);
//         } catch (err) {
//             console.error('fetchData error:', err?.response?.data || err.message);
//             setLocations([]);
//             setPagination(null);
//         } finally {
//             setLoading(false);
//         }
//     }, [base]);

//     useEffect(() => {
//         fetchData(page, limit, search);
//     }, [page, limit, base, fetchData]);

//     useEffect(() => {
//         if (isFirstRender.current) {
//             isFirstRender.current = false;
//             return;
//         }
//         setPage(1);
//         fetchData(1, limit, search);
//     }, [search]);

//     // fetch dropdown 
//     useEffect(() => {
//         if (role === 'Admin') {
//             API.get('/admin/users?role=Supervisor')
//                 .then(response => setSupervisors(response.data.data || []))
//                 .catch(console.error);

//             API.get('/admin/phases')
//                 .then(response => setPhases(response.data.data || []))
//                 .catch(console.error);

//             API.get('/admin/vendors')
//                 .then(response => setVendors(response.data.data || []))
//                 .catch(console.error);
//         }
//         if (role === 'Supervisor') {
//             API.get('/supervisor/workers')
//                 .then(response => setWorkers(response.data.data || []))
//                 .catch(console.error);
//         }
//     }, [role]);

//     // Pagination 
//     const handlePageChange  = (pg)  => { setSelected([]); setPage(pg); };
//     const handleLimitChange = (lmt) => { setSelected([]); setLimit(lmt); setPage(1); };

//     // check box 
//     const toggleAll = () =>
//         selected.length === data.length
//             ? setSelected([])
//             : setSelected(data.map(d => d.id));

//     const toggleOne = (id) =>
//         setSelected(prev =>
//             prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
//         );

//     // ─bulk assign supervisor 
//     const bulkAssign = async () => {
//         if (!bulkSupId) return alert('Select a supervisor');
//         setSaving(true);
//         try {
//             let success = 0, failed = 0;
//             for (const locId of selected) {
//                 try {
//                     await API.patch(
//                         `/admin/locations/${locId}/assign-supervisor`,
//                         { supervisor_id: parseInt(bulkSupId) }
//                     );
//                     success++;
//                 } catch { failed++; }
//             }
//             alert(`Assigned: ${success}\nFailed: ${failed}`);
//             setBulkModal(false);
//             setSelected([]);
//             setBulkSupId('');
//             fetchData(page, limit, search);
//         } finally {
//             setSaving(false);
//         }
//     };

//     // bulk assign worker
//     const bulkAssignWorker = async () => {
//         if (!selWorkerId) return alert('Please select a worker');
//         setSaving(true);
//         try {
//             await API.patch('/supervisor/locations/bulk-assign-worker', {
//                 locationIds: selected,
//                 worker_id:   parseInt(selWorkerId)
//             });
//             alert(`Worker assigned to ${selected.length} locations!`);
//             setWorkerModal(false);
//             setSelected([]);
//             setSelWorkerId('');
//             fetchData(page, limit, search);
//         } catch (err) {
//             alert(err.response?.data?.message || 'Failed to assign worker');
//         } finally {
//             setSaving(false);
//         }
//     };

//     // form handler
//     const handleChange = (e) => {
//         setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
//         setFormError('');
//     };

//     // create
//     const openAdd = () => { setFormData(emptyForm); setFormError(''); setAddModal(true); };

//     const handleCreate = async (e) => {
//         e.preventDefault();
//         if (!formData.location_name.trim()) {
//             setFormError('Location name is required.');
//             return;
//         }
//         setCrudLoading(true);
//         try {
//             await API.post('/admin/locations', {
//                 location_name:     formData.location_name.trim(),
//                 corridor_name:     formData.corridor_name.trim()     || null,
//                 location_type:     formData.location_type            || null,
//                 serial_number:     formData.serial_number.trim()     || null,
//                 proposed_solution: formData.proposed_solution.trim() || null,
//                 no_of_lanes:       parseInt(formData.no_of_lanes)    || 0,
//                 no_of_roads:       parseInt(formData.no_of_roads)    || 0,
//                 phase_id:          formData.phase_id                 || null,
//                 vendor_id:         formData.vendor_id                || null,
//                 supervisor_id:     formData.supervisor_id            || null,
//             });
//             setAddModal(false);
//             setFormData(emptyForm);
//             fetchData(page, limit, search);
//         } catch (err) {
//             setFormError(err?.response?.data?.message || 'Failed to create location.');
//         } finally {
//             setCrudLoading(false);
//         }
//     };

//     // view
//     const openView = async (loc) => {
//         setActive(loc);
//         setViewData(null);
//         setViewModal(true);
//         try {
//             const response = await API.get(`${base}/locations/${loc.id}`);
//             setViewData(response.data.data || response.data.location || loc);
//         } catch { setViewData(loc); }
//     };

//     //edit 
//     const openEdit = (loc) => {
//         setActive(loc);
//         setFormData({
//             location_name:     loc.location_name              || '',
//             corridor_name:     loc.corridor_name              || '',
//             location_type:     loc.location_type              || '',
//             serial_number:     String(loc.serial_number       || ''),
//             proposed_solution: loc.proposed_solution          || '',
//             no_of_lanes:       String(loc.no_of_lanes         || ''),
//             no_of_roads:       String(loc.no_of_roads         || ''),
//             phase_id:          String(loc.phase_id            || ''),
//             vendor_id:         String(loc.vendor_id           || ''),
//             supervisor_id:     String(loc.supervisor_id       || ''),
//         });
//         setFormError('');
//         setEditModal(true);
//     };

//     const handleUpdate = async (e) => {
//         e.preventDefault();
//         if (!formData.location_name.trim()) {
//             setFormError('Location name is required.');
//             return;
//         }
//         setCrudLoading(true);
//         try {
//             await API.put(`/admin/locations/${activeLocation.id}`, {
//                 location_name:     formData.location_name.trim(),
//                 corridor_name:     formData.corridor_name.trim()     || null,
//                 location_type:     formData.location_type            || null,
//                 serial_number:     formData.serial_number.trim()     || null,
//                 proposed_solution: formData.proposed_solution.trim() || null,
//                 no_of_lanes:       parseInt(formData.no_of_lanes)    || 0,
//                 no_of_roads:       parseInt(formData.no_of_roads)    || 0,
//                 phase_id:          formData.phase_id                 || null,
//                 vendor_id:         formData.vendor_id                || null,
//                 supervisor_id:     formData.supervisor_id            || null,
//             });
//             setEditModal(false);
//             setActive(null);
//             fetchData(page, limit, search);
//         } catch (err) {
//             setFormError(err?.response?.data?.message || 'Failed to update location.');
//         } finally {
//             setCrudLoading(false);
//         }
//     };

//     // delete
//     const openDelete = (loc) => { setActive(loc); setDeleteModal(true); };

//     const handleDelete = async () => {
//         setCrudLoading(true);
//         try {
//             await API.delete(`/admin/locations/${activeLocation.id}`);
//             setDeleteModal(false);
//             setActive(null);
//             setSelected(prev => prev.filter(id => id !== activeLocation.id));
//             // If last row deleted move previous page
//             if (data.length === 1 && page > 1) setPage(prev => prev - 1);
//             else fetchData(page, limit, search);
//         } catch (err) {
//             alert(err?.response?.data?.message || 'Failed to delete.');
//         } finally {
//             setCrudLoading(false);
//         }
//     };

//     // computer values
//     const totalLocs  = pagination?.total ?? data.length;
//     const withSup    = data.filter(d => d.supervisor).length;
//     const withoutSup = data.length - withSup;

//     //  Options for dropdowns — passed as props to LocationFormFields
//     const phaseOptions = phases.map(p => ({
//         value: p.id,
//         label: p.phase_name
//     }));
//     const vendorOptions = vendors.map(v => ({
//         value: v.id,
//         label: v.vendor_name
//     }));
//     const supervisorOptions = supervisors.map(s => ({
//         value: s.id,
//         label: `${s.full_name} — ${s.phone}`
//     }));

//     //  Shared props object — pass to both Add & Edit modal
//     const formFieldProps = {
//         formData,
//         handleChange,
//         phaseOptions,
//         vendorOptions,
//         supervisorOptions
//     };

//     return (
//         <div className="space-y-4">

//             {/* Header */}
//             <div className="flex items-center justify-between flex-wrap gap-3">
//                 <div>
//                     <h2 className="text-lg font-bold text-slate-800">
//                         {role === 'Admin' ? 'All Locations' : 'My Locations'}
//                     </h2>
//                     <p className="text-xs text-slate-400">
//                         {totalLocs} total · {withSup} assigned · {withoutSup} unassigned
//                         {pagination && pagination.totalPages > 1 &&
//                             ` · Page ${pagination.page} of ${pagination.totalPages}`
//                         }
//                     </p>
//                 </div>
//                 <div className="flex items-center gap-2">
//                     {role === 'Admin' && selected.length > 0 && (
//                         <button onClick={() => setBulkModal(true)}
//                             className="px-3 py-2 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-1.5">
//                             Assign Supervisor ({selected.length})
//                         </button>
//                     )}
//                     {role === 'Supervisor' && selected.length > 0 && (
//                         <button onClick={() => setWorkerModal(true)}
//                             className="px-3 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1.5">
//                             Assign Worker ({selected.length})
//                         </button>
//                     )}
//                     {role === 'Admin' && (
//                         <button onClick={openAdd}
//                             className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5">
//                             + Add Location
//                         </button>
//                     )}
//                 </div>
//             </div>

//             {/* Search */}
//             <div className="bg-white rounded-xl border border-slate-200/80 p-4">
//                 <div className="relative max-w-sm">
//                     <input
//                         type="text"
//                         value={search}
//                         onChange={e => setSearch(e.target.value)}
//                         placeholder="Search locations..."
//                         className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
//                     />
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
//                 {loading ? (
//                     <div className="flex items-center justify-center py-20">
//                         <div className="w-6 h-6 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
//                     </div>
//                 ) : data.length === 0 ? (
//                     <div className="text-center py-16">
//                         <p className="text-slate-400 text-sm">No locations found</p>
//                     </div>
//                 ) : (
//                     <>
//                         <div className="overflow-x-auto">
//                             <table className="w-full">
//                                 <thead>
//                                     <tr className="bg-slate-50/80 border-b border-slate-100">
//                                         {(role === 'Admin' || role === 'Supervisor') && (
//                                             <th className="px-3 py-2.5 w-10">
//                                                 <input type="checkbox"
//                                                     checked={selected.length === data.length && data.length > 0}
//                                                     onChange={toggleAll}
//                                                     className="rounded border-slate-300" />
//                                             </th>
//                                         )}
//                                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">S.No</th>
//                                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Location</th>
//                                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Type</th>
//                                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Phase</th>
//                                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
//                                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Supervisor</th>
//                                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {data.map((loc, i) => (
//                                         <tr key={loc.id}
//                                             onClick={() => role === 'Supervisor' && nav(`${base}/locations/${loc.id}`)}
//                                             className={`border-t border-slate-50 hover:bg-slate-50/50 transition-colors
//                                                 ${selected.includes(loc.id) ? 'bg-blue-50/30' : ''}
//                                                 ${role === 'Supervisor' ? 'cursor-pointer' : ''}`}>

//                                             {(role === 'Admin' || role === 'Supervisor') && (
//                                                 <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
//                                                     <input type="checkbox"
//                                                         checked={selected.includes(loc.id)}
//                                                         onChange={() => toggleOne(loc.id)}
//                                                         className="rounded border-slate-300" />
//                                                 </td>
//                                             )}
//                                             <td className="px-5 py-3 text-[11px] text-slate-400 font-mono">
//                                                 {loc.serial_number || ((page - 1) * limit + i + 1)}
//                                             </td>
//                                             <td className="px-5 py-3">
//                                                 <p className="text-[12px] font-semibold text-slate-700">{loc.location_name}</p>
//                                                 {loc.corridor_name && (
//                                                     <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{loc.corridor_name}</p>
//                                                 )}
//                                             </td>
//                                             <td className="px-5 py-3 text-[11px] text-slate-500">{loc.location_type || '-'}</td>
//                                             {/*  Phase */}
//                                             <td className="px-5 py-3 text-[11px] text-slate-500">{loc.phase?.phase_name || '-'}</td>
//                                             {/*  Vendor */}
//                                             <td className="px-5 py-3 text-[11px] text-slate-500">{loc.vendor?.vendor_name || '-'}</td>
//                                             <td className="px-5 py-3">
//                                                 {loc.supervisor?.full_name ? (
//                                                     <div className="flex items-center gap-1.5">
//                                                         <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-[8px] font-bold">
//                                                             {loc.supervisor.full_name[0].toUpperCase()}
//                                                         </div>
//                                                         <span className="text-[11px] text-slate-600">{loc.supervisor.full_name}</span>
//                                                     </div>
//                                                 ) : (
//                                                     <span className="text-[11px] text-amber-500 font-medium">Not Assigned</span>
//                                                 )}
//                                             </td>
//                                             <td className="px-5 py-3">
//                                                 <div className="flex items-center gap-1.5">
//                                                     <button
//                                                         onClick={(e) => { e.stopPropagation(); role === 'Supervisor' ? nav(`${base}/locations/${loc.id}`) : openView(loc); }}
//                                                         className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md" title="View">
//                                                         <Eye className="w-4 h-4" />
//                                                     </button>
//                                                     {role === 'Admin' && (
//                                                         <>
//                                                             <button onClick={(e) => { e.stopPropagation(); openEdit(loc); }}
//                                                                 className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md" title="Edit">
//                                                                 <Edit className="w-4 h-4" />
//                                                             </button>
//                                                             <button onClick={(e) => { e.stopPropagation(); openDelete(loc); }}
//                                                                 className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md" title="Delete">
//                                                                 <Trash2 className="w-4 h-4" />
//                                                             </button>
//                                                         </>
//                                                     )}
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                         <Pagination
//                             pagination={pagination}
//                             onPageChange={handlePageChange}
//                             onLimitChange={handleLimitChange}
//                             limit={limit}
//                         />
//                     </>
//                 )}
//             </div>

//   {/* ── ADD MODAL ──────────────────────────── */}
//         {addModal && (
//             <Modal onClose={() => setAddModal(false)}>
//         <h3 className="text-sm font-bold text-slate-800 mb-1">
//             Add New Location
//         </h3>
//         <p className="text-xs text-slate-400 mb-4">
//             Fill all details to create a new location.
//         </p>

//         {/*  Fixed className — was "space-y" (typo!) */}
//         <form onSubmit={handleCreate} className="space-y-3">
//             <LocationFormFields {...formFieldProps} />

//             {formError && (
//                 <p className="text-xs text-red-500 bg-red-50 
//                               border border-red-100 rounded-lg px-3 py-2">
//                     {formError}
//                 </p>
//             )}

//             <div className="flex gap-2 justify-end pt-2 
//                             border-t border-slate-100 mt-2">
//                 <button
//                     type="button"
//                     onClick={() => setAddModal(false)}
//                     className="px-4 py-2 text-xs font-medium 
//                                text-slate-600 bg-slate-100 
//                                hover:bg-slate-200 rounded-lg"
//                 >
//                     Cancel
//                 </button>
//                 <Button
//                     type="submit"
//                     loading={crudLoading}
//                     className="w-auto px-4 py-2 text-xs"
//                 >
//                     Create Location
//                 </Button>
//             </div>
//         </form>
//     </Modal>
// )}

// {/* ─edit modal*/}
// {editModal && activeLocation && (
//     <Modal onClose={() => setEditModal(false)}>
//         <h3 className="text-sm font-bold text-slate-800 mb-1">
//             Edit Location
//         </h3>
//         <p className="text-xs text-slate-400 mb-4">
//             Updating:{' '}
//             <span className="font-semibold text-slate-600">
//                 {activeLocation.location_name}
//             </span>
//         </p>

//         <form onSubmit={handleUpdate} className="space-y-3">
//             <LocationFormFields {...formFieldProps} />

//             {formError && (
//                 <p className="text-xs text-red-500 bg-red-50 
//                               border border-red-100 rounded-lg px-3 py-2">
//                     {formError}
//                 </p>
//             )}

//             <div className="flex gap-2 justify-end pt-2 
//                             border-t border-slate-100 mt-2">
//                 <button
//                     type="button"
//                     onClick={() => setEditModal(false)}
//                     className="px-4 py-2 text-xs font-medium 
//                                text-slate-600 bg-slate-100 
//                                hover:bg-slate-200 rounded-lg"
//                 >
//                     Cancel
//                 </button>
//                 <Button
//                     type="submit"
//                     loading={crudLoading}
//                     className="w-auto px-4 py-2 text-xs 
//                                bg-emerald-600 hover:bg-emerald-700"
//                 >
//                     Save Changes
//                 </Button>
//             </div>
//         </form>
//     </Modal>
// )}

//             {/*view modal*/}
//             {viewModal && activeLocation && (
//                 <Modal onClose={() => setViewModal(false)}>
//                     <h3 className="text-sm font-bold text-slate-800 mb-1">Location Details</h3>
//                     <p className="text-xs text-slate-400 mb-4">{activeLocation.location_name}</p>
//                     {!viewData ? (
//                         <div className="flex justify-center py-10">
//                             <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
//                         </div>
//                     ) : (
//                         <div className="space-y-4">
//                             <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
//                                 {[
//                                     { l: 'Location Name',     v: viewData.location_name },
//                                     { l: 'Corridor',          v: viewData.corridor_name },
//                                     { l: 'Type',              v: viewData.location_type },
//                                     { l: 'Phase',             v: viewData.phase?.phase_name },
//                                     { l: 'Vendor',            v: viewData.vendor?.vendor_name },
//                                     { l: 'Supervisor',        v: viewData.supervisor?.full_name },
//                                     { l: 'No. of Lanes',      v: viewData.no_of_lanes },
//                                     { l: 'No. of Roads',      v: viewData.no_of_roads },
//                                     { l: 'Proposed Solution', v: viewData.proposed_solution },
//                                     { l: 'Overall Status',    v: viewData.overall_status },
//                                 ].map((item, i) => (
//                                     <div key={i}>
//                                         <p className="text-[10px] text-slate-400 uppercase font-semibold">{item.l}</p>
//                                         <p className="text-sm text-slate-700 font-medium">{item.v || '-'}</p>
//                                     </div>
//                                 ))}
//                             </div>
//                             <div>
//                                 <h4 className="text-xs font-bold text-slate-700 mb-2">Activities Status</h4>
//                                 {(!viewData.activities || viewData.activities.length === 0) ? (
//                                     <p className="text-xs text-slate-400 italic">No activities found.</p>
//                                 ) : (
//                                     <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
//                                         <table className="w-full text-left">
//                                             <thead className="bg-slate-50 sticky top-0">
//                                                 <tr>
//                                                     <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">Activity</th>
//                                                     <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase text-center">Done?</th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody className="divide-y divide-slate-100">
//                                                 {viewData.activities.map((act, i) => {
//                                                     const isDone = act.status === 'Completed';
//                                                     return (
//                                                         <tr key={act.id || i} className="hover:bg-slate-50/50">
//                                                             <td className="px-3 py-2 text-xs text-slate-700">{act.activity?.activity_name || '-'}</td>
//                                                             <td className="px-3 py-2 text-center">
//                                                                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
//                                                                     {isDone ? 'Yes' : 'No'}
//                                                                 </span>
//                                                             </td>
//                                                         </tr>
//                                                     );
//                                                 })}
//                                             </tbody>
//                                         </table>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     )}
//                     <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
//                         <button onClick={() => setViewModal(false)}
//                             className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
//                             Close
//                         </button>
//                     </div>
//                 </Modal>
//             )}

//             {/* delete modal*/}
//             {deleteModal && activeLocation && (
//                 <Modal onClose={() => setDeleteModal(false)}>
//                     <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
//                         <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                                 d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
//                         </svg>
//                     </div>
//                     <h3 className="text-sm font-bold text-slate-800 text-center mb-1">Delete Location</h3>
//                     <p className="text-xs text-slate-500 text-center mb-1">Are you sure you want to delete</p>
//                     <p className="text-sm font-semibold text-slate-700 text-center mb-1">"{activeLocation.location_name}"</p>
//                     <p className="text-xs text-red-500 text-center mb-6">⚠️ This action cannot be undone.</p>
//                     <div className="flex gap-2 justify-end">
//                         <button onClick={() => setDeleteModal(false)}
//                             className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
//                             Cancel
//                         </button>
//                         <button onClick={handleDelete} disabled={crudLoading}
//                             className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg flex items-center gap-1.5">
//                             {crudLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
//                             {crudLoading ? 'Deleting...' : 'Yes, Delete'}
//                         </button>
//                     </div>
//                 </Modal>
//             )}

//             {/* bulk assign supervisor model*/}
//             {bulkModal && (
//                 <Modal onClose={() => setBulkModal(false)}>
//                     <h3 className="text-sm font-bold text-slate-800 mb-1">Bulk Assign Supervisor</h3>
//                     <p className="text-xs text-slate-400 mb-4">{selected.length} locations selected</p>
//                     <div className="bg-slate-50 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
//                         {selected.map(sId => {
//                             const loc = data.find(d => d.id === sId);
//                             return <p key={sId} className="text-[11px] text-slate-600">• {loc?.location_name}</p>;
//                         })}
//                     </div>
//                     <label className="block text-xs font-semibold text-slate-600 mb-1">Select Supervisor</label>
//                     <select value={bulkSupId} onChange={e => setBulkSupId(e.target.value)}
//                         className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4">
//                         <option value="">Choose...</option>
//                         {supervisors.map(s => (
//                             <option key={s.id} value={s.id}>{s.full_name} — {s.phone}</option>
//                         ))}
//                     </select>
//                     <div className="flex gap-2 justify-end">
//                         <button onClick={() => setBulkModal(false)}
//                             className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
//                             Cancel
//                         </button>
//                         <button onClick={bulkAssign} disabled={saving}
//                             className="px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 rounded-lg flex items-center gap-1.5">
//                             {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
//                             {saving ? 'Assigning...' : `Assign to ${selected.length} Locations`}
//                         </button>
//                     </div>
//                 </Modal>
//             )}

//             {/* ── bulk assign worker model */}
//             {workerModal && (
//                 <Modal onClose={() => { setWorkerModal(false); setSelWorkerId(''); }}>
//                     <h3 className="text-sm font-bold text-slate-800 mb-1">Assign Worker</h3>
//                     <p className="text-xs text-slate-400 mb-4">{selected.length} location(s) selected</p>
//                     <div className="bg-slate-50 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
//                         {selected.map(sId => {
//                             const loc = data.find(d => d.id === sId);
//                             return <p key={sId} className="text-[11px] text-slate-600">• {loc?.location_name}</p>;
//                         })}
//                     </div>
//                     <label className="block text-xs font-semibold text-slate-600 mb-1">Select Worker</label>
//                     <select value={selWorkerId} onChange={e => setSelWorkerId(e.target.value)}
//                         className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4">
//                         <option value="">Choose Worker...</option>
//                         {workers.map(w => (
//                             <option key={w.id} value={w.id}>{w.full_name} — {w.phone}</option>
//                         ))}
//                     </select>
//                     {workers.length === 0 && (
//                         <p className="text-xs text-amber-500 mb-4">⚠️ No workers found. Please add workers first.</p>
//                     )}
//                     <div className="flex gap-2 justify-end">
//                         <button onClick={() => { setWorkerModal(false); setSelWorkerId(''); }}
//                             className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
//                             Cancel
//                         </button>
//                         <button onClick={bulkAssignWorker} disabled={saving || !selWorkerId}
//                             className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 rounded-lg flex items-center gap-1.5">
//                             {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
//                             {saving ? 'Assigning...' : `Assign to ${selected.length} Locations`}
//                         </button>
//                     </div>
//                 </Modal>
//             )}

//         </div>
//     );
// };

// export default Locations;