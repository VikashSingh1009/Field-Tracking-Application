// src/components/ui/QuickAddModal.jsx
import { useState } from "react";
import { X, Plus, Loader } from "lucide-react";

const QuickAddModal = ({ 
    title,          // "Add New Location Type"
    label,          // "Location Type Name"
    placeholder,    // "e.g. Square"
    onClose, 
    onAdd           // function to call with new value
}) => {
    const [value,   setValue]   = useState("");
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!value.trim()) {
            setError(`${label} is required`);
            return;
        }
        setLoading(true);
        setError("");
        try {
            await onAdd(value.trim()); // ✅ Call parent handler
            onClose();                  // ✅ Close modal on success
        } catch (err) {
            setError(err.message || "Failed to add. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // ── Backdrop ──────────────────────────────────────────
        <div className="fixed inset-0 z-[999] flex items-center 
                        justify-center bg-black/40 backdrop-blur-sm">

            {/* ── Modal Box ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-2xl w-full 
                            max-w-sm mx-4 overflow-hidden
                            animate-in fade-in slide-in-from-bottom-4">

                {/* ── Header ────────────────────────────────── */}
                <div className="flex items-center justify-between 
                                px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-violet-100 rounded-xl 
                                        flex items-center justify-center">
                            <Plus size={16} className="text-violet-600" />
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-800">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg 
                                   transition-colors text-slate-400"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Form ──────────────────────────────────── */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold 
                                          text-slate-600 mb-1.5">
                            {label} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                setError("");
                            }}
                            placeholder={placeholder}
                            autoFocus
                            className="w-full px-3.5 py-2.5 border-2 border-slate-200 
                                       rounded-xl text-sm focus:outline-none 
                                       focus:ring-4 focus:ring-violet-500/10 
                                       focus:border-violet-500 transition-all"
                        />

                        {/* ── Error ─────────────────────────── */}
                        {error && (
                            <p className="mt-1.5 text-xs text-red-500 
                                          font-medium flex items-center gap-1">
                                <span>⚠️</span> {error}
                            </p>
                        )}
                    </div>

                    {/* ── Buttons ───────────────────────────── */}
                    <div className="flex gap-2 justify-end pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2.5 text-xs font-semibold 
                                       text-slate-600 bg-slate-100 
                                       hover:bg-slate-200 rounded-xl 
                                       transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !value.trim()}
                            className="px-4 py-2.5 text-xs font-semibold 
                                       text-white bg-violet-600 
                                       hover:bg-violet-700 rounded-xl 
                                       flex items-center gap-2 transition-all 
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       shadow-md shadow-violet-500/20"
                        >
                            {loading ? (
                                <>
                                    <Loader size={13} 
                                            className="animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus size={13} />
                                    Add
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickAddModal;