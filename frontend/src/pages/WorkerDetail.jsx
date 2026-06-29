import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/client";
import Badge from "../components/ui/Badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, Mail, User, CheckCircle2, RotateCw,
  Clock, AlertTriangle, TrendingUp, MapPin, Calendar,
  ChevronRight, Activity, Filter, Search, X,
  ClipboardList, History, Layers
} from "lucide-react";

/* ── Tab config ── */
const TABS = [
  { key: "overview", label: "Overview",   icon: TrendingUp    },
  { key: "tasks",    label: "All Tasks",  icon: ClipboardList },
  { key: "history",  label: "Updates",    icon: History       },
];

/* ── Status filter options ── */
const STATUS_FILTERS = [
  "All", "Not Started", "In Progress", "Completed", "Delayed", "Incomplete"
];

/* ── Color helpers (consistent with your existing patterns) ── */
const getStatusStyle = (status) => {
  const map = {
    "Completed":   "bg-emerald-50 text-emerald-700 border-emerald-100",
    "In Progress": "bg-violet-50 text-violet-700 border-violet-100",
    "Not Started": "bg-slate-50 text-slate-600 border-slate-200",
    "Delayed":     "bg-rose-50 text-rose-700 border-rose-100",
    "Incomplete":  "bg-amber-50 text-amber-700 border-amber-100",
  };
  return map[status] || "bg-slate-50 text-slate-600 border-slate-200";
};

const WorkerDetail = () => {
  const { id }  = useParams();
  const nav     = useNavigate();

  const [loading,  setLoading]  = useState(true);
  const [worker,   setWorker]   = useState(null);
  const [stats,    setStats]    = useState({});
  const [tasks,    setTasks]    = useState([]);

  const [activeTab,     setActiveTab]     = useState("overview");
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [search,        setSearch]        = useState("");

  /* ── Fetch worker tasks & details ── */
  const fetchWorkerData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/supervisor/workers/${id}/tasks`);
      setWorker(res.data.worker  || null);
      setStats(res.data.stats    || {});
      setTasks(res.data.data     || []);
    } catch (err) {
      console.error("[WorkerDetail]", err?.response?.data || err.message);
      toast.error("Failed to load worker details");
      if (err?.response?.status === 404) nav("/supervisor/workers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkerData(); }, [id]);

  /* ── Filtered tasks ── */
  const filteredTasks = tasks.filter((t) => {
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchSearch =
      search === "" ||
      t.activity?.activity_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.location?.location_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  /* ── All updates (flattened from tasks) ── */
  const allUpdates = tasks
    .flatMap((t) =>
      (t.updates || []).map((u) => ({
        ...u,
        taskName:     t.activity?.activity_name || "Task",
        locationName: t.location?.location_name  || "Location",
      }))
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  /* ────────────────── LOADING ────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[75vh] gap-5">
        <div className="w-12 h-12 border-[3px] border-violet-500
                        border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">
          Loading worker details...
        </p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="flex flex-col items-center justify-center h-[75vh] gap-3">
        <p className="text-slate-500 font-semibold">Worker not found</p>
        <button
          onClick={() => nav("/supervisor/workers")}
          className="text-violet-600 text-sm font-semibold hover:underline"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  /* ── Completion % ── */
  const completionPct = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  /* ────────────────── RENDER ────────────────── */
  return (
    <div className="space-y-5">

      {/* ── Back Button + Page Title ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => nav("/supervisor/workers")}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500
                     hover:text-violet-600 hover:border-violet-300 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Worker Details
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Viewing: <span className="text-violet-600 font-semibold">{worker.full_name}</span>
          </p>
        </div>
      </motion.div>

      {/* ── Worker Profile Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
      >
        {/* Gradient header strip */}
        <div
          className="h-24 relative"
          style={{
            background:
              "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
          }}
        >
          <div className="absolute inset-0 opacity-[0.04]"
               style={{
                 backgroundImage:
                   "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                 backgroundSize: "20px 20px",
               }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar overlapping header */}
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600
                              rounded-2xl flex items-center justify-center text-white
                              text-2xl font-bold shadow-xl shadow-violet-500/30
                              border-4 border-white">
                {worker.full_name?.[0]?.toUpperCase()}
              </div>
              {/* Active status dot */}
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full
                               border-2 border-white
                               ${worker.is_active
                                 ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                                 : "bg-slate-300"
                               }`}
              />
            </div>

            {/* Status badge */}
            <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold
                             border ${getStatusStyle(worker.is_active ? "In Progress" : "Not Started")}`}>
              {worker.is_active ? "✓ Active Account" : "✗ Inactive"}
            </span>
          </div>

          {/* Worker info */}
          <h3 className="text-[20px] font-extrabold text-slate-800 tracking-tight">
            {worker.full_name}
          </h3>
          <p className="text-[12px] text-violet-600 font-bold mt-0.5 mb-3">
            {worker.employee_id || "No Employee ID"}
          </p>

          <div className="flex flex-wrap gap-3">
            {worker.phone && (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50
                              rounded-xl border border-slate-100">
                <Phone size={13} className="text-slate-400" />
                <span className="text-[12px] text-slate-600 font-semibold">
                  {worker.phone}
                </span>
              </div>
            )}
            {worker.email && (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50
                              rounded-xl border border-slate-100">
                <Mail size={13} className="text-slate-400" />
                <span className="text-[12px] text-slate-600 font-semibold">
                  {worker.email}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {[
          { label: "Total Tasks",  value: stats.total       || 0, icon: Activity,      color: "violet"  },
          { label: "Completed",    value: stats.completed   || 0, icon: CheckCircle2,  color: "emerald" },
          { label: "In Progress",  value: stats.in_progress || 0, icon: RotateCw,      color: "purple"  },
          { label: "Not Started",  value: stats.not_started || 0, icon: Clock,         color: "slate"   },
          { label: "Delayed",      value: stats.delayed     || 0, icon: AlertTriangle, color: "rose"    },
          { label: "Avg Progress", value: `${stats.avg_progress || 0}%`,
                                                                   icon: TrendingUp,    color: "blue"    },
        ].map((card, i) => {
          const colorMap = {
            violet:  { bg: "bg-violet-50",  text: "text-violet-600"  },
            emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
            purple:  { bg: "bg-purple-50",  text: "text-purple-600"  },
            slate:   { bg: "bg-slate-50",   text: "text-slate-500"   },
            rose:    { bg: "bg-rose-50",    text: "text-rose-600"    },
            blue:    { bg: "bg-blue-50",    text: "text-blue-600"    },
          };
          const c    = colorMap[card.color];
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i + 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
            >
              <div className={`w-8 h-8 ${c.bg} rounded-xl flex items-center
                               justify-center mb-2.5`}>
                <Icon size={15} className={c.text} />
              </div>
              <p className={`text-[20px] font-extrabold ${c.text} leading-none`}>
                {card.value}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wide">
                {card.label}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Completion Ring ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
            <TrendingUp size={15} className="text-violet-600" />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-slate-800">Task Completion</h4>
            <p className="text-[11px] text-slate-400 font-medium">
              Overall performance overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="40" fill="none"
                      stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="48" cy="48" r="40" fill="none"
                      stroke="url(#wdRing)" strokeWidth="8"
                      strokeDasharray={`${completionPct * 2.51} 251`}
                      strokeLinecap="round"
                      className="transition-all duration-1000" />
              <defs>
                <linearGradient id="wdRing" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[20px] font-extrabold text-slate-800">
                {completionPct}%
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase">Done</span>
            </div>
          </div>

          {/* Mini stat bars */}
          <div className="flex-1 space-y-2.5">
            {[
              { label: "Completed",   value: stats.completed   || 0, color: "#10b981" },
              { label: "In Progress", value: stats.in_progress || 0, color: "#8b5cf6" },
              { label: "Not Started", value: stats.not_started || 0, color: "#94a3b8" },
              { label: "Delayed",     value: stats.delayed     || 0, color: "#f43f5e" },
            ].map((s, i) => {
              const pct = stats.total > 0
                ? Math.round((s.value / stats.total) * 100)
                : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 font-medium w-24 flex-shrink-0">
                    {s.label}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 w-8 text-right">
                    {s.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5
                   flex items-center gap-1"
      >
        {TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4
                          rounded-xl text-[13px] font-semibold transition-all
                          ${active
                            ? "bg-violet-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                          }`}
            >
              <Icon size={14} />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ══════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm
                            py-16 flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                <ClipboardList size={24} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 font-semibold">No tasks assigned</p>
              <p className="text-xs text-slate-300">
                Assign tasks from the Activities page
              </p>
            </div>
          ) : (
            tasks.slice(0, 5).map((task, idx) => {
              const latestUpdate = task.updates?.[0];
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm
                             p-5 hover:border-violet-200 hover:shadow-md
                             transition-all duration-200 cursor-pointer group"
                  onClick={() => nav(`/supervisor/activities/${task.id}`)}
                >
                  {/* Task header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 mr-3">
                      <p className="text-[14px] font-bold text-slate-800 leading-tight">
                        {task.activity?.activity_name || "Unnamed Task"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin size={11} className="text-slate-400" />
                        <span className="text-[12px] text-slate-500 font-medium">
                          {task.location?.location_name || "No Location"}
                        </span>
                        {task.location?.location_type && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-[11px] text-slate-400">
                              {task.location.location_type}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge status={task.status} />
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Progress
                      </span>
                      <span className="text-[11px] font-bold text-violet-600">
                        {task.progress_pct || 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600
                                   rounded-full transition-all duration-700"
                        style={{ width: `${task.progress_pct || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {task.planned_end_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={11} className="text-slate-400" />
                          <span className="text-[11px] text-slate-500 font-medium">
                            Due:{" "}
                            {new Date(task.planned_end_date).toLocaleDateString(
                              "en-IN", { day: "2-digit", month: "short" }
                            )}
                          </span>
                        </div>
                      )}
                      {latestUpdate && (
                        <span className="text-[11px] text-slate-400">
                          · Updated by {latestUpdate.updater?.full_name || "Unknown"}
                        </span>
                      )}
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-slate-300 group-hover:text-violet-500
                                 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </motion.div>
              );
            })
          )}

          {tasks.length > 5 && (
            <button
              onClick={() => setActiveTab("tasks")}
              className="w-full py-3 text-center text-xs font-semibold text-violet-600
                         hover:bg-violet-50 rounded-2xl border border-violet-100
                         transition-all bg-white"
            >
              View all {tasks.length} tasks →
            </button>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════
          TAB: ALL TASKS
      ══════════════════════════════════════════ */}
      {activeTab === "tasks" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Search + Filter */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4
                          shadow-sm space-y-3">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks or locations..."
                className="w-full pl-10 pr-10 py-2.5 border-2 border-slate-200
                           rounded-xl text-sm focus:outline-none focus:ring-4
                           focus:ring-violet-500/10 focus:border-violet-500 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Status filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={13} className="text-slate-400" />
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold
                              border transition-all
                              ${statusFilter === s
                                ? "bg-violet-600 text-white border-violet-600"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:border-violet-300"
                              }`}
                >
                  {s}
                  {s !== "All" && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-lg text-[9px] font-bold
                      ${statusFilter === s ? "bg-white/20" : "bg-slate-200 text-slate-500"}`}>
                      {tasks.filter((t) => t.status === s).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Task count */}
          <p className="text-xs text-slate-400 font-medium px-1">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>

          {/* Task list */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm
                            py-12 flex flex-col items-center gap-3">
              <Activity size={28} className="text-slate-200" />
              <p className="text-sm text-slate-400 font-semibold">
                No tasks found
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100
                            shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/40 border-b border-slate-100">
                      {["Activity", "Location", "Status", "Progress",
                        "Due Date", "Updates", ""].map((h) => (
                        <th key={h}
                            className="px-5 py-3 text-left text-[11px] font-bold
                                       text-slate-400 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task, i) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-t border-slate-50 hover:bg-slate-50/60
                                   transition-colors"
                      >
                        {/* Activity name */}
                        <td className="px-5 py-4">
                          <p className="text-[13px] font-semibold text-slate-700">
                            {task.activity?.activity_name || "-"}
                          </p>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                            <p className="text-[12px] text-slate-500 font-medium">
                              {task.location?.location_name || "-"}
                            </p>
                          </div>
                          {task.location?.corridor_name && (
                            <p className="text-[10px] text-slate-400 mt-0.5 ml-4">
                              {task.location.corridor_name}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <Badge status={task.status} />
                        </td>

                        {/* Progress */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5 min-w-[90px]">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-violet-500 rounded-full transition-all"
                                style={{ width: `${task.progress_pct || 0}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">
                              {task.progress_pct || 0}%
                            </span>
                          </div>
                        </td>

                        {/* Due date */}
                        <td className="px-5 py-4">
                          {task.planned_end_date ? (
                            <span className="text-[12px] text-slate-500 font-medium">
                              {new Date(task.planned_end_date).toLocaleDateString(
                                "en-IN", { day: "2-digit", month: "short", year: "2-digit" }
                              )}
                            </span>
                          ) : (
                            <span className="text-[12px] text-slate-300">-</span>
                          )}
                        </td>

                        {/* Updates count */}
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-slate-50 border border-slate-200
                                           rounded-xl text-[11px] font-bold text-slate-500">
                            {task.updates?.length || 0} updates
                          </span>
                        </td>

                        {/* View button */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() => nav(`/supervisor/activities/${task.id}`)}
                            className="px-3 py-1.5 text-[11px] font-semibold text-violet-600
                                       bg-violet-50 hover:bg-violet-100 rounded-xl
                                       transition-all flex items-center gap-1"
                          >
                            View <ChevronRight size={11} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════
          TAB: UPDATES / HISTORY
      ══════════════════════════════════════════ */}
      {activeTab === "history" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {allUpdates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm
                            py-16 flex flex-col items-center gap-3">
              <History size={28} className="text-slate-200" />
              <p className="text-sm text-slate-400 font-semibold">
                No updates yet
              </p>
              <p className="text-xs text-slate-300">
                Task updates will appear here
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100
                            shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                  <History size={15} className="text-violet-600" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-slate-800">
                    All Task Updates
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {allUpdates.length} updates across {tasks.length} tasks
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-5 space-y-0">
                {allUpdates.map((update, idx) => {
                  const hasPhotos = update.photos && update.photos.length > 0;
                  const isLast    = idx === allUpdates.length - 1;

                  return (
                    <div key={update.id} className="flex gap-4 relative">
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-100" />
                      )}

                      {/* Timeline dot */}
                      <div className="relative flex-shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center
                                         justify-center border-2 border-white shadow-sm
                                         ${update.new_status === "Completed"
                                           ? "bg-emerald-100"
                                           : update.new_status === "Delayed"
                                           ? "bg-rose-100"
                                           : "bg-violet-100"
                                         }`}>
                          {update.new_status === "Completed"
                            ? <CheckCircle2 size={14} className="text-emerald-600" />
                            : update.new_status === "Delayed"
                            ? <AlertTriangle size={14} className="text-rose-600" />
                            : <RotateCw size={14} className="text-violet-600" />
                          }
                        </div>
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-5 ${isLast ? "" : ""}`}>
                        <div className="bg-slate-50/60 rounded-2xl border
                                        border-slate-100 p-4 hover:border-slate-200
                                        transition-all">
                          {/* Update header */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-[13px] font-bold text-slate-700">
                                {update.taskName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <MapPin size={10} className="text-slate-400" />
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {update.locationName}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(update.created_at).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short", year: "2-digit" }
                                )}
                              </span>
                              <br />
                              <span className="text-[10px] text-slate-400">
                                {new Date(update.created_at).toLocaleTimeString(
                                  "en-IN",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Status change */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {update.old_status !== update.new_status && (
                              <>
                                <Badge status={update.old_status} />
                                <span className="text-[11px] text-slate-400">→</span>
                              </>
                            )}
                            <Badge status={update.new_status} />

                            {/* Progress change */}
                            {update.old_progress !== update.new_progress && (
                              <span className="text-[11px] text-slate-500 font-medium
                                               bg-white border border-slate-200 px-2
                                               py-0.5 rounded-lg">
                                {update.old_progress}% → {update.new_progress}%
                              </span>
                            )}
                          </div>

                          {/* Remarks */}
                          {update.remarks && (
                            <p className="text-[12px] text-slate-600 font-medium
                                          bg-white rounded-xl px-3 py-2 border
                                          border-slate-100 mb-2">
                              "{update.remarks}"
                            </p>
                          )}

                          {/* Photos */}
                          {hasPhotos && (
                            <div className="flex gap-2 flex-wrap mb-2">
                              {update.photos.slice(0, 4).map((photo, pi) => (
                                <div
                                  key={pi}
                                  className="relative w-16 h-16 rounded-xl
                                             overflow-hidden border border-slate-200
                                             bg-slate-100 cursor-pointer
                                             hover:opacity-90 transition-opacity"
                                  onClick={() =>
                                    window.open(
                                      `http://192.168.1.17:5000${photo}`,
                                      "_blank"
                                    )
                                  }
                                >
                                  <img
                                    src={`http://192.168.1.17:5000${photo}`}
                                    alt={`Photo ${pi + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                  {pi === 3 && update.photos.length > 4 && (
                                    <div className="absolute inset-0 bg-black/50
                                                    flex items-center justify-center">
                                      <span className="text-white text-[11px] font-bold">
                                        +{update.photos.length - 4}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Updated by */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 bg-gradient-to-br from-violet-400
                                            to-purple-500 rounded-md flex items-center
                                            justify-center text-white text-[9px] font-bold">
                              {(update.updater?.full_name || "U")[0]}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Updated by{" "}
                              <span className="text-slate-600 font-semibold">
                                {update.updater?.full_name || "Unknown"}
                              </span>
                            </span>
                            {update.photo_type && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="text-[10px] text-slate-400
                                                 bg-white border border-slate-200
                                                 px-2 py-0.5 rounded-lg font-medium">
                                  {update.photo_type}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
};

export default WorkerDetail;