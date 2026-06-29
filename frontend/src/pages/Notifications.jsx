import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bell, CheckCircle2, AlertTriangle, Clock, Upload,
  UserCheck, MessageSquare, RefreshCw, CheckCheck,
  Megaphone, Inbox,
} from "lucide-react";

const typeConfig = {
  "Task Assigned": { icon: CheckCircle2, color: "violet", bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200" },
  "Task Completed": { icon: CheckCircle2, color: "emerald", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  "Task Delayed": { icon: AlertTriangle, color: "rose", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  "Status Updated": { icon: RefreshCw, color: "blue", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  "Excel Uploaded": { icon: Upload, color: "amber", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  "Supervisor Assigned": { icon: UserCheck, color: "cyan", bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  "Remarks Added": { icon: MessageSquare, color: "slate", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
};

const defaultConfig = { icon: Bell, color: "slate", bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" };

const Notifications = () => {
  const { role } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const base = role === "Admin" ? "/admin" : role === "Supervisor" ? "/supervisor" : "/worker";

  const fetchData = async () => {
    try { setLoading(true); const r = await API.get(`${base}/notifications`); setData(r.data.data || []); }
    catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const markRead = async (id) => {
    try { await API.patch(`${base}/notifications/${id}/read`); fetchData(); toast.success("Marked as read"); }
    catch (err) { toast.error("Failed to mark as read"); }
  };

  const unreadCount = data.filter((n) => !n.is_read).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80 gap-4">
      <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading notifications...</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-2xl flex items-center justify-center shadow-sm">
            <Bell size={19} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Notifications</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {data.length} total · {unreadCount} unread
            </p>
          </div>
        </div>
        <button onClick={fetchData}
          className="px-4 py-2.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 flex items-center gap-2 transition-all">
          <RefreshCw size={13} /> Refresh
        </button>
      </motion.div>

      {/* Empty State */}
      {data.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-100 py-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox size={28} className="text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-500">No notifications yet</p>
          <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {data.map((n, i) => {
            const cfg = typeConfig[n.type] || defaultConfig;
            const Icon = cfg.icon;
            return (
              <motion.div key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ x: 2 }}
                className={`relative bg-white rounded-2xl border-2 p-4 md:p-5 flex items-start gap-4 transition-all cursor-pointer group ${
                  n.is_read ? "border-slate-100" : `${cfg.border} ${cfg.bg}/40 shadow-sm`
                }`}
              >
                {/* Unread dot */}
                {!n.is_read && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-violet-500 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
                )}

                {/* Icon */}
                <div className={`w-10 h-10 ${cfg.bg} rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                  <Icon size={18} className={cfg.text} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 ${cfg.bg} ${cfg.text} text-[10px] font-bold rounded-xl border ${cfg.border}`}>
                          {n.type}
                        </span>
                        {!n.is_read && (
                          <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider animate-pulse">New</span>
                        )}
                      </div>
                      <p className="text-[14px] font-bold text-slate-800">{n.title}</p>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)}
                        className="text-[11px] font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5">
                        <CheckCheck size={12} /> Mark Read
                      </button>
                    )}
                  </div>

                  <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{n.message}</p>

                  <div className="flex items-center gap-3 mt-2.5">
                    {n.sender?.full_name && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <div className="w-4 h-4 bg-gradient-to-br from-violet-400 to-purple-500 rounded-md flex items-center justify-center text-white text-[8px] font-bold">
                          {n.sender.full_name[0]}
                        </div>
                        {n.sender.full_name}
                      </div>
                    )}
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock size={11} />
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;























// import { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import API from '../api/client';
// import {Bell} from 'lucide-react'

// const typeIcon = {
//     'Task Assigned':       'assignment',
//     'Task Completed':      'check_circle',
//     'Task Delayed':        'warning',
//     'Status Updated':      'sync',
//     'Excel Uploaded':      'upload',
//     'Supervisor Assigned': 'engineering',
//     'Remarks Added':       'chat',
// };

// const Notifications = () => {
//     const { role } = useAuth();
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const base = role === 'Admin' ? '/admin' : role === 'Supervisor' ? '/supervisor' : '/worker';

    

//     const fetchData = async () => {
//         try { setLoading(true); const r = await API.get(`${base}/notifications`); setData(r.data.data || []); }
//         catch (err) {
//             console.log(err)
//         } finally { setLoading(false); }
//     };
//     useEffect(() => {
//     const load = async () => {
//         await fetchData();
  
//     };
//     load();
//     }, []);

//     const markRead = async (id) => {
//         try { await API.patch(`${base}/notifications/${id}/read`); fetchData(); } catch (err) {
//             console.log(err)
//         }
//     };

//     if (loading) return <div className="flex items-center justify-center h-80"><div className="w-6 h-6 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

//     return (
//         <div className="space-y-4">
//             <div><h2 className="text-lg font-bold text-slate-800">Notifications</h2><p className="text-xs text-slate-400">{data.length} notifications</p></div>

//             {data.length === 0 ? (
//                 <div className="bg-white rounded-xl border border-slate-200/80 py-16 text-center">
//                     <div className="flex items-center justify-center mb-2">
//                         <Bell className="w-8 h-8 text-slate-400" />
//                     </div>
//                     <p className="text-sm text-slate-400">No notifications</p>
//                 </div>
//             ) : (
//                 <div className="space-y-2">
//                     {data.map(n => (
//                         <div key={n.id}
//                             className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-all
//                                 ${n.is_read ? 'border-slate-100' : 'border-blue-200 bg-blue-50/30'}`}>
//                             <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">{typeIcon[n.type] || 'notifications'}</span>
//                             <div className="flex-1 min-w-0">
//                                 <div className="flex items-start justify-between gap-2">
//                                     <div>
//                                         <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded">{n.type}</span>
//                                         <p className="text-[13px] font-semibold text-slate-700 mt-1">{n.title}</p>
//                                     </div>
//                                     {!n.is_read && (
//                                         <button onClick={() => markRead(n.id)}
//                                             className="text-[11px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap flex-shrink-0">
//                                             Mark Read
//                                         </button>
//                                     )}
//                                 </div>
//                                 <p className="text-[12px] text-slate-500 mt-1">{n.message}</p>
//                                 <p className="text-[10px] text-slate-400 mt-1.5">
//                                     {n.sender?.full_name ? `${n.sender.full_name} · ` : ''}
//                                     {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
//                                 </p>
//                             </div>
//                             {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default Notifications;