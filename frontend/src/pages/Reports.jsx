import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/client";
import Badge from "../components/ui/Badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FileDown, Download, Filter, X, CheckCircle2, RotateCw,
  Clock, AlertTriangle, TrendingUp, BarChart3, PieChartIcon,
  Target, MapPin, Layers, Users, LayoutDashboard,
} from "lucide-react";   //download TrendingUP

const CHART_COLORS = ["#10b981", "#8b5cf6", "#94a3b8", "#f43f5e", "#f59e0b"];

const Reports = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({ phase: "", status: "", supervisor: "" });
  const [phases, setPhases] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [tab, setTab] = useState("overview");

  const [activityStatuses, setActivityStatuses] = useState([]);

  const base = role === "Admin" ? "/admin" : "/supervisor";

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = `${base}/reports?`;
      if (filters.phase) url += `phase_id=${filters.phase}&`;
      if (filters.status) url += `status=${filters.status}&`;
      if (filters.supervisor) url += `supervisor_id=${filters.supervisor}&`;
      const r = await API.get(url);
      setLocations(r.data.data || []);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const fetchDashboard = async () => {
    try {
      const r = await API.get(`${base}/dashboard`);
      setStats(r.data.data?.stats || {});
    } catch (err) { console.log(err); }
  };

  const fetchPhases = async () => {
    try {
      const r = await API.get("/admin/locations");
      const data = r.data.data || [];
      const unique = [], seen = {};
      data.forEach((l) => {
        if (l.phase?.phase_name && !seen[l.phase.phase_name]) {
          seen[l.phase.phase_name] = true;
          unique.push({ id: l.phase_id, name: l.phase.phase_name });
        }
      });
      setPhases(unique);
    } catch (err) { console.log(err); }
  };

  const fetchSupervisors = async () => {
    try {
      const r = await API.get("/admin/users?role=Supervisor");
      setSupervisors(r.data.data || []);
    } catch (err) { console.log(err); }
  };

  const fetchActivityStatues = async () => {
    try {
      const r = await API.get("/admin/lookups?category=ACTIVITY_STATUS");
      setActivityStatuses(r.data.data || []);
    } catch (err){
      console.log('fetchActivityStatues error:', err);
    }
  }

  useEffect(() => {
    const load = async () => {
      await fetchData();
      await fetchDashboard();
      if (role === "Admin") { 
        await fetchPhases(); 
        await fetchSupervisors(); 
        await fetchActivityStatues();
      }
    };
    load();
  }, [filters, role]);

  const exportXls = async () => {
    try {
      const r = await API.get("/admin/reports/export", { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([r.data]));
      a.download = "Field_Report.xlsx";
      a.click();
      toast.success("Export started!");
    } catch { toast.error("Export failed"); }
  };

  /* ─── Chart Data ─── */
  const statusData = [
    { name: "Completed", value: stats.completed || 0, color: CHART_COLORS[0] },
    { name: "In Progress", value: stats.in_progress || 0, color: CHART_COLORS[1] },
    { name: "Not Started", value: stats.not_started || 0, color: CHART_COLORS[2] },
    { name: "Delayed", value: stats.delayed || 0, color: CHART_COLORS[3] },
  ].filter((d) => d.value > 0);

  const totalActs = (stats.completed || 0) + (stats.in_progress || 0) + (stats.not_started || 0) + (stats.delayed || 0);

  const phaseMap = {};
  locations.forEach((loc) => {
    const phaseName = loc.phase?.phase_name || "No Phase";
    if (!phaseMap[phaseName]) phaseMap[phaseName] = { total: 0, completed: 0, inProgress: 0, notStarted: 0, delayed: 0 };
    (loc.activities || []).forEach((a) => {
      phaseMap[phaseName].total++;
      if (a.status === "Completed") phaseMap[phaseName].completed++;
      else if (a.status === "In Progress") phaseMap[phaseName].inProgress++;
      else if (a.status === "Not Started") phaseMap[phaseName].notStarted++;
      else if (a.status === "Delayed") phaseMap[phaseName].delayed++;
    });
  });

  const phaseChartData = Object.entries(phaseMap).map(([name, data]) => ({
    name: name.length > 12 ? name.substring(0, 12) + "..." : name,
    fullName: name, completed: data.completed, inProgress: data.inProgress,
    notStarted: data.notStarted, delayed: data.delayed, total: data.total,
    progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  }));

  const supMap = {};
  locations.forEach((loc) => {
    const supName = loc.supervisor?.full_name || "Unassigned";
    if (!supMap[supName]) supMap[supName] = { total: 0, completed: 0, locations: 0 };
    supMap[supName].locations++;
    (loc.activities || []).forEach((a) => {
      supMap[supName].total++;
      if (a.status === "Completed") supMap[supName].completed++;
    });
  });

  const supChartData = Object.entries(supMap).map(([name, data]) => ({
    name: name.length > 12 ? name.substring(0, 12) + "..." : name, fullName: name,
    locations: data.locations, completed: data.completed, total: data.total,
    progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  })).sort((a, b) => b.progress - a.progress);

  const locChartData = locations.slice(0, 15).map((loc) => {
    const acts = loc.activities || [];
    const total = acts.length;
    const done = acts.filter((a) => a.status === "Completed").length;
    return { name: (loc.location_name || "").substring(0, 15), fullName: loc.location_name, progress: total > 0 ? Math.round((done / total) * 100) : 0, total, done };
  });

  const totalLocations = locations.length;
  const completedLocs = locations.filter((l) => { const acts = l.activities || []; return acts.length > 0 && acts.every((a) => a.status === "Completed"); }).length;
  const completionRate = totalActs > 0 ? Math.round(((stats.completed || 0) / totalActs) * 100) : 0;

  const summaryCards = [
    { l: "Total Locations", v: totalLocations, icon: MapPin, color: "violet" },
    { l: "Completed Locations", v: completedLocs, icon: CheckCircle2, color: "emerald" },
    { l: "Total Activities", v: totalActs, icon: Layers, color: "blue" },
    { l: "Completion Rate", v: `${completionRate}%`, icon: Target, color: "amber" },
    { l: "Completed", v: stats.completed || 0, icon: CheckCircle2, color: "emerald" },
    { l: "In Progress", v: stats.in_progress || 0, icon: RotateCw, color: "purple" },
    { l: "Not Started", v: stats.not_started || 0, icon: Clock, color: "slate" },
    { l: "Delayed", v: stats.delayed || 0, icon: AlertTriangle, color: "rose" },
  ];

  const cm = {
    violet: { light: "bg-violet-50", text: "text-violet-600" },
    blue: { light: "bg-blue-50", text: "text-blue-600" },
    amber: { light: "bg-amber-50", text: "text-amber-600" },
    emerald: { light: "bg-emerald-50", text: "text-emerald-600" },
    purple: { light: "bg-purple-50", text: "text-purple-600" },
    slate: { light: "bg-slate-50", text: "text-slate-500" },
    rose: { light: "bg-rose-50", text: "text-rose-600" },
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-slate-200/60 text-xs">
        <p className="font-bold text-slate-700 mb-1.5">{payload[0]?.payload?.fullName || label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <div className="w-2.5 h-2.5 rounded-md" style={{ backgroundColor: p.color }} />
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-bold text-slate-700">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Reports & Analytics</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{totalLocations} locations · {totalActs} activities</p>
        </div>
        {role === "Admin" && (
          <button onClick={exportXls}
            className="px-4 py-2.5 text-xs font-semibold bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20">
            <FileDown size={14} /> Export Excel
          </button>
        )}
      </motion.div>

      {/* Filters */}
      {role === "Admin" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter size={14} className="text-slate-400" />
            <select value={filters.phase} onChange={(e) => setFilters({ ...filters, phase: e.target.value })}
              className="px-3.5 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all">
              <option value="">All Phases</option>
              {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3.5 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all">
              <option value="">All Status</option>
              {/* {["Completed", "In Progress", "Not Started", "Delayed"].map((s) => <option key={s} value={s}>{s}</option>)} */}
              {activityStatuses.length > 0 ? (
                activityStatuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))
              ) : (
                <>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Not started">Not started</option>
                <option value="Delayed">Delayed</option>
                </>
              )}
            </select>
            <select value={filters.supervisor} onChange={(e) => setFilters({ ...filters, supervisor: e.target.value })}
              className="px-3.5 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all">
              <option value="">All Supervisors</option>
              {supervisors.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            {(filters.phase || filters.status || filters.supervisor) && (
              <button onClick={() => setFilters({ phase: "", status: "", supervisor: "" })}
                className="px-3.5 py-2 text-xs font-semibold text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-1.5">
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-100 p-1.5 inline-flex gap-1 shadow-sm">
        {[
          { key: "overview", icon: LayoutDashboard, label: "Overview" },
          { key: "phase", icon: Layers, label: "Phase" },
          { key: "supervisor", icon: Users, label: "Supervisor" },
          { key: "locations", icon: MapPin, label: "Locations" },
          { key: "table", icon: BarChart3, label: "Table" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl capitalize transition-all flex items-center gap-2 ${
              tab === t.key ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" : "text-slate-500 hover:bg-slate-100"
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading reports...</p>
        </div>
      ) : (
        <>
          {/* ═══ OVERVIEW ═══ */}
          {tab === "overview" && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {summaryCards.map((c, i) => {
                  const cl = cm[c.color]; const Icon = c.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
                      <div className={`w-9 h-9 ${cl.light} rounded-xl flex items-center justify-center mb-2.5`}>
                        <Icon size={17} className={cl.text} />
                      </div>
                      <p className={`text-xl font-extrabold tracking-tight ${cl.text}`}>{c.v}</p>
                      <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">{c.l}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                {/* Pie Chart */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
                      <PieChartIcon size={17} className="text-violet-600" />
                    </div>
                    <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Activity Status Distribution</h3>
                  </div>
                  {statusData.length === 0 ? (
                    <div className="h-52 flex flex-col items-center justify-center gap-3">
                      <PieChartIcon size={32} className="text-slate-200" />
                      <p className="text-sm text-slate-400 font-medium">No data</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-1/2">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                              {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={CustomTooltip} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-1/2 space-y-2">
                        {statusData.map((d, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="w-3 h-3 rounded-md" style={{ backgroundColor: CHART_COLORS[i] }} />
                              <span className="text-[11px] font-semibold text-slate-600">{d.name}</span>
                            </div>
                            <span className="text-[13px] font-bold text-slate-800">{d.value}</span>
                          </div>
                        ))}
                        <div className="pt-2.5 mt-1 border-t border-slate-100 flex justify-between px-2">
                          <span className="text-[11px] font-bold text-slate-500">Total</span>
                          <span className="text-[13px] font-extrabold text-slate-800">{totalActs}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Completion Ring */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
                      <Target size={17} className="text-violet-600" />
                    </div>
                    <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Overall Completion</h3>
                  </div>
                  <div className="flex items-center justify-center py-4">
                    <div className="relative w-44 h-44">
                      <svg className="w-44 h-44 -rotate-90">
                        <circle cx="88" cy="88" r="72" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        <circle cx="88" cy="88" r="72" fill="none" stroke="url(#reportRing)" strokeWidth="12"
                          strokeDasharray={`${completionRate * 4.52} 452`} strokeLinecap="round" />
                        <defs>
                          <linearGradient id="reportRing" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[36px] font-extrabold text-slate-800">{completionRate}%</span>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Completed</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 mt-2">
                    {[
                      { v: stats.completed || 0, l: "Done", c: "emerald" },
                      { v: stats.in_progress || 0, l: "Active", c: "purple" },
                      { v: stats.delayed || 0, l: "Delayed", c: "rose" },
                    ].map((s, i) => {
                      const cl = cm[s.c];
                      return (
                        <div key={i} className={`${cl.light} rounded-2xl p-3 text-center`}>
                          <p className={`text-lg font-extrabold ${cl.text}`}>{s.v}</p>
                          <p className={`text-[10px] font-semibold ${cl.text}/60`}>{s.l}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PHASE TAB ═══ */}
          {tab === "phase" && (
            <div className="space-y-5">
              <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
                    <BarChart3 size={17} className="text-violet-600" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Phase-wise Activity Breakdown</h3>
                </div>
                {phaseChartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-3">
                    <BarChart3 size={32} className="text-slate-200" />
                    <p className="text-sm text-slate-400 font-medium">No phase data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={phaseChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} />
                      <Tooltip content={CustomTooltip} />
                      <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} barSize={22} />
                      <Bar dataKey="inProgress" name="In Progress" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={22} />
                      <Bar dataKey="notStarted" name="Not Started" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={22} />
                      <Bar dataKey="delayed" name="Delayed" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {phaseChartData.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[13px] font-bold text-slate-700">{p.fullName}</h4>
                      <span className={`text-sm font-extrabold ${p.progress === 100 ? "text-emerald-600" : p.progress > 50 ? "text-violet-600" : "text-amber-600"}`}>
                        {p.progress}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div className={`h-full rounded-full transition-all duration-700 ${p.progress === 100 ? "bg-emerald-500" : p.progress > 50 ? "bg-violet-500" : "bg-amber-500"}`}
                        style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold">
                      {[
                        { v: p.completed, c: "text-emerald-600", icon: CheckCircle2 },
                        { v: p.inProgress, c: "text-violet-600", icon: RotateCw },
                        { v: p.notStarted, c: "text-slate-400", icon: Clock },
                        { v: p.delayed, c: "text-rose-500", icon: AlertTriangle },
                      ].map((x, j) => (
                        <span key={j} className={`${x.c} flex items-center gap-1`}>
                          <x.icon size={12} /> {x.v}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ SUPERVISOR TAB ═══ */}
          {tab === "supervisor" && (
            <div className="space-y-5">
              <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
                    <Users size={17} className="text-violet-600" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Supervisor Performance</h3>
                </div>
                {supChartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-3">
                    <Users size={32} className="text-slate-200" />
                    <p className="text-sm text-slate-400 font-medium">No data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(250, supChartData.length * 40)}>
                    <BarChart data={supChartData} layout="vertical" margin={{ left: 10, right: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <Tooltip content={CustomTooltip} />
                      <Bar dataKey="progress" name="Progress %" fill="url(#supGradient)" radius={[0, 8, 8, 0]} barSize={20} />
                      <defs>
                        <linearGradient id="supGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {supChartData.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-violet-500/20">
                        {s.fullName[0]}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-700">{s.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{s.locations} locations · {s.total} activities</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${s.progress}%` }} />
                      </div>
                      <span className="text-[11px] font-extrabold text-violet-600">{s.progress}%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{s.completed}/{s.total} activities completed</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ LOCATIONS TAB ═══ */}
          {tab === "locations" && (
            <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
                  <MapPin size={17} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Location-wise Progress</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Top 15 locations</p>
                </div>
              </div>
              {locChartData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <MapPin size={32} className="text-slate-200" />
                  <p className="text-sm text-slate-400 font-medium">No data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(300, locChartData.length * 35)}>
                  <BarChart data={locChartData} layout="vertical" margin={{ left: 10, right: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <Tooltip content={CustomTooltip} />
                    <Bar dataKey="progress" name="Progress %" radius={[0, 8, 8, 0]} barSize={18}>
                      {locChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.progress === 100 ? "#10b981" : entry.progress > 50 ? "#8b5cf6" : entry.progress > 0 ? "#f59e0b" : "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* ═══ TABLE TAB ═══ */}
          {tab === "table" && (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                    <BarChart3 size={15} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Detailed Report</h3>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">{locations.length} locations</span>
              </div>
              {locations.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                    <BarChart3 size={22} className="text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">No data</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/40">
                        {["S.No", "Location", "Phase", "Supervisor", "Activities", "Progress", "Status"].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((loc, i) => {
                        const acts = loc.activities || [];
                        const total = acts.length;
                        const done = acts.filter((a) => a.status === "Completed").length;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <tr key={loc.id || i} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5 text-[12px] text-slate-400 font-mono">{loc.serial_number || i + 1}</td>
                            <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">{loc.location_name || "-"}</td>
                            <td className="px-5 py-3.5 text-[12px] text-slate-500 font-medium">{loc.phase?.phase_name || "-"}</td>
                            <td className="px-5 py-3.5 text-[12px] text-slate-500 font-medium">{loc.supervisor?.full_name || "-"}</td>
                            <td className="px-5 py-3.5 text-[12px] text-slate-500 font-medium">{done}/{total}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5 min-w-[90px]">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${
                                    pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-violet-500" : pct > 0 ? "bg-amber-500" : "bg-slate-200"
                                  }`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 w-8 text-right">{pct}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5"><Badge status={loc.overall_status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;


















// import { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import API from '../api/client';
// import Badge from '../components/ui/Badge';
// import {
//     PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
//     CartesianGrid, Tooltip, ResponsiveContainer,
//     // AreaChart, Area
// } from 'recharts';

// const COLORS = ['#059669', '#2563eb', '#94a3b8', '#dc2626', '#d97706'];

// const Reports = () => {
//     const { role } = useAuth();
//     const [loading, setLoading] = useState(true);
//     const [locations, setLocations] = useState([]);
//     const [stats, setStats] = useState({});
//     const [filters, setFilters] = useState({ phase: '', status: '', supervisor: '' });
//     const [phases, setPhases] = useState([]);
//     const [supervisors, setSupervisors] = useState([]);
//     const [tab, setTab] = useState('overview');

//     const base = role === 'Admin' ? '/admin' : '/supervisor';



//     const fetchData = async () => {
//         try {
//             setLoading(true);
//             let url = `${base}/reports?`;
//             if (filters.phase) url += `phase_id=${filters.phase}&`;
//             if (filters.status) url += `status=${filters.status}&`;
//             if (filters.supervisor) url += `supervisor_id=${filters.supervisor}&`;
//             const r = await API.get(url);
//             setLocations(r.data.data || []);
//         } catch (err){
//             console.log(err);
//         } finally { setLoading(false); }
//     };

//     const fetchDashboard = async () => {
//         try {
//             const r = await API.get(`${base}/dashboard`);
//             setStats(r.data.data?.stats || {});
//         } catch (err) {
//             console.log(err)
//         }
//     };

//     const fetchPhases = async () => {
//         try {
//             const r = await API.get('/admin/locations');
//             const data = r.data.data || [];
//             const unique = [];
//             const seen = {};
//             data.forEach(l => {
//                 if (l.phase?.phase_name && !seen[l.phase.phase_name]) {
//                     seen[l.phase.phase_name] = true;
//                     unique.push({ id: l.phase_id, name: l.phase.phase_name });
//                 }
//             });
//             setPhases(unique);
//         } catch (err) {
//             console.log(err);
//         }
//     };

//     const fetchSupervisors = async () => {
//         try {
//             const r = await API.get('/admin/users?role=Supervisor');
//             setSupervisors(r.data.data || []);
//         } catch (err){
//             console.log(err)
//         }
//     };

//     useEffect(() => {
//     const load = async () => {
//         await fetchData();
//         await fetchDashboard();

//         if (role === 'Admin') {
//             await fetchPhases();
//             await fetchSupervisors();
//         }
//     };

//     load();
//     }, [filters, role]);

//     const exportXls = async () => {
//         try {
//             const r = await API.get('/admin/reports/export', { responseType: 'blob' });
//             const a = document.createElement('a');
//             a.href = URL.createObjectURL(new Blob([r.data]));
//             a.download = 'Field_Report.xlsx';
//             a.click();
//         } catch { alert('Export failed'); }
//     };


//     // chart data calculation 
//     // Status Distribution
//     const statusData = [
//         { name: 'Completed', value: stats.completed || 0 },
//         { name: 'In Progress', value: stats.in_progress || 0 },
//         { name: 'Not Started', value: stats.not_started || 0 },
//         { name: 'Delayed', value: stats.delayed || 0 },
//     ].filter(d => d.value > 0);

//     const totalActs = (stats.completed || 0) + (stats.in_progress || 0) + (stats.not_started || 0) + (stats.delayed || 0);

//     // Phase wise progress
//     const phaseMap = {};
//     locations.forEach(loc => {
//         const phaseName = loc.phase?.phase_name || 'No Phase';
//         if (!phaseMap[phaseName]) phaseMap[phaseName] = { total: 0, completed: 0, inProgress: 0, notStarted: 0, delayed: 0 };
//         const acts = loc.activities || [];
//         acts.forEach(a => {
//             phaseMap[phaseName].total++;
//             if (a.status === 'Completed') phaseMap[phaseName].completed++;
//             else if (a.status === 'In Progress') phaseMap[phaseName].inProgress++;
//             else if (a.status === 'Not Started') phaseMap[phaseName].notStarted++;
//             else if (a.status === 'Delayed') phaseMap[phaseName].delayed++;
//         });
//     });

//     const phaseChartData = Object.entries(phaseMap).map(([name, data]) => ({
//         name: name.length > 12 ? name.substring(0, 12) + '...' : name,
//         fullName: name,
//         completed: data.completed,
//         inProgress: data.inProgress,
//         notStarted: data.notStarted,
//         delayed: data.delayed,
//         total: data.total,
//         progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
//     }));

//     // Supervisor wise progress
//     const supMap = {};
//     locations.forEach(loc => {
//         const supName = loc.supervisor?.full_name || 'Unassigned';
//         if (!supMap[supName]) supMap[supName] = { total: 0, completed: 0, locations: 0 };
//         supMap[supName].locations++;
//         const acts = loc.activities || [];
//         acts.forEach(a => {
//             supMap[supName].total++;
//             if (a.status === 'Completed') supMap[supName].completed++;
//         });
//     });

//     const supChartData = Object.entries(supMap).map(([name, data]) => ({
//         name: name.length > 12 ? name.substring(0, 12) + '...' : name,
//         fullName: name,
//         locations: data.locations,
//         completed: data.completed,
//         total: data.total,
//         progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
//     })).sort((a, b) => b.progress - a.progress);

//     // Location wise progress
//     const locChartData = locations.slice(0, 15).map(loc => {
//         const acts = loc.activities || [];
//         const total = acts.length;
//         const done = acts.filter(a => a.status === 'Completed').length;
//         return {
//             name: (loc.location_name || '').substring(0, 15),
//             fullName: loc.location_name,
//             progress: total > 0 ? Math.round((done / total) * 100) : 0,
//             total,
//             done
//         };
//     });

//     // Summary cards
//     const totalLocations = locations.length;
//     const completedLocs = locations.filter(l => {
//         const acts = l.activities || [];
//         return acts.length > 0 && acts.every(a => a.status === 'Completed');
//     }).length;
//     const completionRate = totalActs > 0 ? Math.round(((stats.completed || 0) / totalActs) * 100) : 0;

//     const summaryCards = [
//         { l: 'Total Locations', v: totalLocations, c: 'text-blue-600', bg: 'bg-blue-50', icon: <span className="material-symbols-outlined">location_on</span> },
//         { l: 'Completed Locations', v: completedLocs, c: 'text-emerald-600', bg: 'bg-emerald-50', icon: <span className="material-symbols-outlined">check_circle</span> },
//         { l: 'Total Activities', v: totalActs, c: 'text-indigo-600', bg: 'bg-indigo-50', icon: <span className="material-symbols-outlined">assignment</span> },
//         { l: 'Completion Rate', v: `${completionRate}%`, c: 'text-violet-600', bg: 'bg-violet-50', icon: <span className="material-symbols-outlined">bar_chart</span> },
//         { l: 'Completed', v: stats.completed || 0, c: 'text-emerald-600', bg: 'bg-emerald-50', icon: <span className="material-symbols-outlined">check_circle</span> },
//         { l: 'In Progress', v: stats.in_progress || 0, c: 'text-amber-600', bg: 'bg-amber-50', icon: <span className="material-symbols-outlined">sync</span> },
//         { l: 'Not Started', v: stats.not_started || 0, c: 'text-slate-500', bg: 'bg-slate-50', icon: <span className="material-symbols-outlined">schedule</span> },
//         { l: 'Delayed', v: stats.delayed || 0, c: 'text-red-600', bg: 'bg-red-50', icon: <span className="material-symbols-outlined">warning</span> },
//     ];

//     // Custom Tooltip
//     const CustomTooltip = ({ active, payload, label }) => {
//         if (!active || !payload?.length) return null;
//         return (
//             <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 text-xs">
//                 <p className="font-semibold text-slate-700 mb-1">{payload[0]?.payload?.fullName || label}</p>
//                 {payload.map((p, i) => (
//                     <div key={i} className="flex items-center gap-2">
//                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
//                         <span className="text-slate-500">{p.name}:</span>
//                         <span className="font-semibold text-slate-700">{p.value}</span>
//                     </div>
//                 ))}
//             </div>
//         );
//     };

//     return (
//         <div className="space-y-4">
//             {/* Header */}
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//                 <div>
//                     <h2 className="text-lg font-bold text-slate-800">Reports & Analytics</h2>
//                     <p className="text-xs text-slate-400">{totalLocations} locations · {totalActs} activities</p>
//                 </div>
//                 <div className="flex gap-2">
//                     {role === 'Admin' && (
//                         <button onClick={exportXls}
//                             className="px-3 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1.5">
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                             </svg>
//                             Export Excel
//                         </button>
//                     )}
//                 </div>
//             </div>

//             {/* Filters */}
//             {role === 'Admin' && (
//                 <div className="bg-white rounded-xl border border-slate-200/80 p-4">
//                     <div className="flex flex-wrap gap-3">
//                         <select value={filters.phase} onChange={e => setFilters({ ...filters, phase: e.target.value })}
//                             className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
//                             <option value="">All Phases</option>
//                             <option value="Phase 1">Phase 1</option>
//                             <option value="Phase 2">Phase 2</option>
//                             {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                         </select>

//                         <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
//                             className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
//                             <option value="">All Status</option>
//                             <option value="Completed">Completed</option>
//                             <option value="In Progress">In Progress</option>
//                             <option value="Not Started">Not Started</option>
//                             <option value="Delayed">Delayed</option>
//                         </select>

//                         <select value={filters.supervisor} onChange={e => setFilters({ ...filters, supervisor: e.target.value })}
//                             className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
//                             <option value="">All Supervisors</option>
//                             {supervisors.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
//                         </select>

//                         {(filters.phase || filters.status || filters.supervisor) && (
//                             <button onClick={() => setFilters({ phase: '', status: '', supervisor: '' })}
//                                 className="px-3 py-2 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg">
//                                 Clear Filters
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             )}

//             {/* Tabs */}
//             <div className="bg-white rounded-xl border border-slate-200/80 p-1 inline-flex gap-1">
//                 {['overview', 'phase', 'supervisor', 'locations', 'table'].map(t => (
//                     <button key={t} onClick={() => setTab(t)}
//                         className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors
//                             ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
//                         {t}
//                     </button>
//                 ))}
//             </div>

//             {loading ? (
//                 <div className="flex items-center justify-center py-20">
//                     <div className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
//                 </div>
//             ) : (
//                 <>
//                         {/* overview tab  */}
//                     {tab === 'overview' && (
//                         <div className="space-y-4">
//                             {/* Summary Cards */}
//                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                                 {summaryCards.map((c, i) => (
//                                     <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4">
//                                         <div className={`w-9 h-9 ${c.bg} ${c.c} rounded-lg flex items-center justify-center text-lg mb-2`}>{c.icon}</div>
//                                         <p className={`text-xl font-bold ${c.c}`}>{c.v}</p>
//                                         <p className="text-[10px] text-slate-400 font-medium mt-0.5">{c.l}</p>
//                                     </div>
//                                 ))}
//                             </div>

//                             {/* Charts Row */}
//                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//                                 {/* Pie Chart */}
//                                 <div className="bg-white rounded-xl border border-slate-200/80 p-5">
//                                     <h3 className="text-sm font-bold text-slate-700 mb-4">Activity Status Distribution</h3>
//                                     {statusData.length === 0 ? (
//                                         <div className="h-52 flex items-center justify-center"><p className="text-sm text-slate-400">No data</p></div>
//                                     ) : (
//                                         <div className="flex items-center gap-4">
//                                             <div className="w-1/2">
//                                                 <ResponsiveContainer width="100%" height={200}>
//                                                     <PieChart>
//                                                         <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
//                                                             {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
//                                                         </Pie>
//                                                         <Tooltip content={CustomTooltip} />
//                                                     </PieChart>
//                                                 </ResponsiveContainer>
//                                             </div>
//                                             <div className="w-1/2 space-y-2">
//                                                 {statusData.map((d, i) => (
//                                                     <div key={i} className="flex items-center justify-between">
//                                                         <div className="flex items-center gap-2">
//                                                             <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
//                                                             <span className="text-[11px] text-slate-600">{d.name}</span>
//                                                         </div>
//                                                         <span className="text-[12px] font-bold text-slate-800">{d.value}</span>
//                                                     </div>
//                                                 ))}
//                                                 <div className="pt-2 border-t border-slate-100">
//                                                     <div className="flex justify-between">
//                                                         <span className="text-[11px] font-medium text-slate-600">Total</span>
//                                                         <span className="text-[12px] font-bold text-slate-800">{totalActs}</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>

//                                 {/* Completion Rate */}
//                                 <div className="bg-white rounded-xl border border-slate-200/80 p-5">
//                                     <h3 className="text-sm font-bold text-slate-700 mb-4">Overall Completion</h3>
//                                     <div className="flex items-center justify-center py-4">
//                                         <div className="relative w-40 h-40">
//                                             <svg className="w-40 h-40 transform -rotate-90">
//                                                 <circle cx="80" cy="80" r="65" fill="none" stroke="#f1f5f9" strokeWidth="14" />
//                                                 <circle cx="80" cy="80" r="65" fill="none" stroke="#2563eb" strokeWidth="14"
//                                                     strokeDasharray={`${completionRate * 4.08} 408`} strokeLinecap="round" />
//                                             </svg>
//                                             <div className="absolute inset-0 flex flex-col items-center justify-center">
//                                                 <span className="text-3xl font-bold text-slate-800">{completionRate}%</span>
//                                                 <span className="text-[10px] text-slate-400">Completed</span>
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <div className="grid grid-cols-3 gap-2 mt-2">
//                                         <div className="bg-emerald-50 rounded-lg p-2 text-center">
//                                             <p className="text-sm font-bold text-emerald-700">{stats.completed || 0}</p>
//                                             <p className="text-[9px] text-emerald-600">Done</p>
//                                         </div>
//                                         <div className="bg-blue-50 rounded-lg p-2 text-center">
//                                             <p className="text-sm font-bold text-blue-700">{stats.in_progress || 0}</p>
//                                             <p className="text-[9px] text-blue-600">Active</p>
//                                         </div>
//                                         <div className="bg-red-50 rounded-lg p-2 text-center">
//                                             <p className="text-sm font-bold text-red-700">{stats.delayed || 0}</p>
//                                             <p className="text-[9px] text-red-600">Delayed</p>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {/* ═══════════ PHASE TAB ═══════════ */}
//                     {tab === 'phase' && (
//                         <div className="space-y-4">
//                             <div className="bg-white rounded-xl border border-slate-200/80 p-5">
//                                 <h3 className="text-sm font-bold text-slate-700 mb-4">Phase-wise Activity Breakdown</h3>
//                                 {phaseChartData.length === 0 ? (
//                                     <div className="h-64 flex items-center justify-center"><p className="text-sm text-slate-400">No phase data</p></div>
//                                 ) : (
//                                     <ResponsiveContainer width="100%" height={300}>
//                                         <BarChart data={phaseChartData}>
//                                             <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                                             <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
//                                             <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
//                                             <Tooltip content={CustomTooltip} />
//                                             <Bar dataKey="completed" name="Completed" fill="#059669" radius={[4,4,0,0]} barSize={20} />
//                                             <Bar dataKey="inProgress" name="In Progress" fill="#2563eb" radius={[4,4,0,0]} barSize={20} />
//                                             <Bar dataKey="notStarted" name="Not Started" fill="#94a3b8" radius={[4,4,0,0]} barSize={20} />
//                                             <Bar dataKey="delayed" name="Delayed" fill="#dc2626" radius={[4,4,0,0]} barSize={20} />
//                                         </BarChart>
//                                     </ResponsiveContainer>
//                                 )}
//                             </div>

//                             {/* Phase Cards */}
//                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//                                 {phaseChartData.map((p, i) => (
//                                     <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4">
//                                         <div className="flex items-center justify-between mb-3">
//                                             <h4 className="text-[13px] font-semibold text-slate-700">{p.fullName}</h4>
//                                             <span className={`text-sm font-bold ${p.progress === 100 ? 'text-emerald-600' : p.progress > 50 ? 'text-blue-600' : 'text-amber-600'}`}>{p.progress}%</span>
//                                         </div>
//                                         <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
//                                             <div className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-500' : p.progress > 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${p.progress}%` }} />
//                                         </div>
//                                         <div className="flex justify-between text-[10px]">
//                                             <span className="text-emerald-600 flex items-center gap-1">
//                                                 <span className="material-symbols-outlined text-[14px]">check_circle</span>
//                                                 {p.completed}
//                                             </span>
//                                             <span className="text-blue-600 flex items-center gap-1">
//                                                 <span className="material-symbols-outlined text-[14px]">sync</span>
//                                                 {p.inProgress}
//                                             </span>
//                                             <span className="text-slate-400 flex items-center gap-1">
//                                                 <span className="material-symbols-outlined text-[14px]">schedule</span>
//                                                 {p.notStarted}
//                                             </span>
//                                             <span className="text-red-500 flex items-center gap-1">
//                                                 <span className="material-symbols-outlined text-[14px]">warning</span>
//                                                 {p.delayed}
//                                             </span>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}

//                     {/* supervisor tab  */}
//                     {tab === 'supervisor' && (
//                         <div className="space-y-4">
//                             <div className="bg-white rounded-xl border border-slate-200/80 p-5">
//                                 <h3 className="text-sm font-bold text-slate-700 mb-4">Supervisor Performance</h3>
//                                 {supChartData.length === 0 ? (
//                                     <div className="h-64 flex items-center justify-center"><p className="text-sm text-slate-400">No data</p></div>
//                                 ) : (
//                                     <ResponsiveContainer width="100%" height={Math.max(250, supChartData.length * 40)}>
//                                         <BarChart data={supChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
//                                             <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                                             <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
//                                             <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#64748b' }} />
//                                             <Tooltip content={CustomTooltip} />
//                                             <Bar dataKey="progress" name="Progress %" fill="#2563eb" radius={[0,6,6,0]} barSize={18} />
//                                         </BarChart>
//                                     </ResponsiveContainer>
//                                 )}
//                             </div>

//                             {/* Supervisor Cards */}
//                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//                                 {supChartData.map((s, i) => (
//                                     <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4">
//                                         <div className="flex items-center gap-3 mb-3">
//                                             <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">{s.fullName[0]}</div>
//                                             <div>
//                                                 <p className="text-[12px] font-semibold text-slate-700">{s.fullName}</p>
//                                                 <p className="text-[10px] text-slate-400">{s.locations} locations · {s.total} activities</p>
//                                             </div>
//                                         </div>
//                                         <div className="flex items-center gap-2 mb-1">
//                                             <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
//                                                 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.progress}%` }} />
//                                             </div>
//                                             <span className="text-[11px] font-bold text-blue-600">{s.progress}%</span>
//                                         </div>
//                                         <p className="text-[10px] text-slate-400">{s.completed}/{s.total} activities completed</p>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}

//                     {/* location tab  */}
//                     {tab === 'locations' && (
//                         <div className="bg-white rounded-xl border border-slate-200/80 p-5">
//                             <h3 className="text-sm font-bold text-slate-700 mb-4">Location-wise Progress (Top 15)</h3>
//                             {locChartData.length === 0 ? (
//                                 <div className="h-64 flex items-center justify-center"><p className="text-sm text-slate-400">No data</p></div>
//                             ) : (
//                                 <ResponsiveContainer width="100%" height={Math.max(300, locChartData.length * 35)}>
//                                     <BarChart data={locChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
//                                         <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                                         <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
//                                         <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#64748b' }} />
//                                         <Tooltip content={CustomTooltip} />
//                                         <Bar dataKey="progress" name="Progress %" fill="#2563eb" radius={[0,6,6,0]} barSize={16}>
//                                             {locChartData.map((entry, i) => (
//                                                 <Cell key={i} fill={entry.progress === 100 ? '#059669' : entry.progress > 50 ? '#2563eb' : entry.progress > 0 ? '#d97706' : '#94a3b8'} />
//                                             ))}
//                                         </Bar>
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             )}
//                         </div>
//                     )}

//                     {/* table tab  */}
//                     {tab === 'table' && (
//                         <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
//                             <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
//                                 <h3 className="text-sm font-bold text-slate-700">Detailed Report</h3>
//                                 <span className="text-[11px] text-slate-400">{locations.length} locations</span>
//                             </div>
//                             {locations.length === 0 ? (
//                                 <div className="text-center py-16"><p className="text-slate-400 text-sm">No data</p></div>
//                             ) : (
//                                 <div className="overflow-x-auto">
//                                     <table className="w-full">
//                                         <thead>
//                                             <tr className="bg-slate-50/80 border-b border-slate-100">
//                                                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">S.No</th>
//                                                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Location</th>
//                                                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Phase</th>
//                                                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Supervisor</th>
//                                                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Activities</th>
//                                                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Progress</th>
//                                                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {locations.map((loc, i) => {
//                                                 const acts = loc.activities || [];
//                                                 const total = acts.length;
//                                                 const done = acts.filter(a => a.status === 'Completed').length;
//                                                 const pct = total > 0 ? Math.round((done / total) * 100) : 0;

//                                                 return (
//                                                     <tr key={loc.id || i} className="border-t border-slate-50 hover:bg-slate-50/50">
//                                                         <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">{loc.serial_number || i + 1}</td>
//                                                         <td className="px-4 py-3 text-[12px] font-medium text-slate-700">{loc.location_name || '-'}</td>
//                                                         <td className="px-4 py-3 text-[11px] text-slate-500">{loc.phase?.phase_name || '-'}</td>
//                                                         <td className="px-4 py-3 text-[11px] text-slate-500">{loc.supervisor?.full_name || '-'}</td>
//                                                         <td className="px-4 py-3 text-[11px] text-slate-500">{done}/{total}</td>
//                                                         <td className="px-4 py-3">
//                                                             <div className="flex items-center gap-2 min-w-[80px]">
//                                                                 <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                                                                     <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-blue-500' : pct > 0 ? 'bg-amber-500' : 'bg-slate-200'}`} style={{ width: `${pct}%` }} />
//                                                                 </div>
//                                                                 <span className="text-[10px] text-slate-400 w-7 text-right">{pct}%</span>
//                                                             </div>
//                                                         </td>
//                                                         <td className="px-4 py-3"><Badge status={loc.overall_status} /></td>
//                                                     </tr>
//                                                 );
//                                             })}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </>
//             )}
//         </div>
//     );
// };

// export default Reports;