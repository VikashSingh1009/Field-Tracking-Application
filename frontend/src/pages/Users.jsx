// Users.jsx — Complete File with Dynamic Role Management
import { useState, useEffect, useCallback } from "react";
import API from "../api/client";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Edit, Trash2, Power, PowerOff, Plus, Search,
  UserCheck, Shield, Wrench, Copy, CheckCircle2,
  X, Loader, UsersIcon, ChevronDown
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   QUICK ADD MODAL — Reusable popup to add any master data
═══════════════════════════════════════════════════════════════ */
const QuickAddModal = ({ title, label, placeholder, onClose, onAdd }) => {
  const [value,   setValue]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) { setError(`${label} is required`); return; }
    setLoading(true);
    setError("");
    try {
      await onAdd(value.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center
                  bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────── */}
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
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors
                       text-slate-400 hover:text-slate-600"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Form ────────────────────────────────────────── */}
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
            {error && (
              <p className="mt-1.5 text-xs text-red-500 font-medium
                            flex items-center gap-1">
                ⚠️ {error}
              </p>
            )}
          </div>

          {/* ── Buttons ───────────────────────────────────── */}
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
              {loading
                ? <><Loader size={12} className="animate-spin" /> Adding...</>
                : <><Plus size={12} /> Add Role</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 
   ROLE SELECT WITH ADD BUTTON
   → Shows role dropdown + "+ Add Role" button
*/
const RoleSelectWithAdd = ({
  value, onChange, roles, onAddRoleClick, disabled = false
}) => (
  <div>
    {/* ── Label Row */}
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-xs font-semibold text-slate-600">
        Role <span className="text-red-500">*</span>
      </label>
      {/* ── "+ Add Role" Button */}
      {!disabled && (
        <button
          type="button"
          onClick={onAddRoleClick}
          className="flex items-center gap-1 text-[10px] font-semibold
                     text-violet-600 hover:text-violet-800 bg-violet-50
                     hover:bg-violet-100 px-2 py-1 rounded-lg
                     transition-all border border-violet-100"
          title="Add new role"
        >
          <Plus size={10} /> Add New Role
        </button>
      )}
    </div>

    {/* ── Select Dropdown  */}
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 border-2 border-slate-200
                   rounded-xl text-sm focus:outline-none
                   focus:ring-4 focus:ring-violet-500/10
                   focus:border-violet-500 bg-white transition-all
                   appearance-none
                   ${disabled ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`}
      >
        <option value="">Select Role...</option>
        {roles.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3.5 top-1/2 -translate-y-1/2
                   text-slate-400 pointer-events-none"
      />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   HELPER — Role badge color
═══════════════════════════════════════════════════════════════ */
const getRoleBadgeClass = (role) => {
  const map = {
    Admin:      "bg-rose-50 text-rose-700 border-rose-100",
    Supervisor: "bg-blue-50 text-blue-700 border-blue-100",
    Worker:     "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  // ✅ Default for any custom roles added dynamically
  return `px-2.5 py-1 rounded-xl text-[11px] font-bold border
    ${map[role] || "bg-violet-50 text-violet-700 border-violet-100"}`;
};

/* ═══════════════════════════════════════════════════════════════
   HELPER — Role avatar gradient color
═══════════════════════════════════════════════════════════════ */
const getRoleAvatar = (role) => {
  const map = {
    Admin:      "bg-gradient-to-br from-rose-500 to-pink-600",
    Supervisor: "bg-gradient-to-br from-blue-500 to-indigo-600",
    Worker:     "bg-gradient-to-br from-emerald-500 to-teal-600",
  };
  // ✅ Default gradient for custom roles
  return map[role] || "bg-gradient-to-br from-violet-500 to-purple-600";
};

/* ═══════════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════════ */
const StatCard = ({ value, label, icon: Icon, bg, text }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="relative bg-white rounded-2xl p-4 border border-slate-100
               shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
  >
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${bg} opacity-60`} />
    <div className="flex items-center justify-between mb-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                       bg-slate-50`}>
        <Icon size={17} className={text} />
      </div>
    </div>
    <p className={`text-2xl font-extrabold tracking-tight ${text}`}>
      {value}
    </p>
    <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">
      {label}
    </p>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   DEFAULT ROLES — Always available as base roles
   (Even if master_lookups is empty)
═══════════════════════════════════════════════════════════════ */
const DEFAULT_ROLES = [
  { value: "Supervisor", label: "Supervisor" },
  { value: "Worker",     label: "Worker"     },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN USERS COMPONENT
═══════════════════════════════════════════════════════════════ */
const Users = () => {
  /* ── States ───────────────────────────────────────────────── */
  const [data,            setData]            = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [modal,           setModal]           = useState(false);
  const [editModal,       setEditModal]       = useState(false);
  const [editUser,        setEditUser]        = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [filter,          setFilter]          = useState("all");
  const [search,          setSearch]          = useState("");
  const [roles,           setRoles]           = useState(DEFAULT_ROLES);
  const [allFilters,      setAllFilters]      = useState(["all", "Admin", "Supervisor", "Worker"]);
  const [inviteLink,      setInviteLink]      = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // ✅ Quick Add Role Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "",
    role: "", employee_id: "",
  });

  /* ── Fetch Roles from master_lookups ──────────────────────── */
  const fetchRoles = useCallback(async () => {
    try {
      const res = await API.get("/admin/lookups?category=user_role");
      const masterRoles = (res.data.data || []).map((r) => ({
        value: r.label,   // ✅ Use label as value (e.g. "Field Engineer")
        label: r.label,
      }));

      // ✅ Merge DEFAULT_ROLES + dynamic roles (no duplicates)
      const existingValues = DEFAULT_ROLES.map((r) => r.value.toLowerCase());
      const newRoles = masterRoles.filter(
        (r) => !existingValues.includes(r.value.toLowerCase())
      );
      const merged = [...DEFAULT_ROLES, ...newRoles];
      setRoles(merged);

      // ✅ Update filter tabs with dynamic roles
      const filterTabs = [
        "all", "Admin",
        ...merged.map((r) => r.value)
      ];
      // Remove duplicates
      setAllFilters([...new Set(filterTabs)]);

    } catch (err) {
      console.error("Failed to fetch roles:", err.message);
      // ✅ Fallback to default roles
      setRoles(DEFAULT_ROLES);
    }
  }, []);

  /* ── Fetch Users ──────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/admin/users?";
      if (filter !== "all") url += `role=${filter}&`;
      if (search) url += `search=${search}`;
      const r = await API.get(url);
      setData(r.data.data || []);
    } catch (err) {
      console.error("fetchData error:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);
  useEffect(() => { fetchData();  }, [fetchData]);

  /* ── Handle Quick Add Role ────────────────────────────────── */
  const handleAddRole = async (roleName) => {
    try {
      // ✅ Check duplicate
      const exists = roles.some(
        (r) => r.value.toLowerCase() === roleName.toLowerCase()
      );
      if (exists) {
        throw new Error(`Role "${roleName}" already exists!`);
      }

      // ✅ Save to master_lookups
      await API.post("/admin/lookups", {
        category:   "user_role",
        value:      roleName.toLowerCase().replace(/\s+/g, "_"),
        label:      roleName,
        sort_order: 0,
      });

      // ✅ Refresh roles list
      await fetchRoles();
      toast.success(`✅ Role "${roleName}" added successfully!`);

    } catch (err) {
      throw new Error(
        err?.response?.data?.message || err.message || "Failed to add role"
      );
    }
  };

  /* ── Create User ──────────────────────────────────────────── */
  const create = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.role) {
      return toast.error("Name, Phone & Role are required");
    }
    setSaving(true);
    try {
      const res = await API.post("/admin/users", form);
      if (res.data.invite_link) {
        setInviteLink(res.data.invite_link);
        setShowInviteModal(true);
      }
      toast.success("User created successfully!");
      setModal(false);
      setForm({
        full_name: "", phone: "", email: "",
        role: "", employee_id: ""
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  /* ── Update User */
  const update = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    if (!editUser.role) {
    return toast.error("Please select a role");
  }
    setSaving(true);
    try {
      await API.put(`/admin/users/${editUser.id}`, {
        full_name:   editUser.full_name,
        phone:       editUser.phone,
        email:       editUser.email,
        employee_id: editUser.employee_id,
        role: editUser.role,
      });
      toast.success("User updated!");
      setEditModal(false);
      setEditUser(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  /* ── Toggle User Status ───────────────────────────────────── */
  const toggle = async (id) => {
    try {
      await API.patch(`/admin/users/${id}/toggle-status`);
      toast.success("Status updated!");
      fetchData();
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  /* ── Delete User ──────────────────────────────────────────── */
  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.delete(`/admin/users/${id}`);
      toast.success("User deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  /* ── Copy Invite Link ─────────────────────────────────────── */
  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  /* ── Computed Stats ───────────────────────────────────────── */
  const total       = data.length;
  const admins      = data.filter((u) => u.role === "Admin").length;
  const supervisors = data.filter((u) => u.role === "Supervisor").length;
  const workers     = data.filter((u) => u.role === "Worker").length;
  // ✅ Custom roles count
  const customRoles = data.filter(
    (u) => !["Admin", "Supervisor", "Worker"].includes(u.role)
  ).length;

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
            Team Management
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {total} members · {roles.length} roles available
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* ── Add Role Button ─────────────────────────────── */}
          {/* <button
            onClick={() => setShowRoleModal(true)}
            className="px-4 py-2.5 text-xs font-semibold bg-slate-100
                       text-slate-700 rounded-2xl hover:bg-slate-200
                       flex items-center gap-2 transition-all border
                       border-slate-200"
          >
            <Shield size={14} /> Manage Roles
          </button> */}
          {/* ── Add User Button ─────────────────────────────── */}
          <button
            onClick={() => setModal(true)}
            className="px-4 py-2.5 text-xs font-semibold bg-violet-600
                       text-white rounded-2xl hover:bg-violet-700
                       flex items-center gap-2 transition-all
                       shadow-md shadow-violet-500/20"
          >
            <Plus size={14} /> Add User
          </button>
        </div>
      </motion.div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          value={total} label="Total"
          icon={UsersIcon} bg="bg-violet-500" text="text-violet-600"
        />
        <StatCard
          value={admins} label="Admins"
          icon={Shield} bg="bg-rose-500" text="text-rose-600"
        />
        <StatCard
          value={supervisors} label="Supervisors"
          icon={UserCheck} bg="bg-blue-500" text="text-blue-600"
        />
        <StatCard
          value={workers} label="Workers"
          icon={Wrench} bg="bg-emerald-500" text="text-emerald-600"
        />
      </div>

      {/* ✅ Custom Roles Stats — show only if custom roles exist */}
      {customRoles > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl
                        px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-100 rounded-xl flex
                          items-center justify-center">
            <Shield size={15} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-violet-700">
              {customRoles} users with custom roles
            </p>
            <p className="text-[10px] text-violet-500 font-medium">
              Custom roles:{" "}
              {roles
                .filter((r) => !["Supervisor", "Worker"].includes(r.value))
                .map((r) => r.label)
                .join(", ") || "None yet"}
            </p>
          </div>
        </div>
      )}

      {/* ── Search & Filters ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* ── Search Input ─────────────────────────────── */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2
                                          -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200
                         rounded-xl text-sm focus:outline-none
                         focus:ring-4 focus:ring-violet-500/10
                         focus:border-violet-500 transition-all"
            />
          </div>

          {/* ✅ Dynamic Filter Tabs — includes custom roles */}
          <div className="flex gap-1.5 flex-wrap">
            {allFilters.map((r) => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl
                            transition-all ${
                  filter === r
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r === "all" ? "All" : r}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Users Table ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100
                   overflow-hidden shadow-sm"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center
                          py-20 gap-3">
            <div className="w-10 h-10 border-[3px] border-violet-500
                            border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">
              Loading users...
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 flex flex-col
                          items-center gap-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex
                            items-center justify-center">
              <UsersIcon size={24} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              No users found
            </p>
            <p className="text-xs text-slate-300">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/40">
                  <th className="px-5 py-3 text-left text-[11px] font-bold
                                 text-slate-400 uppercase tracking-widest">
                    User
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold
                                 text-slate-400 uppercase tracking-widest">
                    Phone
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold
                                 text-slate-400 uppercase tracking-widest">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold
                                 text-slate-400 uppercase tracking-widest">
                    Role
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold
               text-slate-400 uppercase tracking-widest">
                      Status
                  </th>

                {/* ✅ ADD THIS NEW COLUMN HEADER HERE */}
                <th className="px-5 py-3 text-left text-[11px] font-bold
               text-slate-400 uppercase tracking-widest">
                    Reporting To
                </th>

              <th className="px-5 py-3 text-left text-[11px] font-bold
               text-slate-400 uppercase tracking-widest">
                Actions
              </th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-slate-50
                               hover:bg-slate-50/60 transition-colors"
                  >
                    {/* ── User Info ──────────────────────── */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center
                          justify-center text-white text-xs font-bold
                          shadow-sm ${getRoleAvatar(u.role)}`}>
                          {u.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-700">
                            {u.full_name}
                          </p>
                          {u.employee_id && (
                            <p className="text-[10px] text-slate-400 font-medium">
                              ID: {u.employee_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-[13px]
                                   text-slate-500 font-medium">
                      {u.phone}
                    </td>
                    <td className="px-5 py-3.5 text-[13px]
                                   text-slate-500 font-medium">
                      {u.email || "-"}
                    </td>

                    {/* ✅ Role Badge — works for ALL roles */}
                    <td className="px-5 py-3.5">
                      <span className={getRoleBadgeClass(u.role)}>
                        {u.role}
                      </span>
                    </td>

                    {/* ── Active Status ──────────────────── */}
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-xl text-[11px]
                    font-bold border ${
                    u.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}>
                  {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* ✅ ADD THIS NEW COLUMN DATA HERE */}
                <td className="px-5 py-3.5">
                  {u.role === "Worker" ? (
                u.my_supervisor ? (
                <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex
                        items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-blue-600">
                  {u.my_supervisor.full_name?.[0]?.toUpperCase()}
                </span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700">
                {u.my_supervisor.full_name}
                </span>
               </div>
              ) : (
              <span className="text-[11px] font-bold text-amber-500
                       bg-amber-50 px-2.5 py-1 rounded-xl
                       border border-amber-100">
              ⚠️ Unassigned
              </span>
              )
            ) : (
            <span className="text-slate-300 text-sm">—</span>
            )}
            </td>
                    {/* ── Actions ────────────────────────── */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditUser({ ...u });
                            setEditModal(true);
                          }}
                          className="p-2 text-violet-600 bg-violet-50
                                     hover:bg-violet-100 rounded-xl
                                     transition-all"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => toggle(u.id)}
                          className={`p-2 rounded-xl transition-all ${
                            u.is_active
                              ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                              : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                          }`}
                          title={u.is_active ? "Deactivate" : "Activate"}
                        >
                          {u.is_active
                            ? <PowerOff size={15} />
                            : <Power size={15} />
                          }
                        </button>
                        {u.role !== "Admin" && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="p-2 text-rose-600 bg-rose-50
                                       hover:bg-rose-100 rounded-xl
                                       transition-all"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════ */}

      {/* ── Create User Modal ──────────────────────────────── */}
      {modal && (
        <Modal onClose={() => setModal(false)}>
          <div className="mb-5">
            <h3 className="text-lg font-extrabold text-slate-800
                           tracking-tight">
              Create New User
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Fill details and send an invite
            </p>
          </div>
          <form onSubmit={create} className="space-y-4">
            <Input
              label="Full Name *"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Enter full name"
            />
            <Input
              label="Phone Number *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Enter phone number"
            />
            <Input
              label="Email (optional — for invite)"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Optional"
            />

            {/* ✅ Role Dropdown with Add New Role button */}
            <RoleSelectWithAdd
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              roles={roles}
              onAddRoleClick={() => setShowRoleModal(true)}
            />

            <Input
              label="Employee ID"
              value={form.employee_id}
              onChange={(e) =>
                setForm({ ...form, employee_id: e.target.value })
              }
              placeholder="Optional"
            />
            <div className="flex gap-2 justify-end pt-3
                            border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600
                           bg-slate-100 hover:bg-slate-200 rounded-2xl
                           transition-all"
              >
                Cancel
              </button>
              <Button
                type="submit"
                loading={saving}
                className="w-auto px-5 py-2.5 text-xs"
              >
                Create & Send Invite
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Invite Link Modal ──────────────────────────────── */}
      {showInviteModal && (
        <Modal onClose={() => setShowInviteModal(false)}>
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex
                            items-center justify-center mx-auto">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800">
                User Created Successfully!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Share this link with the user to set their password
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200
                            rounded-2xl p-4 text-left">
              <p className="text-[11px] text-slate-600 break-all font-mono">
                {inviteLink}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 px-4 py-2.5 text-xs font-semibold
                           bg-violet-600 text-white rounded-2xl
                           hover:bg-violet-700 flex items-center
                           justify-center gap-2 transition-all
                           shadow-md shadow-violet-500/20"
              >
                <Copy size={14} /> Copy Invite Link
              </button>
            </div>
            <p className="text-[10px] text-rose-500 font-medium">
              ⚠️ Link expires in 24 hours
            </p>
            <button
              onClick={() => setShowInviteModal(false)}
              className="text-xs text-slate-400 hover:text-slate-600
                         font-medium"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editModal && editUser && (
  <Modal onClose={() => setEditModal(false)}>
    <div className="mb-5">
      <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
        Edit User
      </h3>
      <p className="text-xs text-slate-400 mt-1">
        Update user details
      </p>
    </div>

    <form onSubmit={update} className="space-y-4">
      <Input
        label="Full Name"
        value={editUser.full_name || ""}
        onChange={(e) =>
          setEditUser({ ...editUser, full_name: e.target.value })
        }
      />
      <Input
        label="Phone"
        value={editUser.phone || ""}
        onChange={(e) =>
          setEditUser({ ...editUser, phone: e.target.value })
        }
      />
      <Input
        label="Email"
        type="email"
        value={editUser.email || ""}
        onChange={(e) =>
          setEditUser({ ...editUser, email: e.target.value })
        }
      />
      <Input
        label="Employee ID"
        value={editUser.employee_id || ""}
        onChange={(e) =>
          setEditUser({ ...editUser, employee_id: e.target.value })
        }
      />

      {/* ── Role Field ─────────────────────────────────── */}
      {editUser.role === "Admin" ? (

        /* Admin — role is locked, cannot change */
        <div>
          <div className="flex items-center justify-between mb-1.5">
            {/* ✅ FIX 2 — mb-1.5 not "mb-1 5" */}
            <label className="text-xs font-semibold text-slate-600">
              Role
            </label>
          </div>
          <div className="relative">
            <select
              value="Admin"
              disabled
              className="w-full px-3.5 py-2.5 border-2 border-slate-200
                         rounded-xl text-sm bg-slate-50 text-slate-500
                         cursor-not-allowed appearance-none"
            >
              <option value="Admin">Admin</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3.5 top-1/2 -translate-y-1/2
                         text-slate-400 pointer-events-none"
            />
          </div>
          {/* ✅ FIX 1 — lowercase <p> not <P> */}
          <p className="text-[10px] text-slate-400 mt-1.5">
            🔒 Admin role cannot be changed.
          </p>
        </div>

      ) : (

        /* Non-Admin — role is fully editable */
        <RoleSelectWithAdd
          value={editUser.role || ""}
          onChange={(e) =>
            setEditUser({ ...editUser, role: e.target.value })
          }
          roles={roles}
          onAddRoleClick={() => setShowRoleModal(true)}
          disabled={false}
        />

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
        <Button
          type="submit"
          loading={saving}
          className="w-auto px-5 py-2.5 text-xs"
        >
          Save Changes
        </Button>
      </div>
    </form>
  </Modal>
)}

      {/* ✅ Quick Add Role Modal */}
      {showRoleModal && (
        <QuickAddModal
          title="Add New Role"
          label="Role Name"
          placeholder="e.g. Field Engineer, Inspector, Manager..."
          onClose={() => setShowRoleModal(false)}
          onAdd={handleAddRole}
        />
      )}

    </div>
  );
};

export default Users;