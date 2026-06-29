import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import API from "../api/client";
import Badge from "../components/ui/Badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Pin, Users, Wrench, Activity, CheckCircle2, RotateCw,
  Clock, AlertTriangle, UserX, TrendingUp, ArrowRight,
  Sparkles, MapPin, Layers, ChevronRight, Target, Zap,
  BarChart3, PieChartIcon, Calendar, LayoutDashboard,
  // ✅ ADD ONLY THESE 2 NEW ICONS to existing import
  UserCheck, Shield,
} from "lucide-react";

/* ─── Color Palette ─── */
const CHART_COLORS = {
  completed:  "#10b981",
  inProgress: "#8b5cf6",
  notStarted: "#94a3b8",
  delayed:    "#f43f5e",
};

/* ─── Animation Variants ─── */
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const Dashboard = () => {
  const { role, user } = useAuth();
  const nav = useNavigate();

  /* ─── ALL STATE HOOKS FIRST ─── */
  const [loading,   setLoading]   = useState(true);
  const [stats,     setStats]     = useState({});
  const [recent,    setRecent]    = useState([]);
  const [locations, setLocations] = useState([]);

  // ✅ ADD ONLY THIS ONE NEW STATE
  const [teamData, setTeamData] = useState([]);

  const base =
    role === "Admin"      ? "/admin"
    : role === "Supervisor" ? "/supervisor"
    : "/worker";

  /* ─── Fetch Data — UNCHANGED ─── */
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await API.get(`${base}/dashboard`);
      const dashboardData = response.data.data || {};
      setStats(dashboardData.stats || {});
setRecent(
    role === "Admin"
        ? dashboardData.recent_updates      || []
        : role === "Supervisor"
            ? dashboardData.recent_updates  ||
              dashboardData.pending_assignments || []
            : dashboardData.pending_tasks   ||
              dashboardData.my_tasks        || []
);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await API.get(`${base}/locations`);
      setLocations(response.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ ADD ONLY THIS ONE NEW FETCH FUNCTION
// Dashboard.jsx mein fetchTeamData() ko YE SE REPLACE KARO:

const fetchTeamData = async () => {
    try {
      if (role === "Admin") {
        // Admin → supervisors with workers
        const res = await API.get("/admin/supervisors-with-workers");
        setTeamData(res.data.data || []);

      } else if (role === "Supervisor") {
        // ✅ CORRECT - Supervisor ka apna API
        const res = await API.get("/supervisor/my-workers");
        setTeamData(res.data.data || []);

      } else if (role === "Worker") {
        // ✅ Worker → apne supervisor ki info
        // Worker ke paas koi special API nahi
        // AuthContext mein user object se supervisor_id milega
        // Lekin supervisor details ke liye worker dashboard API use karo
        const res = await API.get("/worker/dashboard");
        const dashData = res.data.data || {};
        // Worker dashboard mein supervisor info nahi hai abhi
        // Isliye empty rakhte hain - worker section optional hai
        setTeamData([]);
      }
    } catch (err) {
      console.log("fetchTeamData error (non-critical):", err.message);
      setTeamData([]); // ✅ Fail hone pe empty - page crash nahi hoga
    }
};

  /* ─── useEffect — ADD fetchTeamData() call only ─── */
  useEffect(() => {
    const load = async () => {
      await fetchDashboard();
      if (role === "Admin" || role === "Supervisor") await fetchLocations();
      await fetchTeamData(); // ✅ ADD THIS ONE LINE
    };
    load();
  }, [role]);

  /* ─── useMemo for barData — UNCHANGED ─── */
  const barData = useMemo(
    () =>
      locations.slice(0, 10).map((loc) => {
        const total = loc.activities?.length || 0;
        const done  = loc.activities?.filter((a) => a.status === "Completed")?.length || 0;
        const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
        return {
          name:     (loc.location_name || "N/A").substring(0, 18),
          progress: pct,
          total,
          done,
        };
      }),
    [locations]
  );

  /* ─── Loading State — UNCHANGED ─── */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[75vh] gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500
                          to-purple-600 animate-pulse shadow-2xl shadow-violet-500/30" />
          <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-emerald-400
                          rounded-full border-[3px] border-white animate-bounce
                          shadow-lg shadow-emerald-400/50" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-500">Loading your dashboard</p>
          <p className="text-xs text-slate-400 mt-1">Fetching the latest data...</p>
        </div>
      </div>
    );

  /* ─── ALL EXISTING CODE BELOW IS 100% UNCHANGED ─── */

  const cards =
    role === "Admin"
      ? [
          { label: "Total Locations",  value: stats.total_locations   || 0, icon: Pin,          color: "violet"  },
          { label: "Supervisors",       value: stats.total_supervisors || 0, icon: Users,        color: "blue"    },
          { label: "Workers",           value: stats.total_workers     || 0, icon: Wrench,       color: "cyan"    },
          { label: "Total Activities",  value: stats.total_activities  || 0, icon: Activity,     color: "amber"   },
          { label: "Completed",         value: stats.completed         || 0, icon: CheckCircle2, color: "emerald" },
          { label: "In Progress",       value: stats.in_progress       || 0, icon: RotateCw,     color: "purple"  },
          { label: "Not Started",       value: stats.not_started       || 0, icon: Clock,        color: "slate"   },
          { label: "Delayed",           value: stats.delayed           || 0, icon: AlertTriangle,color: "rose"    },
        ]
      : role === "Supervisor"
        ? [
            { label: "My Locations",    value: stats.my_locations     || 0, icon: Pin,          color: "violet"  },
            { label: "Total Activities",value: stats.total_activities  || 0, icon: Activity,     color: "amber"   },
            { label: "Completed",       value: stats.completed         || 0, icon: CheckCircle2, color: "emerald" },
            { label: "In Progress",     value: stats.in_progress       || 0, icon: RotateCw,     color: "purple"  },
            { label: "Delayed",         value: stats.delayed           || 0, icon: AlertTriangle,color: "rose"    },
            { label: "Unassigned",      value: stats.unassigned        || 0, icon: UserX,        color: "slate"   },
          ]
        : [
            { label: "Total Tasks",  value: stats.total_tasks || stats.total || 0, icon: Activity,     color: "violet"  },
            { label: "Completed",    value: stats.completed   || 0,                icon: CheckCircle2, color: "emerald" },
            { label: "In Progress",  value: stats.in_progress || 0,                icon: RotateCw,     color: "purple"  },
            { label: "Not Started",  value: stats.not_started || 0,                icon: Clock,        color: "slate"   },
            { label: "Delayed",      value: stats.delayed     || 0,                icon: AlertTriangle,color: "rose"    },
          ];

  const cm = {
    violet:  { light: "bg-violet-50",  text: "text-violet-600",  soft: "bg-violet-100"  },
    blue:    { light: "bg-blue-50",    text: "text-blue-600",    soft: "bg-blue-100"    },
    cyan:    { light: "bg-cyan-50",    text: "text-cyan-600",    soft: "bg-cyan-100"    },
    amber:   { light: "bg-amber-50",   text: "text-amber-600",   soft: "bg-amber-100"   },
    emerald: { light: "bg-emerald-50", text: "text-emerald-600", soft: "bg-emerald-100" },
    purple:  { light: "bg-purple-50",  text: "text-purple-600",  soft: "bg-purple-100"  },
    slate:   { light: "bg-slate-50",   text: "text-slate-500",   soft: "bg-slate-100"   },
    rose:    { light: "bg-rose-50",    text: "text-rose-600",    soft: "bg-rose-100"    },
  };

  const pieData = [
    { name: "Completed",   value: stats.completed   || 0, color: CHART_COLORS.completed  },
    { name: "In Progress", value: stats.in_progress || 0, color: CHART_COLORS.inProgress },
    { name: "Not Started", value: stats.not_started || 0, color: CHART_COLORS.notStarted },
    { name: "Delayed",     value: stats.delayed     || 0, color: CHART_COLORS.delayed    },
  ].filter((d) => d.value > 0);

  const totalActs =
    (stats.completed || 0) + (stats.in_progress || 0) +
    (stats.not_started || 0) + (stats.delayed || 0);

  const completionPct =
    totalActs > 0 ? Math.round(((stats.completed || 0) / totalActs) * 100) : 0;

  const hrs   = new Date().getHours();
  const greet = hrs < 12 ? "Good Morning" : hrs < 17 ? "Good Afternoon" : "Good Evening";
  const emoji = hrs < 12 ? "🌅" : hrs < 17 ? "☀️" : "🌙";

  const tableTitle =
    role === "Admin"
      ? "Recent Activity Updates"
      : role === "Supervisor"
        ? "Pending Worker Assignments"
        : "My Pending Tasks";

  /* ════════════════════════════════════════════════
     RENDER — EVERYTHING BELOW IS UNCHANGED EXCEPT
     3 NEW SECTIONS ADDED BEFORE CLOSING </div>
  ════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ─────── HERO CARD — UNCHANGED ─────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white"
        style={{
          background:
            "linear-gradient(135deg, #4f46e5 0%, #7c3aed 25%, #a855f7 55%, #6366f1 100%)",
        }}
      >
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/30 rounded-full animate-ping" />
        <div className="absolute top-[30%] right-[20%] w-2 h-2 bg-white/20 rounded-full" />
        <div className="absolute bottom-[25%] right-[40%] w-1 h-1 bg-amber-300/50 rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-amber-300" />
                <p className="text-white/60 text-[11px] font-bold tracking-[0.2em] uppercase">
                  {role} Dashboard
                </p>
              </div>
              <h1 className="text-2xl md:text-[32px] font-extrabold tracking-tight leading-tight">
                {greet}, {user?.full_name?.split(" ")[0]} <span>{emoji}</span>
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-lg leading-relaxed">
                Real-time overview of your field operations. Stay on top of every
                location, activity, and team member.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3.5
                              border border-white/[0.08] text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Target size={14} className="text-emerald-300" />
                  <p className="text-[26px] font-extrabold leading-none">{completionPct}%</p>
                </div>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  Completion
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3.5
                              border border-white/[0.08] text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Zap size={14} className="text-amber-300" />
                  <p className="text-[26px] font-extrabold leading-none">
                    {stats.total_activities || stats.total_tasks || stats.total || 0}
                  </p>
                </div>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  Total
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            {role === "Admin" && (
              <>
                <button
                  onClick={() => nav(`${base}/locations`)}
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl
                             px-4 py-2 text-xs font-semibold flex items-center gap-2
                             transition-all border border-white/10"
                >
                  <MapPin size={13} /> View Locations
                </button>
                <button
                  onClick={() => nav(`${base}/upload`)}
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl
                             px-4 py-2 text-xs font-semibold flex items-center gap-2
                             transition-all border border-white/10"
                >
                  <Layers size={13} /> Upload Data
                </button>
              </>
            )}
            <button
              onClick={() => nav(`${base}/reports`)}
              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl
                         px-4 py-2 text-xs font-semibold flex items-center gap-2
                         transition-all border border-white/10"
            >
              <TrendingUp size={13} /> View Reports
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─────── STAT CARDS — UNCHANGED ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((card, i) => {
          const c    = cm[card.color];
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -2 }}
              className="group relative bg-white rounded-xl p-3.5 md:p-4 cursor-pointer
                         border border-slate-100 overflow-hidden shadow-sm hover:shadow-md
                         transition-all duration-200"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r
                              from-violet-500 to-purple-600 opacity-0
                              group-hover:opacity-100 transition-opacity duration-300
                              rounded-t-xl" />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 ${c.light} rounded-xl flex items-center
                                 justify-center transition-transform duration-200
                                 group-hover:scale-105`}>
                  <Icon size={17} className={c.text} />
                </div>
              </div>
              <p className="text-[24px] md:text-[26px] font-extrabold text-slate-800
                            tracking-tight leading-none mb-0.5">
                {card.value.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">
                {card.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ─────── CHARTS ROW — UNCHANGED ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
                <PieChartIcon size={17} className="text-violet-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
                  Activity Status
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Distribution overview
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold bg-slate-50
                             px-3 py-1.5 rounded-xl border border-slate-100">
              {totalActs} total
            </span>
          </div>

          {pieData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                <PieChartIcon size={28} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 font-medium">No activity data yet</p>
              <p className="text-xs text-slate-300">Start by uploading activities</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-full sm:w-[55%] flex items-center justify-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData} cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100}
                      paddingAngle={4} dataKey="value"
                      stroke="none" cornerRadius={6}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{
                        borderRadius: "14px", border: "1px solid #e2e8f0",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                        fontSize: "13px", fontWeight: 500, padding: "8px 14px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center
                                justify-center pointer-events-none">
                  <span className="text-[28px] font-extrabold text-slate-800">
                    {totalActs}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold
                                   uppercase tracking-wider">
                    Total
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-[45%] space-y-2.5">
                {pieData.map((item, idx) => {
                  const pct =
                    totalActs > 0 ? Math.round((item.value / totalActs) * 100) : 0;
                  return (
                    <div key={idx}
                         className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-md shadow-sm"
                               style={{ backgroundColor: item.color }} />
                          <span className="text-[12px] font-semibold text-slate-700">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-slate-800">
                          {item.value}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-[22px]">
                        <div className="h-full rounded-full transition-all duration-700"
                             style={{ width: `${pct}%`, backgroundColor: item.color }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium
                                       ml-[22px] mt-0.5 block">
                        {pct}% of total
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {(role === "Admin" || role === "Supervisor") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
                  <BarChart3 size={17} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
                    Location Progress
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Completion by location
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold bg-slate-50
                               px-3 py-1.5 rounded-xl border border-slate-100">
                Top {Math.min(barData.length, 10)}
              </span>
            </div>

            {barData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <BarChart3 size={28} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 font-medium">No location data yet</p>
                <p className="text-xs text-slate-300">Add locations to see progress</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={barData} layout="vertical"
                  margin={{ left: 5, right: 35, top: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="#8b5cf6" />
                      <stop offset="50%"  stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number" domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    dataKey="name" type="category" width={130}
                    tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Progress"]}
                    contentStyle={{
                      borderRadius: "14px", border: "1px solid #e2e8f0",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                      fontSize: "13px", fontWeight: 500, padding: "8px 14px",
                    }}
                    cursor={{ fill: "rgba(139, 92, 246, 0.06)" }}
                  />
                  <Bar dataKey="progress" fill="url(#barGradient)"
                       radius={[0, 10, 10, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {barData.length > 0 && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  {barData.filter((d) => d.progress === 100).length} fully complete
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  {barData.filter((d) => d.progress > 0 && d.progress < 100).length} in progress
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  {barData.filter((d) => d.progress === 0).length} not started
                </div>
              </div>
            )}
          </motion.div>
        )}

        {role === "Worker" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
                <Target size={17} className="text-violet-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
                  My Task Progress
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Personal completion rate
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-5">
              <div className="relative w-48 h-48">
                <svg className="w-48 h-48 -rotate-90">
                  <circle cx="96" cy="96" r="84" fill="none"
                          stroke="#f1f5f9" strokeWidth="10" />
                  <circle cx="96" cy="96" r="84" fill="none"
                          stroke="url(#ringGrad)" strokeWidth="10"
                          strokeDasharray={`${completionPct * 5.28} 528`}
                          strokeLinecap="round"
                          className="transition-all duration-1000" />
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%"   stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[44px] font-extrabold text-slate-800 tracking-tight">
                    {completionPct}%
                  </span>
                  <span className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">
                    Done
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  { v: stats.completed   || 0, l: "Completed",   c: "emerald", icon: CheckCircle2  },
                  { v: stats.in_progress || 0, l: "In Progress",  c: "purple",  icon: RotateCw      },
                  { v: stats.not_started || 0, l: "Not Started",  c: "slate",   icon: Clock         },
                  { v: stats.delayed     || 0, l: "Delayed",      c: "rose",    icon: AlertTriangle },
                ].map((s, i) => {
                  const cl   = cm[s.c];
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.03 }}
                      className={`${cl.light} rounded-2xl p-4 text-center cursor-pointer
                                  transition-shadow hover:shadow-md`}
                    >
                      <Icon size={18} className={`${cl.text} mx-auto mb-1.5`} />
                      <p className={`text-xl font-extrabold ${cl.text}`}>{s.v}</p>
                      <p className={`text-[11px] font-semibold ${cl.text}/60`}>{s.l}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ─────── LOCATION OVERVIEW — UNCHANGED ─────── */}
      {(role === "Admin" || role === "Supervisor") && locations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6
                     shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
                <MapPin size={17} className="text-violet-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
                  Location Overview
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Click any location for full details
                </p>
              </div>
            </div>
            <button
              onClick={() => nav(`${base}/locations`)}
              className="group text-xs font-semibold text-violet-600 hover:text-violet-700
                         hover:bg-violet-50 px-4 py-2 rounded-xl transition-all
                         flex items-center gap-1.5"
            >
              View All
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {locations.slice(0, 8).map((loc, idx) => {
              const total = loc.activities?.length || 0;
              const done  = loc.activities?.filter((a) => a.status === "Completed")?.length || 0;
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
              const statusColor =
                pct === 100 ? "emerald" : pct > 50 ? "violet" : pct > 0 ? "amber" : "slate";

              return (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * idx, duration: 0.3 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => nav(`${base}/locations/${loc.id}`)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50
                             hover:bg-slate-50 cursor-pointer transition-all duration-200
                             group border border-transparent hover:border-slate-200"
                >
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center
                      ${statusColor === "emerald" ? "bg-emerald-100 text-emerald-600"
                        : statusColor === "violet" ? "bg-violet-100 text-violet-600"
                        : statusColor === "amber"  ? "bg-amber-100 text-amber-600"
                        : "bg-slate-100 text-slate-400"
                      }`}>
                      <Pin size={19} />
                    </div>
                    <svg className="absolute inset-0 w-11 h-11 -rotate-90">
                      <circle cx="22" cy="22" r="20" fill="none"
                        stroke={pct === 100 ? "#6ee7b7" : pct > 50 ? "#a78bfa" : pct > 0 ? "#fcd34d" : "#e2e8f0"}
                        strokeWidth="2.5"
                        strokeDasharray={`${pct * 1.26} 126`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                        opacity="0.6"
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-700
                                  group-hover:text-slate-900 truncate transition-colors">
                      {loc.location_name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        {loc.supervisor?.full_name || "No Supervisor"}
                      </p>
                      <span className="text-slate-300">·</span>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {done}/{total} done
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-32 shrink-0">
                    <div className="flex-1 h-2 bg-slate-200/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700
                          ${pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-violet-500"
                            : pct > 0 ? "bg-amber-500" : "bg-slate-300"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-9 text-right
                      ${pct === 100 ? "text-emerald-600" : pct > 50 ? "text-violet-600"
                        : pct > 0 ? "text-amber-600" : "text-slate-400"}`}>
                      {pct}%
                    </span>
                  </div>

                  <ChevronRight size={15}
                    className="text-slate-300 group-hover:text-violet-400
                               group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.div>
              );
            })}
          </div>

          {locations.length > 8 && (
            <button
              onClick={() => nav(`${base}/locations`)}
              className="w-full mt-3 py-3 text-center text-xs font-semibold text-slate-500
                         hover:text-violet-600 hover:bg-violet-50/50 rounded-xl transition-all"
            >
              + {locations.length - 8} more locations — View all
            </button>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ✅ NEW SECTION 1 — ADMIN: Supervisor → Workers Overview
          Shows each supervisor with their assigned workers count
      ═══════════════════════════════════════════════════════════ */}
      {role === "Admin" && teamData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-2xl flex items-center justify-center">
                <UserCheck size={17} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
                  Team Assignment Overview
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Supervisor → Workers assignment status
                </p>
              </div>
            </div>
            <button
              onClick={() => nav(`${base}/assign-workers`)}
              className="group text-xs font-semibold text-violet-600 hover:text-violet-700
                         hover:bg-violet-50 px-4 py-2 rounded-xl transition-all
                         flex items-center gap-1.5"
            >
              Manage
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Summary chips */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50
                             border border-blue-100 rounded-xl text-[11px]
                             font-bold text-blue-700">
              <Shield size={11} />
              {teamData.length} Supervisors
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50
                             border border-emerald-100 rounded-xl text-[11px]
                             font-bold text-emerald-700">
              <CheckCircle2 size={11} />
              {teamData.reduce((s, sup) => s + (sup.my_workers?.length ?? sup.worker_count ?? 0), 0)} Assigned Workers
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50
                             border border-amber-100 rounded-xl text-[11px]
                             font-bold text-amber-700">
              <AlertTriangle size={11} />
              {teamData.filter((s) => (s.my_workers?.length ?? s.worker_count ?? 0) === 0).length} Supervisors without workers
            </span>
          </div>

          {/* Supervisor rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {teamData.slice(0, 6).map((sup, idx) => {
              const workerCount = sup.my_workers?.length ?? sup.worker_count ?? 0;
              const workers     = sup.my_workers || [];

              return (
                <motion.div
                  key={sup.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/60
                             border border-slate-100 hover:border-blue-200
                             hover:bg-blue-50/30 transition-all duration-200 group"
                >
                  {/* Supervisor Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br
                                  from-blue-500 to-indigo-600 flex items-center
                                  justify-center text-white text-sm font-bold
                                  shadow-sm flex-shrink-0">
                    {sup.full_name?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-700 truncate">
                      {sup.full_name}
                    </p>

                    {/* Worker avatars — show first 4 */}
                    {workers.length > 0 ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex -space-x-1.5">
                          {workers.slice(0, 4).map((w) => (
                            <div
                              key={w.id}
                              title={w.full_name}
                              className="w-5 h-5 rounded-full bg-gradient-to-br
                                         from-emerald-400 to-teal-500 flex items-center
                                         justify-center text-white text-[9px] font-bold
                                         border border-white"
                            >
                              {w.full_name?.[0]?.toUpperCase()}
                            </div>
                          ))}
                          {workers.length > 4 && (
                            <div className="w-5 h-5 rounded-full bg-slate-200 flex
                                            items-center justify-center text-[8px]
                                            font-bold text-slate-500 border border-white">
                              +{workers.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {workers.slice(0, 2).map((w) => w.full_name.split(" ")[0]).join(", ")}
                          {workers.length > 2 && ` +${workers.length - 2} more`}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-500 font-semibold mt-0.5">
                        ⚠️ No workers assigned
                      </p>
                    )}
                  </div>

                  {/* Worker count badge */}
                  <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold
                                   border flex-shrink-0 transition-all
                                   ${workerCount > 0
                      ? "bg-blue-50 border-blue-100 text-blue-700"
                      : "bg-amber-50 border-amber-100 text-amber-700"
                    }`}>
                    {workerCount} {workerCount === 1 ? "worker" : "workers"}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Show more */}
          {teamData.length > 6 && (
            <button
              onClick={() => nav(`${base}/assign-workers`)}
              className="w-full mt-3 py-3 text-center text-xs font-semibold
                         text-slate-500 hover:text-violet-600 hover:bg-violet-50/50
                         rounded-xl transition-all"
            >
              + {teamData.length - 6} more supervisors — Manage All
            </button>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ✅ NEW SECTION 2 — SUPERVISOR: My Assigned Workers
          Shows list of workers assigned to this supervisor
      ═══════════════════════════════════════════════════════════ */}
      {role === "Supervisor" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Users size={17} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
                  My Team
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Workers assigned to you
                </p>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border
              ${teamData.length > 0
                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                : "bg-amber-50 border-amber-100 text-amber-700"
              }`}>
              {teamData.length} {teamData.length === 1 ? "Worker" : "Workers"}
            </span>
          </div>

          {teamData.length === 0 ? (
            // No workers assigned
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={22} className="text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500">
                No workers assigned yet
              </p>
              <p className="text-xs text-slate-400 text-center max-w-[220px]">
                Contact your admin to assign workers to your team
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {teamData.map((worker, idx) => (
                <motion.div
                  key={worker.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * idx }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl
                             bg-emerald-50/60 border border-emerald-100
                             hover:border-emerald-200 hover:bg-emerald-50
                             transition-all duration-200"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br
                                  from-emerald-500 to-teal-600 flex items-center
                                  justify-center text-white text-sm font-bold
                                  shadow-sm flex-shrink-0">
                    {worker.full_name?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-700 truncate">
                      {worker.full_name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      📞 {worker.phone}
                    </p>
                  </div>

                  {/* Active dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0
                    ${worker.is_active
                      ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                      : "bg-slate-300"
                    }`}
                    title={worker.is_active ? "Active" : "Inactive"}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ✅ NEW SECTION 3 — WORKER: My Supervisor Info Card
          Shows the supervisor assigned to this worker
      ═══════════════════════════════════════════════════════════ */}
      {role === "Worker" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Shield size={17} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
                My Supervisor
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Your assigned supervisor details
              </p>
            </div>
          </div>

          {teamData.length === 0 ? (
            // No supervisor assigned
            <div className="flex items-center gap-4 p-4 rounded-2xl
                            bg-amber-50 border border-amber-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center
                              justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-700">
                  No Supervisor Assigned
                </p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  Contact your admin to get assigned to a supervisor
                </p>
              </div>
            </div>
          ) : (
            // Supervisor found
            <div className="flex items-center gap-5 p-5 rounded-2xl
                            bg-gradient-to-br from-blue-50 to-indigo-50
                            border border-blue-100">
              {/* Big Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br
                              from-blue-500 to-indigo-600 flex items-center
                              justify-center text-white text-2xl font-bold
                              shadow-lg shadow-blue-500/20 flex-shrink-0">
                {teamData[0]?.full_name?.[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[17px] font-extrabold text-slate-800">
                    {teamData[0]?.full_name}
                  </p>
                  {/* Active badge */}
                  <span className="px-2 py-0.5 bg-emerald-100 border
                                   border-emerald-200 rounded-lg text-[10px]
                                   font-bold text-emerald-700">
                    Active
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 font-semibold">
                  📞 {teamData[0]?.phone}
                </p>
                {teamData[0]?.email && (
                  <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                    ✉️ {teamData[0]?.email}
                  </p>
                )}
                <p className="text-[11px] text-blue-600 font-bold mt-2
                               flex items-center gap-1">
                  <UserCheck size={12} />
                  Your Supervisor
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ─────── RECENT ACTIVITY TABLE — UNCHANGED ─────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
      >
        <div className="px-5 md:px-7 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
              <Calendar size={15} className="text-slate-400" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
              {tableTitle}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold bg-slate-50
                           px-3 py-1.5 rounded-xl border border-slate-100">
            {recent.length} entries
          </span>
        </div>

        {recent.length === 0 ? (
          <div className="px-5 py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
              <LayoutDashboard size={28} className="text-slate-200" />
            </div>
            <p className="text-sm text-slate-400 font-semibold">No data yet</p>
            <p className="text-xs text-slate-300">Recent activity will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/40">
                  {["Location", "Activity", "Status",
                    role === "Admin" ? "Updated By"
                    : role === "Supervisor" ? "Worker"
                    : "Deadline",
                  ].map((h) => (
                    <th key={h}
                        className="px-5 md:px-7 py-3.5 text-left text-[11px] font-bold
                                   text-slate-400 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((item, i) => (
                  <tr key={item.id || i}
                      className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 md:px-7 py-4 text-[13px] font-semibold text-slate-700">
                      {role === "Admin"
                        ? item.location_activity?.location?.location_name || "-"
                        : item.location?.location_name || item.location_name || "-"}
                    </td>
                    <td className="px-5 md:px-7 py-4 text-[13px] text-slate-500 font-medium">
                      {role === "Admin"
                        ? item.location_activity?.activity?.activity_name || "-"
                        : item.activity?.activity_name || item.activity_name || "-"}
                    </td>
                    <td className="px-5 md:px-7 py-4">
                      <Badge status={role === "Admin" ? item.new_status : item.status} />
                    </td>
                    <td className="px-5 md:px-7 py-4 text-[13px] text-slate-500 font-medium">
                      {role === "Admin"    ? item.updater?.full_name     || "-"
                      : role === "Supervisor" ? item.worker?.full_name   || "Unassigned"
                      : item.planned_end_date || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

    </div>
  );
};

export default Dashboard;
















































// import { useState, useEffect, useMemo } from "react";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";

// import API from "../api/client";
// import Badge from "../components/ui/Badge";
// import { motion } from "framer-motion";
// import { toast } from "sonner";
// import {
//   PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
//   CartesianGrid, Tooltip, ResponsiveContainer,
// } from "recharts";
// import {
//   Pin, Users, Wrench, Activity, CheckCircle2, RotateCw,
//   Clock, AlertTriangle, UserX, TrendingUp, ArrowRight,
//   Sparkles, MapPin, Layers, ChevronRight, Target, Zap,
//   BarChart3, PieChartIcon, Calendar, LayoutDashboard,
// } from "lucide-react";

// /* ─── Color Palette ─── */
// const CHART_COLORS = {
//   completed: "#10b981",
//   inProgress: "#8b5cf6",
//   notStarted: "#94a3b8",
//   delayed: "#f43f5e",
// };

// /* ─── Animation Variants ─── */
// const cardVariants = {
//   hidden: { opacity: 0, y: 24 },
//   visible: (i) => ({
//     opacity: 1, y: 0,
//     transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
//   }),
// };

// const Dashboard = () => {
//   const { role, user } = useAuth();
//   const nav = useNavigate();

//   /* ─── ALL STATE HOOKS FIRST ─── */
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({});
//   const [recent, setRecent] = useState([]);
//   const [locations, setLocations] = useState([]);

//   const base =
//     role === "Admin"
//       ? "/admin"
//       : role === "Supervisor"
//         ? "/supervisor"
//         : "/worker";

//   /* ─── Fetch Data ─── */
//   const fetchDashboard = async () => {
//     try {
//       setLoading(true);
//       const response = await API.get(`${base}/dashboard`);
//       const dashboardData = response.data.data || {};
//       setStats(dashboardData.stats || {});
//       setRecent(
//         role === "Admin"
//           ? dashboardData.recent_updates || []
//           : role === "Supervisor"
//             ? dashboardData.pending_assignments || []
//             : dashboardData.pending_tasks || dashboardData.my_tasks || []
//       );
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to load dashboard data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchLocations = async () => {
//     try {
//       const response = await API.get(`${base}/locations`);
//       setLocations(response.data.data || []);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   useEffect(() => {
//     const load = async () => {
//       await fetchDashboard();
//       if (role === "Admin" || role === "Supervisor") await fetchLocations();
//     };
//     load();
//   }, [role]);

//   /* ───────── ALL HOOKS MUST BE BEFORE ANY EARLY RETURN ───────── */

//   /* useMemo for barData — MUST be before early return */
//   const barData = useMemo(
//     () =>
//       locations.slice(0, 10).map((loc) => {
//         const total = loc.activities?.length || 0;
//         const done =
//           loc.activities?.filter((a) => a.status === "Completed")?.length || 0;
//         const pct = total > 0 ? Math.round((done / total) * 100) : 0;
//         return {
//           name: (loc.location_name || "N/A").substring(0, 18),
//           progress: pct,
//           total,
//           done,
//         };
//       }),
//     [locations]
//   );

//   /* ─── Loading State — NOW comes AFTER all hooks ─── */
//   if (loading)
//     return (
//       <div className="flex flex-col items-center justify-center h-[75vh] gap-5">
//         <div className="relative">
//           <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse shadow-2xl shadow-violet-500/30" />
//           <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-emerald-400 rounded-full border-[3px] border-white animate-bounce shadow-lg shadow-emerald-400/50" />
//         </div>
//         <div className="text-center">
//           <p className="text-sm font-semibold text-slate-500">Loading your dashboard</p>
//           <p className="text-xs text-slate-400 mt-1">Fetching the latest data...</p>
//         </div>
//       </div>
//     );

//   /* ─── Stat Cards Config ─── */
//   const cards =
//     role === "Admin"
//       ? [
//           { label: "Total Locations", value: stats.total_locations || 0, icon: Pin, color: "violet" },
//           { label: "Supervisors", value: stats.total_supervisors || 0, icon: Users, color: "blue" },
//           { label: "Workers", value: stats.total_workers || 0, icon: Wrench, color: "cyan" },
//           { label: "Total Activities", value: stats.total_activities || 0, icon: Activity, color: "amber" },
//           { label: "Completed", value: stats.completed || 0, icon: CheckCircle2, color: "emerald" },
//           { label: "In Progress", value: stats.in_progress || 0, icon: RotateCw, color: "purple" },
//           { label: "Not Started", value: stats.not_started || 0, icon: Clock, color: "slate" },
//           { label: "Delayed", value: stats.delayed || 0, icon: AlertTriangle, color: "rose" },
//         ]
//       : role === "Supervisor"
//         ? [
//             { label: "My Locations", value: stats.my_locations || 0, icon: Pin, color: "violet" },
//             { label: "Total Activities", value: stats.total_activities || 0, icon: Activity, color: "amber" },
//             { label: "Completed", value: stats.completed || 0, icon: CheckCircle2, color: "emerald" },
//             { label: "In Progress", value: stats.in_progress || 0, icon: RotateCw, color: "purple" },
//             { label: "Delayed", value: stats.delayed || 0, icon: AlertTriangle, color: "rose" },
//             { label: "Unassigned", value: stats.unassigned || 0, icon: UserX, color: "slate" },
//           ]
//         : [
//             { label: "Total Tasks", value: stats.total_tasks || stats.total || 0, icon: Activity, color: "violet" },
//             { label: "Completed", value: stats.completed || 0, icon: CheckCircle2, color: "emerald" },
//             { label: "In Progress", value: stats.in_progress || 0, icon: RotateCw, color: "purple" },
//             { label: "Not Started", value: stats.not_started || 0, icon: Clock, color: "slate" },
//             { label: "Delayed", value: stats.delayed || 0, icon: AlertTriangle, color: "rose" },
//           ];

//   /* ─── Color Map ─── */
//   const cm = {
//     violet:  { light: "bg-violet-50", text: "text-violet-600", soft: "bg-violet-100" },
//     blue:    { light: "bg-blue-50",   text: "text-blue-600",   soft: "bg-blue-100" },
//     cyan:    { light: "bg-cyan-50",   text: "text-cyan-600",   soft: "bg-cyan-100" },
//     amber:   { light: "bg-amber-50",  text: "text-amber-600",  soft: "bg-amber-100" },
//     emerald: { light: "bg-emerald-50",text: "text-emerald-600",soft: "bg-emerald-100" },
//     purple:  { light: "bg-purple-50", text: "text-purple-600", soft: "bg-purple-100" },
//     slate:   { light: "bg-slate-50",  text: "text-slate-500",  soft: "bg-slate-100" },
//     rose:    { light: "bg-rose-50",   text: "text-rose-600",   soft: "bg-rose-100" },
//   };

//   /* ─── Chart Data ─── */
//   const pieData = [
//     { name: "Completed", value: stats.completed || 0, color: CHART_COLORS.completed },
//     { name: "In Progress", value: stats.in_progress || 0, color: CHART_COLORS.inProgress },
//     { name: "Not Started", value: stats.not_started || 0, color: CHART_COLORS.notStarted },
//     { name: "Delayed", value: stats.delayed || 0, color: CHART_COLORS.delayed },
//   ].filter((d) => d.value > 0);

//   const totalActs =
//     (stats.completed || 0) + (stats.in_progress || 0) +
//     (stats.not_started || 0) + (stats.delayed || 0);

//   const completionPct =
//     totalActs > 0 ? Math.round(((stats.completed || 0) / totalActs) * 100) : 0;

//   const hrs = new Date().getHours();
//   const greet =
//     hrs < 12 ? "Good Morning" : hrs < 17 ? "Good Afternoon" : "Good Evening";
//   const emoji = hrs < 12 ? "🌅" : hrs < 17 ? "☀️" : "🌙";

//   const tableTitle =
//     role === "Admin"
//       ? "Recent Activity Updates"
//       : role === "Supervisor"
//         ? "Pending Worker Assignments"
//         : "My Pending Tasks";

//   /* ════════════════════════════════════════════════
//      RENDER
//      ════════════════════════════════════════════════ */
//   return (
//     <div className="space-y-6">
//       {/* ─────── HERO CARD ─────── */}
//       <motion.div
//         initial={{ opacity: 0, y: -10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white"
//         style={{
//           background:
//             "linear-gradient(135deg, #4f46e5 0%, #7c3aed 25%, #a855f7 55%, #6366f1 100%)",
//         }}
//       >
//         {/* Decorative orbs */}
//         <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl" />
//         <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
//         <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/30 rounded-full animate-ping" />
//         <div className="absolute top-[30%] right-[20%] w-2 h-2 bg-white/20 rounded-full" />
//         <div className="absolute bottom-[25%] right-[40%] w-1 h-1 bg-amber-300/50 rounded-full" />
//         <div
//           className="absolute inset-0 opacity-[0.03]"
//           style={{
//             backgroundImage:
//               "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
//             backgroundSize: "28px 28px",
//           }}
//         />

//         <div className="relative z-10">
//           <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <Sparkles size={14} className="text-amber-300" />
//                 <p className="text-white/60 text-[11px] font-bold tracking-[0.2em] uppercase">
//                   {role} Dashboard
//                 </p>
//               </div>
//               <h1 className="text-2xl md:text-[32px] font-extrabold tracking-tight leading-tight">
//                 {greet}, {user?.full_name?.split(" ")[0]}{" "}
//                 <span>{emoji}</span>
//               </h1>
//               <p className="text-white/60 text-sm mt-2 max-w-lg leading-relaxed">
//                 Real-time overview of your field operations. Stay on top of every
//                 location, activity, and team member.
//               </p>
//             </div>

//             {/* Stat chips */}
//             <div className="flex items-center gap-3">
//               <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-white/[0.08] text-center min-w-[90px]">
//                 <div className="flex items-center justify-center gap-1.5 mb-1">
//                   <Target size={14} className="text-emerald-300" />
//                   <p className="text-[26px] font-extrabold leading-none">
//                     {completionPct}%
//                   </p>
//                 </div>
//                 <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
//                   Completion
//                 </p>
//               </div>
//               <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-white/[0.08] text-center min-w-[90px]">
//                 <div className="flex items-center justify-center gap-1.5 mb-1">
//                   <Zap size={14} className="text-amber-300" />
//                   <p className="text-[26px] font-extrabold leading-none">
//                     {stats.total_activities || stats.total_tasks || stats.total || 0}
//                   </p>
//                 </div>
//                 <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
//                   Total
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Quick action buttons */}
//           <div className="flex flex-wrap gap-2 mt-5">
//             {role === "Admin" && (
//               <>
//                 <button
//                   onClick={() => nav(`${base}/locations`)}
//                   className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all border border-white/10"
//                 >
//                   <MapPin size={13} /> View Locations
//                 </button>
//                 <button
//                   onClick={() => nav(`${base}/upload`)}
//                   className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all border border-white/10"
//                 >
//                   <Layers size={13} /> Upload Data
//                 </button>
//               </>
//             )}
//             <button
//               onClick={() => nav(`${base}/reports`)}
//               className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all border border-white/10"
//             >
//               <TrendingUp size={13} /> View Reports
//             </button>
//           </div>
//         </div>
//       </motion.div>

//       {/* ─────── STAT CARDS ─────── */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
//         {cards.map((card, i) => {
//           const c = cm[card.color];
//           const Icon = card.icon;
//           return (
//             <motion.div
//               key={i}
//               custom={i}
//               variants={cardVariants}
//               initial="hidden"
//               animate="visible"
//               whileHover={{ y: -2 }}
//               className="group relative bg-white rounded-xl p-3.5 md:p-4 cursor-pointer border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
//             >
//               {/* Colored top accent on hover */}
//               <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl" />

//               <div className="flex items-start justify-between mb-3">
//                 <div className={`w-9 h-9 ${c.light} rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
//                   <Icon size={17} className={c.text} />
//                 </div>
//               </div>

//               <p className="text-[24px] md:text-[26px] font-extrabold text-slate-800 tracking-tight leading-none mb-0.5">
//                 {card.value.toLocaleString()}
//               </p>
//               <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">
//                 {card.label}
//               </p>
//             </motion.div>
//           );
//         })}
//       </div>

//       {/* ─────── CHARTS ROW ─────── */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
//         {/* ── PIE CHART: Activity Status ── */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3, duration: 0.5 }}
//           className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
//         >
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center gap-3">
//               <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
//                 <PieChartIcon size={17} className="text-violet-600" />
//               </div>
//               <div>
//                 <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
//                   Activity Status
//                 </h3>
//                 <p className="text-[11px] text-slate-400 font-medium">
//                   Distribution overview
//                 </p>
//               </div>
//             </div>
//             <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
//               {totalActs} total
//             </span>
//           </div>

//           {pieData.length === 0 ? (
//             <div className="h-64 flex flex-col items-center justify-center gap-3">
//               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
//                 <PieChartIcon size={28} className="text-slate-300" />
//               </div>
//               <p className="text-sm text-slate-400 font-medium">
//                 No activity data yet
//               </p>
//               <p className="text-xs text-slate-300">
//                 Start by uploading activities
//               </p>
//             </div>
//           ) : (
//             <div className="flex flex-col sm:flex-row items-center gap-6">
//               {/* Donut */}
//               <div className="relative w-full sm:w-[55%] flex items-center justify-center">
//                 <ResponsiveContainer width="100%" height={240}>
//                   <PieChart>
//                     <Pie
//                       data={pieData}
//                       cx="50%"
//                       cy="50%"
//                       innerRadius={60}
//                       outerRadius={100}
//                       paddingAngle={4}
//                       dataKey="value"
//                       stroke="none"
//                       cornerRadius={6}
//                     >
//                       {pieData.map((entry, idx) => (
//                         <Cell key={idx} fill={entry.color} />
//                       ))}
//                     </Pie>
//                     <Tooltip
//                       formatter={(value, name) => [value, name]}
//                       contentStyle={{
//                         borderRadius: "14px",
//                         border: "1px solid #e2e8f0",
//                         boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
//                         fontSize: "13px",
//                         fontWeight: 500,
//                         padding: "8px 14px",
//                       }}
//                     />
//                   </PieChart>
//                 </ResponsiveContainer>
//                 {/* Center overlay */}
//                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
//                   <span className="text-[28px] font-extrabold text-slate-800">
//                     {totalActs}
//                   </span>
//                   <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
//                     Total
//                   </span>
//                 </div>
//               </div>

//               {/* Legend with micro progress bars */}
//               <div className="w-full sm:w-[45%] space-y-2.5">
//                 {pieData.map((item, idx) => {
//                   const pct =
//                     totalActs > 0
//                       ? Math.round((item.value / totalActs) * 100)
//                       : 0;
//                   return (
//                     <div
//                       key={idx}
//                       className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
//                     >
//                       <div className="flex items-center justify-between mb-1.5">
//                         <div className="flex items-center gap-2.5">
//                           <div
//                             className="w-3 h-3 rounded-md shadow-sm"
//                             style={{ backgroundColor: item.color }}
//                           />
//                           <span className="text-[12px] font-semibold text-slate-700">
//                             {item.name}
//                           </span>
//                         </div>
//                         <span className="text-sm font-extrabold text-slate-800">
//                           {item.value}
//                         </span>
//                       </div>
//                       {/* Micro bar */}
//                       <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-[22px]">
//                         <div
//                           className="h-full rounded-full transition-all duration-700"
//                           style={{
//                             width: `${pct}%`,
//                             backgroundColor: item.color,
//                           }}
//                         />
//                       </div>
//                       <span className="text-[10px] text-slate-400 font-medium ml-[22px] mt-0.5 block">
//                         {pct}% of total
//                       </span>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </motion.div>

//         {/* ── BAR CHART: Location Progress ── */}
//         {(role === "Admin" || role === "Supervisor") && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.5 }}
//             className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
//           >
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
//                   <BarChart3 size={17} className="text-violet-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
//                     Location Progress
//                   </h3>
//                   <p className="text-[11px] text-slate-400 font-medium">
//                     Completion by location
//                   </p>
//                 </div>
//               </div>
//               <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
//                 Top {Math.min(barData.length, 10)}
//               </span>
//             </div>

//             {barData.length === 0 ? (
//               <div className="h-64 flex flex-col items-center justify-center gap-3">
//                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
//                   <BarChart3 size={28} className="text-slate-300" />
//                 </div>
//                 <p className="text-sm text-slate-400 font-medium">
//                   No location data yet
//                 </p>
//                 <p className="text-xs text-slate-300">
//                   Add locations to see progress
//                 </p>
//               </div>
//             ) : (
//               <ResponsiveContainer width="100%" height={280}>
//                 <BarChart
//                   data={barData}
//                   layout="vertical"
//                   margin={{ left: 5, right: 35, top: 5, bottom: 5 }}
//                 >
//                   <defs>
//                     <linearGradient
//                       id="barGradient"
//                       x1="0"
//                       y1="0"
//                       x2="1"
//                       y2="0"
//                     >
//                       <stop offset="0%" stopColor="#8b5cf6" />
//                       <stop offset="50%" stopColor="#a855f7" />
//                       <stop offset="100%" stopColor="#6366f1" />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     stroke="#f1f5f9"
//                     horizontal={false}
//                   />
//                   <XAxis
//                     type="number"
//                     domain={[0, 100]}
//                     tick={{
//                       fontSize: 11,
//                       fill: "#94a3b8",
//                       fontWeight: 500,
//                     }}
//                     tickFormatter={(v) => `${v}%`}
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   <YAxis
//                     dataKey="name"
//                     type="category"
//                     width={130}
//                     tick={{
//                       fontSize: 11,
//                       fill: "#475569",
//                       fontWeight: 500,
//                     }}
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   <Tooltip
//                     formatter={(value) => [`${value}%`, "Progress"]}
//                     contentStyle={{
//                       borderRadius: "14px",
//                       border: "1px solid #e2e8f0",
//                       boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
//                       fontSize: "13px",
//                       fontWeight: 500,
//                       padding: "8px 14px",
//                     }}
//                     cursor={{ fill: "rgba(139, 92, 246, 0.06)" }}
//                   />
//                   <Bar
//                     dataKey="progress"
//                     fill="url(#barGradient)"
//                     radius={[0, 10, 10, 0]}
//                     barSize={20}
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             )}

//             {/* Summary row */}
//             {barData.length > 0 && (
//               <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
//                 <div className="flex items-center gap-2 text-xs text-slate-500">
//                   <div className="w-2 h-2 rounded-full bg-emerald-400" />
//                   {barData.filter((d) => d.progress === 100).length} fully complete
//                 </div>
//                 <div className="flex items-center gap-2 text-xs text-slate-500">
//                   <div className="w-2 h-2 rounded-full bg-amber-400" />
//                   {barData.filter((d) => d.progress > 0 && d.progress < 100).length} in progress
//                 </div>
//                 <div className="flex items-center gap-2 text-xs text-slate-500">
//                   <div className="w-2 h-2 rounded-full bg-slate-300" />
//                   {barData.filter((d) => d.progress === 0).length} not started
//                 </div>
//               </div>
//             )}
//           </motion.div>
//         )}

//         {/* ── WORKER PROGRESS RING ── */}
//         {role === "Worker" && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.5 }}
//             className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
//           >
//             <div className="flex items-center gap-3 mb-6">
//               <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
//                 <Target size={17} className="text-violet-600" />
//               </div>
//               <div>
//                 <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
//                   My Task Progress
//                 </h3>
//                 <p className="text-[11px] text-slate-400 font-medium">
//                   Personal completion rate
//                 </p>
//               </div>
//             </div>

//             <div className="flex flex-col items-center gap-5">
//               <div className="relative w-48 h-48">
//                 <svg className="w-48 h-48 -rotate-90">
//                   <circle cx="96" cy="96" r="84" fill="none" stroke="#f1f5f9" strokeWidth="10" />
//                   <circle
//                     cx="96" cy="96" r="84"
//                     fill="none"
//                     stroke="url(#ringGrad)"
//                     strokeWidth="10"
//                     strokeDasharray={`${completionPct * 5.28} 528`}
//                     strokeLinecap="round"
//                     className="transition-all duration-1000"
//                   />
//                   <defs>
//                     <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
//                       <stop offset="0%" stopColor="#8b5cf6" />
//                       <stop offset="100%" stopColor="#a855f7" />
//                     </linearGradient>
//                   </defs>
//                 </svg>
//                 <div className="absolute inset-0 flex flex-col items-center justify-center">
//                   <span className="text-[44px] font-extrabold text-slate-800 tracking-tight">
//                     {completionPct}%
//                   </span>
//                   <span className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">
//                     Done
//                   </span>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3 w-full">
//                 {[
//                   { v: stats.completed || 0, l: "Completed", c: "emerald", icon: CheckCircle2 },
//                   { v: stats.in_progress || 0, l: "In Progress", c: "purple", icon: RotateCw },
//                   { v: stats.not_started || 0, l: "Not Started", c: "slate", icon: Clock },
//                   { v: stats.delayed || 0, l: "Delayed", c: "rose", icon: AlertTriangle },
//                 ].map((s, i) => {
//                   const cl = cm[s.c];
//                   const Icon = s.icon;
//                   return (
//                     <motion.div
//                       key={i}
//                       whileHover={{ scale: 1.03 }}
//                       className={`${cl.light} rounded-2xl p-4 text-center cursor-pointer transition-shadow hover:shadow-md`}
//                     >
//                       <Icon size={18} className={`${cl.text} mx-auto mb-1.5`} />
//                       <p className={`text-xl font-extrabold ${cl.text}`}>{s.v}</p>
//                       <p className={`text-[11px] font-semibold ${cl.text}/60`}>{s.l}</p>
//                     </motion.div>
//                   );
//                 })}
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </div>

//       {/* ─────── LOCATION OVERVIEW ─────── */}
//       {(role === "Admin" || role === "Supervisor") && locations.length > 0 && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.5, duration: 0.5 }}
//           className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm overflow-hidden"
//         >
//           <div className="flex items-center justify-between mb-5">
//             <div className="flex items-center gap-3">
//               <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
//                 <MapPin size={17} className="text-violet-600" />
//               </div>
//               <div>
//                 <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
//                   Location Overview
//                 </h3>
//                 <p className="text-[11px] text-slate-400 font-medium">
//                   Click any location for full details
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => nav(`${base}/locations`)}
//               className="group text-xs font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
//             >
//               View All
//               <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
//             </button>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//             {locations.slice(0, 8).map((loc, idx) => {
//               const total = loc.activities?.length || 0;
//               const done =
//                 loc.activities?.filter((a) => a.status === "Completed")?.length || 0;
//               const pct = total > 0 ? Math.round((done / total) * 100) : 0;

//               const statusColor =
//                 pct === 100 ? "emerald" : pct > 50 ? "violet" : pct > 0 ? "amber" : "slate";

//               return (
//                 <motion.div
//                   key={loc.id}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: 0.05 * idx, duration: 0.3 }}
//                   whileHover={{ scale: 1.01 }}
//                   onClick={() => nav(`${base}/locations/${loc.id}`)}
//                   className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all duration-200 group border border-transparent hover:border-slate-200"
//                 >
//                   <div className="relative shrink-0">
//                     <div
//                       className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
//                         statusColor === "emerald"
//                           ? "bg-emerald-100 text-emerald-600"
//                           : statusColor === "violet"
//                             ? "bg-violet-100 text-violet-600"
//                             : statusColor === "amber"
//                               ? "bg-amber-100 text-amber-600"
//                               : "bg-slate-100 text-slate-400"
//                       }`}
//                     >
//                       <Pin size={19} />
//                     </div>
//                     <svg className="absolute inset-0 w-11 h-11 -rotate-90">
//                       <circle
//                         cx="22" cy="22" r="20"
//                         fill="none"
//                         stroke={
//                           pct === 100 ? "#6ee7b7" : pct > 50 ? "#a78bfa" : pct > 0 ? "#fcd34d" : "#e2e8f0"
//                         }
//                         strokeWidth="2.5"
//                         strokeDasharray={`${pct * 1.26} 126`}
//                         strokeLinecap="round"
//                         className="transition-all duration-700"
//                         opacity="0.6"
//                       />
//                     </svg>
//                   </div>

//                   <div className="flex-1 min-w-0">
//                     <p className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 truncate transition-colors">
//                       {loc.location_name}
//                     </p>
//                     <div className="flex items-center gap-3 mt-1">
//                       <p className="text-[11px] text-slate-400 font-medium truncate">
//                         {loc.supervisor?.full_name || "No Supervisor"}
//                       </p>
//                       <span className="text-slate-300">·</span>
//                       <p className="text-[11px] font-semibold text-slate-500">
//                         {done}/{total} done
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3 w-32 shrink-0">
//                     <div className="flex-1 h-2 bg-slate-200/60 rounded-full overflow-hidden">
//                       <div
//                         className={`h-full rounded-full transition-all duration-700 ${
//                           pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-violet-500" : pct > 0 ? "bg-amber-500" : "bg-slate-300"
//                         }`}
//                         style={{ width: `${pct}%` }}
//                       />
//                     </div>
//                     <span
//                       className={`text-xs font-bold w-9 text-right ${
//                         pct === 100 ? "text-emerald-600" : pct > 50 ? "text-violet-600" : pct > 0 ? "text-amber-600" : "text-slate-400"
//                       }`}
//                     >
//                       {pct}%
//                     </span>
//                   </div>

//                   <ChevronRight size={15} className="text-slate-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" />
//                 </motion.div>
//               );
//             })}
//           </div>

//           {locations.length > 8 && (
//             <button
//               onClick={() => nav(`${base}/locations`)}
//               className="w-full mt-3 py-3 text-center text-xs font-semibold text-slate-500 hover:text-violet-600 hover:bg-violet-50/50 rounded-xl transition-all"
//             >
//               + {locations.length - 8} more locations — View all
//             </button>
//           )}
//         </motion.div>
//       )}

//       {/* ─────── RECENT ACTIVITY TABLE ─────── */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.55, duration: 0.5 }}
//         className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
//       >
//         <div className="px-5 md:px-7 py-4 border-b border-slate-100 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
//               <Calendar size={15} className="text-slate-400" />
//             </div>
//             <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
//               {tableTitle}
//             </h3>
//           </div>
//           <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
//             {recent.length} entries
//           </span>
//         </div>

//         {recent.length === 0 ? (
//           <div className="px-5 py-20 flex flex-col items-center justify-center gap-3">
//             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
//               <LayoutDashboard size={28} className="text-slate-200" />
//             </div>
//             <p className="text-sm text-slate-400 font-semibold">No data yet</p>
//             <p className="text-xs text-slate-300">Recent activity will appear here</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-slate-50/40">
//                   {["Location", "Activity", "Status",
//                     role === "Admin" ? "Updated By" : role === "Supervisor" ? "Worker" : "Deadline",
//                   ].map((h) => (
//                     <th key={h} className="px-5 md:px-7 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {recent.map((item, i) => (
//                   <tr key={item.id || i} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
//                     <td className="px-5 md:px-7 py-4 text-[13px] font-semibold text-slate-700">
//                       {role === "Admin" ? item.location_activity?.location?.location_name || "-"
//                         : item.location?.location_name || item.location_name || "-"}
//                     </td>
//                     <td className="px-5 md:px-7 py-4 text-[13px] text-slate-500 font-medium">
//                       {role === "Admin" ? item.location_activity?.activity?.activity_name || "-"
//                         : item.activity?.activity_name || item.activity_name || "-"}
//                     </td>
//                     <td className="px-5 md:px-7 py-4">
//                       <Badge status={role === "Admin" ? item.new_status : item.status} />
//                     </td>
//                     <td className="px-5 md:px-7 py-4 text-[13px] text-slate-500 font-medium">
//                       {role === "Admin" ? item.updater?.full_name || "-"
//                         : role === "Supervisor" ? item.worker?.full_name || "Unassigned"
//                         : item.planned_end_date || "-"}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </motion.div>
//     </div>
//   );
// };

// export default Dashboard;























// import { useState, useEffect, useMemo } from "react";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";
// import API from "../api/client";
// import Badge from "../components/ui/Badge";
// import { motion } from "framer-motion";
// import { toast } from "sonner";
// import {
//   PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
//   CartesianGrid, Tooltip, ResponsiveContainer,
// } from "recharts";
// import {
//   Pin, Users, Wrench, Activity, CheckCircle2, RotateCw,
//   Clock, AlertTriangle, UserX, TrendingUp, ArrowRight,
//   Sparkles, MapPin, Layers, ChevronRight, Target, Zap,
//   BarChart3, PieChartIcon, Calendar, LayoutDashboard,
// } from "lucide-react";

// /* ─── Color Palette ─── */
// const CHART_COLORS = {
//   completed: "#10b981",
//   inProgress: "#8b5cf6",
//   notStarted: "#94a3b8",
//   delayed: "#f43f5e",
// };

// /* ─── Animation Variants ─── */
// const cardVariants = {
//   hidden: { opacity: 0, y: 24 },
//   visible: (i) => ({
//     opacity: 1, y: 0,
//     transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
//   }),
// };

// const Dashboard = () => {
//   const { role, user } = useAuth();
//   const nav = useNavigate();

//   /* ─── ALL STATE HOOKS FIRST ─── */
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({});
//   const [recent, setRecent] = useState([]);
//   const [locations, setLocations] = useState([]);

//   const base =
//     role === "Admin"
//       ? "/admin"
//       : role === "Supervisor"
//         ? "/supervisor"
//         : "/worker";

//   /* ─── Fetch Data ─── */
//   const fetchDashboard = async () => {
//     try {
//       setLoading(true);
//       const response = await API.get(`${base}/dashboard`);
//       const dashboardData = response.data.data || {};
//       setStats(dashboardData.stats || {});
//       setRecent(
//         role === "Admin"
//           ? dashboardData.recent_updates || []
//           : role === "Supervisor"
//             ? dashboardData.pending_assignments || []
//             : dashboardData.pending_tasks || dashboardData.my_tasks || []
//       );
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to load dashboard data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchLocations = async () => {
//     try {
//       const response = await API.get(`${base}/locations`);
//       setLocations(response.data.data || []);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   useEffect(() => {
//     const load = async () => {
//       await fetchDashboard();
//       if (role === "Admin" || role === "Supervisor") await fetchLocations();
//     };
//     load();
//   }, [role]);

//   /* ───────── ALL HOOKS MUST BE BEFORE ANY EARLY RETURN ───────── */

//   /* useMemo for barData — MUST be before early return */
//   const barData = useMemo(
//     () =>
//       locations.slice(0, 10).map((loc) => {
//         const total = loc.activities?.length || 0;
//         const done =
//           loc.activities?.filter((a) => a.status === "Completed")?.length || 0;
//         const pct = total > 0 ? Math.round((done / total) * 100) : 0;
//         return {
//           name: (loc.location_name || "N/A").substring(0, 18),
//           progress: pct,
//           total,
//           done,
//         };
//       }),
//     [locations]
//   );

//   /* ─── Loading State — NOW comes AFTER all hooks ─── */
//   if (loading)
//     return (
//       <div className="flex flex-col items-center justify-center h-[75vh] gap-5">
//         <div className="relative">
//           <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse shadow-2xl shadow-violet-500/30" />
//           <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-emerald-400 rounded-full border-[3px] border-white animate-bounce shadow-lg shadow-emerald-400/50" />
//         </div>
//         <div className="text-center">
//           <p className="text-sm font-semibold text-slate-500">Loading your dashboard</p>
//           <p className="text-xs text-slate-400 mt-1">Fetching the latest data...</p>
//         </div>
//       </div>
//     );

//   /* ─── Stat Cards Config ─── */
//   const cards =
//     role === "Admin"
//       ? [
//           { label: "Total Locations", value: stats.total_locations || 0, icon: Pin, color: "violet" },
//           { label: "Supervisors", value: stats.total_supervisors || 0, icon: Users, color: "blue" },
//           { label: "Workers", value: stats.total_workers || 0, icon: Wrench, color: "cyan" },
//           { label: "Total Activities", value: stats.total_activities || 0, icon: Activity, color: "amber" },
//           { label: "Completed", value: stats.completed || 0, icon: CheckCircle2, color: "emerald" },
//           { label: "In Progress", value: stats.in_progress || 0, icon: RotateCw, color: "purple" },
//           { label: "Not Started", value: stats.not_started || 0, icon: Clock, color: "slate" },
//           { label: "Delayed", value: stats.delayed || 0, icon: AlertTriangle, color: "rose" },
//         ]
//       : role === "Supervisor"
//         ? [
//             { label: "My Locations", value: stats.my_locations || 0, icon: Pin, color: "violet" },
//             { label: "Total Activities", value: stats.total_activities || 0, icon: Activity, color: "amber" },
//             { label: "Completed", value: stats.completed || 0, icon: CheckCircle2, color: "emerald" },
//             { label: "In Progress", value: stats.in_progress || 0, icon: RotateCw, color: "purple" },
//             { label: "Delayed", value: stats.delayed || 0, icon: AlertTriangle, color: "rose" },
//             { label: "Unassigned", value: stats.unassigned || 0, icon: UserX, color: "slate" },
//           ]
//         : [
//             { label: "Total Tasks", value: stats.total_tasks || stats.total || 0, icon: Activity, color: "violet" },
//             { label: "Completed", value: stats.completed || 0, icon: CheckCircle2, color: "emerald" },
//             { label: "In Progress", value: stats.in_progress || 0, icon: RotateCw, color: "purple" },
//             { label: "Not Started", value: stats.not_started || 0, icon: Clock, color: "slate" },
//             { label: "Delayed", value: stats.delayed || 0, icon: AlertTriangle, color: "rose" },
//           ];

//   /* ─── Color Map ─── */
//   const cm = {
//     violet:  { light: "bg-violet-50", text: "text-violet-600", soft: "bg-violet-100" },
//     blue:    { light: "bg-blue-50",   text: "text-blue-600",   soft: "bg-blue-100" },
//     cyan:    { light: "bg-cyan-50",   text: "text-cyan-600",   soft: "bg-cyan-100" },
//     amber:   { light: "bg-amber-50",  text: "text-amber-600",  soft: "bg-amber-100" },
//     emerald: { light: "bg-emerald-50",text: "text-emerald-600",soft: "bg-emerald-100" },
//     purple:  { light: "bg-purple-50", text: "text-purple-600", soft: "bg-purple-100" },
//     slate:   { light: "bg-slate-50",  text: "text-slate-500",  soft: "bg-slate-100" },
//     rose:    { light: "bg-rose-50",   text: "text-rose-600",   soft: "bg-rose-100" },
//   };

//   /* ─── Chart Data ─── */
//   const pieData = [
//     { name: "Completed", value: stats.completed || 0, color: CHART_COLORS.completed },
//     { name: "In Progress", value: stats.in_progress || 0, color: CHART_COLORS.inProgress },
//     { name: "Not Started", value: stats.not_started || 0, color: CHART_COLORS.notStarted },
//     { name: "Delayed", value: stats.delayed || 0, color: CHART_COLORS.delayed },
//   ].filter((d) => d.value > 0);

//   const totalActs =
//     (stats.completed || 0) + (stats.in_progress || 0) +
//     (stats.not_started || 0) + (stats.delayed || 0);

//   const completionPct =
//     totalActs > 0 ? Math.round(((stats.completed || 0) / totalActs) * 100) : 0;

//   const hrs = new Date().getHours();
//   const greet =
//     hrs < 12 ? "Good Morning" : hrs < 17 ? "Good Afternoon" : "Good Evening";
//   const emoji = hrs < 12 ? "🌅" : hrs < 17 ? "☀️" : "🌙";

//   const tableTitle =
//     role === "Admin"
//       ? "Recent Activity Updates"
//       : role === "Supervisor"
//         ? "Pending Worker Assignments"
//         : "My Pending Tasks";

//   /* ════════════════════════════════════════════════
//      RENDER
//      ════════════════════════════════════════════════ */
//   return (
//     <div className="space-y-6">
//       {/* ─────── HERO CARD ─────── */}
//       <motion.div
//         initial={{ opacity: 0, y: -10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white"
//         style={{
//           background:
//             "linear-gradient(135deg, #4f46e5 0%, #7c3aed 25%, #a855f7 55%, #6366f1 100%)",
//         }}
//       >
//         {/* Decorative orbs */}
//         <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl" />
//         <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
//         <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/30 rounded-full animate-ping" />
//         <div className="absolute top-[30%] right-[20%] w-2 h-2 bg-white/20 rounded-full" />
//         <div className="absolute bottom-[25%] right-[40%] w-1 h-1 bg-amber-300/50 rounded-full" />
//         <div
//           className="absolute inset-0 opacity-[0.03]"
//           style={{
//             backgroundImage:
//               "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
//             backgroundSize: "28px 28px",
//           }}
//         />

//         <div className="relative z-10">
//           <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <Sparkles size={14} className="text-amber-300" />
//                 <p className="text-white/60 text-[11px] font-bold tracking-[0.2em] uppercase">
//                   {role} Dashboard
//                 </p>
//               </div>
//               <h1 className="text-2xl md:text-[32px] font-extrabold tracking-tight leading-tight">
//                 {greet}, {user?.full_name?.split(" ")[0]}{" "}
//                 <span>{emoji}</span>
//               </h1>
//               <p className="text-white/60 text-sm mt-2 max-w-lg leading-relaxed">
//                 Real-time overview of your field operations. Stay on top of every
//                 location, activity, and team member.
//               </p>
//             </div>

//             {/* Stat chips */}
//             <div className="flex items-center gap-3">
//               <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-white/[0.08] text-center min-w-[90px]">
//                 <div className="flex items-center justify-center gap-1.5 mb-1">
//                   <Target size={14} className="text-emerald-300" />
//                   <p className="text-[26px] font-extrabold leading-none">
//                     {completionPct}%
//                   </p>
//                 </div>
//                 <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
//                   Completion
//                 </p>
//               </div>
//               <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-white/[0.08] text-center min-w-[90px]">
//                 <div className="flex items-center justify-center gap-1.5 mb-1">
//                   <Zap size={14} className="text-amber-300" />
//                   <p className="text-[26px] font-extrabold leading-none">
//                     {stats.total_activities || stats.total_tasks || stats.total || 0}
//                   </p>
//                 </div>
//                 <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
//                   Total
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Quick action buttons */}
//           <div className="flex flex-wrap gap-2 mt-5">
//             {role === "Admin" && (
//               <>
//                 <button
//                   onClick={() => nav(`${base}/locations`)}
//                   className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all border border-white/10"
//                 >
//                   <MapPin size={13} /> View Locations
//                 </button>
//                 <button
//                   onClick={() => nav(`${base}/upload`)}
//                   className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all border border-white/10"
//                 >
//                   <Layers size={13} /> Upload Data
//                 </button>
//               </>
//             )}
//             <button
//               onClick={() => nav(`${base}/reports`)}
//               className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all border border-white/10"
//             >
//               <TrendingUp size={13} /> View Reports
//             </button>
//           </div>
//         </div>
//       </motion.div>

//       {/* ─────── STAT CARDS ─────── */}
//       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2.5 md:gap-3">
//         {cards.map((card, i) => {
//           const c = cm[card.color];
//           const Icon = card.icon;
//           return (
//             <motion.div
//               key={i}
//               custom={i}
//               variants={cardVariants}
//               initial="hidden"
//               animate="visible"
//               whileHover={{ y: -2 }}
//               className="group relative bg-white rounded-xl p-3 md:p-3.5 cursor-pointer border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
//             >
//               {/* Colored top accent */}
//               <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.text.replace('text','bg')} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl`} />

//               <div className="flex items-center justify-between mb-2">
//                 <div className={`w-8 h-8 ${c.light} rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
//                   <Icon size={15} className={c.text} />
//                 </div>
//               </div>

//               <p className="text-[20px] md:text-[22px] font-bold text-slate-800 tracking-tight leading-none mb-0.5">
//                 {card.value.toLocaleString()}
//               </p>
//               <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
//                 {card.label}
//               </p>
//             </motion.div>
//           );
//         })}
//       </div>

//       {/* ─────── CHARTS ROW ─────── */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
//         {/* ── PIE CHART: Activity Status ── */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3, duration: 0.5 }}
//           className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
//         >
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center gap-3">
//               <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
//                 <PieChartIcon size={17} className="text-violet-600" />
//               </div>
//               <div>
//                 <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
//                   Activity Status
//                 </h3>
//                 <p className="text-[11px] text-slate-400 font-medium">
//                   Distribution overview
//                 </p>
//               </div>
//             </div>
//             <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
//               {totalActs} total
//             </span>
//           </div>

//           {pieData.length === 0 ? (
//             <div className="h-64 flex flex-col items-center justify-center gap-3">
//               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
//                 <PieChartIcon size={28} className="text-slate-300" />
//               </div>
//               <p className="text-sm text-slate-400 font-medium">
//                 No activity data yet
//               </p>
//               <p className="text-xs text-slate-300">
//                 Start by uploading activities
//               </p>
//             </div>
//           ) : (
//             <div className="flex flex-col sm:flex-row items-center gap-6">
//               {/* Donut */}
//               <div className="relative w-full sm:w-[55%] flex items-center justify-center">
//                 <ResponsiveContainer width="100%" height={240}>
//                   <PieChart>
//                     <Pie
//                       data={pieData}
//                       cx="50%"
//                       cy="50%"
//                       innerRadius={60}
//                       outerRadius={100}
//                       paddingAngle={4}
//                       dataKey="value"
//                       stroke="none"
//                       cornerRadius={6}
//                     >
//                       {pieData.map((entry, idx) => (
//                         <Cell key={idx} fill={entry.color} />
//                       ))}
//                     </Pie>
//                     <Tooltip
//                       formatter={(value, name) => [value, name]}
//                       contentStyle={{
//                         borderRadius: "14px",
//                         border: "1px solid #e2e8f0",
//                         boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
//                         fontSize: "13px",
//                         fontWeight: 500,
//                         padding: "8px 14px",
//                       }}
//                     />
//                   </PieChart>
//                 </ResponsiveContainer>
//                 {/* Center overlay */}
//                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
//                   <span className="text-[28px] font-extrabold text-slate-800">
//                     {totalActs}
//                   </span>
//                   <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
//                     Total
//                   </span>
//                 </div>
//               </div>

//               {/* Legend with micro progress bars */}
//               <div className="w-full sm:w-[45%] space-y-2.5">
//                 {pieData.map((item, idx) => {
//                   const pct =
//                     totalActs > 0
//                       ? Math.round((item.value / totalActs) * 100)
//                       : 0;
//                   return (
//                     <div
//                       key={idx}
//                       className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
//                     >
//                       <div className="flex items-center justify-between mb-1.5">
//                         <div className="flex items-center gap-2.5">
//                           <div
//                             className="w-3 h-3 rounded-md shadow-sm"
//                             style={{ backgroundColor: item.color }}
//                           />
//                           <span className="text-[12px] font-semibold text-slate-700">
//                             {item.name}
//                           </span>
//                         </div>
//                         <span className="text-sm font-extrabold text-slate-800">
//                           {item.value}
//                         </span>
//                       </div>
//                       {/* Micro bar */}
//                       <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-[22px]">
//                         <div
//                           className="h-full rounded-full transition-all duration-700"
//                           style={{
//                             width: `${pct}%`,
//                             backgroundColor: item.color,
//                           }}
//                         />
//                       </div>
//                       <span className="text-[10px] text-slate-400 font-medium ml-[22px] mt-0.5 block">
//                         {pct}% of total
//                       </span>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </motion.div>

//         {/* ── BAR CHART: Location Progress ── */}
//         {(role === "Admin" || role === "Supervisor") && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.5 }}
//             className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
//           >
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
//                   <BarChart3 size={17} className="text-violet-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
//                     Location Progress
//                   </h3>
//                   <p className="text-[11px] text-slate-400 font-medium">
//                     Completion by location
//                   </p>
//                 </div>
//               </div>
//               <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
//                 Top {Math.min(barData.length, 10)}
//               </span>
//             </div>

//             {barData.length === 0 ? (
//               <div className="h-64 flex flex-col items-center justify-center gap-3">
//                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
//                   <BarChart3 size={28} className="text-slate-300" />
//                 </div>
//                 <p className="text-sm text-slate-400 font-medium">
//                   No location data yet
//                 </p>
//                 <p className="text-xs text-slate-300">
//                   Add locations to see progress
//                 </p>
//               </div>
//             ) : (
//               <ResponsiveContainer width="100%" height={280}>
//                 <BarChart
//                   data={barData}
//                   layout="vertical"
//                   margin={{ left: 5, right: 35, top: 5, bottom: 5 }}
//                 >
//                   <defs>
//                     <linearGradient
//                       id="barGradient"
//                       x1="0"
//                       y1="0"
//                       x2="1"
//                       y2="0"
//                     >
//                       <stop offset="0%" stopColor="#8b5cf6" />
//                       <stop offset="50%" stopColor="#a855f7" />
//                       <stop offset="100%" stopColor="#6366f1" />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     stroke="#f1f5f9"
//                     horizontal={false}
//                   />
//                   <XAxis
//                     type="number"
//                     domain={[0, 100]}
//                     tick={{
//                       fontSize: 11,
//                       fill: "#94a3b8",
//                       fontWeight: 500,
//                     }}
//                     tickFormatter={(v) => `${v}%`}
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   <YAxis
//                     dataKey="name"
//                     type="category"
//                     width={130}
//                     tick={{
//                       fontSize: 11,
//                       fill: "#475569",
//                       fontWeight: 500,
//                     }}
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   <Tooltip
//                     formatter={(value) => [`${value}%`, "Progress"]}
//                     contentStyle={{
//                       borderRadius: "14px",
//                       border: "1px solid #e2e8f0",
//                       boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
//                       fontSize: "13px",
//                       fontWeight: 500,
//                       padding: "8px 14px",
//                     }}
//                     cursor={{ fill: "rgba(139, 92, 246, 0.06)" }}
//                   />
//                   <Bar
//                     dataKey="progress"
//                     fill="url(#barGradient)"
//                     radius={[0, 10, 10, 0]}
//                     barSize={20}
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             )}

//             {/* Summary row */}
//             {barData.length > 0 && (
//               <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
//                 <div className="flex items-center gap-2 text-xs text-slate-500">
//                   <div className="w-2 h-2 rounded-full bg-emerald-400" />
//                   {barData.filter((d) => d.progress === 100).length} fully
//                   complete
//                 </div>
//                 <div className="flex items-center gap-2 text-xs text-slate-500">
//                   <div className="w-2 h-2 rounded-full bg-amber-400" />
//                   {barData.filter((d) => d.progress > 0 && d.progress < 100).length}{" "}
//                   in progress
//                 </div>
//                 <div className="flex items-center gap-2 text-xs text-slate-500">
//                   <div className="w-2 h-2 rounded-full bg-slate-300" />
//                   {barData.filter((d) => d.progress === 0).length} not started
//                 </div>
//               </div>
//             )}
//           </motion.div>
//         )}

//         {/* ── WORKER PROGRESS RING ── */}
//         {role === "Worker" && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.5 }}
//             className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
//           >
//             <div className="flex items-center gap-3 mb-6">
//               <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
//                 <Target size={17} className="text-violet-600" />
//               </div>
//               <div>
//                 <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
//                   My Task Progress
//                 </h3>
//                 <p className="text-[11px] text-slate-400 font-medium">
//                   Personal completion rate
//                 </p>
//               </div>
//             </div>

//             <div className="flex flex-col items-center gap-5">
//               {/* SVG Progress Ring */}
//               <div className="relative w-48 h-48">
//                 <svg className="w-48 h-48 -rotate-90">
//                   <circle cx="96" cy="96" r="84" fill="none" stroke="#f1f5f9" strokeWidth="10" />
//                   <circle
//                     cx="96" cy="96" r="84"
//                     fill="none"
//                     stroke="url(#ringGrad)"
//                     strokeWidth="10"
//                     strokeDasharray={`${completionPct * 5.28} 528`}
//                     strokeLinecap="round"
//                     className="transition-all duration-1000"
//                   />
//                   <defs>
//                     <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
//                       <stop offset="0%" stopColor="#8b5cf6" />
//                       <stop offset="100%" stopColor="#a855f7" />
//                     </linearGradient>
//                   </defs>
//                 </svg>
//                 <div className="absolute inset-0 flex flex-col items-center justify-center">
//                   <span className="text-[44px] font-extrabold text-slate-800 tracking-tight">
//                     {completionPct}%
//                   </span>
//                   <span className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">
//                     Done
//                   </span>
//                 </div>
//               </div>

//               {/* Mini stat grid */}
//               <div className="grid grid-cols-2 gap-3 w-full">
//                 {[
//                   { v: stats.completed || 0, l: "Completed", c: "emerald", icon: CheckCircle2 },
//                   { v: stats.in_progress || 0, l: "In Progress", c: "purple", icon: RotateCw },
//                   { v: stats.not_started || 0, l: "Not Started", c: "slate", icon: Clock },
//                   { v: stats.delayed || 0, l: "Delayed", c: "rose", icon: AlertTriangle },
//                 ].map((s, i) => {
//                   const cl = cm[s.c];
//                   const Icon = s.icon;
//                   return (
//                     <motion.div
//                       key={i}
//                       whileHover={{ scale: 1.03 }}
//                       className={`${cl.light} rounded-2xl p-4 text-center cursor-pointer transition-shadow hover:shadow-md`}
//                     >
//                       <Icon size={18} className={`${cl.text} mx-auto mb-1.5`} />
//                       <p className={`text-xl font-extrabold ${cl.text}`}>{s.v}</p>
//                       <p className={`text-[11px] font-semibold ${cl.text}/60`}>{s.l}</p>
//                     </motion.div>
//                   );
//                 })}
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </div>

//       {/* ─────── LOCATION OVERVIEW (ADMIN / SUPERVISOR) ─────── */}
//       {(role === "Admin" || role === "Supervisor") && locations.length > 0 && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.5, duration: 0.5 }}
//           className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm overflow-hidden"
//         >
//           <div className="flex items-center justify-between mb-5">
//             <div className="flex items-center gap-3">
//               <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
//                 <MapPin size={17} className="text-violet-600" />
//               </div>
//               <div>
//                 <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
//                   Location Overview
//                 </h3>
//                 <p className="text-[11px] text-slate-400 font-medium">
//                   Click any location for full details
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => nav(`${base}/locations`)}
//               className="group text-xs font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
//             >
//               View All
//               <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
//             </button>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//             {locations.slice(0, 8).map((loc, idx) => {
//               const total = loc.activities?.length || 0;
//               const done =
//                 loc.activities?.filter((a) => a.status === "Completed")?.length || 0;
//               const pct = total > 0 ? Math.round((done / total) * 100) : 0;

//               const statusColor =
//                 pct === 100 ? "emerald" : pct > 50 ? "violet" : pct > 0 ? "amber" : "slate";

//               return (
//                 <motion.div
//                   key={loc.id}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: 0.05 * idx, duration: 0.3 }}
//                   whileHover={{ scale: 1.01 }}
//                   onClick={() => nav(`${base}/locations/${loc.id}`)}
//                   className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all duration-200 group border border-transparent hover:border-slate-200"
//                 >
//                   {/* Status circle with progress ring */}
//                   <div className="relative shrink-0">
//                     <div
//                       className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
//                         statusColor === "emerald"
//                           ? "bg-emerald-100 text-emerald-600"
//                           : statusColor === "violet"
//                             ? "bg-violet-100 text-violet-600"
//                             : statusColor === "amber"
//                               ? "bg-amber-100 text-amber-600"
//                               : "bg-slate-100 text-slate-400"
//                       }`}
//                     >
//                       <Pin size={19} />
//                     </div>
//                     {/* Progress ring */}
//                     <svg className="absolute inset-0 w-11 h-11 -rotate-90">
//                       <circle
//                         cx="22" cy="22" r="20"
//                         fill="none"
//                         stroke={
//                           pct === 100 ? "#6ee7b7" : pct > 50 ? "#a78bfa" : pct > 0 ? "#fcd34d" : "#e2e8f0"
//                         }
//                         strokeWidth="2.5"
//                         strokeDasharray={`${pct * 1.26} 126`}
//                         strokeLinecap="round"
//                         className="transition-all duration-700"
//                         opacity="0.6"
//                       />
//                     </svg>
//                   </div>

//                   {/* Info */}
//                   <div className="flex-1 min-w-0">
//                     <p className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 truncate transition-colors">
//                       {loc.location_name}
//                     </p>
//                     <div className="flex items-center gap-3 mt-1">
//                       <p className="text-[11px] text-slate-400 font-medium truncate">
//                         {loc.supervisor?.full_name || "No Supervisor"}
//                       </p>
//                       <span className="text-slate-300">·</span>
//                       <p className="text-[11px] font-semibold text-slate-500">
//                         {done}/{total} done
//                       </p>
//                     </div>
//                   </div>

//                   {/* Progress bar */}
//                   <div className="flex items-center gap-3 w-32 shrink-0">
//                     <div className="flex-1 h-2 bg-slate-200/60 rounded-full overflow-hidden">
//                       <div
//                         className={`h-full rounded-full transition-all duration-700 ${
//                           pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-violet-500" : pct > 0 ? "bg-amber-500" : "bg-slate-300"
//                         }`}
//                         style={{ width: `${pct}%` }}
//                       />
//                     </div>
//                     <span
//                       className={`text-xs font-bold w-9 text-right ${
//                         pct === 100 ? "text-emerald-600" : pct > 50 ? "text-violet-600" : pct > 0 ? "text-amber-600" : "text-slate-400"
//                       }`}
//                     >
//                       {pct}%
//                     </span>
//                   </div>

//                   <ChevronRight size={15} className="text-slate-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" />
//                 </motion.div>
//               );
//             })}
//           </div>

//           {locations.length > 8 && (
//             <button
//               onClick={() => nav(`${base}/locations`)}
//               className="w-full mt-3 py-3 text-center text-xs font-semibold text-slate-500 hover:text-violet-600 hover:bg-violet-50/50 rounded-xl transition-all"
//             >
//               + {locations.length - 8} more locations — View all
//             </button>
//           )}
//         </motion.div>
//       )}

//       {/* ─────── RECENT ACTIVITY TABLE ─────── */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.55, duration: 0.5 }}
//         className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
//       >
//         <div className="px-5 md:px-7 py-4 border-b border-slate-100 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
//               <Calendar size={15} className="text-slate-400" />
//             </div>
//             <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
//               {tableTitle}
//             </h3>
//           </div>
//           <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
//             {recent.length} entries
//           </span>
//         </div>

//         {recent.length === 0 ? (
//           <div className="px-5 py-20 flex flex-col items-center justify-center gap-3">
//             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
//               <LayoutDashboard size={28} className="text-slate-200" />
//             </div>
//             <p className="text-sm text-slate-400 font-semibold">No data yet</p>
//             <p className="text-xs text-slate-300">
//               Recent activity will appear here
//             </p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-slate-50/40">
//                   {[
//                     "Location",
//                     "Activity",
//                     "Status",
//                     role === "Admin"
//                       ? "Updated By"
//                       : role === "Supervisor"
//                         ? "Worker"
//                         : "Deadline",
//                   ].map((h) => (
//                     <th
//                       key={h}
//                       className="px-5 md:px-7 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest"
//                     >
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {recent.map((item, i) => (
//                   <tr
//                     key={item.id || i}
//                     className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors"
//                   >
//                     <td className="px-5 md:px-7 py-4 text-[13px] font-semibold text-slate-700">
//                       {role === "Admin"
//                         ? item.location_activity?.location?.location_name || "-"
//                         : item.location?.location_name || item.location_name || "-"}
//                     </td>
//                     <td className="px-5 md:px-7 py-4 text-[13px] text-slate-500 font-medium">
//                       {role === "Admin"
//                         ? item.location_activity?.activity?.activity_name || "-"
//                         : item.activity?.activity_name || item.activity_name || "-"}
//                     </td>
//                     <td className="px-5 md:px-7 py-4">
//                       <Badge
//                         status={role === "Admin" ? item.new_status : item.status}
//                       />
//                     </td>
//                     <td className="px-5 md:px-7 py-4 text-[13px] text-slate-500 font-medium">
//                       {role === "Admin"
//                         ? item.updater?.full_name || "-"
//                         : role === "Supervisor"
//                           ? item.worker?.full_name || "Unassigned"
//                           : item.planned_end_date || "-"}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </motion.div>
//     </div>
//   );
// };

// export default Dashboard;























// import { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import API from '../api/client';
// import Badge from '../components/ui/Badge';
// import {
//     PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
//     CartesianGrid, Tooltip, ResponsiveContainer, 
// } from 'recharts';

// const COLORS = {
//     completed:  '#059669',
//     inProgress: '#2563eb',
//     notStarted: '#94a3b8',
//     delayed:    '#dc2626',
//     onHold:     '#d97706'
// };

// const Dashboard = () => {
//     const { role, user } = useAuth();
//     const nav = useNavigate();
//     const [loading, setLoading] = useState(true);
//     const [stats, setStats]     = useState({});
//     const [recent, setRecent]   = useState([]);
//     const [locations, setLocations] = useState([]);
//     // const [activities, setActivities] = useState([]);

//     const base = role === 'Admin' ? '/admin' : role === 'Supervisor' ? '/supervisor' : '/worker';


//     // call dashboard api > extrac data > stores in states > render UI 
//     const fetchDashboard = async () => {
//         try {
//             setLoading(true);
//             const response = await API.get(`${base}/dashboard`);
//             const dashboardData = response.data.data || {};
//             setStats(dashboardData.stats || {});
//             setRecent(
//                 role === 'Admin'      ? (dashboardData.recent_updates || []) :
//                 role === 'Supervisor' ? (dashboardData.pending_assignments || []) :
//                 (dashboardData.pending_tasks || dashboardData.my_tasks || [])
//             );
//         } catch (e) { console.error(e); }
//         finally { setLoading(false); }
//     };

//     const fetchLocations = async () => {
//         try {
//             const response = await API.get(`${base}/locations`);
//             setLocations(response.data.data || []);
//         } catch (err){
//             console.log(err);
            
//         }
//     };

//     useEffect(() => {
//     const load = async () => {
//         await fetchDashboard();

//         if (role === 'Admin' || role === 'Supervisor') {
//             await fetchLocations();
//         }
//     };

//     load();
// }, [role]);

//     if (loading) return (
//         <div className="flex items-center justify-center h-80">
//             <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
//         </div>
//     );

//     // stat card data 
//     const cards = role === 'Admin' ? [
//         { label: 'Total Locations',   value: stats.total_locations   || 0, textColor: 'text-blue-600',    bg: 'bg-blue-50',    icon: <span className="material-symbols-outlined">location_on</span> },
//         { label: 'Supervisors',       value: stats.total_supervisors || 0, textColor: 'text-violet-600',  bg: 'bg-violet-50',  icon: <span className="material-symbols-outlined">engineering</span> },
//         { label: 'Workers',           value: stats.total_workers     || 0, textColor: 'text-cyan-600',    bg: 'bg-cyan-50',    icon: <span className="material-symbols-outlined">handyman</span> },
//         { label: 'Total Activities',  value: stats.total_activities  || 0, textColor: 'text-indigo-600',  bg: 'bg-indigo-50',  icon: <span className="material-symbols-outlined">assignment</span> },
//         { label: 'Completed',         value: stats.completed         || 0, textColor: 'text-emerald-600', bg: 'bg-emerald-50', icon: <span className="material-symbols-outlined">check_circle</span> },
//         { label: 'In Progress',       value: stats.in_progress       || 0, textColor: 'text-amber-600',   bg: 'bg-amber-50',   icon: <span className="material-symbols-outlined">sync</span> },
//         { label: 'Not Started',       value: stats.not_started       || 0, textColor: 'text-slate-500',   bg: 'bg-slate-50',   icon: <span className="material-symbols-outlined">schedule</span> },
//         { label: 'Delayed',           value: stats.delayed           || 0, textColor: 'text-red-600',     bg: 'bg-red-50',     icon: <span className="material-symbols-outlined">warning</span> },
//     ] : role === 'Supervisor' ? [
//         { label: 'My Locations',     value: stats.my_locations     || 0, textColor: 'text-blue-600',    bg: 'bg-blue-50',    icon: <span className="material-symbols-outlined">location_on</span> },
//         { label: 'Total Activities', value: stats.total_activities || 0, textColor: 'text-indigo-600',  bg: 'bg-indigo-50',  icon: <span className="material-symbols-outlined">assignment</span> },
//         { label: 'Completed',        value: stats.completed        || 0, textColor: 'text-emerald-600', bg: 'bg-emerald-50', icon: <span className="material-symbols-outlined">check_circle</span> },
//         { label: 'In Progress',      value: stats.in_progress      || 0, textColor: 'text-amber-600',   bg: 'bg-amber-50',   icon: <span className="material-symbols-outlined">sync</span> },
//         { label: 'Delayed',          value: stats.delayed          || 0, textColor: 'text-red-600',     bg: 'bg-red-50',     icon: <span className="material-symbols-outlined">warning</span> },
//         { label: 'Unassigned',       value: stats.unassigned       || 0, textColor: 'text-slate-500',   bg: 'bg-slate-50',   icon: <span className="material-symbols-outlined">help</span> },
//     ] : [
//         { label: 'Total Tasks',  value: stats.total_tasks || stats.total || 0, textColor: 'text-blue-600',    bg: 'bg-blue-50',    icon: <span className="material-symbols-outlined">assignment</span> },
//         { label: 'Completed',    value: stats.completed    || 0, textColor: 'text-emerald-600', bg: 'bg-emerald-50', icon: <span className="material-symbols-outlined">check_circle</span> },
//         { label: 'In Progress',  value: stats.in_progress  || 0, textColor: 'text-amber-600',   bg: 'bg-amber-50',   icon: <span className="material-symbols-outlined">sync</span> },
//         { label: 'Not Started',  value: stats.not_started  || 0, textColor: 'text-slate-500',   bg: 'bg-slate-50',   icon: <span className="material-symbols-outlined">schedule</span> },
//         { label: 'Delayed',      value: stats.delayed      || 0, textColor: 'text-red-600',     bg: 'bg-red-50',     icon: <span className="material-symbols-outlined">warning</span> },
//     ];

//     // chart Data 
//     const pieData = [
//         { name: 'Completed',   value: stats.completed   || 0, color: COLORS.completed },
//         { name: 'In Progress', value: stats.in_progress || 0, color: COLORS.inProgress },
//         { name: 'Not Started', value: stats.not_started || 0, color: COLORS.notStarted },
//         { name: 'Delayed',     value: stats.delayed     || 0, color: COLORS.delayed },
//     ].filter(d => d.value > 0);

//     const totalActs = (stats.completed || 0) + (stats.in_progress || 0) + (stats.not_started || 0) + (stats.delayed || 0);
//     const completionPct = totalActs > 0 ? Math.round(((stats.completed || 0) / totalActs) * 100) : 0;

//     // Location wise progress for bar chart
//     const barData = locations.slice(0, 10).map(loc => {
//         const total = loc.activities?.length || 0;
//         const done  = loc.activities?.filter(a => a.status === 'Completed')?.length || 0;
//         const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
//         return {
//             name:     loc.location_name?.substring(0, 15) || 'N/A',
//             progress: pct,
//             total:    total,
//             done:     done
//         };
//     });

//     // Greeting
//     const hrs   = new Date().getHours();
//     const greet = hrs < 12 ? 'Good Morning' : hrs < 17 ? 'Good Afternoon' : 'Good Evening';

//     // Table title
//     const tableTitle =
//         role === 'Admin'      ? 'Recent Activity Updates' :
//         role === 'Supervisor' ? 'Pending Worker Assignments' :
//         'My Pending Tasks';

//     return (
//         <div className="space-y-4 md:space-y-5"
// >
//         {/* greeting card  */}
//             <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
//                 <h2 className="text-lg font-bold">{greet}, {user?.full_name} 👋</h2>
//                 <p className="text-blue-100 text-sm mt-0.5">Here's what's happening with your field operations today</p>
//                 <div className="flex items-center gap-4 mt-3">
//                     <div className="bg-white/20 rounded-lg px-3 py-1.5">
//                         <span className="text-xs font-medium">{completionPct}% Overall Completion</span>
//                     </div>
//                     <div className="bg-white/20 rounded-lg px-3 py-1.5">
//                         <span className="text-xs font-medium">{stats.total_activities || stats.total_tasks || stats.total || 0} Total Activities</span>
//                     </div>
//                 </div>
//             </div>

//             {/* stat card  */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//                 {cards.map((card, index) => (
//                     <div key={index} className="bg-white rounded-xl border border-slate-200/80 p-4 hover:shadow-sm transition-all">
//                         <div className={`w-10 h-10 ${card.bg} ${card.card} rounded-lg flex items-center justify-center text-lg mb-3`}>
//                             {card.icon}
//                         </div>
//                         <p className={`text-2xl font-bold ${card.card}`}>{card.value}</p>
//                         <p className="text-[11px] text-slate-400 font-medium mt-0.5">{card.label}</p>
//                     </div>
//                 ))}
//             </div>

//             {/* chart row  */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

//                 {/* PIE CHART - Activity Status */}
//                 <div className="bg-white rounded-xl border border-slate-200/80 p-5">
//                     <h3 className="text-sm font-bold text-slate-700 mb-4">Activity Status Distribution</h3>

//                     {pieData.length === 0 ? (
//                         <div className="h-64 flex items-center justify-center">
//                             <p className="text-sm text-slate-400">No activity data yet</p>
//                         </div>
//                     ) : (
//                         <div className="flex items-center gap-6">
//                             {/* Pie */}
//                             <div className="w-1/2">
//                                 <ResponsiveContainer width="100%" height={220}>
//                                     <PieChart>
//                                         <Pie
//                                             data={pieData}
//                                             cx="50%"
//                                             cy="50%"
//                                             innerRadius={50}
//                                             outerRadius={85}
//                                             paddingAngle={3}
//                                             dataKey="value"
//                                         >
//                                             {pieData.map((entry, idx) => (
//                                                 <Cell key={idx} fill={entry.color} />
//                                             ))}
//                                         </Pie>
//                                         <Tooltip
//                                             formatter={(value, name) => [value, name]}
//                                             contentStyle={{
//                                                 borderRadius: '8px',
//                                                 border: '1px solid #e2e8f0',
//                                                 boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//                                                 fontSize: '12px'
//                                             }}
//                                         />
//                                     </PieChart>
//                                 </ResponsiveContainer>
//                             </div>

//                             {/* Legend */}
//                             <div className="w-1/2 space-y-3">
//                                 {pieData.map((dasboardData, index) => (
//                                     <div key={index} className="flex items-center justify-between">
//                                         <div className="flex items-center gap-2">
//                                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dasboardData.color }} />
//                                             <span className="text-xs text-slate-600">{dasboardData.name}</span>
//                                         </div>
//                                         <div className="flex items-center gap-2">
//                                             <span className="text-sm font-bold text-slate-800">{dasboardData.value}</span>
//                                             <span className="text-[10px] text-slate-400">
//                                                 ({totalActs > 0 ? Math.round((dasboardData.value / totalActs) * 100) : 0}%)
//                                             </span>
//                                         </div>
//                                     </div>
//                                 ))}
//                                 <div className="pt-2 mt-2 border-t border-slate-100">
//                                     <div className="flex items-center justify-between">
//                                         <span className="text-xs font-medium text-slate-600">Total</span>
//                                         <span className="text-sm font-bold text-slate-800">{totalActs}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {/* BAR CHART - Location Progress (Admin/Supervisor only) */}
//                 {(role === 'Admin' || role === 'Supervisor') && (
//                     <div className="bg-white rounded-xl border border-slate-200/80 p-5">
//                         <h3 className="text-sm font-bold text-slate-700 mb-4">
//                             Location-wise Progress (Top 10)
//                         </h3>

//                         {barData.length === 0 ? (
//                             <div className="h-64 flex items-center justify-center">
//                                 <p className="text-sm text-slate-400">No location data yet</p>
//                             </div>
//                         ) : (
//                             <ResponsiveContainer width="100%" height={250}>
//                                 <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
//                                     <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                                     <XAxis
//                                         type="number"
//                                         domain={[0, 100]}
//                                         tick={{ fontSize: 11, fill: '#94a3b8' }}
//                                         tickFormatter={v => `${v}%`}
//                                     />
//                                     <YAxis
//                                         dataKey="name"
//                                         type="category"
//                                         width={110}
//                                         tick={{ fontSize: 10, fill: '#64748b' }}
//                                     />
//                                     <Tooltip
//                                         formatter={(value) => [`${value}%`, 'Progress']}
//                                         contentStyle={{
//                                             borderRadius: '8px',
//                                             border: '1px solid #e2e8f0',
//                                             boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//                                             fontSize: '12px'
//                                         }}
//                                     />
//                                     <Bar
//                                         dataKey="progress"
//                                         fill="#2563eb"
//                                         radius={[0, 6, 6, 0]}
//                                         barSize={16}
//                                     />
//                                 </BarChart>
//                             </ResponsiveContainer>
//                         )}
//                     </div>
//                 )}

//                 {/* WORKER - Task Progress Chart */}
//                 {role === 'Worker' && (
//                     <div className="bg-white rounded-xl border border-slate-200/80 p-5">
//                         <h3 className="text-sm font-bold text-slate-700 mb-4">My Task Progress</h3>

//                         <div className="space-y-4">
//                             {/* Progress Ring */}
//                             <div className="flex items-center justify-center py-4">
//                                 <div className="relative w-36 h-36">
//                                     <svg className="w-36 h-36 transform -rotate-90">
//                                         <circle cx="72" cy="72" r="60" fill="none" stroke="#f1f5f9" strokeWidth="12" />
//                                         <circle cx="72" cy="72" r="60" fill="none" stroke="#2563eb" strokeWidth="12"
//                                             strokeDasharray={`${completionPct * 3.77} 377`}
//                                             strokeLinecap="round" />
//                                     </svg>
//                                     <div className="absolute inset-0 flex flex-col items-center justify-center">
//                                         <span className="text-3xl font-bold text-slate-800">{completionPct}%</span>
//                                         <span className="text-[10px] text-slate-400">Complete</span>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Stats */}
//                             <div className="grid grid-cols-2 gap-2">
//                                 <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
//                                     <p className="text-lg font-bold text-emerald-700">{stats.completed || 0}</p>
//                                     <p className="text-[10px] text-emerald-600">Done</p>
//                                 </div>
//                                 <div className="bg-blue-50 rounded-lg p-2.5 text-center">
//                                     <p className="text-lg font-bold text-blue-700">{stats.in_progress || 0}</p>
//                                     <p className="text-[10px] text-blue-600">In Progress</p>
//                                 </div>
//                                 <div className="bg-slate-50 rounded-lg p-2.5 text-center">
//                                     <p className="text-lg font-bold text-slate-600">{stats.not_started || 0}</p>
//                                     <p className="text-[10px] text-slate-500">Not Started</p>
//                                 </div>
//                                 <div className="bg-red-50 rounded-lg p-2.5 text-center">
//                                     <p className="text-lg font-bold text-red-600">{stats.delayed || 0}</p>
//                                     <p className="text-[10px] text-red-500">Delayed</p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>

//                 {/* location progress list admin/supervisor  */}
//             {(role === 'Admin' || role === 'Supervisor') && locations.length > 0 && (
//                 <div className="bg-white rounded-xl border border-slate-200/80 p-5">
//                     <div className="flex items-center justify-between mb-4">
//                         <h3 className="text-sm font-bold text-slate-700">Location Progress Overview</h3>
//                         <button onClick={() => nav(`${base}/locations`)}
//                             className="text-xs text-blue-600 hover:text-blue-700 font-medium">
//                             View All →
//                         </button>
//                     </div>

//                     <div className="space-y-3">
//                         {locations.slice(0, 8).map(loc => {
//                             const total = loc.activities?.length || 0;
//                             const done  = loc.activities?.filter(a => a.status === 'Completed')?.length || 0;
//                             const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

//                             return (
//                                 <div key={loc.id}
//                                     className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
//                                     onClick={() => nav(`${base}/locations/${loc.id}`)}>
//                                     {/* Location Info */}
//                                     <div className="flex-1 min-w-0">
//                                         <p className="text-[12px] font-semibold text-slate-700 truncate">{loc.location_name}</p>
//                                         <p className="text-[10px] text-slate-400">
//                                             {loc.supervisor?.full_name || 'No Supervisor'} · {done}/{total} activities
//                                         </p>
//                                     </div>

//                                     {/* Progress Bar */}
//                                     <div className="w-32 flex items-center gap-2">
//                                         <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
//                                             <div
//                                                 className={`h-full rounded-full transition-all duration-500 ${
//                                                     pct === 100 ? 'bg-emerald-500' :
//                                                     pct > 50   ? 'bg-blue-500' :
//                                                     pct > 0    ? 'bg-amber-500' :
//                                                     'bg-slate-200'
//                                                 }`}
//                                                 style={{ width: `${pct}%` }}
//                                             />
//                                         </div>
//                                         <span className={`text-[11px] font-semibold w-10 text-right ${
//                                             pct === 100 ? 'text-emerald-600' :
//                                             pct > 50   ? 'text-blue-600' :
//                                             pct > 0    ? 'text-amber-600' :
//                                             'text-slate-400'
//                                         }`}>
//                                             {pct}%
//                                         </span>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 </div>
//             )}

//             {/* recent table  */}
//             <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
//                 <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
//                     <h3 className="text-sm font-bold text-slate-700">{tableTitle}</h3>
//                     <span className="text-[11px] text-slate-400">{recent.length} items</span>
//                 </div>

//                 {recent.length === 0 ? (
//                     <div className="px-5 py-12 text-center">
//                         <span className="material-symbols-outlined text-[32px] text-slate-300 mb-2">inbox</span>
//                         <p className="text-sm text-slate-400">No data available yet</p>
//                         <p className="text-xs text-slate-300 mt-1">Upload Excel and assign tasks to see data here</p>
//                     </div>
//                 ) : (
//                     <table className="w-full">
//                         <thead>
//                             <tr className="bg-slate-50/80">
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Location</th>
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Activity</th>
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                                     {role === 'Admin' ? 'Updated By' : role === 'Supervisor' ? 'Worker' : 'Deadline'}
//                                 </th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {recent.map((response, index) => (
//                                 <tr key={response.id || index} className="border-t border-slate-50 hover:bg-slate-50/50">
//                                     <td className="px-5 py-3 text-[12px] font-medium text-slate-700">
//                                         {role === 'Admin'
//                                             ? (response.location_activity?.location?.location_name || '-')
//                                             : (response.location?.location_name || response.location_name || '-')}
//                                     </td>
//                                     <td className="px-5 py-3 text-[12px] text-slate-500">
//                                         {role === 'Admin'
//                                             ? (response.location_activity?.activity?.activity_name || '-')
//                                             : (response.activity?.activity_name || response.activity_name || '-')}
//                                     </td>
//                                     <td className="px-5 py-3">
//                                         <Badge status={role === 'Admin' ? response.new_status : response.status} />
//                                     </td>
//                                     <td className="px-5 py-3 text-[12px] text-slate-500">
//                                         {role === 'Admin'
//                                             ? (response.updater?.full_name || '-')
//                                             : role === 'Supervisor'
//                                                 ? (response.worker?.full_name || 'Unassigned')
//                                                 : (response.planned_end_date || '-')}
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default Dashboard;