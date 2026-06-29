import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/client";
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, ChevronDown, LogOut } from "lucide-react";

const titles = {
  dashboard: "Dashboard", locations: "Locations", activities: "Activities",
  tasks: "Tasks", upload: "Upload", users: "Team", reports: "Reports",
  evidence: "Evidence", notifications: "Alerts",
};

const AppHeader = ({ collapsed, onToggle }) => {
  const { user, logout, role } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [unread, setUnread] = useState(0);
  const [drop, setDrop] = useState(false);
  const dropdownRef = useRef(null);
  const base = role === "Admin" ? "/admin" : role === "Supervisor" ? "/supervisor" : "/worker";
  const page = loc.pathname.split("/").filter(Boolean).pop() || "dashboard";

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await API.get(`${base}/notifications`);
        setUnread(response.data.unread_count || 0);
      } catch (err) { console.log(err); }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [base]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDrop(false);
    };
    if (drop) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [drop]);

  return (
    <header className="h-[60px] bg-white border-b border-slate-100 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* ── Left ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-2 rounded-xl hover:bg-slate-100 md:hidden transition-all active:scale-95"
        >
          <Menu size={18} className="text-slate-500" />
        </button>

        <button
          onClick={onToggle}
          className="p-2 rounded-xl hover:bg-slate-100 hidden md:block transition-all active:scale-95"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} className="text-slate-400 hover:text-slate-600 transition-colors" />
          ) : (
            <PanelLeftClose size={18} className="text-slate-400 hover:text-slate-600 transition-colors" />
          )}
        </button>

        <div className="hidden sm:block w-px h-5 bg-slate-200" />

        <div>
          <h1 className="text-[15px] md:text-[16px] font-bold text-slate-800 tracking-tight">
            {titles[page] || "Dashboard"}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={() => nav(`${base}/notifications`)}
          className="relative p-2.5 rounded-xl hover:bg-slate-50 transition-all group"
        >
          <Bell size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-gradient-to-br from-rose-500 to-pink-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold ring-2 ring-white px-1 shadow-md shadow-rose-500/25">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDrop(!drop)}
            className="flex items-center gap-2.5 p-1.5 pr-2 rounded-xl hover:bg-slate-50 transition-all"
          >
            <div className="w-[34px] h-[34px] bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-violet-500/20 ring-2 ring-white">
              {user?.full_name?.[0]}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-[12px] font-semibold text-slate-700">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 font-medium">{role}</p>
            </div>
            <ChevronDown size={14} className={`hidden sm:block text-slate-400 transition-transform duration-200 ${drop ? "rotate-180" : ""}`} />
          </button>

          {drop && (
            <div
              className="absolute right-0 top-[48px] w-60 bg-white rounded-2xl shadow-2xl border border-slate-200/50 py-2 z-50 overflow-hidden"
              style={{ animation: "slideDown 0.18s ease" }}
            >
              <div className="px-5 py-3.5 border-b border-slate-100">
                <p className="text-[13px] font-semibold text-slate-800">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{user?.phone}</p>
                <span className="inline-block mt-2 px-2.5 py-1 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                  {role}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full px-5 py-3 text-left text-[13px] text-slate-600 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-3 font-medium transition-all"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;


















// import { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import API from '../../api/client';

// const titles = { 
//     dashboard:'Dashboard', 
//     locations:'Locations', 
//     activities:'Activities', 
//     tasks:'Tasks', 
//     upload:'Upload', 
//     users:'Team', 
//     reports:'Reports', 
//     evidence:'Evidence', 
//     notifications:'Alerts' };

// const AppHeader = ({ collapsed, onToggle }) => {
//     const { user, logout, role } = useAuth();
//     const nav = useNavigate();
//     const loc = useLocation();
//     const [unread, setUnread] = useState(0);
//     const [drop, setDrop] = useState(false);
//     const base = role === 'Admin' ? '/admin' : role === 'Supervisor' ? '/supervisor' : '/worker';
//     const page = loc.pathname.split('/').filter(Boolean).pop() || 'dashboard';

//     useEffect(() => {
//         const fetchUnread = async () => { 
//             try { 
//                 const response = await API.get(`${base}/notifications`); 
//                 setUnread(response.data.unread_count || 0); } 
//             catch (err){
//             console.log(err);
//         } };
//         fetchUnread(); 
//         const interval = setInterval(fetchUnread, 30000); 
//         return () => clearInterval(interval);
//     }, [base]);

//     return (
//         <header className="h-14 md:h-15 bg-white border-b border-slate-200/80 px-3 md:px-6 flex items-center justify-between sticky top-0 z-30">
//             {/* Left */}
//             <div className="flex items-center gap-3">
//                 {/* Hamburger for mobile */}
//                 <button onClick={onToggle} className="p-2 rounded-lg hover:bg-slate-100 md:hidden">
//                     <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                     </svg>
//                 </button>
//                 {/* Desktop collapse toggle */}
//                 <button onClick={onToggle} className="p-2 rounded-lg hover:bg-slate-100 hidden md:block">
//                     <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={collapsed ? "M4 6h16M4 12h16M4 18h16" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
//                     </svg>
//                 </button>
//                 <div>
//                     <h1 className="text-[14px] md:text-[15px] font-bold text-slate-800">{titles[page] || 'Dashboard'}</h1>
//                     <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
//                         {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
//                     </p>
//                 </div>
//             </div>

//             {/* Right */}
//             <div className="flex items-center gap-1">
//                 {/* Bell */}
//                 <button onClick={() => nav(`${base}/notifications`)}
//                     className="relative p-2 rounded-lg hover:bg-slate-50">
//                     <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//                     </svg>
//                     {unread > 0 && (
//                         <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold ring-2 ring-white">
//                             {unread > 9 ? '9+' : unread}
//                         </span>
//                     )}
//                 </button>

//                 <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

//                 {/* Profile */}
//                 <div className="relative">
//                     <button onClick={() => setDrop(!drop)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50">
//                         <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
//                             {user?.full_name?.[0]}
//                         </div>
//                         <div className="hidden sm:block text-left">
//                             <p className="text-[12px] font-semibold text-slate-700 leading-tight">{user?.full_name}</p>
//                             <p className="text-[10px] text-slate-400">{role}</p>
//                         </div>
//                     </button>

//                     {drop && (
//                         <>
//                             <div className="fixed inset-0 z-40" onClick={() => setDrop(false)} />
//                             <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
//                                 <div className="px-3 py-2.5 border-b border-slate-100">
//                                     <p className="text-[12px] font-semibold text-slate-700">{user?.full_name}</p>
//                                     <p className="text-[10px] text-slate-400">{user?.phone}</p>
//                                 </div>
//                                 <button onClick={logout}
//                                     className="w-full px-3 py-2.5 text-left text-[12px] text-red-500 hover:bg-red-50 flex items-center gap-2">
//                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//                                     </svg>
//                                     Sign Out
//                                 </button>
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </div>
//         </header>
//     );
// };

// export default AppHeader;