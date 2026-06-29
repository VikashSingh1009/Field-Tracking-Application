import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { handleResetPassword } from "../api/authHandler";


const EyeIcon = ({ show, onToggle }) => (
    <button
        type="button"
        onClick={onToggle}
        className="text-slate-400 hover:text-slate-600 transition focus:outline-none"
        aria-label={show ? "Hide password" : "Show password"}
    >
        {show ? (
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
);


const ResetPassword = () => {
    const { token }   = useParams();
    const navigate    = useNavigate();

    const [password,     setPassword]     = useState("");
    const [confirm,      setConfirm]      = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [loading,      setLoading]      = useState(false);
    const [error,        setError]        = useState("");
    const [isSuccess,    setIsSuccess]    = useState(false);
    const [strength,     setStrength]     = useState(0);


    useEffect(() => {
        let score = 0;
        if (password.length >= 6)             score++;
        if (/[A-Z]/.test(password))           score++;
        if (/[0-9]/.test(password))           score++;
        if (/[^A-Za-z0-9]/.test(password))   score++;
        setStrength(score);
    }, [password]);

    const getStrengthInfo = () => {
        if (!password) return null;
        if (strength === 1) return { label: "Weak",   color: "bg-rose-400",    text: "text-rose-500"    };
        if (strength === 2) return { label: "Fair",   color: "bg-amber-400",   text: "text-amber-500"   };
        if (strength === 3) return { label: "Good",   color: "bg-blue-400",    text: "text-blue-500"    };
        if (strength === 4) return { label: "Strong", color: "bg-emerald-400", text: "text-emerald-500" };
        return null;
    };

    const strengthInfo = getStrengthInfo();


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!password || !confirm)
            return setError("All fields are required");

        if (password.length < 6)
            return setError("Password must be at least 6 characters");

        if (password !== confirm)
            return setError("Passwords do not match");

        setLoading(true);

        try {
            const res = await handleResetPassword({
                token,
                password,
                confirmPassword: confirm,
            });

            if (res.success) {
                setIsSuccess(true);
                setTimeout(() => navigate("/login"), 3000);
            } else {
                setError(res.message || "Reset failed. Link may have expired.");
            }
        } catch (err) {
            setError(err.message || "Server unreachable. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative"
            style={{
                background: "linear-gradient(135deg, #faf9f7 0%, #f5f3ff 30%, #fdf2f8 60%, #f8fafc 100%)",
            }}
        >
            {/* Floating Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-violet-200/40 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-fuchsia-200/30 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-100/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-[420px]">

                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
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

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-200/60 border border-white/50 p-8">

                    {/* ── Success State ──────────────────────────────── */}
                    {isSuccess ? (
                        <div className="text-center space-y-5">

                            {/* Success Icon */}
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 mb-2">
                                    Password Reset!
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Your password has been updated successfully.
                                    Redirecting to login in 3 seconds...
                                </p>
                            </div>

                            {/* Auto Redirect Progress Bar */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                    style={{ animation: "progress 3s linear forwards" }}
                                />
                            </div>

                            <button
                                onClick={() => navigate("/login")}
                                className="w-full h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition"
                            >
                                Go to Login
                            </button>

                            <style>{`
                                @keyframes progress {
                                    from { width: 0%; }
                                    to   { width: 100%; }
                                }
                            `}</style>
                        </div>

                    ) : (
                        /* ── Form State ──────────────────────────────── */
                        <>
                            {/* Header */}
                            <div className="mb-7 text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                </div>
                                <h2 className="text-[26px] font-extrabold text-slate-800 tracking-tight mb-1.5">
                                    Reset Password
                                </h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    Create a strong new password for your account
                                </p>
                            </div>

                            {/* Error Banner */}
                            {error && (
                                <div className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-rose-700 text-sm font-semibold">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* New Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                            placeholder="Enter new password"
                                            className="w-full h-11 px-4 pr-10 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <EyeIcon
                                                show={showPassword}
                                                onToggle={() => setShowPassword((p) => !p)}
                                            />
                                        </div>
                                    </div>

                                    {/* Strength Bar */}
                                    {password && strengthInfo && (
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                            strength >= i ? strengthInfo.color : "bg-slate-200"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className={`text-xs font-semibold ${strengthInfo.text}`}>
                                                {strengthInfo.label} password
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirm}
                                            onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                                            placeholder="Re-enter new password"
                                            className={`w-full h-11 px-4 pr-16 border rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                                                confirm && password !== confirm
                                                    ? "border-rose-300 focus:ring-rose-400"
                                                    : confirm && password === confirm
                                                    ? "border-emerald-300 focus:ring-emerald-400"
                                                    : "border-slate-200 focus:ring-violet-400"
                                            }`}
                                        />

                                        {/* Match Icon */}
                                        {confirm && (
                                            <div className="absolute right-9 top-1/2 -translate-y-1/2">
                                                {password === confirm ? (
                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}

                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <EyeIcon
                                                show={showConfirm}
                                                onToggle={() => setShowConfirm((p) => !p)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Password Requirements */}
                                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                                    <p className="text-xs font-semibold text-slate-500 mb-2">
                                        Password must have:
                                    </p>
                                    {[
                                        { rule: password.length >= 6,          label: "At least 6 characters"  },
                                        { rule: /[A-Z]/.test(password),        label: "One uppercase letter"   },
                                        { rule: /[0-9]/.test(password),        label: "One number"             },
                                        { rule: /[^A-Za-z0-9]/.test(password), label: "One special character"  },
                                    ].map(({ rule, label }) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                                rule ? "bg-emerald-100" : "bg-slate-200"
                                            }`}>
                                                {rule ? (
                                                    <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                )}
                                            </div>
                                            <span className={`text-xs transition-colors ${
                                                rule ? "text-emerald-600 font-medium" : "text-slate-400"
                                            }`}>
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </button>

                                {/* Back to Login */}
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="w-full h-11 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
                                >
                                    Back to Login
                                </button>

                            </form>
                        </>
                    )}

                </div>

                {/* Footer */}
                <p className="text-center text-[11px] text-slate-400 font-medium mt-6">
                    © {new Date().getFullYear()} FieldTracking · All rights reserved
                </p>

            </div>
        </div>
    );
};

export default ResetPassword;