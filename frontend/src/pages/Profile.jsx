// Profile.jsx
// All 3 roles ke liye Profile Page
// Existing UI style match karta hai

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/client";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User, Phone, Mail, Shield, Briefcase,
  Lock, Eye, EyeOff, CheckCircle2,
  Edit3, Save, X, UserCheck, Wrench,
  AlertCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   ROLE CONFIG — Colors per role
═══════════════════════════════════════════════ */
const ROLE_CONFIG = {
  Admin: {
    gradient: "from-rose-500 to-pink-600",
    bg:       "bg-rose-50",
    text:     "text-rose-700",
    border:   "border-rose-100",
    icon:     Shield,
    label:    "System Administrator"
  },
  Supervisor: {
    gradient: "from-blue-500 to-indigo-600",
    bg:       "bg-blue-50",
    text:     "text-blue-700",
    border:   "border-blue-100",
    icon:     UserCheck,
    label:    "Field Supervisor"
  },
  Worker: {
    gradient: "from-emerald-500 to-teal-600",
    bg:       "bg-emerald-50",
    text:     "text-emerald-700",
    border:   "border-emerald-100",
    icon:     Wrench,
    label:    "Field Worker"
  }
};

/* ═══════════════════════════════════════════════
   SECTION CARD — Reusable wrapper
═══════════════════════════════════════════════ */
const SectionCard = ({ title, subtitle, icon: Icon, iconBg, iconColor, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-9 h-9 ${iconBg} rounded-2xl flex items-center justify-center`}>
        <Icon size={17} className={iconColor} />
      </div>
      <div>
        <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {children}
  </motion.div>
);

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
const Profile = () => {
  const { user: authUser, login, role } = useAuth();

  /* ── States ── */
  const [profileData,   setProfileData]   = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [editMode,      setEditMode]      = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass,    setSavingPass]    = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name:   "",
    email:       "",
    employee_id: ""
  });
  const [profileErrors, setProfileErrors] = useState({});

  // Password form
  const [passForm, setPassForm] = useState({
    old_password:     "",
    new_password:     "",
    confirm_password: ""
  });
  const [passErrors,   setPassErrors]   = useState({});
  const [showOld,      setShowOld]      = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // Assignment data
  const [assignData, setAssignData] = useState(null);

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.Worker;
  const RoleIcon   = roleConfig.icon;

  /* ── Fetch Profile ── */
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("/auth/me");
      const u   = res.data.user || {};
      setProfileData(u);
      setProfileForm({
        full_name:   u.full_name   || "",
        email:       u.email       || "",
        employee_id: u.employee_id || ""
      });

      // Fetch assignment data based on role
      if (role === "Worker") {
        try {
          // Worker ka supervisor fetch karo
          const supRes = await API.get("/admin/supervisors");
          const allSups = supRes.data.data || [];
          const mySup = allSups.find(s => s.id === u.supervisor_id);
          setAssignData({ supervisor: mySup || null });
        } catch { setAssignData(null); }

      } else if (role === "Supervisor") {
        try {
          // Supervisor ke workers fetch karo
          const workerRes = await API.get("/supervisor/my-workers");
          setAssignData({ workers: workerRes.data.data || [] });
        } catch { setAssignData(null); }
      }

    } catch (err) {
      toast.error("Failed to load profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  /* ── Profile Update ── */
  const handleProfileSave = async () => {
    // Validation
    const errors = {};
    if (!profileForm.full_name?.trim()) {
      errors.full_name = "Full name is required";
    }
    if (profileForm.email && !/\S+@\S+\.\S+/.test(profileForm.email)) {
      errors.email = "Enter a valid email";
    }
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setSavingProfile(true);
    try {
      const res = await API.patch("/auth/update-profile", {
        full_name:   profileForm.full_name.trim(),
        email:       profileForm.email?.trim()       || null,
        employee_id: profileForm.employee_id?.trim() || null
      });

      toast.success("Profile updated successfully! ✅");
      setEditMode(false);
      setProfileErrors({});

      // AuthContext update karo
      const updatedUser = res.data.user;
      const token = localStorage.getItem("token");
      login(updatedUser, token);

      // Local state update karo
      setProfileData(updatedUser);

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Cancel Edit ── */
  const handleCancelEdit = () => {
    setEditMode(false);
    setProfileErrors({});
    // Reset form to original
    setProfileForm({
      full_name:   profileData?.full_name   || "",
      email:       profileData?.email       || "",
      employee_id: profileData?.employee_id || ""
    });
  };

  /* ── Password Change ── */
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validation
    const errors = {};
    if (!passForm.old_password) {
      errors.old_password = "Current password is required";
    }
    if (!passForm.new_password) {
      errors.new_password = "New password is required";
    } else if (passForm.new_password.length < 6) {
      errors.new_password = "Must be at least 6 characters";
    }
    if (!passForm.confirm_password) {
      errors.confirm_password = "Please confirm your password";
    } else if (passForm.new_password !== passForm.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }
    if (passForm.old_password === passForm.new_password) {
      errors.new_password = "New password must be different from current";
    }

    if (Object.keys(errors).length > 0) {
      setPassErrors(errors);
      return;
    }

    setSavingPass(true);
    try {
      await API.patch("/auth/change-password", {
        old_password: passForm.old_password,
        new_password: passForm.new_password
      });

      toast.success("Password changed successfully! 🔐");
      setPassForm({
        old_password:     "",
        new_password:     "",
        confirm_password: ""
      });
      setPassErrors({});

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPass(false);
    }
  };

  /* ── Password Strength ── */
  const getPasswordStrength = (pass) => {
    if (!pass) return null;
    if (pass.length < 6)  return { level: "Weak",   color: "bg-rose-500",   width: "25%"  };
    if (pass.length < 8)  return { level: "Fair",   color: "bg-amber-500",  width: "50%"  };
    if (pass.length < 12) return { level: "Good",   color: "bg-blue-500",   width: "75%"  };
    return                       { level: "Strong", color: "bg-emerald-500",width: "100%" };
  };
  const passStrength = getPasswordStrength(passForm.new_password);

  /* ── Loading ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[75vh] gap-5">
      <div className="w-12 h-12 border-[3px] border-violet-500
                      border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading profile...</p>
    </div>
  );

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
          My Profile
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Manage your account settings and preferences
        </p>
      </motion.div>

      {/* ══════════════════════════════════════
          SECTION 1 — Profile Hero Card
      ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative bg-white rounded-3xl border border-slate-100
                   p-6 shadow-sm overflow-hidden"
      >
        {/* Background gradient */}
        <div className={`absolute top-0 left-0 right-0 h-1
                         bg-gradient-to-r ${roleConfig.gradient}`} />

        <div className="flex items-center gap-5 flex-wrap">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br
                           ${roleConfig.gradient} flex items-center
                           justify-center text-white text-3xl font-bold
                           shadow-lg flex-shrink-0`}>
            {profileData?.full_name?.[0]?.toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {profileData?.full_name}
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              📞 {profileData?.phone}
            </p>
            {profileData?.email && (
              <p className="text-sm text-slate-400 font-medium">
                ✉️ {profileData?.email}
              </p>
            )}

            {/* Role + Status badges */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`flex items-center gap-1.5 px-3 py-1.5
                               ${roleConfig.bg} ${roleConfig.text}
                               ${roleConfig.border} border rounded-xl
                               text-[12px] font-bold`}>
                <RoleIcon size={12} />
                {role}
              </span>
              <span className={`px-3 py-1.5 rounded-xl text-[12px] font-bold
                               border ${profileData?.is_active
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-rose-50 text-rose-700 border-rose-100"
              }`}>
                {profileData?.is_active ? "✅ Active" : "❌ Inactive"}
              </span>
              {profileData?.employee_id && (
                <span className="px-3 py-1.5 rounded-xl text-[12px] font-bold
                                 bg-slate-50 text-slate-600 border border-slate-200">
                  ID: {profileData.employee_id}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════
          SECTION 2 — Personal Information
      ══════════════════════════════════════ */}
      <SectionCard
        title="Personal Information"
        subtitle="Update your name, email and employee ID"
        icon={User}
        iconBg="bg-violet-50"
        iconColor="text-violet-600"
      >
        {!editMode ? (
          // View Mode
          <div className="space-y-3">
            {[
              { label: "Full Name",   value: profileData?.full_name,   icon: User      },
              { label: "Phone",       value: profileData?.phone,        icon: Phone     },
              { label: "Email",       value: profileData?.email,        icon: Mail      },
              { label: "Employee ID", value: profileData?.employee_id,  icon: Briefcase },
            ].map((item, i) => (
              <div key={i}
                   className="flex items-center gap-3 p-3.5 bg-slate-50/80
                              rounded-2xl border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center
                                justify-center border border-slate-200 flex-shrink-0">
                  <item.icon size={14} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400
                                 uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-[13px] font-semibold text-slate-700 mt-0.5">
                    {item.value || "—"}
                  </p>
                </div>
              </div>
            ))}

            {/* Edit Button */}
            <button
              onClick={() => setEditMode(true)}
              className="w-full mt-2 flex items-center justify-center gap-2
                         px-4 py-3 text-sm font-semibold text-violet-600
                         bg-violet-50 hover:bg-violet-100 rounded-2xl
                         border border-violet-100 transition-all"
            >
              <Edit3 size={15} />
              Edit Profile
            </button>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-4">
            <Input
              label="Full Name *"
              value={profileForm.full_name}
              onChange={(e) => {
                setProfileForm({ ...profileForm, full_name: e.target.value });
                setProfileErrors({ ...profileErrors, full_name: "" });
              }}
              placeholder="Enter your full name"
              error={profileErrors.full_name}
            />

            {/* Phone — read only */}
            <div>
              <label className="block text-sm font-semibold text-slate-700
                                 mb-1.5 tracking-tight">
                Phone Number
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50
                              border-2 border-slate-200 rounded-xl">
                <Phone size={15} className="text-slate-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-500">
                  {profileData?.phone}
                </span>
                <span className="ml-auto text-[10px] font-bold text-slate-400
                                  bg-slate-200 px-2 py-1 rounded-lg">
                  Cannot Change
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                Contact admin to change phone number
              </p>
            </div>

            <Input
              label="Email Address"
              type="email"
              value={profileForm.email}
              onChange={(e) => {
                setProfileForm({ ...profileForm, email: e.target.value });
                setProfileErrors({ ...profileErrors, email: "" });
              }}
              placeholder="your@email.com (optional)"
              error={profileErrors.email}
            />

            <Input
              label="Employee ID"
              value={profileForm.employee_id}
              onChange={(e) =>
                setProfileForm({ ...profileForm, employee_id: e.target.value })
              }
              placeholder="e.g. EMP001 (optional)"
            />

            {/* Save / Cancel Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={savingProfile}
                className="flex-1 flex items-center justify-center gap-2
                           px-4 py-3 text-sm font-semibold text-slate-600
                           bg-slate-100 hover:bg-slate-200 rounded-2xl
                           transition-all disabled:opacity-50"
              >
                <X size={15} />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="flex-1 flex items-center justify-center gap-2
                           px-4 py-3 text-sm font-semibold text-white
                           bg-violet-600 hover:bg-violet-700 rounded-2xl
                           transition-all disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-md shadow-violet-500/20"
              >
                {savingProfile ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white
                                    border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ══════════════════════════════════════
          SECTION 3 — Change Password
      ══════════════════════════════════════ */}
      <SectionCard
        title="Change Password"
        subtitle="Use a strong password to keep your account secure"
        icon={Lock}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">

          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700
                               mb-1.5 tracking-tight">
              Current Password *
            </label>
            <div className={`relative flex items-center rounded-xl border-2
                            transition-all duration-200
                            ${passErrors.old_password
                ? "border-red-400"
                : "border-slate-200 hover:border-slate-300"
              } bg-white`}>
              <input
                type={showOld ? "text" : "password"}
                value={passForm.old_password}
                onChange={(e) => {
                  setPassForm({ ...passForm, old_password: e.target.value });
                  setPassErrors({ ...passErrors, old_password: "" });
                }}
                placeholder="Enter current password"
                className="w-full px-4 py-3 text-sm font-medium text-slate-800
                           placeholder-slate-400 bg-transparent outline-none rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="pr-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passErrors.old_password && (
              <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {passErrors.old_password}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700
                               mb-1.5 tracking-tight">
              New Password *
            </label>
            <div className={`relative flex items-center rounded-xl border-2
                            transition-all duration-200
                            ${passErrors.new_password
                ? "border-red-400"
                : "border-slate-200 hover:border-slate-300"
              } bg-white`}>
              <input
                type={showNew ? "text" : "password"}
                value={passForm.new_password}
                onChange={(e) => {
                  setPassForm({ ...passForm, new_password: e.target.value });
                  setPassErrors({ ...passErrors, new_password: "" });
                }}
                placeholder="Enter new password (min 6 chars)"
                className="w-full px-4 py-3 text-sm font-medium text-slate-800
                           placeholder-slate-400 bg-transparent outline-none rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="pr-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Strength Bar */}
            {passStrength && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Strength
                  </p>
                  <p className={`text-[11px] font-bold
                    ${passStrength.level === "Strong" ? "text-emerald-600"
                    : passStrength.level === "Good"   ? "text-blue-600"
                    : passStrength.level === "Fair"   ? "text-amber-600"
                    : "text-rose-600"}`}>
                    {passStrength.level}
                  </p>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passStrength.color} rounded-full
                                transition-all duration-300`}
                    style={{ width: passStrength.width }}
                  />
                </div>
              </div>
            )}

            {passErrors.new_password && (
              <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {passErrors.new_password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700
                               mb-1.5 tracking-tight">
              Confirm New Password *
            </label>
            <div className={`relative flex items-center rounded-xl border-2
                            transition-all duration-200
                            ${passErrors.confirm_password
                ? "border-red-400"
                : passForm.confirm_password &&
                  passForm.new_password === passForm.confirm_password
                  ? "border-emerald-400"
                  : "border-slate-200 hover:border-slate-300"
              } bg-white`}>
              <input
                type={showConfirm ? "text" : "password"}
                value={passForm.confirm_password}
                onChange={(e) => {
                  setPassForm({ ...passForm, confirm_password: e.target.value });
                  setPassErrors({ ...passErrors, confirm_password: "" });
                }}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 text-sm font-medium text-slate-800
                           placeholder-slate-400 bg-transparent outline-none rounded-xl"
              />
              <div className="pr-4 flex items-center gap-1.5">
                {passForm.confirm_password &&
                 passForm.new_password === passForm.confirm_password && (
                  <CheckCircle2 size={15} className="text-emerald-500" />
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {passErrors.confirm_password && (
              <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {passErrors.confirm_password}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              loading={savingPass}
              className="text-sm py-3"
            >
              🔐 Update Password
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* ══════════════════════════════════════
          SECTION 4 — My Assignment
          (Role based — different for each)
      ══════════════════════════════════════ */}

      {/* WORKER — My Supervisor */}
      {role === "Worker" && (
        <SectionCard
          title="My Supervisor"
          subtitle="Your assigned supervisor details"
          icon={Shield}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        >
          {assignData?.supervisor ? (
            <div className="flex items-center gap-4 p-4 rounded-2xl
                            bg-gradient-to-br from-blue-50 to-indigo-50
                            border border-blue-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br
                              from-blue-500 to-indigo-600 flex items-center
                              justify-center text-white text-xl font-bold
                              shadow-md shadow-blue-500/20 flex-shrink-0">
                {assignData.supervisor.full_name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-[16px] font-extrabold text-slate-800">
                  {assignData.supervisor.full_name}
                </p>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                  📞 {assignData.supervisor.phone}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-2
                                  px-2.5 py-1 bg-blue-100 border border-blue-200
                                  rounded-xl text-[11px] font-bold text-blue-700">
                  <UserCheck size={11} />
                  Your Supervisor
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-amber-50
                            border border-amber-100 rounded-2xl">
              <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-700">
                  No Supervisor Assigned
                </p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  Contact your admin to get assigned
                </p>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* SUPERVISOR — My Team Summary */}
      {role === "Supervisor" && (
        <SectionCard
          title="My Team"
          subtitle="Workers assigned to you"
          icon={Wrench}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        >
          {assignData?.workers?.length > 0 ? (
            <div className="space-y-2">
              {/* Summary */}
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-100
                                  rounded-xl text-[12px] font-bold text-emerald-700">
                  {assignData.workers.length} Workers Assigned
                </span>
              </div>

              {/* Workers list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {assignData.workers.slice(0, 6).map((worker) => (
                  <div key={worker.id}
                       className="flex items-center gap-3 p-3 bg-slate-50
                                  rounded-2xl border border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br
                                    from-emerald-500 to-teal-600 flex items-center
                                    justify-center text-white text-sm font-bold
                                    flex-shrink-0">
                      {worker.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-700 truncate">
                        {worker.full_name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {worker.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {assignData.workers.length > 6 && (
                <p className="text-[11px] text-slate-400 font-medium text-center mt-2">
                  +{assignData.workers.length - 6} more workers
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-amber-50
                            border border-amber-100 rounded-2xl">
              <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-700">
                  No Workers Assigned Yet
                </p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  Ask admin to assign workers to you
                </p>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* ADMIN — System Info */}
      {role === "Admin" && (
        <SectionCard
          title="Account Info"
          subtitle="System administrator account"
          icon={Shield}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        >
          <div className="flex items-center gap-4 p-4 rounded-2xl
                          bg-gradient-to-br from-rose-50 to-pink-50
                          border border-rose-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br
                            from-rose-500 to-pink-600 flex items-center
                            justify-center shadow-md shadow-rose-500/20
                            flex-shrink-0">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-slate-800">
                System Administrator
              </p>
              <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                Full access to all features
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 bg-rose-100 border border-rose-200
                                  rounded-xl text-[11px] font-bold text-rose-700">
                  Admin Role
                </span>
                <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-200
                                  rounded-xl text-[11px] font-bold text-emerald-700">
                  Full Access
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

    </div>
  );
};

export default Profile;