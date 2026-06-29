import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/client";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import { ArrowLeft, MapPin, Target, Activity, CheckCircle2, Clock, AlertTriangle, UserCheck,  } from "lucide-react";   //ChevronRight UserPlus
import { motion } from "framer-motion";
import { toast } from "sonner";

/* ─── ProgressBar ─── */
const ProgressBar = ({ pct, size = "md" }) => {
  const h = size === "lg" ? "h-3" : size === "sm" ? "h-1.5" : "h-2";
  const color =
    pct === 100 ? "bg-emerald-500" : pct > 60 ? "bg-violet-500" : pct > 30 ? "bg-amber-500" : pct > 0 ? "bg-orange-500" : "bg-slate-200";
  return (
    <div className={`w-full ${h} bg-slate-100 rounded-full overflow-hidden`}>
      <div className={`${h} ${color} rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  );
};

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
const LocationsDetail = () => {
  const { id } = useParams();
  const { role } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loc, setLoc] = useState(null);
  const [acts, setActs] = useState([]);
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selId, setSelId] = useState("");
  const [actId, setActId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [instructions, setInstructions] = useState("");

  const base = role === "Admin" ? "/admin" : "/supervisor";

  const fetchLoc = async () => {
    try {
      setLoading(true);
      const r = await API.get(`${base}/locations/${id}`);
      const d = r.data.data || r.data.location || {};
      setLoc(d);
      setActs(d.activities || []);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      if (role === "Admin") { const r = await API.get("/admin/users?role=Supervisor"); setUsers(r.data.data || []); }
      if (role === "Supervisor") { const r = await API.get("/supervisor/workers"); setUsers(r.data.data || []); }
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    const load = async () => { await fetchLoc(); await fetchUsers(); };
    load();
  }, [id]);

  const assign = async () => {
    if (!selId) return toast.error("Please select a user");
    setSaving(true);
    try {
      if (modalType === "supervisor") {
        await API.patch(`/admin/locations/${id}/assign-supervisor`, { supervisor_id: parseInt(selId) });
        toast.success("Supervisor assigned!");
      } else {
        await API.patch(`/supervisor/activities/${actId}/assign-worker`, {
          worker_id: parseInt(selId), worker_instructions: instructions || undefined,
        });
        toast.success("Worker assigned!");
      }
      setModal(false); setSelId(""); setInstructions("");
      fetchLoc();
    } catch (e) { toast.error(e.response?.data?.message || "Assignment failed"); }
    finally { setSaving(false); }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading location details...</p>
      </div>
    );

  if (!loc) return <p className="text-center text-slate-400 py-10 font-medium">Location not found</p>;

  /* ─── Stats ─── */
  const totalActs = acts.length;
  const completed = acts.filter((a) => a.status === "Completed").length;
  const inProgress = acts.filter((a) => a.status === "In Progress").length;
  const notStarted = acts.filter((a) => a.status === "Not Started").length;
  const delayed = acts.filter((a) => a.status === "Delayed").length;
  const overallPct = totalActs > 0 ? Math.round((completed / totalActs) * 100) : 0;
  const assignedWorkers = acts.filter((a) => a.worker).length;

  const info = [
    { l: "Type", v: loc.location_type },
    { l: "Phase", v: loc.phase?.phase_name },
    { l: "Vendor", v: loc.vendor?.vendor_name },
    { l: "Supervisor", v: loc.supervisor?.full_name || "Not Assigned" },
    { l: "Lanes", v: loc.no_of_lanes },
    { l: "Roads", v: loc.no_of_roads },
    { l: "Solution", v: loc.proposed_solution },
    { l: "Corridor", v: loc.corridor_name },
  ];

  return (
    <div className="space-y-5">
      {/* ── Back Button ── */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => nav(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Locations
      </motion.button>

      {/* ── Header Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
                <MapPin size={17} className="text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{loc.location_name}</h2>
                {loc.corridor_name && <p className="text-xs text-slate-400 font-medium">{loc.corridor_name}</p>}
              </div>
            </div>
          </div>
          {role === "Admin" && (
            <Button
              onClick={() => { setModalType("supervisor"); setSelId(""); setModal(true); }}
              className="w-auto"
            >
              <UserCheck size={15} className="mr-1" />
              {loc.supervisor ? "Change Supervisor" : "Assign Supervisor"}
            </Button>
          )}
        </div>

        {/* ── Overall Progress ── */}
        <div className="bg-slate-50/80 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                <Target size={15} className="text-violet-600" />
              </div>
              <p className="text-sm font-bold text-slate-700">Overall Progress</p>
            </div>
            <span className={`text-2xl font-extrabold tracking-tight ${
              overallPct === 100 ? "text-emerald-600" : overallPct > 50 ? "text-violet-600" : "text-amber-600"
            }`}>
              {overallPct}%
            </span>
          </div>
          <ProgressBar pct={overallPct} size="lg" />

          {/* Mini Stats */}
          <div className="grid grid-cols-5 gap-3 mt-5">
            {[
              { v: totalActs, l: "Total", c: "slate", icon: Activity },
              { v: completed, l: "Done", c: "emerald", icon: CheckCircle2 },
              { v: inProgress, l: "Active", c: "violet", icon: Activity },
              { v: notStarted, l: "Pending", c: "slate", icon: Clock },
              { v: delayed, l: "Delayed", c: "rose", icon: AlertTriangle },
            ].map((s, i) => {
            //   const Icon = s.icon;
              return (
                <div key={i} className="text-center">
                  <p className={`text-lg font-extrabold ${
                    s.c === "emerald" ? "text-emerald-600" : s.c === "violet" ? "text-violet-600" : s.c === "rose" ? "text-rose-600" : "text-slate-600"
                  }`}>{s.v}</p>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${
                    s.c === "emerald" ? "text-emerald-400" : s.c === "violet" ? "text-violet-400" : s.c === "rose" ? "text-rose-400" : "text-slate-400"
                  }`}>{s.l}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Info Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {info.map((item, i) =>
            item.v ? (
              <div key={i} className="bg-slate-50/80 rounded-2xl p-3.5 hover:bg-slate-50 transition-colors">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.l}</p>
                <p className="text-[13px] font-semibold text-slate-700 truncate">{item.v}</p>
              </div>
            ) : null
          )}
        </div>
      </motion.div>

      {/* ── Activities Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
      >
        <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
              <Activity size={15} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Activities ({totalActs})</h3>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            {assignedWorkers}/{totalActs} assigned
          </span>
        </div>

        {acts.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Activity size={22} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-medium">No activities found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/40">
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">#</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Activity</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Start</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">End</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Progress</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Worker</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Remarks</th>
                  {role === "Supervisor" && (
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {acts.map((a, idx) => (
                  <tr
                    key={a.id}
                    className={`border-t border-slate-50 hover:bg-slate-50/60 transition-colors ${idx % 2 === 0 ? "" : "bg-slate-50/30"}`}
                  >
                    <td className="px-5 py-3.5 text-[12px] text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold text-slate-700">{a.activity?.activity_name || "-"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500 font-medium">
                      {a.planned_start_date ? new Date(a.planned_start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500 font-medium">
                      {a.planned_end_date ? new Date(a.planned_end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "-"}
                    </td>
                    <td className="px-5 py-3.5"><Badge status={a.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-[110px]">
                        <ProgressBar pct={a.progress_pct || 0} size="sm" />
                        <span className="text-[11px] font-bold text-slate-500 w-9 text-right">{a.progress_pct || 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {a.worker?.full_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                            {a.worker.full_name[0]}
                          </div>
                          <span className="text-[12px] text-slate-600 font-medium">{a.worker.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-amber-500 font-semibold">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-400 max-w-[140px] truncate font-medium">{a.remarks || "-"}</td>
                    {role === "Supervisor" && (
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => { setActId(a.id); setModalType("worker"); setSelId(""); setInstructions(""); setModal(true); }}
                          className="px-3 py-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all"
                        >
                          {a.worker ? "Reassign" : "Assign"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ═══════════ ASSIGN MODAL ═══════════ */}
      {modal && (
        <Modal onClose={() => setModal(false)}>
          <div className="mb-5">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
              {modalType === "supervisor" ? "Assign Supervisor" : "Assign Worker"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Select a {modalType === "supervisor" ? "supervisor" : "worker"} for this {modalType === "supervisor" ? "location" : "activity"}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Select {modalType === "supervisor" ? "Supervisor" : "Worker"} *
              </label>
              <select
                value={selId}
                onChange={(e) => setSelId(e.target.value)}
                className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
              >
                <option value="">-- Choose --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} — {u.phone}</option>
                ))}
              </select>
              {users.length === 0 && (
                <p className="text-xs text-amber-500 font-medium mt-1.5">
                  ⚠️ No {modalType === "supervisor" ? "supervisors" : "workers"} found. Add from Team Management first.
                </p>
              )}
            </div>

            {modalType === "worker" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Instructions (Optional)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="What should the worker do?"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 resize-none transition-all"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">
                Cancel
              </button>
              <button
                onClick={assign}
                disabled={saving || !selId}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 rounded-2xl flex items-center gap-2 transition-all"
              >
                {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LocationsDetail;










// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import API from '../api/client';
// import Badge from '../components/ui/Badge';
// import Modal from '../components/ui/Modal';
// import Button from '../components/ui/Button';

// const ProgressBar = ({ pct, size = 'md' }) => {
//     const h = size === 'lg' ? 'h-3' : size === 'sm' ? 'h-1.5' : 'h-2';
//     const color = pct === 100 ? 'bg-emerald-500' : pct > 60 ? 'bg-blue-500' : pct > 30 ? 'bg-amber-500' : pct > 0 ? 'bg-orange-500' : 'bg-slate-200';
//     return (
//         <div className={`w-full ${h} bg-slate-100 rounded-full overflow-hidden`}>
//             <div className={`${h} ${color} rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
//         </div>
//     );
// };

// const LocationsDetail = () => {
//     const { id } = useParams();
//     const { role } = useAuth();
//     const nav = useNavigate();
//     const [loading, setLoading] = useState(true);
//     const [loc, setLoc] = useState(null);
//     const [acts, setActs] = useState([]);
//     const [users, setUsers] = useState([]);
//     const [modal, setModal] = useState(false);
//     const [modalType, setModalType] = useState('');
//     const [selId, setSelId] = useState('');
//     const [actId, setActId] = useState(null);
//     const [saving, setSaving] = useState(false);
//     const [instructions, setInstructions] = useState('');

//     const base = role === 'Admin' ? '/admin' : '/supervisor';

    

//     const fetchLoc = async () => {
//         try {
//             setLoading(true);
//             const r = await API.get(`${base}/locations/${id}`);
//             const d = r.data.data || r.data.location || {};
//             setLoc(d);
//             setActs(d.activities || []);
//         } catch (err) {
//             console.log(err)
//         } finally { setLoading(false); }
//     };

//     const fetchUsers = async () => {
//         try {
//             if (role === 'Admin') { const r = await API.get('/admin/users?role=Supervisor'); setUsers(r.data.data || []); }
//             if (role === 'Supervisor') { const r = await API.get('/supervisor/workers'); setUsers(r.data.data || []); }
//         } catch (err) {
//             console.log(err)
//         }
//     };

//     useEffect(() => {
//     const load = async () => {
//         await fetchLoc();
//         await fetchUsers();
//     };
//     load();
//     }, [id]);

//     const assign = async () => {
//         if (!selId) return alert('Please select');
//         setSaving(true);
//         try {
//             if (modalType === 'supervisor') {
//                 await API.patch(`/admin/locations/${id}/assign-supervisor`, { supervisor_id: parseInt(selId) });
//             } else {
//                 await API.patch(`/supervisor/activities/${actId}/assign-worker`, {
//                     worker_id: parseInt(selId),
//                     worker_instructions: instructions || undefined
//                 });
//             }
//             setModal(false);
//             setSelId('');
//             setInstructions('');
//             fetchLoc();
//         } catch (e) { alert(e.response?.data?.message || 'Failed'); }
//         finally { setSaving(false); }
//     };

//     if (loading) return <div className="flex items-center justify-center h-80"><div className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
//     if (!loc) return <p className="text-center text-slate-400 py-10">Location not found</p>;

//     // Calculate stats
//     const totalActs = acts.length;
//     const completed = acts.filter(a => a.status === 'Completed').length;
//     const inProgress = acts.filter(a => a.status === 'In Progress').length;
//     const notStarted = acts.filter(a => a.status === 'Not Started').length;
//     const delayed = acts.filter(a => a.status === 'Delayed').length;
//     const overallPct = totalActs > 0 ? Math.round((completed / totalActs) * 100) : 0;
//     const assignedWorkers = acts.filter(a => a.worker).length;

//     const info = [
//         { l: 'Type',       v: loc.location_type },
//         { l: 'Phase',      v: loc.phase?.phase_name },
//         { l: 'Vendor',     v: loc.vendor?.vendor_name },
//         { l: 'Supervisor', v: loc.supervisor?.full_name || 'Not Assigned' },
//         { l: 'Lanes',      v: loc.no_of_lanes },
//         { l: 'Roads',      v: loc.no_of_roads },
//         { l: 'Solution',   v: loc.proposed_solution },
//         { l: 'Corridor',   v: loc.corridor_name },
//     ];

//     return (
//         <div className="space-y-4">
//             {/* Back */}
//             <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                 </svg>
//                 Back to Locations
//             </button>


//             {/* header + overall progress  */}
//             <div className="bg-white rounded-xl border border-slate-200/80 p-5">
//                 <div className="flex items-start justify-between mb-4">
//                     <div>
//                         <h2 className="text-lg font-bold text-slate-800">{loc.location_name}</h2>
//                         {loc.corridor_name && <p className="text-xs text-slate-400 mt-0.5">{loc.corridor_name}</p>}
//                     </div>
//                     {role === 'Admin' && (
//                         <Button
//                             onClick={() => { setModalType('supervisor'); setSelId(''); setModal(true); }}
//                         >
//                             {loc.supervisor ? 'Change Supervisor' : 'Assign Supervisor'}
//                         </Button>
//                     )}
//                 </div>

//                 {/* Overall Progress */}
//                 <div className="bg-slate-50 rounded-xl p-4 mb-4">
//                     <div className="flex items-center justify-between mb-2">
//                         <p className="text-sm font-semibold text-slate-700">Overall Progress</p>
//                         <span className={`text-lg font-bold ${overallPct === 100 ? 'text-emerald-600' : overallPct > 50 ? 'text-blue-600' : 'text-amber-600'}`}>
//                             {overallPct}%
//                         </span>
//                     </div>
//                     <ProgressBar pct={overallPct} size="lg" />

//                     {/* Mini Stats */}
//                     <div className="grid grid-cols-5 gap-2 mt-4">
//                         <div className="text-center">
//                             <p className="text-lg font-bold text-slate-700">{totalActs}</p>
//                             <p className="text-[9px] text-slate-400 font-medium uppercase">Total</p>
//                         </div>
//                         <div className="text-center">
//                             <p className="text-lg font-bold text-emerald-600">{completed}</p>
//                             <p className="text-[9px] text-emerald-500 font-medium uppercase">Done</p>
//                         </div>
//                         <div className="text-center">
//                             <p className="text-lg font-bold text-blue-600">{inProgress}</p>
//                             <p className="text-[9px] text-blue-500 font-medium uppercase">Active</p>
//                         </div>
//                         <div className="text-center">
//                             <p className="text-lg font-bold text-slate-400">{notStarted}</p>
//                             <p className="text-[9px] text-slate-400 font-medium uppercase">Pending</p>
//                         </div>
//                         <div className="text-center">
//                             <p className="text-lg font-bold text-red-600">{delayed}</p>
//                             <p className="text-[9px] text-red-500 font-medium uppercase">Delayed</p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Location Info Grid */}
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                     {info.map((item, i) => (
//                         item.v ? (
//                             <div key={i} className="bg-slate-50 rounded-lg p-3">
//                                 <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{item.l}</p>
//                                 <p className="text-[12px] font-medium text-slate-700 truncate">{item.v}</p>
//                             </div>
//                         ) : null
//                     ))}
//                 </div>
//             </div>

//             {/* activity table with progress  */}
//             <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
//                 <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
//                     <h3 className="text-sm font-bold text-slate-700">Activities ({acts.length})</h3>
//                     <span className="text-[11px] text-slate-400">{assignedWorkers}/{totalActs} workers assigned</span>
//                 </div>

//                 {acts.length === 0 ? (
//                     <div className="text-center py-10"><p className="text-sm text-slate-400">No activities</p></div>
//                 ) : (
//                     <div className="overflow-x-auto">
//                         <table className="w-full">
//                             <thead>
//                                 <tr className="bg-slate-50/80 border-b border-slate-100">
//                                     <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">#</th>
//                                     <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Activity</th>
//                                     <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Start</th>
//                                     <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">End</th>
//                                     <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
//                                     <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Progress</th>
//                                     <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Worker</th>
//                                     <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Remarks</th>
//                                     {role === 'Supervisor' && (
//                                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide"></th>
//                                     )}
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {acts.map((a, idx) => (
//                                     <tr key={a.id} className={`border-t border-slate-50 hover:bg-slate-50/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
//                                         <td className="px-5 py-3 text-[11px] text-slate-400">{idx + 1}</td>
//                                         <td className="px-5 py-3">
//                                             <p className="text-[12px] font-semibold text-slate-700">{a.activity?.activity_name || '-'}</p>
//                                         </td>
//                                         <td className="px-5 py-3 text-[11px] text-slate-500">
//                                             {a.planned_start_date ? new Date(a.planned_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
//                                         </td>
//                                         <td className="px-5 py-3 text-[11px] text-slate-500">
//                                             {a.planned_end_date ? new Date(a.planned_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
//                                         </td>
//                                         <td className="px-5 py-3"><Badge status={a.status} /></td>
//                                         <td className="px-5 py-3">
//                                             <div className="flex items-center gap-2 min-w-[100px]">
//                                                 <ProgressBar pct={a.progress_pct || 0} size="sm" />
//                                                 <span className="text-[10px] font-semibold text-slate-500 w-8 text-right">{a.progress_pct || 0}%</span>
//                                             </div>
//                                         </td>
//                                         <td className="px-5 py-3">
//                                             {a.worker?.full_name ? (
//                                                 <div className="flex items-center gap-1.5">
//                                                     <div className="w-5 h-5 bg-blue-500 rounded-md flex items-center justify-center text-white text-[8px] font-bold">
//                                                         {a.worker.full_name[0]}
//                                                     </div>
//                                                     <span className="text-[11px] text-slate-600">{a.worker.full_name}</span>
//                                                 </div>
//                                             ) : (
//                                                 <span className="text-[11px] text-amber-500 font-medium">Not Assigned</span>
//                                             )}
//                                         </td>
//                                         <td className="px-5 py-3 text-[11px] text-slate-400 max-w-[120px] truncate">{a.remarks || '-'}</td>
//                                         {role === 'Supervisor' && (
//                                             <td className="px-5 py-3">
//                                                 <button onClick={() => {
//                                                     setActId(a.id);
//                                                     setModalType('worker');
//                                                     setSelId('');
//                                                     setInstructions('');
//                                                     setModal(true);
//                                                 }} className="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
//                                                     {a.worker ? 'Reassign' : 'Assign'}
//                                                 </button>
//                                             </td>
//                                         )}
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 )}
//             </div>

            
//             {/* assign model  */}

//             {modal && (
//                 <Modal onClose={() => setModal(false)}>
        
//                 {/* Header */}
//                 <div className="flex items-center justify-between mb-5">
//                     <h3 className="text-sm font-bold text-slate-800">
//                     {modalType === 'supervisor' 
//                     ? '👔 Assign Supervisor' 
//                     : '👷 Assign Worker'
//                     }
//                     </h3>
//                     <button 
//                         onClick={() => setModal(false)} 
//                         className="text-slate-400 hover:text-slate-600"
//                     >
//                         <svg className="w-5 h-5" fill="none" 
//                             stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" 
//                             strokeLinejoin="round" 
//                             strokeWidth={2} 
//                             d="M6 18L18 6M6 6l12 12" />
//                         </svg>
//                     </button>
//                 </div>

//                 <div className="space-y-4">
//                 {/* Select Dropdown */}
//                 <div>
//                     <label className="block text-xs font-semibold 
//                                   text-slate-600 mb-1.5">
//                         Select {modalType === 'supervisor' 
//                             ? 'Supervisor' 
//                             : 'Worker'
//                     } *
//                     </label>
//                 <select 
//                     value={selId} 
//                     onChange={e => setSelId(e.target.value)}
//                     className="w-full px-3 py-2.5 border 
//                                border-slate-200 rounded-lg text-sm 
//                                focus:outline-none focus:ring-2 
//                                focus:ring-blue-500/20 
//                                focus:border-blue-500"
//                 >
//                     <option value="">-- Choose --</option>
//                     {users.map(u => (
//                         <option key={u.id} value={u.id}>
//                             {u.full_name} - {u.phone}
//                         </option>
//                     ))}
//                 </select>

//                 {/*  if there is no single user found - message */}
//                 {users.length === 0 && (
//                     <p className="text-xs text-amber-500 mt-1">
//                         ⚠️ No {modalType === 'supervisor' 
//                                ? 'supervisors' 
//                                : 'workers'
//                                } found. 
//                         Add from Team Management first.
//                     </p>
//                 )}
//             </div>

//             {/*  Instructions - Only in Worker assign  */}
//             {modalType === 'worker' && (
//                 <div>
//                     <label className="block text-xs font-semibold 
//                                       text-slate-600 mb-1.5">
//                         Instructions (Optional)
//                     </label>
//                     <textarea 
//                         value={instructions} 
//                         onChange={e => setInstructions(e.target.value)}
//                         rows={3}
//                         // placeholder="Worker ko kya karna hai..."
//                         className="w-full px-3 py-2 border  border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20  focus:border-blue-500 resize-none"
//                     />
//                 </div>
//             )}

//             {/* Buttons */}
//             <div className="flex gap-2 justify-end pt-2">
//                 <button 
//                     type="button" 
//                     onClick={() => setModal(false)}
//                     className="px-4 py-2 text-xs font-medium 
//                                text-slate-600 bg-slate-100 
//                                hover:bg-slate-200 rounded-lg"
//                 >
//                     Cancel
//                 </button>
//                 <button 
//                     onClick={assign} 
//                     disabled={saving || !selId}
//                     className="px-4 py-2 text-xs font-medium 
//                                text-white bg-blue-600 
//                                hover:bg-blue-700 
//                                disabled:bg-blue-300
//                                rounded-lg flex items-center gap-1.5"
//                 >
//                     {saving && (
//                         <span className="w-3 h-3 border-2 
//                                          border-white 
//                                          border-t-transparent 
//                                          rounded-full animate-spin" 
//                         />
//                     )}
//                     {saving ? 'Assigning...' : 'Assign'}
//                 </button>
//             </div>
//         </div>
//     </Modal>
// )}
//         </div>
//     );
// };

// export default LocationsDetail;