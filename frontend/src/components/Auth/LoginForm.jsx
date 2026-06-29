import { useState } from "react";
import { handleLogin, handleGoogleAuth } from "../../api/authHandler";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import ForgotPasswordModal from "./ForgotPasswordModal";

const LoginForm = () => {
  const [phone, setPhone]                     = useState("");
  const [pass, setPass]                       = useState("");
  const [loading, setLoading]                 = useState(false);
  const [googleLoading, setGoogleLoading]     = useState(false);
  const [error, setError]                     = useState("");
  const [phoneError, setPhoneError]           = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [rememberMe, setRememberMe]           = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login } = useAuth();

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const hasInvalidChars = /[^0-9]/.test(value);
    if (hasInvalidChars) {
      setPhoneError("Only numbers allowed");
      setTimeout(() => setPhoneError(""), 2000);
    }
    const numbersOnly = value.replace(/[^0-9]/g, "");
    if (numbersOnly.length <= 10) setPhone(numbersOnly);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!phone || !pass) return setError("All fields are required");
    if (phone.length !== 10) return setError("Phone number must be 10 digits");
    setLoading(true);
    setError("");
    try {
      const res = await handleLogin({ phone, password: pass });
      if (res.success) {
        login(res.user, res.token);
        window.location.href =
          res.user.role === "Admin"
            ? "/admin/dashboard"
            : res.user.role === "Supervisor"
            ? "/supervisor/dashboard"
            : "/worker/dashboard";
      } else {
        setError(res.message || "Login failed");
      }
    } catch (err) {
      console.log(err);
      console.log(err.response);
      console.log(err.response?.data);

      setError(
      err.response?.data?.message ||
      err.message ||
      "Server unreachable"
      );
      
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        const res = await handleGoogleAuth({ access_token: tokenResponse.access_token });
        if (res.success) {
          login(res.user, res.token);
          window.location.href =
            res.user.role === "Admin"
              ? "/admin/dashboard"
              : res.user.role === "Supervisor"
              ? "/supervisor/dashboard"
              : "/worker/dashboard";
        } else {
          setError(res.message || "Google login failed");
        }
      } catch {
        setError("Google login failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError("Google login failed. Please try again.");
      setGoogleLoading(false);
    },
  });

  return (
    <>
      <div
        className="w-full lg:w-[55%] flex items-center justify-center px-6 h-full overflow-y-auto relative"
        style={{
          background:
            "linear-gradient(135deg, #faf9f7 0%, #f5f3ff 30%, #fdf2f8 60%, #f8fafc 100%)",
        }}
      >
        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-violet-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-fuchsia-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-100/20 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-[420px]">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">
              Field<span className="text-violet-600">Track</span>
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-200/60 border border-white/50 p-6">


            <div className="mb-5 text-center">
              <h2 className="text-[26px] font-extrabold text-slate-800 tracking-tight mb-1">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Sign in to your FieldTrack account
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3"
                style={{ animation: "shake 0.4s ease" }}
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-rose-700 text-sm font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4" autoComplete="off">

              {/* Phone Input */}
              <Input
                label="Phone Number"
                type="text"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter 10 digit number"
                maxLength={10}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                error={phoneError}
                rightElement={
                  <span className={`text-[11px] font-bold ${
                    phone.length === 10
                      ? "text-emerald-500"
                      : phone.length > 0
                      ? "text-violet-500"
                      : "text-slate-400"
                  }`}>
                    {phone.length}/10
                  </span>
                }
              />

              {/* Password Input */}
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError(""); }}
                placeholder="Enter your password"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-slate-400 hover:text-slate-600 transition focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm text-violet-600 font-medium hover:text-violet-800 transition"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <div className="pt-1">
                <Button type="submit" loading={loading}>Sign In</Button>
              </div>

              {/* OR Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={googleLoading}
                className="w-full h-11 border border-slate-200 rounded-xl flex items-center justify-center gap-3 bg-white hover:bg-slate-50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                )}
                <span className="text-sm font-medium text-slate-700">
                  {googleLoading ? "Signing in..." : "Continue with Google"}
                </span>
              </button>

            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 font-medium mt-2">
            © {new Date().getFullYear()} FieldTracking · All rights reserved
          </p>

        </div>
      </div>

      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </>
  );
};

export default LoginForm;




































// import { useState } from "react";
// import { handleLogin, handleGoogleAuth } from "../../api/authHandler";
// import Input from "../ui/Input";
// import Button from "../ui/Button";
// import { useAuth } from "../../context/AuthContext";
// import { useGoogleLogin } from "@react-oauth/google";
// import ForgotPasswordModal from "./ForgotPasswordModal";

// const LoginForm = () => {
//   const [phone, setPhone]               = useState("");
//   const [pass, setPass]                 = useState("");
//   const [loading, setLoading]           = useState(false);
//   const [googleLoading, setGoogleLoading] = useState(false);
//   const [error, setError]               = useState("");
//   const [phoneError, setPhoneError]     = useState("");
//   const [showPassword, setShowPassword] = useState(false);       // ✅ NEW
//   const [rememberMe, setRememberMe]     = useState(false);       // ✅ NEW
//   const [showForgotModal, setShowForgotModal] = useState(false); // ✅ NEW

//   const { login } = useAuth();

//   // ─── Phone Handler (unchanged) ────────────────────────────────
//   const handlePhoneChange = (e) => {
//     const value = e.target.value;
//     const hasInvalidChars = /[^0-9]/.test(value);

//     if (hasInvalidChars) {
//       setPhoneError("Only numbers allowed");
//       setTimeout(() => setPhoneError(""), 2000);
//     }

//     const numbersOnly = value.replace(/[^0-9]/g, "");
//     if (numbersOnly.length <= 10) {
//       setPhone(numbersOnly);
//     }
//     setError("");
//   };

//   // ─── Normal Login (unchanged) ─────────────────────────────────
//   const submit = async (e) => {
//     e.preventDefault();

//     if (!phone || !pass) return setError("All fields are required");
//     if (phone.length !== 10) return setError("Phone number must be 10 digits");

//     setLoading(true);
//     setError("");

//     const data = { phone, password: pass };

//     try {
//       const res = await handleLogin(data);
//       console.log(res, "login res");

//       if (res.success) {
//         login(res.user, res.token);

//         const redirectPath =
//           res.user.role === "Admin"
//             ? "/admin/dashboard"
//             : res.user.role === "Supervisor"
//             ? "/supervisor/dashboard"
//             : "/worker/dashboard";

//         window.location.href = redirectPath;
//       } else {
//         setError(res.message || "Login failed");
//       }
//     } catch {
//       setError("Server unreachable");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ─── Google Login ✅ NEW ───────────────────────────────────────
//   const googleLogin = useGoogleLogin({
//     onSuccess: async (tokenResponse) => {
//       setGoogleLoading(true);
//       setError("");
//       try {
//         const res = await handleGoogleAuth({
//           access_token: tokenResponse.access_token,
//         });

//         if (res.success) {
//           login(res.user, res.token);

//           const redirectPath =
//             res.user.role === "Admin"
//               ? "/admin/dashboard"
//               : res.user.role === "Supervisor"
//               ? "/supervisor/dashboard"
//               : "/worker/dashboard";

//           window.location.href = redirectPath;
//         } else {
//           setError(res.message || "Google login failed");
//         }
//       } catch {
//         setError("Google login failed. Please try again.");
//       } finally {
//         setGoogleLoading(false);
//       }
//     },
//     onError: () => {
//       setError("Google login failed. Please try again.");
//       setGoogleLoading(false);
//     },
//   });

//   // ─── Render ───────────────────────────────────────────────────
//   return (
//     <>
//       <div
//         className="w-full lg:w-[55%] flex items-center justify-center p-6 min-h-screen lg:min-h-0 relative"
//         style={{
//           background:
//             "linear-gradient(135deg, #faf9f7 0%, #f5f3ff 30%, #fdf2f8 60%, #f8fafc 100%)",
//         }}
//       >
//         {/* Floating Orbs (unchanged) */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <div className="absolute -top-32 -right-32 w-80 h-80 bg-violet-200/40 rounded-full blur-3xl" />
//           <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-fuchsia-200/30 rounded-full blur-3xl" />
//           <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-100/20 rounded-full blur-3xl" />
//         </div>

//         <div className="relative w-full max-w-[420px]">

//           {/* Mobile Logo (unchanged) */}
//           <div className="lg:hidden flex items-center gap-3 mb-8">
//             <div className="relative">
//               <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
//                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                     d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//                 </svg>
//               </div>
//               <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
//             </div>
//             <span className="font-bold text-lg text-slate-800 tracking-tight">
//               Field<span className="text-violet-600">Track</span>
//             </span>
//           </div>

//           {/* Card */}
//           <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-200/60 border border-white/50 p-8">

//             {/* Header (unchanged) */}
//             <div className="mb-7 text-center">
//               <h2 className="text-[26px] font-extrabold text-slate-800 tracking-tight mb-1.5">
//                 Welcome back
//               </h2>
//               <p className="text-sm text-slate-500 font-medium">
//                 Sign in to your FieldTrack account
//               </p>
//             </div>

//             {/* Error Banner (unchanged) */}
//             {error && (
//               <div
//                 className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3"
//                 style={{ animation: "shake 0.4s ease" }}
//               >
//                 <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
//                   <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                       d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <span className="text-rose-700 text-sm font-semibold">{error}</span>
//               </div>
//             )}

//             <form onSubmit={submit} className="space-y-5" autoComplete="off">

//               {/* Phone Input (unchanged) */}
//               <Input
//                 label="Phone Number"
//                 type="text"
//                 inputMode="numeric"
//                 value={phone}
//                 onChange={handlePhoneChange}
//                 placeholder="Enter 10 digit number"
//                 maxLength={10}
//                 autoComplete="off"
//                 autoCorrect="off"
//                 autoCapitalize="off"
//                 spellCheck="false"
//                 data-form-type="other"
//                 error={phoneError}
//                 rightElement={
//                   <span className={`text-[11px] font-bold ${
//                     phone.length === 10
//                       ? "text-emerald-500"
//                       : phone.length > 0
//                       ? "text-violet-500"
//                       : "text-slate-400"
//                   }`}>
//                     {phone.length}/10
//                   </span>
//                 }
//               />

//               {/* Password Input ✅ UPDATED: added show/hide toggle */}
//               <Input
//                 label="Password"
//                 type={showPassword ? "text" : "password"}
//                 value={pass}
//                 onChange={(e) => { setPass(e.target.value); setError(""); }}
//                 placeholder="Enter your password"
//                 autoComplete="new-password"
//                 autoCorrect="off"
//                 autoCapitalize="off"
//                 spellCheck="false"
//                 data-form-type="other"
//                 rightElement={
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword((prev) => !prev)}
//                     className="text-slate-400 hover:text-slate-600 transition focus:outline-none"
//                     aria-label={showPassword ? "Hide password" : "Show password"}
//                   >
//                     {showPassword ? (
//                       // Eye-Off Icon
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                           d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                       </svg>
//                     ) : (
//                       // Eye Icon
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                           d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                           d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                       </svg>
//                     )}
//                   </button>
//                 }
//               />

//               {/* ✅ NEW: Remember Me + Forgot Password Row */}
//               <div className="flex items-center justify-between">
//                 <label className="flex items-center gap-2 cursor-pointer select-none">
//                   <input
//                     type="checkbox"
//                     checked={rememberMe}
//                     onChange={(e) => setRememberMe(e.target.checked)}
//                     className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
//                   />
//                   <span className="text-sm text-slate-600">Remember me</span>
//                 </label>

//                 <button
//                   type="button"
//                   onClick={() => setShowForgotModal(true)}
//                   className="text-sm text-violet-600 font-medium hover:text-violet-800 transition"
//                 >
//                   Forgot Password?
//                 </button>
//               </div>

//               {/* Sign In Button (unchanged) */}
//               <div className="pt-2">
//                 <Button type="submit" loading={loading}>Sign In</Button>
//               </div>

//               {/* ✅ NEW: OR Divider */}
//               <div className="flex items-center gap-3">
//                 <div className="flex-1 h-px bg-slate-200" />
//                 <span className="text-xs text-slate-400 font-medium">OR</span>
//                 <div className="flex-1 h-px bg-slate-200" />
//               </div>

//               {/* ✅ NEW: Google Login Button */}
//               <button
//                 type="button"
//                 onClick={() => googleLogin()}
//                 disabled={googleLoading}
//                 className="w-full h-11 border border-slate-200 rounded-xl flex items-center justify-center gap-3 bg-white hover:bg-slate-50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
//               >
//                 {googleLoading ? (
//                   <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
//                   </svg>
//                 ) : (
//                   <img
//                     src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
//                     alt="Google"
//                     className="w-5 h-5"
//                   />
//                 )}
//                 <span className="text-sm font-medium text-slate-700">
//                   {googleLoading ? "Signing in..." : "Continue with Google"}
//                 </span>
//               </button>

//             </form>
//           </div>

//           {/* Footer (unchanged) */}
//           <p className="text-center text-[11px] text-slate-400 font-medium mt-6">
//             © {new Date().getFullYear()} FieldTracking · All rights reserved
//           </p>

//         </div>
//       </div>

//       {/* ✅ NEW: Forgot Password Modal */}
//       {showForgotModal && (
//         <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
//       )}
//     </>
//   );
// };

// export default LoginForm;




// // import { useState } from 'react';
// // // import { useNavigate } from 'react-router-dom';
// // import { handleLogin } from '../../api/authHandler';
// // import Input from '../ui/Input';
// // import Button from '../ui/Button';
// // import { useAuth } from '../../context/AuthContext';


// // const LoginForm = () => {
// //     // const nav = useNavigate();
// //     const [phone, setPhone] = useState('');
// //     const [pass, setPass] = useState('');
// //     const [loading, setLoading] = useState(false);
// //     const [error, setError] = useState('');
// //     const [phoneError, setPhoneError] = useState('');

// //     const handlePhoneChange = (e) => {
// //         const value = e.target.value;
// //         const hasInvalidChars = /[^0-9]/.test(value);

// //         if (hasInvalidChars) {
// //             setPhoneError('Only numbers allowed');
// //             setTimeout(() => setPhoneError(''), 2000);
// //         }

// //         const numbersOnly = value.replace(/[^0-9]/g, '');
// //         if (numbersOnly.length <= 10) {
// //             setPhone(numbersOnly);
// //         }
// //         setError('');
// //     };

// //     const { login } = useAuth();

// //     const submit = async (e) => {
// //         e.preventDefault();

// //         if (!phone || !pass) {
// //             return setError('All fields are required');
// //         }

// //         if (phone.length !== 10) {
// //             return setError('Phone number must be 10 digits');
// //         }

// //         setLoading(true);
// //         setError('');

// //         const data = { phone, password: pass }

// //         try {
// //             const res = await handleLogin(data);
// //             console.log(res,'login res')

// //             if (res.success) {
// //                 // localStorage.setItem('token', res.token);
// //                 login(res.user, res.token);
// //                 // localStorage.setItem('user', JSON.stringify(res.user));
                

// //                 const redirectPath =
// //                     res.user.role === 'Admin'      ? '/admin/dashboard' :
// //                     res.user.role === 'Supervisor' ? '/supervisor/dashboard' :
// //                                                    '/worker/dashboard';
// //                 // nav(redirectPath);
// //                 window.location.href = redirectPath;
// //             } else {
// //                 setError(res.message || 'Login failed');
// //             }
// //         } catch {
// //             setError('Server unreachable');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     return (
// //         <div className="w-full lg:w-[55%] flex items-center justify-center p-6 min-h-screen lg:min-h-0 bg-white">
// //             <div className="w-full max-w-[380px]">
// //                 {/* Mobile Logo */}
// //                 <div className="lg:hidden flex items-center gap-2.5 mb-8">
// //                     <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
// //                         <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
// //                         </svg>
// //                     </div>
// //                     <span className="font-bold text-slate-800">Field Tracking</span>
// //                 </div>

// //                 <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome back</h2>
// //                 <p className="text-sm text-slate-400 mb-6">Enter your credentials to continue</p>

// //                 {error && (
// //                     <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
// //                         <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// //                         </svg>
// //                         <span className="text-red-600 text-xs font-medium">{error}</span>
// //                     </div>
// //                 )}

// //                 <form onSubmit={submit} className="space-y-4" autoComplete="off">
// //                     <Input
// //                         label="Phone Number"
// //                         type="text"
// //                         inputMode="numeric"
// //                         value={phone}
// //                         onChange={handlePhoneChange}
// //                         placeholder="Enter 10 digit phone number"
// //                         maxLength={10}
// //                         autoComplete="off"
// //                         autoCorrect="off"
// //                         autoCapitalize="off"
// //                         spellCheck="false"
// //                         data-form-type="other"
// //                         error={phoneError}
// //                         rightElement={
// //                             <span className="text-[10px] text-slate-400">
// //                                 {phone.length}/10
// //                             </span>
// //                         }
// //                     />

// //                     <Input
// //                         label="Password"
// //                         type="password"
// //                         value={pass}
// //                         onChange={e => { setPass(e.target.value); setError(''); }}
// //                         placeholder="Enter password"
// //                         autoComplete="new-password"
// //                         autoCorrect="off"
// //                         autoCapitalize="off"
// //                         spellCheck="false"
// //                         data-form-type="other"
// //                     />

// //                     <Button type="submit" loading={loading}>
// //                         Sign In
// //                     </Button>
// //                 </form>
// //             </div>
// //         </div>
// //     );
// // };

// // export default LoginForm;
