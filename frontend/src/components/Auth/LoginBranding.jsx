const LoginBranding = () => {
  return (
    <div
      className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center h-full"
      style={{
        background:
          "linear-gradient(160deg, #0f172a 0%, #1e1b4b 30%, #2e1065 60%, #0f172a 100%)",
      }}
    >
      {/* Ambient light orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-fuchsia-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating particles */}
      <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" />
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/10 rounded-full" />
      <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-violet-400/30 rounded-full" />

      <div className="relative px-12 py-8 w-full h-full flex flex-col justify-center">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/40">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight">
            Field<span className="text-violet-400 font-bold">Track</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold text-white leading-tight mb-3 tracking-tight">
          Manage your{" "}
          <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
            field operations
          </span>{" "}
          effortlessly
        </h1>

        {/* Description */}
        <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
          Real-time tracking, team management, and activity monitoring — all in
          one platform built for modern field teams.
        </p>

        {/* Stats row */}
        <div className="flex gap-10 mt-6 pt-5 border-t border-white/[0.06]">
          <div>
            <p className="text-2xl font-extrabold text-white tracking-tight">200+</p>
            <p className="text-slate-500 text-xs font-semibold">Active Sites</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white tracking-tight">50+</p>
            <p className="text-slate-500 text-xs font-semibold">Team Members</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white tracking-tight">99%</p>
            <p className="text-slate-500 text-xs font-semibold">Uptime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginBranding;












// const LoginBranding = () => {
//   return (
//     <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 30%, #2e1065 60%, #0f172a 100%)" }}>

//       {/* Ambient light orbs */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute top-10 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
//         <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-fuchsia-600/15 rounded-full blur-3xl" />
//         <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
//       </div>

//       {/* Grid texture */}
//       <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "48px 48px" }} />

//       {/* Floating particles */}
//       <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" />
//       <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/10 rounded-full" />
//       <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-violet-400/30 rounded-full" />

//       <div className="relative px-12 py-12 w-full h-full flex flex-col justify-center">

//         {/* Logo */}
//         <div className="flex items-center gap-3 mb-8">
//           <div className="relative">
//             <div className="w-11 h-11 bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/40">
//               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//               </svg>
//             </div>
//             <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
//           </div>
//           <span className="text-white font-extrabold text-lg tracking-tight">
//             Field<span className="text-violet-400 font-bold">Track</span>
//           </span>
//         </div>

//         {/* Headline */}
//         <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
//           Manage your{' '}
//           <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
//             field operations
//           </span>{' '}
//           effortlessly
//         </h1>

//         {/* Description */}
//         <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
//           Real-time tracking, team management, and activity monitoring — all in one platform built for modern field teams.
//         </p>

//         {/* Stats row */}
//         <div className="flex gap-10 mt-8 pt-6 border-t border-white/[0.06]">
//           <div>
//             <p className="text-2xl font-extrabold text-white tracking-tight">200+</p>
//             <p className="text-slate-500 text-xs font-semibold">Active Sites</p>
//           </div>
//           <div>
//             <p className="text-2xl font-extrabold text-white tracking-tight">50+</p>
//             <p className="text-slate-500 text-xs font-semibold">Team Members</p>
//           </div>
//           <div>
//             <p className="text-2xl font-extrabold text-white tracking-tight">99%</p>
//             <p className="text-slate-500 text-xs font-semibold">Uptime</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginBranding;