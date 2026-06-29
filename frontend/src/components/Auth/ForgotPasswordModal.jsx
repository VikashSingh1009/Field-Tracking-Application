import { useState } from "react";
import { handleForgotPassword } from "../../api/authHandler";

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) return setError("Email is required");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email");

    setLoading(true);
    setError("");

    try {
      await handleForgotPassword({ email });
      setIsSuccess(true);
    } catch {
      setError("Server unreachable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ── Backdrop ──────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-1">
            Forgot Password?
          </h3>
          <p className="text-sm text-slate-500">
            Enter your registered email and we'll send you a reset link.
          </p>
        </div>

        {/* ── Success State ─────────────────────────────────────── */}
        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-emerald-700 text-sm font-medium">
                If an account exists with this email, a password reset link has been sent. Please check your inbox.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition"
            >
              Back to Login
            </button>
          </div>

        ) : (
          /* ── Form State ───────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Error */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-rose-600 text-xs font-medium">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Enter your registered email"
                className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            {/* Cancel */}
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>

          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordModal;