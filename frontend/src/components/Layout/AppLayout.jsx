import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";
import { Toaster } from "sonner";

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8f7f5" }}>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            fontSize: "13px",
            fontWeight: 500,
          },
        }}
      />

      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile
            ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
            : ""
          }
        `}
      >
        <Sidebar
          collapsed={isMobile ? false : collapsed}
          setCollapsed={isMobile ? () => setMobileOpen(false) : setCollapsed}
          isMobile={isMobile}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader
          collapsed={collapsed}
          onToggle={() => {
            if (isMobile) setMobileOpen(!mobileOpen);
            else setCollapsed(!collapsed);
          }}
        />
        <main className="flex-1 overflow-y-auto p-3 md:p-5 lg:p-6" style={{ background: "#f8f7f5" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;








































// import { useState, useEffect } from 'react';
// import { Outlet } from 'react-router-dom';
// import Sidebar from './Sidebar';
// import AppHeader from './AppHeader';

// const AppLayout = () => {
//     const [collapsed, setCollapsed] = useState(false);
//     const [mobileOpen, setMobileOpen] = useState(false);
//     const [isMobile, setIsMobile] = useState(false);

//     // Screen size detect karo
//     useEffect(() => {
//         const check = () => {
//             const mobile = window.innerWidth < 768;
//             // const mobile = useMediaQuery()
//             setIsMobile(mobile);
//             if (mobile) setCollapsed(true);
//         };
//         check();
//         window.addEventListener('resize', check);
//         return () => window.removeEventListener('resize', check);  //cleanup function
//     }, []);

//     return (
//         <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">

//             {/* Mobile Overlay */}
//             {isMobile && mobileOpen && (
//                 <div
//                     className="fixed inset-0 bg-black/40 z-40 md:hidden"
//                     onClick={() => setMobileOpen(false)}
//                 />
//             )}

//             {/* Sidebar */}
//             <div className={`
//                 ${isMobile
//                     ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
//                     : ''
//                 }
//             `}>
//                 <Sidebar
//                     collapsed={isMobile ? false : collapsed}
//                     setCollapsed={isMobile ? () => setMobileOpen(false) : setCollapsed}
//                     isMobile={isMobile}
//                     onClose={() => setMobileOpen(false)}
//                 />
//             </div>

//             {/* Main Content */}
//             <div className="flex-1 flex flex-col overflow-hidden min-w-0">
//                 <AppHeader
//                     collapsed={collapsed}
//                     onToggle={() => {
//                         if (isMobile) setMobileOpen(!mobileOpen);
//                         else setCollapsed(!collapsed);
//                     }}
//                 />
//                 <main className="flex-1 overflow-y-auto p-3 md:p-5">
//                     <Outlet />
//                 </main>
//             </div>
//         </div>
//     );
// };

// export default AppLayout;