import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Badge from "../components/ui/Badge";
import {
  Users, Search, X, CheckCircle2, RotateCw,
  Clock, AlertTriangle, Phone, Activity,
  UserX, TrendingUp, MapPin, Calendar,
  ClipboardList, History, ChevronRight,
  Filter
} from "lucide-react";

/* ════════════════════════════════════════
   WORKER STATUS CONFIG
════════════════════════════════════════ */
const statusConfig = {
  "All Done":       { 
    bg: "bg-emerald-50", text: "text-emerald-700", 
    border: "border-emerald-200", dot: "bg-emerald-400",
    label: "All Done"
  },
  "Active":         { 
    bg: "bg-violet-50",  text: "text-violet-700",  
    border: "border-violet-200",  dot: "bg-violet-400",
    label: "Active"
  },
  "Has Delays":     { 
    bg: "bg-rose-50",    text: "text-rose-700",    
    border: "border-rose-200",    dot: "bg-rose-400",
    label: "Has Delays"
  },
  "Has Incomplete": { 
    bg: "bg-amber-50",   text: "text-amber-700",   
    border: "border-amber-200",   dot: "bg-amber-400",
    label: "Incomplete"
  },
  "Not Started":    { 
    bg: "bg-slate-50",   text: "text-slate-600",   
    border: "border-slate-200",   dot: "bg-slate-400",
    label: "Not Started"
  },
  "No Tasks":       { 
    bg: "bg-slate-50",   text: "text-slate-400",   
    border: "border-slate-200",   dot: "bg-slate-300",
    label: "No Tasks"
  },
};

/* ════════════════════════════════════════
   STATUS FILTERS
════════════════════════════════════════ */
const TASK_STATUS_FILTERS = [
  "All", "Not Started", "In Progress", 
  "Completed", "Delayed", "Incomplete"
];

/* ════════════════════════════════════════
   WORKER MODAL COMPONENT
════════════════════════════════════════ */
const WorkerModal = ({ worker, onClose }) => {
  const [tasks,       setTasks]       = useState([]);
  const [stats,       setStats]       = useState({});
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [taskFilter,  setTaskFilter]  = useState("All");
  const [taskSearch,  setTaskSearch]  = useState("");

  /* Fetch worker tasks */
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/supervisor/workers/${worker.id}/tasks`);
        setTasks(res.data.data  || []);
        setStats(res.data.stats || {});
      } catch (err) {
        console.error("[WorkerModal]", err?.response?.data || err.message);
        toast.error("Failed to load worker tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [worker.id]);

  /* Filtered tasks */
  const filteredTasks = tasks.filter((t) => {
    const matchStatus = taskFilter === "All" || t.status === taskFilter;
    const matchSearch =
      taskSearch === "" ||
      t.activity?.activity_name?.toLowerCase()
        .includes(taskSearch.toLowerCase()) ||
      t.location?.location_name?.toLowerCase()
        .includes(taskSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  /* All updates flattened */
  const allUpdates = tasks
    .flatMap((t) =>
      (t.updates || []).map((u) => ({
        ...u,
        taskName:     t.activity?.activity_name || "Task",
        locationName: t.location?.location_name  || "Location",
      }))
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  /* Completion % */
  const completionPct = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const sc = statusConfig[worker.stats?.overall_status] 
    || statusConfig["No Tasks"];

  /* Tab config */
  const TABS = [
    { key: "overview", label: "Overview",  icon: TrendingUp    },
    { key: "tasks",    label: "Tasks",     icon: ClipboardList },
    { key: "history",  label: "Updates",   icon: History       },
  ];

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* ── Modal Box ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 20  }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl
                   shadow-2xl overflow-hidden flex flex-col"
      >

        {/* ── Modal Header (Worker Info) ── */}
        <div
          className="relative px-6 pt-6 pb-5 flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%)",
          }}
        >
          {/* dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20
                       rounded-xl flex items-center justify-center text-white/70
                       hover:text-white transition-all z-10"
          >
            <X size={16} />
          </button>

          {/* Worker info */}
          <div className="relative flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl
                              flex items-center justify-center text-white text-2xl
                              font-bold border-2 border-white/30">
                {worker.full_name?.[0]?.toUpperCase()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full
                               border-2 border-white
                               ${worker.is_active
                                 ? "bg-emerald-400"
                                 : "bg-slate-400"
                               }`}
              />
            </div>

            {/* Name + details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-extrabold text-white leading-tight">
                {worker.full_name}
              </h3>
              <p className="text-white/60 text-[12px] font-medium mt-0.5">
                {worker.employee_id || "No Employee ID"}
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {worker.phone && (
                  <div className="flex items-center gap-1.5 bg-white/10
                                  rounded-xl px-2.5 py-1">
                    <Phone size={11} className="text-white/60" />
                    <span className="text-[11px] text-white/80 font-medium">
                      {worker.phone}
                    </span>
                  </div>
                )}
                {/* Overall status badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1
                                 rounded-xl text-[11px] font-bold border
                                 bg-white/10 border-white/20 text-white`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {worker.stats?.overall_status || "No Tasks"}
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="relative grid grid-cols-4 gap-2 mt-4">
            {[
              { label: "Total",    value: worker.stats?.total       || 0 },
              { label: "Done",     value: worker.stats?.completed   || 0 },
              { label: "Active",   value: worker.stats?.in_progress || 0 },
              { label: "Delayed",  value: worker.stats?.delayed     || 0 },
            ].map((s, i) => (
              <div key={i}
                   className="bg-white/10 rounded-2xl p-2.5 text-center
                              border border-white/10">
                <p className="text-[18px] font-extrabold text-white leading-none">
                  {s.value}
                </p>
                <p className="text-[10px] text-white/50 font-semibold mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 px-4 py-3 border-b
                        border-slate-100 bg-slate-50/50 flex-shrink-0">
          {TABS.map((tab) => {
            const Icon   = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl
                            text-[12px] font-semibold transition-all
                            ${active
                              ? "bg-violet-600 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-700 hover:bg-white"
                            }`}
              >
                <Icon size={13} />
                {tab.label}
                {tab.key === "tasks" && (
                  <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold
                    ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {tasks.length}
                  </span>
                )}
                {tab.key === "history" && (
                  <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold
                    ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {allUpdates.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* ── Loading ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-[3px] border-violet-500
                              border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400 font-medium">
                Loading tasks...
              </p>
            </div>
          )}

          {/* ══════════════════════════════
              TAB: OVERVIEW
          ══════════════════════════════ */}
          {!loading && activeTab === "overview" && (
            <div className="space-y-3">

              {/* Completion ring + breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100
                              shadow-sm p-4">
                <p className="text-[12px] font-bold text-slate-500 uppercase
                               tracking-wider mb-3">
                  Task Completion
                </p>
                <div className="flex items-center gap-5">
                  {/* Ring */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-20 h-20 -rotate-90">
                      <circle cx="40" cy="40" r="34" fill="none"
                              stroke="#f1f5f9" strokeWidth="7" />
                      <circle cx="40" cy="40" r="34" fill="none"
                              stroke="url(#ring1)" strokeWidth="7"
                              strokeDasharray={`${completionPct * 2.14} 214`}
                              strokeLinecap="round" />
                      <defs>
                        <linearGradient id="ring1" x1="0%" y1="0%"
                                        x2="100%" y2="0%">
                          <stop offset="0%"   stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col
                                    items-center justify-center">
                      <span className="text-[17px] font-extrabold text-slate-800">
                        {completionPct}%
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase">
                        Done
                      </span>
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="flex-1 space-y-2">
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
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-medium w-20 flex-shrink-0">
                            {s.label}
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, delay: i * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 w-5 text-right">
                            {s.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent tasks preview */}
              {tasks.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-100
                                py-10 flex flex-col items-center gap-2">
                  <ClipboardList size={24} className="text-slate-300" />
                  <p className="text-sm text-slate-400 font-medium">
                    No tasks assigned
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase
                                 tracking-wider px-1">
                    Recent Tasks
                  </p>
                  {tasks.slice(0, 4).map((task, idx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0  }}
                      transition={{ delay: idx * 0.06 }}
                      className="bg-white rounded-2xl border border-slate-100
                                 p-4 shadow-sm"
                    >
                      {/* Task header */}
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex-1 mr-2">
                          <p className="text-[13px] font-bold text-slate-700 leading-tight">
                            {task.activity?.activity_name || "Task"}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-slate-400" />
                            <span className="text-[11px] text-slate-500 font-medium">
                              {task.location?.location_name || "-"}
                            </span>
                          </div>
                        </div>
                        <Badge status={task.status} />
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500
                                       to-purple-600 rounded-full transition-all duration-700"
                            style={{ width: `${task.progress_pct || 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-violet-600 w-8 text-right">
                          {task.progress_pct || 0}%
                        </span>
                      </div>

                      {/* Due date */}
                      {task.planned_end_date && (
                        <div className="flex items-center gap-1 mt-2">
                          <Calendar size={10} className="text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-medium">
                            Due:{" "}
                            {new Date(task.planned_end_date).toLocaleDateString(
                              "en-IN",
                              { day: "2-digit", month: "short" }
                            )}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {tasks.length > 4 && (
                    <button
                      onClick={() => setActiveTab("tasks")}
                      className="w-full py-2.5 text-center text-[12px] font-semibold
                                 text-violet-600 hover:bg-violet-50 rounded-xl
                                 border border-violet-100 transition-all"
                    >
                      View all {tasks.length} tasks →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════
              TAB: ALL TASKS
          ══════════════════════════════ */}
          {!loading && activeTab === "tasks" && (
            <div className="space-y-3">

              {/* Search */}
              <div className="relative">
                <Search size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search tasks or locations..."
                  className="w-full pl-10 pr-9 py-2.5 border-2 border-slate-200
                             rounded-xl text-sm focus:outline-none focus:ring-4
                             focus:ring-violet-500/10 focus:border-violet-500
                             transition-all bg-white"
                />
                {taskSearch && (
                  <button
                    onClick={() => setTaskSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status filter chips */}
              <div className="flex gap-1.5 flex-wrap">
                {TASK_STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setTaskFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold
                                border transition-all
                                ${taskFilter === s
                                  ? "bg-violet-600 text-white border-violet-600"
                                  : "bg-white text-slate-500 border-slate-200 hover:border-violet-300"
                                }`}
                  >
                    {s}
                    {s !== "All" && (
                      <span className={`ml-1 text-[9px] font-bold
                        ${taskFilter === s ? "text-white/70" : "text-slate-400"}`}>
                        ({tasks.filter((t) => t.status === s).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Task list */}
              {filteredTasks.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl py-10 flex flex-col
                                items-center gap-2">
                  <Activity size={22} className="text-slate-300" />
                  <p className="text-sm text-slate-400 font-medium">
                    No tasks found
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map((task, idx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-white rounded-2xl border border-slate-100
                                 p-4 shadow-sm hover:border-violet-200
                                 transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 mr-2">
                          <p className="text-[13px] font-bold text-slate-700">
                            {task.activity?.activity_name || "Task"}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-slate-400" />
                            <span className="text-[11px] text-slate-500 font-medium">
                              {task.location?.location_name || "-"}
                            </span>
                            {task.location?.corridor_name && (
                              <span className="text-[10px] text-slate-400">
                                · {task.location.corridor_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge status={task.status} />
                      </div>

                      {/* Progress */}
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${task.progress_pct || 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-violet-600 w-8 text-right">
                          {task.progress_pct || 0}%
                        </span>
                      </div>

                      {/* Footer info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {task.planned_end_date && (
                            <div className="flex items-center gap-1">
                              <Calendar size={10} className="text-slate-400" />
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(task.planned_end_date).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" }
                                )}
                              </span>
                            </div>
                          )}
                          <span className="text-[10px] text-slate-400 bg-slate-50
                                           border border-slate-100 px-2 py-0.5 rounded-lg">
                            {task.updates?.length || 0} updates
                          </span>
                        </div>
                        {task.remarks && (
                          <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]">
                            "{task.remarks}"
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════
              TAB: UPDATES HISTORY
          ══════════════════════════════ */}
          {!loading && activeTab === "history" && (
            <div className="space-y-3">
              {allUpdates.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl py-10 flex flex-col
                                items-center gap-2">
                  <History size={22} className="text-slate-300" />
                  <p className="text-sm text-slate-400 font-medium">
                    No updates yet
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {allUpdates.map((update, idx) => {
                    const isLast    = idx === allUpdates.length - 1;
                    const hasPhotos = update.photos?.length > 0;
                    return (
                      <div key={`${update.id}-${idx}`}
                           className="flex gap-3 relative">
                        {/* Timeline line */}
                        {!isLast && (
                          <div className="absolute left-4 top-8 bottom-0
                                          w-px bg-slate-100" />
                        )}
                        {/* Timeline dot */}
                        <div className="flex-shrink-0 mt-0.5 relative z-10">
                          <div className={`w-8 h-8 rounded-xl flex items-center
                                           justify-center shadow-sm border-2 border-white
                                           ${update.new_status === "Completed"
                                             ? "bg-emerald-100"
                                             : update.new_status === "Delayed"
                                             ? "bg-rose-100"
                                             : "bg-violet-100"
                                           }`}>
                            {update.new_status === "Completed"
                              ? <CheckCircle2 size={13} className="text-emerald-600" />
                              : update.new_status === "Delayed"
                              ? <AlertTriangle size={13} className="text-rose-600" />
                              : <RotateCw size={13} className="text-violet-600" />
                            }
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="bg-white rounded-2xl border border-slate-100
                                          shadow-sm p-3.5">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-[12px] font-bold text-slate-700">
                                  {update.taskName}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MapPin size={9} className="text-slate-400" />
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {update.locationName}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium
                                               flex-shrink-0 ml-2">
                                {new Date(update.created_at).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" }
                                )}{" "}
                                {new Date(update.created_at).toLocaleTimeString(
                                  "en-IN",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>

                            {/* Status change */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {update.old_status !== update.new_status && (
                                <>
                                  <Badge status={update.old_status} />
                                  <span className="text-slate-400 text-xs">→</span>
                                </>
                              )}
                              <Badge status={update.new_status} />
                              {update.old_progress !== update.new_progress && (
                                <span className="text-[10px] text-slate-500 font-medium
                                                 bg-slate-50 border border-slate-200
                                                 px-2 py-0.5 rounded-lg">
                                  {update.old_progress}% → {update.new_progress}%
                                </span>
                              )}
                            </div>

                            {/* Remarks */}
                            {update.remarks && (
                              <p className="text-[11px] text-slate-600 bg-slate-50
                                            rounded-xl px-3 py-2 border border-slate-100
                                            mb-2 italic">
                                "{update.remarks}"
                              </p>
                            )}

                            {/* Photos */}
                            {hasPhotos && (
                              <div className="flex gap-1.5 flex-wrap mb-2">
                                {update.photos.slice(0, 4).map((photo, pi) => (
                                  <div
                                    key={pi}
                                    onClick={() =>
                                      window.open(
                                        `http://192.168.1.17:5000${photo}`,
                                        "_blank"
                                      )
                                    }
                                    className="w-14 h-14 rounded-xl overflow-hidden
                                               border border-slate-200 bg-slate-100
                                               cursor-pointer hover:opacity-80
                                               transition-opacity relative"
                                  >
                                    <img
                                      src={`http://192.168.1.17:5000${photo}`}
                                      alt={`p${pi}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                    {pi === 3 && update.photos.length > 4 && (
                                      <div className="absolute inset-0 bg-black/50
                                                      flex items-center justify-center">
                                        <span className="text-white text-[10px] font-bold">
                                          +{update.photos.length - 4}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Updated by */}
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 bg-gradient-to-br from-violet-400
                                              to-purple-500 rounded-md flex items-center
                                              justify-center text-white text-[8px] font-bold">
                                {(update.updater?.full_name || "U")[0]}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                by{" "}
                                <span className="text-slate-600 font-semibold">
                                  {update.updater?.full_name || "Unknown"}
                                </span>
                              </span>
                              {update.photo_type && (
                                <span className="text-[9px] text-slate-400 bg-slate-50
                                                 border border-slate-200 px-1.5 py-0.5
                                                 rounded-lg ml-1">
                                  {update.photo_type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ════════════════════════════════════════
   MAIN PAGE — WORKERS LIST
════════════════════════════════════════ */
const WorkersList = () => {
  const [loading,       setLoading]       = useState(true);
  const [workers,       setWorkers]       = useState([]);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [selectedWorker, setSelectedWorker] = useState(null);

  /* ── Fetch ── */
  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/supervisor/my-workers");
      setWorkers(res.data.data || []);
    } catch (err) {
      console.error("[WorkersList]", err?.response?.data || err.message);
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkers(); }, []);

  /* ── Filter + Search ── */
  const filtered = workers.filter((w) => {
    const matchSearch =
      w.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      w.phone?.includes(search) ||
      w.employee_id?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      statusFilter === "All" ||
      w.stats?.overall_status === statusFilter;
    return matchSearch && matchFilter;
  });

  /* ── Summary ── */
  const summary = {
    total:     workers.length,
    active:    workers.filter((w) => w.stats?.overall_status === "Active").length,
    allDone:   workers.filter((w) => w.stats?.overall_status === "All Done").length,
    hasDelays: workers.filter((w) => w.stats?.overall_status === "Has Delays").length,
    noTasks:   workers.filter((w) => w.stats?.overall_status === "No Tasks").length,
  };

  const filterTabs = [
    { key: "All",        label: "All Workers", count: summary.total     },
    { key: "Active",     label: "Active",      count: summary.active    },
    { key: "All Done",   label: "All Done",    count: summary.allDone   },
    { key: "Has Delays", label: "Has Delays",  count: summary.hasDelays },
    { key: "No Tasks",   label: "No Tasks",    count: summary.noTasks   },
  ];

  /* ── Card animation ── */
  const cardVariants = {
    hidden:  { opacity: 0, y: 16 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.07, duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  return (
    <>
      <div className="space-y-5">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-3"
        >
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              My Workers
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {workers.length} workers assigned to you ·{" "}
              Click any worker to view details
            </p>
          </div>
          <button
            onClick={fetchWorkers}
            className="px-4 py-2.5 text-xs font-semibold bg-violet-600 text-white
                       rounded-2xl hover:bg-violet-700 flex items-center gap-2
                       transition-all shadow-md shadow-violet-500/20"
          >
            <RotateCw size={13} /> Refresh
          </button>
        </motion.div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Workers", value: summary.total,     icon: Users,         color: "violet"  },
            { label: "Active",        value: summary.active,    icon: Activity,      color: "purple"  },
            { label: "All Done",      value: summary.allDone,   icon: CheckCircle2,  color: "emerald" },
            { label: "Has Delays",    value: summary.hasDelays, icon: AlertTriangle, color: "rose"    },
          ].map((card, i) => {
            const cm = {
              violet:  { bg: "bg-violet-50",  text: "text-violet-600"  },
              purple:  { bg: "bg-purple-50",  text: "text-purple-600"  },
              emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
              rose:    { bg: "bg-rose-50",    text: "text-rose-600"    },
            };
            const c    = cm[card.color];
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-4 border border-slate-100
                           shadow-sm flex items-center gap-3"
              >
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={18} className={c.text} />
                </div>
                <div>
                  <p className="text-[22px] font-extrabold text-slate-800 leading-none">
                    {card.value}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {card.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Search + Filter ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3"
        >
          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, employee ID..."
              className="w-full pl-10 pr-9 py-2.5 border-2 border-slate-200
                         rounded-xl text-sm focus:outline-none focus:ring-4
                         focus:ring-violet-500/10 focus:border-violet-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} className="text-slate-400" />
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold
                            border transition-all flex items-center gap-1.5
                            ${statusFilter === tab.key
                              ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:border-violet-300"
                            }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold
                  ${statusFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-500"
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Workers Grid ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-[3px] border-violet-500
                            border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading workers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm
                          py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
              <UserX size={24} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-semibold">
              {search ? `No workers matching "${search}"` : "No workers assigned yet"}
            </p>
            <p className="text-xs text-slate-300">
              {search ? "Try different search" : "Contact admin to assign workers"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((worker, idx) => {
              const sc  = statusConfig[worker.stats?.overall_status] || statusConfig["No Tasks"];
              const avg = worker.stats?.avg_progress || 0;
              return (
                <motion.div
                  key={worker.id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  onClick={() => setSelectedWorker(worker)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm
                             hover:shadow-lg hover:border-violet-200 cursor-pointer
                             transition-all duration-200 overflow-hidden group"
                >
                  {/* Top strip */}
                  <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600
                                  opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="p-5">
                    {/* Worker info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-500
                                          to-purple-600 rounded-2xl flex items-center
                                          justify-center text-white text-lg font-bold
                                          shadow-md shadow-violet-500/20">
                            {worker.full_name?.[0]?.toUpperCase()}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5
                                           rounded-full border-2 border-white
                                           ${worker.is_active
                                             ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                                             : "bg-slate-300"
                                           }`}
                          />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-800 leading-tight">
                            {worker.full_name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {worker.employee_id || "No ID"}
                          </p>
                        </div>
                      </div>
                      {/* Status badge */}
                      <span className={`px-2 py-1 rounded-xl text-[10px] font-bold
                                       border flex items-center gap-1 flex-shrink-0
                                       ${sc.bg} ${sc.text} ${sc.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-1.5 mb-4">
                      <Phone size={11} className="text-slate-400" />
                      <span className="text-[12px] text-slate-500 font-medium">
                        {worker.phone}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Avg. Progress
                        </span>
                        <span className="text-[12px] font-bold text-violet-600">
                          {avg}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${avg}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.07 }}
                          className="h-full bg-gradient-to-r from-violet-500
                                     to-purple-600 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div className="grid grid-cols-4 gap-1.5 mb-4">
                      {[
                        { label: "Total",   value: worker.stats?.total       || 0, color: "text-slate-600"  },
                        { label: "Done",    value: worker.stats?.completed   || 0, color: "text-emerald-600"},
                        { label: "Active",  value: worker.stats?.in_progress || 0, color: "text-violet-600" },
                        { label: "Delayed", value: worker.stats?.delayed     || 0, color: "text-rose-600"   },
                      ].map((s, i) => (
                        <div key={i}
                             className="bg-slate-50 rounded-xl p-2 text-center
                                        border border-slate-100">
                          <p className={`text-[14px] font-extrabold ${s.color}`}>
                            {s.value}
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            {s.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Click hint */}
                    <div className="flex items-center justify-between pt-3
                                    border-t border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {worker.stats?.total || 0} tasks assigned
                      </span>
                      <span className="text-[12px] font-semibold text-violet-600
                                       group-hover:text-violet-700 flex items-center gap-1">
                        View Details
                        <ChevronRight size={13}
                          className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Worker Modal ── */}
      <AnimatePresence>
        {selectedWorker && (
          <WorkerModal
            worker={selectedWorker}
            onClose={() => setSelectedWorker(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default WorkersList;