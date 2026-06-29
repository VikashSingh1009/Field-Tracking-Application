// Sidebar.jsx — With Collapsible Child Menu for Masters
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ChevronDown } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   MASTER CHILD MENU ITEMS
   Each category becomes a child menu item
═══════════════════════════════════════════════════════════════ */
const MASTER_CHILDREN = [
  {
    key:   "location-type",
    label: "Location Type",
    icon:  "pin_drop",
  },
  {
    key:   "phase-type",
    label: "Phase Type",
    icon:  "layers",
  },
  {
    key:   "vendor-type",
    label: "Vendor Type",
    icon:  "shield",
  },
  {
    key:   "activity-type",
    label: "Activity Type",
    icon:  "bolt",
  },
  {
    key:   "priority",
    label: "Priority",
    icon:  "flag",
  },
  {
    key:   "zone",
    label: "Zone",
    icon:  "grid_view",
  },
  {
    key:   "status",
    label: "Status",
    icon:  "check_box",
  },
  {
    key:   "category",
    label: "Category",
    icon:  "label",
  },
];

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR ITEMS CONFIG
═══════════════════════════════════════════════════════════════ */
const sidebarItems = [
  {
    key:      "dashboard",
    label:    "Dashboard",
    alt:      null,
    icon:     "space_dashboard",
    roles:    ["Admin", "Supervisor", "Worker"],
    children: null,
  },
  {
    key:      "masters",
    label:    "Masters",
    alt:      null,
    icon:     "tune",
    roles:    ["Admin"],
    children: MASTER_CHILDREN,   // ✅ Child menu items
  },
  {
    key:      "locations",
    label:    "Locations",
    alt:      "My Locations",
    icon:     "pin_drop",
    roles:    ["Admin", "Supervisor"],
    children: null,
  },
  {
    key:      "activities",
    label:    "Activities",
    alt:      "My Activities",
    icon:     "timeline",
    roles:    ["Admin", "Supervisor"],
    children: null,
  },
  
  {
    key:      "tasks",
    label:    "My Tasks",
    alt:      null,
    icon:     "checklist",
    roles:    ["Worker"],
    children: null,
  },

  {
  key:      "workers",
  label:    "My Workers",
  alt:      null,
  icon:     "group",           // Material Symbol icon
  roles:    ["Supervisor"],    // Sirf Supervisor ko dikhega
  children: null,
  },

  {
    key:      "upload",
    label:    "Upload",
    alt:      null,
    icon:     "cloud_upload",
    roles:    ["Admin"],
    children: null,
  },
  {
    key:      "users",
    label:    "Team",
    alt:      null,
    icon:     "groups",
    roles:    ["Admin"],
    children: null,
  },

   {
    key:      "assign-workers",
    label:    "Assign Workers",
    alt:      null,
    icon:     "group_add",         // Material Symbol icon
    roles:    ["Admin"],           // Only Admin can see this
    children: null,
  },


  {
    key:      "reports",
    label:    "Reports",
    alt:      null,
    icon:     "monitoring",
    roles:    ["Admin", "Supervisor"],
    children: null,
  },
  {
    key:      "evidence",
    label:    "Evidence",
    alt:      null,
    icon:     "photo_library",
    roles:    ["Admin", "Supervisor", "Worker"],
    children: null,
  },
  {
    key:      "notifications",
    label:    "Alerts",
    alt:      null,
    icon:     "notifications_active",
    roles:    ["Admin", "Supervisor", "Worker"],
    children: null,
  },
  {
    key:      "profile",
    label:    "My Profile",
    alt:      null,
    icon:     "account_circle",   // Material Symbol
    roles:    ["Admin", "Supervisor", "Worker"],
    children: null,
  },
];

/* 
   SIDEBAR COMPONENT
 */
const Sidebar = ({ collapsed, setCollapsed, isMobile, onClose }) => {
  const { role, user } = useAuth();
  const nav            = useNavigate();
  const loc            = useLocation();

  const base = role === "Admin"
    ? "/admin"
    : role === "Supervisor"
    ? "/supervisor"
    : "/worker";

  const menu = sidebarItems.filter((i) => i.roles.includes(role));

  // Track which parent menus are expanded
  // Auto-expand masters if currently on a masters child route
  const isMastersActive = loc.pathname.startsWith(`${base}/masters`);
  const [expanded, setExpanded] = useState(
    isMastersActive ? { masters: true } : {}
  );

  /* Handle nav click */
  const handleClick = (path) => {
    nav(path);
    if (isMobile && onClose) onClose();
  };

  /*  Toggle parent expand/collapse  */
  const toggleExpand = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /*  Check if child route is active  */
  const isChildActive = (parentKey, childKey) => {
    return loc.pathname === `${base}/${parentKey}/${childKey}`;
  };

  /* ── Check if parent is active ──────────────────────────── */
  const isParentActive = (item) => {
    if (item.children) {
      return loc.pathname.startsWith(`${base}/${item.key}`);
    }
    return (
      loc.pathname === `${base}/${item.key}` ||
      loc.pathname.startsWith(`${base}/${item.key}/`)
    );
  };

  return (
    <aside
      className={`
        ${collapsed ? "w-[72px]" : "w-[260px]"}
        h-screen flex flex-col transition-all duration-300
        ease-[cubic-bezier(0.4,0,0.2,1)] relative z-10
      `}
      style={{
        background:
          "linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      }}
    >
      {/* ── Glow ─────────────────────────────────────────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48
                      bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Logo ─────────────────────────────────────────── */}
      <div className={`
        h-[64px] flex items-center px-4 border-b border-white/[0.06] relative
        ${collapsed ? "justify-center" : "justify-between"}
      `}>
        <div className={`
          flex items-center gap-3
          ${collapsed ? "justify-center w-full" : ""}
        `}>
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500
                            via-purple-500 to-fuchsia-500 rounded-xl flex
                            items-center justify-center shadow-lg
                            shadow-violet-500/30">
              <svg className="w-5 h-5 text-white" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827
                         0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5
                            bg-emerald-400 rounded-full border-2
                            border-slate-900 animate-pulse" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[14px] font-bold text-white tracking-tight
                            leading-none">
                Field<span className="text-violet-400">Track</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium
                            tracking-[0.15em] uppercase mt-1">
                {role}
              </p>
            </div>
          )}
        </div>

        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400
                       hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor"
                 viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto
                      scrollbar-none">
        {menu.map((item) => {
          const path    = `${base}/${item.key}`;
          const active  = isParentActive(item);
          const label   = item.alt && role !== "Admin" ? item.alt : item.label;
          const isOpen  = expanded[item.key];
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.key}>
              {/* ── Parent Menu Item ──────────────────────── */}
              <button
                onClick={() => {
                  if (hasChildren) {
                    // ✅ Toggle expand AND navigate to first child
                    if (collapsed) {
                      // If collapsed, expand sidebar first
                      setCollapsed(false);
                      setExpanded((prev) => ({ ...prev, [item.key]: true }));
                    } else {
                      toggleExpand(item.key);
                      // Navigate to first child if not already on masters
                      if (!active) {
                        nav(`${base}/${item.key}/${item.children[0].key}`);
                      }
                    }
                  } else {
                    handleClick(path);
                  }
                }}
                title={collapsed ? label : ""}
                className={`
                  w-full flex items-center gap-3.5 px-3.5 py-3
                  rounded-2xl text-[13px] font-medium
                  transition-all duration-200 group relative
                  ${active
                    ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }
                  ${collapsed ? "justify-center px-0" : ""}
                `}
              >
                {/* Active indicator */}
                {active && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2
                                   w-1 h-8 bg-gradient-to-b from-violet-400
                                   to-fuchsia-400 rounded-full
                                   shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
                )}

                {/* Icon */}
                <span className={`
                  material-symbols-outlined text-[20px] shrink-0
                  ${active
                    ? "text-violet-300"
                    : "text-slate-500 group-hover:text-slate-400"
                  }
                `}>
                  {item.icon}
                </span>

                {/* Label */}
                {!collapsed && (
                  <span className="flex-1 text-left">{label}</span>
                )}

                {/* ✅ Chevron for items with children */}
                {!collapsed && hasChildren && (
                  <ChevronDown
                    size={14}
                    className={`
                      transition-transform duration-200 shrink-0
                      ${isOpen ? "rotate-180" : ""}
                      ${active ? "text-violet-300" : "text-slate-600"}
                    `}
                  />
                )}

                {/* Tooltip for collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-3 py-2
                                   bg-slate-800 text-white text-[11px]
                                   font-medium rounded-xl whitespace-nowrap
                                   opacity-0 invisible group-hover:opacity-100
                                   group-hover:visible transition-all
                                   duration-200 z-50 shadow-xl
                                   border border-slate-700/50
                                   pointer-events-none">
                    {label}
                  </span>
                )}
              </button>

              {/* ✅ Child Menu Items — only show when expanded & not collapsed */}
              {hasChildren && isOpen && !collapsed && (
                <div className="mt-0.5 ml-3 pl-3 border-l
                                border-white/[0.06] space-y-0.5">
                  {item.children.map((child) => {
                    const childActive = isChildActive(item.key, child.key);
                    const childPath   = `${base}/${item.key}/${child.key}`;

                    return (
                      <button
                        key={child.key}
                        onClick={() => handleClick(childPath)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5
                          rounded-xl text-[12px] font-medium
                          transition-all duration-200 group/child relative
                          ${childActive
                            ? "bg-violet-500/20 text-violet-300"
                            : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                          }
                        `}
                      >
                        {/* ✅ Active dot for child */}
                        {childActive && (
                          <span className="absolute left-1.5 top-1/2
                                           -translate-y-1/2 w-1 h-5
                                           bg-violet-400 rounded-full" />
                        )}

                        {/* Child Icon */}
                        <span className={`
                          material-symbols-outlined text-[16px] shrink-0
                          ${childActive
                            ? "text-violet-400"
                            : "text-slate-600 group-hover/child:text-slate-400"
                          }
                        `}>
                          {child.icon}
                        </span>

                        {/* Child Label */}
                        <span className="text-left">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom Profile ───────────────────────────────── */}
      <div className="border-t border-white/[0.06] p-3 relative">
        <div className="absolute bottom-full left-1/2 -translate-x-1/2
                        w-32 h-16 bg-violet-500/5 rounded-full blur-2xl
                        pointer-events-none" />

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1.5
                          rounded-2xl bg-white/[0.03] border border-white/[0.04]">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-400
                            to-fuchsia-500 rounded-xl flex items-center
                            justify-center text-white text-xs font-bold
                            shadow-md shadow-violet-500/20 shrink-0">
              {user?.full_name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-slate-200
                            truncate leading-tight">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {user?.phone}
              </p>
            </div>
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full
                            shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center mb-1.5">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-400
                            to-fuchsia-500 rounded-xl flex items-center
                            justify-center text-white text-xs font-bold
                            shadow-md shadow-violet-500/20">
              {user?.full_name?.[0]}
            </div>
          </div>
        )}

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2.5
                       rounded-xl text-slate-600 hover:text-slate-300
                       hover:bg-white/[0.04] transition-all"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300
                          ${collapsed ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;