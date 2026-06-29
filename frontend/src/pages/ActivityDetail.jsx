// ActivityDetail.jsx
// ✅ ONLY THESE PARTS CHANGE — baaki sab EXACTLY SAME

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/client";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  MapPin, Camera, X, CheckCircle, AlertCircle, Loader,
  ChevronLeft, ChevronRight, ZoomIn, ArrowLeft,
  Activity, Clock, Image as ImageIcon, Send,
  // ✅ ADD ONLY THESE 2 NEW ICONS
  AlertTriangle, Info,
} from "lucide-react";

// ════════════════════════════════════════════
// ✅ ADD THIS CONSTANT — Statuses that need reason
// ════════════════════════════════════════════
const REASON_REQUIRED_STATUSES = ["Incomplete", "Delayed", "On Hold"];

/* ═══════════ HELPERS — ALL UNCHANGED ═══════════ */

const captureGPS = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ success: false, error: "GPS not supported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        success: true,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy)
      }),
      (err) => {
        const map = { 1: "permission_denied", 2: "position_unavailable", 3: "timeout" };
        resolve({ success: false, error: map[err.code] || "error" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

// Lightbox — UNCHANGED
const Lightbox = ({ photos, index, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, onPrev, onNext]);

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all">
        <X size={18} />
      </button>
      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium">
        {index + 1} / {photos.length}
      </span>
      {photos.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all">
          <ChevronLeft size={22} />
        </button>
      )}
      <img
        src={`http://localhost:5000${photos[index]}`}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl"
      />
      {photos.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all">
          <ChevronRight size={22} />
        </button>
      )}
      {photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={(e) => e.stopPropagation()}
              className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === index ? "border-white scale-110 shadow-lg" : "border-white/20 opacity-50 hover:opacity-80"}`}
            >
              <img src={`http://localhost:5000${p}`} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// HistoryPhotos — UNCHANGED
const HistoryPhotos = ({ photos }) => {
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);

  if (!photos || photos.length === 0) return <span className="text-slate-400 text-xs">—</span>;

  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        {photos.slice(0, 3).map((p, i) => (
          <button
            key={i}
            onClick={() => { setLbIdx(i); setLbOpen(true); }}
            className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-violet-400 transition-all group shrink-0"
          >
            <img src={`http://localhost:5000${p}`} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {i === 2 && photos.length > 3 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">+{photos.length - 3}</span>
              </div>
            )}
          </button>
        ))}
      </div>
      {lbOpen && (
        <Lightbox
          photos={photos}
          index={lbIdx}
          onClose={() => setLbOpen(false)}
          onPrev={() => setLbIdx((i) => (i - 1 + photos.length) % photos.length)}
          onNext={() => setLbIdx((i) => (i + 1) % photos.length)}
        />
      )}
    </>
  );
};

// GPSBadge — UNCHANGED
const GPSBadge = ({ status, gpsData, onCapture }) => {
  const cfg = {
    idle: {
      cls: "bg-slate-50 border-slate-200 text-slate-500",
      icon: <MapPin size={13} className="text-slate-400" />,
      label: "Capture GPS location (recommended)",
      showBtn: true,
      btnText: "Capture"
    },
    getting: {
      cls: "bg-blue-50 border-blue-200 text-blue-600",
      icon: <Loader size={13} className="animate-spin text-blue-500" />,
      label: "Getting your location...",
      showBtn: false
    },
    success: {
      cls: "bg-emerald-50 border-emerald-200 text-emerald-700",
      icon: <CheckCircle size={13} className="text-emerald-500" />,
      label: `GPS ready ✓  (±${gpsData?.accuracy || 0}m)`,
      showBtn: false
    },
    permission_denied: {
      cls: "bg-rose-50 border-rose-200 text-rose-600",
      icon: <AlertCircle size={13} className="text-rose-500" />,
      label: "Permission denied — open browser settings → allow location",
      showBtn: true, btnText: "Retry"
    },
    position_unavailable: {
      cls: "bg-amber-50 border-amber-200 text-amber-700",
      icon: <AlertCircle size={13} className="text-amber-500" />,
      label: "GPS signal weak — move to open area and retry",
      showBtn: true, btnText: "Retry"
    },
    timeout: {
      cls: "bg-amber-50 border-amber-200 text-amber-700",
      icon: <AlertCircle size={13} className="text-amber-500" />,
      label: "Location timed out — please retry",
      showBtn: true, btnText: "Retry"
    },
    error: {
      cls: "bg-rose-50 border-rose-200 text-rose-600",
      icon: <AlertCircle size={13} className="text-rose-400" />,
      label: "GPS unavailable — tap retry",
      showBtn: true, btnText: "Retry"
    },
    denied: {
      cls: "bg-rose-50 border-rose-200 text-rose-600",
      icon: <AlertCircle size={13} className="text-rose-500" />,
      label: "Permission denied — open browser settings → allow location",
      showBtn: true, btnText: "Retry"
    },
  };

  const c = cfg[status] || cfg.idle;

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 text-[12px] font-medium transition-all ${c.cls}`}>
      {c.icon}
      <span className="flex-1">{c.label}</span>
      {status === "success" && gpsData && (
        <span className="text-[10px] font-mono text-emerald-600 opacity-70">
          {gpsData.latitude.toFixed(4)}, {gpsData.longitude.toFixed(4)}
        </span>
      )}
      {c.showBtn && (
        <button
          type="button"
          onClick={onCapture}
          className="text-[11px] font-semibold text-violet-600 bg-white px-2.5 py-1 rounded-lg border border-violet-200 hover:bg-violet-50 transition-colors"
        >
          {c.btnText}
        </button>
      )}
    </div>
  );
};

/* ═══════════ MAIN COMPONENT ═══════════ */

const ActivityDetail = () => {
  const { id } = useParams();
  const { role } = useAuth();
  const nav = useNavigate();

  const [loading,   setLoading]   = useState(true);
  const [act,       setAct]       = useState(null);
  const [hist,      setHist]      = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({
    status: "", progress_pct: "", remarks: "", photo_type: ""
  });
  const [files,     setFiles]     = useState([]);
  const [previews,  setPreviews]  = useState([]);
  const fileRef   = useRef(null);
  const cameraRef = useRef(null);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [gpsData,   setGpsData]   = useState(null);
  const [lbOpen,    setLbOpen]    = useState(false);
  const [lbIdx,     setLbIdx]     = useState(0);
  const [lbPhotos,  setLbPhotos]  = useState([]);

  // ✅ ADD ONLY THIS — computed value, no new state needed
  const needsReason = REASON_REQUIRED_STATUSES.includes(form.status);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const url = role === "Supervisor"
        ? `/supervisor/activities/${id}`
        : `/worker/tasks/${id}`;
      const r = await API.get(url);
      const d = r.data.data || r.data.activity || r.data.task || {};
      setAct(d);
      setHist(d.updates || r.data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFileChange = (e) => {
    e.preventDefault();
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 10) {
      toast.error("Maximum 10 photos allowed");
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCaptureGPS = useCallback(async () => {
    setGpsStatus("getting");
    const result = await captureGPS();
    if (result.success) {
      setGpsData(result);
      setGpsStatus("success");
    } else {
      setGpsData(null);
      setGpsStatus(result.error || "error");
    }
  }, []);

  // ✅ UPDATED handleSubmit — adds reason validation only
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.status && !form.progress_pct && !form.remarks && files.length === 0) {
      toast.error("Please fill at least one field or add photos");
      return;
    }

    // ✅ NEW VALIDATION — reason required for incomplete statuses
    if (needsReason && !form.remarks?.trim()) {
      toast.error(`⚠️ Reason is required when status is "${form.status}"`);
      return;
    }

    // ✅ NEW VALIDATION — photo required for incomplete statuses
    if (needsReason && files.length === 0) {
      toast.error(`📸 Please upload at least one photo for "${form.status}" status`);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (form.status)       fd.append("status",       form.status);
      if (form.progress_pct) fd.append("progress_pct", form.progress_pct);
      if (form.remarks)      fd.append("remarks",      form.remarks);
      if (form.photo_type)   fd.append("photo_type",   form.photo_type);

      if (gpsData?.success) {
        fd.append("latitude",  gpsData.latitude);
        fd.append("longitude", gpsData.longitude);
        fd.append("accuracy",  gpsData.accuracy);
      }

      files.forEach((f) => fd.append("photos", f));

      const url = role === "Supervisor"
        ? `/supervisor/activities/${id}/update`
        : `/worker/tasks/${id}/update`;

      await API.post(url, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Update submitted successfully!");
      setForm({ status: "", progress_pct: "", remarks: "", photo_type: "" });
      setFiles([]);
      setPreviews([]);
      setGpsStatus("idle");
      setGpsData(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80 gap-4">
      <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading activity details...</p>
    </div>
  );

  if (!act) return (
    <p className="text-center text-slate-400 py-10 font-medium">Not found</p>
  );

  const info = [
    { l: "Location",     v: act.location?.location_name },
    { l: "Activity",     v: act.activity?.activity_name },
    { l: "Start Date",   v: act.planned_start_date },
    { l: "End Date",     v: act.planned_end_date },
    { l: "Status",       v: act.status },
    { l: "Progress",     v: `${act.progress_pct || 0}%` },
    { l: "Worker",       v: act.worker?.full_name },
    { l: "Instructions", v: act.worker_instructions },
  ];

  return (
    <div className="space-y-5">

      {/* Back Button — UNCHANGED */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => nav(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500
                   hover:text-violet-600 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </motion.button>

      {/* Details Card — UNCHANGED */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
            <Activity size={17} className="text-violet-600" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
            Activity Details
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {info.map((item, i) => (
            <div key={i} className="bg-slate-50/80 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {item.l}
              </p>
              <p className="text-[13px] font-semibold text-slate-700">
                {item.v || "—"}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════
          Update Form — MOSTLY UNCHANGED
          Only 3 small additions marked with ✅ NEW
      ══════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
            <Send size={17} className="text-violet-600" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
            Update Status
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">

          {/* Row 1: Status + Progress — SMALL CHANGE: added Incomplete option */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={`w-full px-3.5 py-2.5 border-2 rounded-xl text-sm
                           focus:outline-none focus:ring-4 transition-all
                           ${needsReason
                  ? "border-amber-300 focus:ring-amber-500/10 focus:border-amber-500 bg-amber-50/30"
                  : "border-slate-200 focus:ring-violet-500/10 focus:border-violet-500"
                }`}
              >
                <option value="">Select Status</option>
                {/* ✅ ADDED "Incomplete" option — others unchanged */}
                {[
                  "Not Started",
                  "In Progress",
                  "Completed",
                  "Incomplete",  // ✅ NEW
                  "Delayed",
                  "On Hold"
                ].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <Input
              label="Progress %"
              type="number"
              min="0"
              max="100"
              value={form.progress_pct}
              onChange={(e) => setForm({ ...form, progress_pct: e.target.value })}
              placeholder="0 — 100"
            />
          </div>

          {/* ✅ NEW SECTION 1 — Warning banner (shows only for incomplete statuses) */}
          <AnimatePresence>
            {needsReason && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3 px-4 py-3.5 bg-amber-50
                           border-2 border-amber-200 rounded-2xl"
              >
                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold text-amber-700">
                    Reason & Photo Required for "{form.status}"
                  </p>
                  <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                    Please explain why the task is {form.status.toLowerCase()} and
                    upload at least one photo as evidence.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 2: Remarks — SMALL CHANGE: label changes + required indicator */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {/* ✅ LABEL CHANGES based on status */}
              {needsReason ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-rose-500">*</span>
                  Reason for {form.status}
                  <span className="text-rose-400 font-normal">(required)</span>
                </span>
              ) : (
                "Remarks"
              )}
            </label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              rows={needsReason ? 4 : 3}
              placeholder={
                needsReason
                  ? `Explain why the task is ${form.status.toLowerCase()}...
e.g. Material not available, Site access blocked, Weather issue...`
                  : "Add remarks..."
              }
              className={`w-full px-3.5 py-2.5 border-2 rounded-xl text-sm
                         focus:outline-none focus:ring-4 resize-none transition-all
                         ${needsReason && !form.remarks?.trim()
                ? "border-rose-200 focus:ring-rose-500/10 focus:border-rose-400 bg-rose-50/20"
                : needsReason && form.remarks?.trim()
                  ? "border-emerald-300 focus:ring-emerald-500/10 focus:border-emerald-500 bg-emerald-50/20"
                  : "border-slate-200 focus:ring-violet-500/10 focus:border-violet-500"
              }`}
            />
            {/* ✅ Character count for reason */}
            {needsReason && (
              <div className="flex items-center justify-between mt-1.5">
                <p className={`text-[10px] font-medium ${
                  form.remarks?.trim()
                    ? "text-emerald-600"
                    : "text-rose-400"
                }`}>
                  {form.remarks?.trim()
                    ? "✓ Reason provided"
                    : "⚠️ Please enter a reason"
                  }
                </p>
                <p className="text-[10px] text-slate-400">
                  {form.remarks?.length || 0} characters
                </p>
              </div>
            )}
          </div>

          {/* Row 3: Photo Type — UNCHANGED */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Photo Type
              {/* ✅ Required asterisk for incomplete */}
              {needsReason && (
                <span className="text-rose-500 ml-1 font-normal text-[10px]">
                  * required
                </span>
              )}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "Before", emoji: "🔵", active: "bg-amber-500 text-white border-amber-500" },
                { key: "During", emoji: "🟡", active: "bg-blue-500 text-white border-blue-500" },
                { key: "After",  emoji: "🟢", active: "bg-emerald-500 text-white border-emerald-500" },
                { key: "Issue",  emoji: "🔴", active: "bg-rose-500 text-white border-rose-500" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setForm({ ...form, photo_type: t.key })}
                  className={`py-2 rounded-xl text-[12px] font-semibold border-2 transition-all
                    ${form.photo_type === t.key
                      ? t.active
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  {t.emoji} {t.key}
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: GPS — UNCHANGED */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              GPS Location{" "}
              <span className="font-normal text-slate-400">(optional but recommended)</span>
            </label>
            <GPSBadge
              status={gpsStatus}
              gpsData={gpsData}
              onCapture={handleCaptureGPS}
            />
          </div>

          {/* Row 5: Photos — SMALL CHANGE: required indicator for incomplete */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Photos{" "}
              {needsReason ? (
                <span className="text-rose-500 font-normal text-[10px]">
                  * at least 1 required for {form.status}
                </span>
              ) : (
                <span className="font-normal text-slate-400">(max 10, 5MB each)</span>
              )}
            </label>

            {/* Camera + Gallery Buttons — UNCHANGED */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 py-4
                           border-2 border-dashed rounded-2xl transition-all
                           ${needsReason && files.length === 0
                  ? "border-rose-300 bg-rose-50/50 hover:bg-rose-50 text-rose-500 hover:border-rose-400"
                  : "border-violet-200 bg-violet-50/50 hover:bg-violet-50 text-violet-600 hover:border-violet-400"
                }`}
              >
                <Camera size={22} />
                <span className="text-[12px] font-semibold">Take Photo</span>
                <span className="text-[10px] opacity-70">Opens Camera</span>
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-4
                           border-2 border-dashed rounded-2xl border-slate-200
                           bg-slate-50 hover:bg-slate-100 hover:border-slate-400
                           transition-all text-slate-600"
              >
                <ImageIcon size={22} />
                <span className="text-[12px] font-semibold">From Gallery</span>
                <span className="text-[10px] text-slate-400">Choose Existing</span>
              </button>
            </div>

            {/* Hidden inputs — UNCHANGED */}
            <input ref={cameraRef} type="file" accept="image/*"
                   capture="environment" className="hidden" onChange={handleFileChange} />
            <input ref={fileRef} type="file" multiple
                   accept="image/*" className="hidden" onChange={handleFileChange} />

            {/* Photo count indicator — UNCHANGED */}
            {files.length > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50
                             rounded-xl border border-emerald-200 mb-3">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-[12px] font-medium text-emerald-700">
                  {files.length} photo(s) ready to upload
                </span>
              </div>
            )}

            {/* ✅ NEW — Photo required warning */}
            {needsReason && files.length === 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50
                             rounded-xl border border-rose-200 mb-3">
                <AlertCircle size={14} className="text-rose-500" />
                <span className="text-[12px] font-medium text-rose-600">
                  Please upload at least 1 photo as evidence
                </span>
              </div>
            )}

            {/* Photo Previews — UNCHANGED */}
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={src}
                      alt=""
                      onClick={() => { setLbPhotos(previews); setLbIdx(idx); setLbOpen(true); }}
                      className="w-16 h-16 object-cover rounded-xl border-2
                                 border-slate-200 cursor-zoom-in
                                 hover:border-violet-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500
                                 text-white rounded-full flex items-center justify-center
                                 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {files.length < 10 && (
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="w-16 h-16 border-2 border-dashed border-violet-200
                               rounded-xl flex flex-col items-center justify-center
                               text-violet-400 hover:border-violet-400 hover:bg-violet-50
                               transition-colors"
                  >
                    <Camera size={14} />
                    <span className="text-[9px] mt-1">Add</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ✅ NEW SECTION 2 — Checklist before submit (only for incomplete) */}
          <AnimatePresence>
            {needsReason && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4"
              >
                <p className="text-[11px] font-bold text-slate-500 uppercase
                               tracking-wider mb-3 flex items-center gap-2">
                  <Info size={12} />
                  Submission Checklist
                </p>
                <div className="space-y-2">
                  {[
                    {
                      done: !!form.status,
                      text: "Status selected"
                    },
                    {
                      done: !!form.remarks?.trim(),
                      text: `Reason entered for "${form.status}"`
                    },
                    {
                      done: files.length > 0,
                      text: "At least 1 photo uploaded"
                    },
                    {
                      done: !!form.photo_type,
                      text: "Photo type selected (optional)"
                    },
                    {
                      done: gpsStatus === "success",
                      text: "GPS location captured (optional)"
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center
                                      justify-center flex-shrink-0 transition-all
                                      ${item.done
                          ? "bg-emerald-500"
                          : "bg-slate-200"
                        }`}>
                        {item.done && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none"
                               stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[12px] font-medium transition-all
                        ${item.done ? "text-emerald-700" : "text-slate-400"}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button — UNCHANGED */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              loading={saving}
            >
              Submit Update
              {(gpsStatus === "success" || files.length > 0) && (
                <span className="ml-2 text-[11px] bg-white/20 px-2 py-0.5 rounded-full">
                  {gpsStatus === "success" && "📍 GPS"}
                  {files.length > 0 && ` 📸 ${files.length}`}
                </span>
              )}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Update History — COMPLETELY UNCHANGED */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
      >
        <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
              <Clock size={15} className="text-violet-600" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
              Update History
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold bg-slate-50
                           px-3 py-1.5 rounded-xl border border-slate-100">
            {hist.length} updates
          </span>
        </div>

        {hist.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Clock size={22} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-medium">No updates yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/40">
                  {["Date & Time", "Status", "Progress", "Photos", "GPS", "Remarks", "By"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold
                                           text-slate-400 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hist.map((h, i) => (
                  <tr key={h.id || i}
                      className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] text-slate-600 font-semibold">
                        {new Date(h.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short"
                        })}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(h.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status={h.new_status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full"
                               style={{ width: `${h.new_progress || 0}%` }} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-500">
                          {h.new_progress ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <HistoryPhotos photos={h.photos || []} />
                    </td>
                    <td className="px-4 py-3.5">
                      {h.latitude && h.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] font-semibold
                                     text-emerald-600 hover:text-emerald-700"
                        >
                          <MapPin size={11} /> View
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 max-w-[140px]">
                      <p className="text-[12px] text-slate-500 truncate"
                         title={h.remarks || ""}>
                        {h.remarks || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] text-slate-500 font-medium whitespace-nowrap">
                        {h.updater?.full_name || "—"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Lightbox — UNCHANGED */}
      {lbOpen && lbPhotos.length > 0 && (
        <Lightbox
          photos={lbPhotos}
          index={lbIdx}
          onClose={() => setLbOpen(false)}
          onPrev={() => setLbIdx((i) => (i - 1 + lbPhotos.length) % lbPhotos.length)}
          onNext={() => setLbIdx((i) => (i + 1) % lbPhotos.length)}
        />
      )}
    </div>
  );
};

export default ActivityDetail;














// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import API from '../api/client';
// import Badge from '../components/ui/Badge';
// import Input from '../components/ui/Input';
// import Button from '../components/ui/Button';
// import {
//     MapPin, Camera, X,
//     CheckCircle, AlertCircle,
//     Loader, ChevronLeft,
//     ChevronRight, ZoomIn
// } from 'lucide-react';
  


// // gps helper 
// const captureGPS = () => new Promise((resolve) => {
//     if (!navigator.geolocation) {
//         resolve({ success: false, error: 'GPS not supported' });
//         return;
//     }
//     navigator.geolocation.getCurrentPosition(
//         (pos) => resolve({
//             success:   true,
//             latitude:  pos.coords.latitude,
//             longitude: pos.coords.longitude,
//             accuracy:  Math.round(pos.coords.accuracy)
//         }),
//         (err) => resolve({
//             success: false,
//             error:   err.code === 1
//                 ? 'denied'
//                 : 'unavailable'
//         }),
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
// });

// // photo lightbox 
// const Lightbox = ({ photos, index, onClose, onPrev, onNext }) => {
//     useEffect(() => {
//         const fn = (e) => {
//             if (e.key === 'Escape')     onClose();
//             if (e.key === 'ArrowLeft')  onPrev();
//             if (e.key === 'ArrowRight') onNext();
//         };
//         window.addEventListener('keydown', fn);
//         return () => window.removeEventListener('keydown', fn);
//     }, [onClose, onPrev, onNext]);

//     return (
//         <div
//             onClick={onClose}
//             className="fixed inset-0 z-50 bg-black/90
//                        flex items-center justify-center p-4"
//         >
//             {/* Close */}
//             <button
//                 onClick={onClose}
//                 className="absolute top-4 right-4 w-9 h-9 bg-white/10
//                            hover:bg-white/20 rounded-full flex items-center
//                            justify-center text-white transition-colors"
//             >
//                 <X size={18} />
//             </button>

//             {/* Counter */}
//             <span className="absolute top-4 left-1/2 -translate-x-1/2
//                              text-white/60 text-sm">
//                 {index + 1} / {photos.length}
//             </span>

//             {/* Prev */}
//             {photos.length > 1 && (
//                 <button
//                     onClick={(e) => { e.stopPropagation(); onPrev(); }}
//                     className="absolute left-4 w-10 h-10 bg-white/10
//                                hover:bg-white/20 rounded-full flex items-center
//                                justify-center text-white transition-colors"
//                 >
//                     <ChevronLeft size={22} />
//                 </button>
//             )}

//             {/* Image */}
//             <img
//                 src={`http://localhost:5000${photos[index]}`}
//                 alt=""
//                 onClick={(e) => e.stopPropagation()}
//                 className="max-h-[85vh] max-w-[85vw]
//                            object-contain rounded-xl"
//             />

//             {/* Next */}
//             {photos.length > 1 && (
//                 <button
//                     onClick={(e) => { e.stopPropagation(); onNext(); }}
//                     className="absolute right-4 w-10 h-10 bg-white/10
//                                hover:bg-white/20 rounded-full flex items-center
//                                justify-center text-white transition-colors"
//                 >
//                     <ChevronRight size={22} />
//                 </button>
//             )}

//             {/* Thumbnails */}
//             {photos.length > 1 && (
//                 <div className="absolute bottom-4 left-1/2
//                                 -translate-x-1/2 flex gap-2">
//                     {photos.map((p, i) => (
//                         <button
//                             key={i}
//                             onClick={(e) => e.stopPropagation()}
//                             className={`w-12 h-12 rounded-lg overflow-hidden
//                                         border-2 transition-all
//                                         ${i === index
//                                             ? 'border-white scale-110'
//                                             : 'border-white/30 opacity-50'
//                                         }`}
//                         >
//                             <img
//                                 src={`http://localhost:5000${p}`}
//                                 alt=""
//                                 className="w-full h-full object-cover"
//                             />
//                         </button>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };

// // history photo strap 
// const HistoryPhotos = ({ photos }) => {
//     const [lbOpen, setLbOpen] = useState(false);
//     const [lbIdx,  setLbIdx]  = useState(0);

//     if (!photos || photos.length === 0) return <span className="text-slate-400">—</span>;

//     return (
//         <>
//             <div className="flex gap-1.5 flex-wrap">
//                 {photos.slice(0, 3).map((p, i) => (
//                     <button
//                         key={i}
//                         onClick={() => { setLbIdx(i); setLbOpen(true); }}
//                         className="relative w-10 h-10 rounded-md overflow-hidden
//                                    border border-slate-200 hover:border-blue-400
//                                    transition-all group flex-shrink-0"
//                     >
//                         <img
//                             src={`http://localhost:5000${p}`}
//                             alt=""
//                             className="w-full h-full object-cover"
//                         />
//                         <div className="absolute inset-0 bg-black/0
//                                         group-hover:bg-black/20 transition-colors
//                                         flex items-center justify-center">
//                             <ZoomIn
//                                 size={12}
//                                 className="text-white opacity-0
//                                            group-hover:opacity-100 transition-opacity"
//                             />
//                         </div>
//                         {/* +more badge */}
//                         {i === 2 && photos.length > 3 && (
//                             <div className="absolute inset-0 bg-black/50
//                                             flex items-center justify-center">
//                                 <span className="text-white text-[9px] font-bold">
//                                     +{photos.length - 3}
//                                 </span>
//                             </div>
//                         )}
//                     </button>
//                 ))}
//             </div>

//             {lbOpen && (
//                 <Lightbox
//                     photos={photos}
//                     index={lbIdx}
//                     onClose={() => setLbOpen(false)}
//                     onPrev={() => setLbIdx(i => (i - 1 + photos.length) % photos.length)}
//                     onNext={() => setLbIdx(i => (i + 1) % photos.length)}
//                 />
//             )}
//         </>
//     );
// };


// // gps status badge (inline in form )
// const GPSBadge = ({ status, gpsData, onCapture }) => {
//     const cfg = {
//         idle: {
//             cls:     'bg-slate-50 border-slate-200 text-slate-500',
//             icon:    <MapPin size={13} className="text-slate-400" />,
//             label:   'Capture GPS location (recommended)',
//             showBtn: true,
//             btnText: 'Capture'
//         },
//         getting: {
//             cls:     'bg-blue-50 border-blue-200 text-blue-600',
//             icon:    <Loader size={13} className="animate-spin text-blue-500" />,
//             label:   'Getting your location...',
//             showBtn: false
//         },
//         success: {
//             cls:     'bg-emerald-50 border-emerald-200 text-emerald-700',
//             icon:    <CheckCircle size={13} className="text-emerald-500" />,
//             label:   `GPS ready ✓  (±${gpsData?.accuracy || 0}m)`,
//             showBtn: false
//         },

//         // ── FIXED: Clear messages per error type ──
//         permission_denied: {
//             cls:     'bg-red-50 border-red-200 text-red-600',
//             icon:    <AlertCircle size={13} className="text-red-500" />,
//             label:   'Permission denied — open browser settings → allow location',
//             showBtn: true,
//             btnText: 'Retry'
//         },
//         position_unavailable: {
//             cls:     'bg-amber-50 border-amber-200 text-amber-700',
//             icon:    <AlertCircle size={13} className="text-amber-500" />,
//             label:   'GPS signal weak — move to open area and retry',
//             showBtn: true,
//             btnText: 'Retry'
//         },
//         timeout: {
//             cls:     'bg-amber-50 border-amber-200 text-amber-700',
//             icon:    <AlertCircle size={13} className="text-amber-500" />,
//             label:   'Location timed out — please retry',
//             showBtn: true,
//             btnText: 'Retry'
//         },
//         error: {
//             cls:     'bg-red-50 border-red-200 text-red-600',
//             icon:    <AlertCircle size={13} className="text-red-400" />,
//             label:   'GPS unavailable — tap retry',
//             showBtn: true,
//             btnText: 'Retry'
//         },

//         // Keep old 'denied' as fallback
//         denied: {
//             cls:     'bg-red-50 border-red-200 text-red-600',
//             icon:    <AlertCircle size={13} className="text-red-500" />,
//             label:   'Permission denied — open browser settings → allow location',
//             showBtn: true,
//             btnText: 'Retry'
//         },
//     };

//     const c = cfg[status] || cfg.idle;

//     return (
//         <div className={`flex items-center gap-2.5 px-3 py-2
//                          rounded-lg border text-[12px] font-medium
//                          transition-all ${c.cls}`}>
//             {c.icon}
//             <span className="flex-1">{c.label}</span>

//             {/* Coordinates on success */}
//             {status === 'success' && gpsData && (
//                 <span className="text-[10px] font-mono
//                                  text-emerald-600 opacity-70">
//                     {gpsData.latitude.toFixed(4)},
//                     {gpsData.longitude.toFixed(4)}
//                 </span>
//             )}

//             {c.showBtn && (
//                 <button
//                     type="button"
//                     onClick={onCapture}
//                     className="text-[11px] font-semibold text-blue-600
//                                bg-white px-2 py-0.5 rounded-md
//                                border border-blue-200 hover:bg-blue-50
//                                transition-colors"
//                 >
//                     {c.btnText}
//                 </button>
//             )}
//         </div>
//     );
// };


// // main component 
// const ActivityDetail = () => {
//     const { id }  = useParams();
//     const { role } = useAuth();
//     const nav      = useNavigate();

//     // data
//     const [loading, setLoading] = useState(true);
//     const [act,     setAct]     = useState(null);
//     const [hist,    setHist]    = useState([]);

//     // form
//     const [saving,  setSaving]  = useState(false);
//     const [form,    setForm]    = useState({
//         status:       '',
//         progress_pct: '',
//         remarks:      '',
//         photo_type:   ''
//     });

//     // photos
//     const [files,       setFiles]       = useState([]);
//     const [previews,    setPreviews]    = useState([]);
//     const fileRef = useRef(null);
//     const cameraRef = useRef(null); 

//     // gps 
//     const [gpsStatus,   setGpsStatus]   = useState('idle');
//     const [gpsData,     setGpsData]     = useState(null);

//     // lightbox 
//     const [lbOpen,  setLbOpen]  = useState(false);
//     const [lbIdx,   setLbIdx]   = useState(0);
//     const [lbPhotos,setLbPhotos]= useState([]);

//     // fetch
//     const fetchData = useCallback(async () => {
//         try {
//             setLoading(true);
//             const url = role === 'Supervisor'
//                 ? `/supervisor/activities/${id}`
//                 : `/worker/tasks/${id}`;
//             const r = await API.get(url);
//             const d = r.data.data || r.data.activity
//                    || r.data.task || {};
//             setAct(d);
//             setHist(d.updates || r.data.history || []);
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     }, [id, role]);

//     useEffect(() => { 
//         fetchData(); 
//     }, [fetchData]);

//     // photo selection
//     const handleFileChange = (e) => {
//         const selected = Array.from(e.target.files);

//         // Max 10 check
//         if (files.length + selected.length > 10) {
//             alert('Maximum 10 photos allowed');
//             return;
//         }

//         setFiles(prev => [...prev, ...selected]);

//         // Generate previews
//         selected.forEach(file => {
//             const reader = new FileReader();
//             reader.onload = (ev) => {
//                 setPreviews(prev => [...prev, ev.target.result]);
//             };
//             reader.readAsDataURL(file);
//         });

//         // Reset input so same file can be reselected
//         e.target.value = '';
//     };

//     const removeFile = (index) => {
//         setFiles(prev    => prev.filter((_, i) => i !== index));
//         setPreviews(prev => prev.filter((_, i) => i !== index));
//     };

//     // gps capture
//     const handleCaptureGPS = useCallback(async () => {
//         setGpsStatus('getting');
//         const result = await captureGPS();

//         if (result.success) {
//             setGpsData(result);
//             setGpsStatus('success');
//         } else {
//             setGpsData(null);
//             // setGpsStatus(result.error === 'denied' ? 'denied' : 'error');
//             switch (result.errorCode){
//                 case 1:
//                     setGpsStatus('permission_denied');
//                     break;
//                 case 2: 
//                     setGpsStatus('position_unavailable');
//                     break;
//                 case 3: 
//                     setGpsStatus('timeout');
//                     break;
//                 default:
//                     setGpsStatus('error');
//             }
//         }
//     }, []);

//     // submit
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setSaving(true);
//         try {
//             const fd = new FormData();

//             // Form fields
//             if (form.status)       fd.append('status',       form.status);
//             if (form.progress_pct) fd.append('progress_pct', form.progress_pct);
//             if (form.remarks)      fd.append('remarks',       form.remarks);
//             if (form.photo_type)   fd.append('photo_type',   form.photo_type);

//             // GPS data (if captured)
//             if (gpsData?.success) {
//                 fd.append('latitude',  gpsData.latitude);
//                 fd.append('longitude', gpsData.longitude);
//                 fd.append('accuracy',  gpsData.accuracy);
//             }

//             // Photos
//             files.forEach(f => fd.append('photos', f));

//             const url = role === 'Supervisor'
//                 ? `/supervisor/activities/${id}/update`
//                 : `/worker/tasks/${id}/update`;

//             await API.post(url, fd, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });

//             // Reset form
//             setForm({
//                 status: '', progress_pct: '',
//                 remarks: '', photo_type: ''
//             });
//             setFiles([]);
//             setPreviews([]);
//             setGpsStatus('idle');
//             setGpsData(null);

//             // Refresh data
//             await fetchData();

//         } catch (err) {
//             alert(err.response?.data?.message || 'Update failed');
//         } finally {
//             setSaving(false);
//         }
//     };

//     // loading / not found
//     if (loading) return (
//         <div className="flex items-center justify-center h-80">
//             <div className="w-6 h-6 border-[3px] border-blue-600
//                             border-t-transparent rounded-full animate-spin" />
//         </div>
//     );

//     if (!act) return (
//         <p className="text-center text-slate-400 py-10">Not found</p>
//     );

//     // info rows 
//     const info = [
//         { l: 'Location',     v: act.location?.location_name   },
//         { l: 'Activity',     v: act.activity?.activity_name   },
//         { l: 'Start Date',   v: act.planned_start_date        },
//         { l: 'End Date',     v: act.planned_end_date          },
//         { l: 'Status',       v: act.status                    },
//         { l: 'Progress',     v: `${act.progress_pct || 0}%`  },
//         { l: 'Worker',       v: act.worker?.full_name         },
//         { l: 'Instructions', v: act.worker_instructions       },
//     ];

    
//     return (
//         <div className="space-y-4">

//             {/* back button  */}
//             <button
//                 onClick={() => nav(-1)}
//                 className="flex items-center gap-1.5
//                            text-sm text-slate-500 hover:text-slate-700"
//             >
//                 <svg className="w-4 h-4" fill="none"
//                      stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round"
//                           strokeWidth={2} d="M15 19l-7-7 7-7" />
//                 </svg>
//                 Back
//             </button>

//             {/* activity details  */}
//             <div className="bg-white rounded-xl border
//                             border-slate-200/80 p-5">
//                 <h2 className="text-sm font-bold text-slate-800 mb-4">
//                     Activity Details
//                 </h2>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                     {info.map((item, i) => (
//                         <div key={i} className="bg-slate-50 rounded-lg p-3">
//                             <p className="text-[10px] font-semibold
//                                           text-slate-400 uppercase
//                                           tracking-wide mb-1">
//                                 {item.l}
//                             </p>
//                             <p className="text-[12px] font-medium text-slate-700">
//                                 {item.v || '—'}
//                             </p>
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             {/* update form  */}
//             <div className="bg-white rounded-xl border
//                             border-slate-200/80 p-5">
//                 <h3 className="text-sm font-bold text-slate-800 mb-4">
//                     Update Status
//                 </h3>

//                 <form onSubmit={handleSubmit}
//                       className="space-y-4 max-w-2xl">

//                     {/* Row 1: Status + Progress */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//                         {/* Status */}
//                         <div>
//                             <label className="block text-xs font-semibold
//                                               text-slate-600 mb-1.5">
//                                 Status
//                             </label>
//                             <select
//                                 value={form.status}
//                                 onChange={e => setForm({
//                                     ...form, status: e.target.value
//                                 })}
//                                 className="w-full px-3 py-2 border border-slate-200
//                                            rounded-lg text-sm focus:outline-none
//                                            focus:ring-2 focus:ring-blue-500/20
//                                            focus:border-blue-500"
//                             >
//                                 <option value="">Select Status</option>
//                                 {['Not Started', 'In Progress',
//                                   'Completed', 'Delayed', 'On Hold']
//                                   .map(s => (
//                                     <option key={s} value={s}>{s}</option>
//                                 ))}
//                             </select>
//                         </div>

//                         {/* Progress */}
//                         <Input
//                             label="Progress %"
//                             type="number"
//                             min="0"
//                             max="100"
//                             value={form.progress_pct}
//                             onChange={e => setForm({
//                                 ...form, progress_pct: e.target.value
//                             })}
//                             placeholder="0 — 100"
//                         />
//                     </div>

//                     {/* Row 2: Remarks */}
//                     <div>
//                         <label className="block text-xs font-semibold
//                                           text-slate-600 mb-1.5">
//                             Remarks
//                         </label>
//                         <textarea
//                             value={form.remarks}
//                             onChange={e => setForm({
//                                 ...form, remarks: e.target.value
//                             })}
//                             rows={3}
//                             placeholder="Add remarks..."
//                             className="w-full px-3 py-2 border border-slate-200
//                                        rounded-lg text-sm focus:outline-none
//                                        focus:ring-2 focus:ring-blue-500/20
//                                        focus:border-blue-500 resize-none"
//                         />
//                     </div>

//                     {/* Row 3: Photo Type */}
//                     <div>
//                         <label className="block text-xs font-semibold
//                                           text-slate-600 mb-1.5">
//                             Photo Type
//                         </label>
//                         <div className="grid grid-cols-4 gap-2">
//                             {[
//                                 { key: 'Before', emoji: '🔵', active: 'bg-amber-500 text-white border-amber-500'   },
//                                 { key: 'During', emoji: '🟡', active: 'bg-blue-500 text-white border-blue-500'     },
//                                 { key: 'After',  emoji: '🟢', active: 'bg-emerald-500 text-white border-emerald-500'},
//                                 { key: 'Issue',  emoji: '🔴', active: 'bg-red-500 text-white border-red-500'       },
//                             ].map(t => (
//                                 <button
//                                     key={t.key}
//                                     type="button"
//                                     onClick={() => setForm({
//                                         ...form, photo_type: t.key
//                                     })}
//                                     className={`py-2 rounded-lg text-[12px]
//                                                 font-medium border transition-all
//                                                 ${form.photo_type === t.key
//                                                     ? t.active
//                                                     : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
//                                                 }`}
//                                 >
//                                     {t.emoji} {t.key}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Row 4: GPS Capture */}
//                     <div>
//                         <label className="block text-xs font-semibold
//                                           text-slate-600 mb-1.5">
//                             GPS Location
//                             <span className="ml-1 font-normal
//                                              text-slate-400 normal-case">
//                                 (optional but recommended)
//                             </span>
//                         </label>
//                         <GPSBadge
//                             status={gpsStatus}
//                             gpsData={gpsData}
//                             onCapture={handleCaptureGPS}
//                         />
//                     </div>

//                     {/* Row 5: Photo Upload */}
// <div>
//     <label className="block text-xs font-semibold
//                       text-slate-600 mb-1.5">
//         Photos
//         <span className="ml-1 font-normal
//                          text-slate-400 normal-case">
//             (max 10 photos, 5MB each)
//         </span>
//     </label>

//     {/* ── TWO BUTTONS: Camera + Gallery ── */}
//     <div className="grid grid-cols-2 gap-3 mb-3">

//         {/* Take Photo — Camera */}
//         <button
//             type="button"
//             onClick={() => cameraRef.current?.click()}
//             className="flex flex-col items-center
//                        justify-center gap-2 py-4
//                        border-2 border-dashed rounded-xl
//                        border-blue-200 bg-blue-50/50
//                        hover:bg-blue-50 hover:border-blue-400
//                        transition-all text-blue-600"
//         >
//             <Camera size={22} />
//             <span className="text-[12px] font-semibold">
//                 Take Photo
//             </span>
//             <span className="text-[10px] text-blue-400">
//                 Opens Camera
//             </span>
//         </button>

//         {/* Upload from Gallery */}
//         <button
//             type="button"
//             onClick={() => fileRef.current?.click()}
//             className="flex flex-col items-center
//                        justify-center gap-2 py-4
//                        border-2 border-dashed rounded-xl
//                        border-slate-200 bg-slate-50
//                        hover:bg-slate-100 hover:border-slate-400
//                        transition-all text-slate-600"
//         >
//             <svg className="w-6 h-6" fill="none"
//                  stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={1.5}
//                       d="M4 16l4.586-4.586a2 2 0
//                          012.828 0L16 16m-2-2l1.586-1.586a2
//                          2 0 012.828 0L20 14m-6-6h.01M6 20h12a2
//                          2 0 002-2V6a2 2 0 00-2-2H6a2 2 0
//                          00-2 2v12a2 2 0 002 2z" />
//             </svg>
//             <span className="text-[12px] font-semibold">
//                 From Gallery
//             </span>
//             <span className="text-[10px] text-slate-400">
//                 Choose Existing
//             </span>
//         </button>
//     </div>

//     {/* Hidden Inputs */}

//     {/* Camera Input — capture="environment" opens BACK camera */}
//     <input
//         ref={cameraRef}
//         type="file"
//         accept="image/*"
//         capture="environment"
//         className="hidden"
//         onChange={handleFileChange}
//     />

//     {/* Gallery Input */}
//     <input
//         ref={fileRef}
//         type="file"
//         multiple
//         accept="image/*"
//         className="hidden"
//         onChange={handleFileChange}
//     />

//     {/* Photo count indicator */}
//     {files.length > 0 && (
//         <div className="flex items-center gap-2 px-3 py-2
//                         bg-emerald-50 rounded-lg border
//                         border-emerald-200 mb-3">
//             <CheckCircle size={14} className="text-emerald-500" />
//             <span className="text-[12px] font-medium text-emerald-700">
//                 {files.length} photo(s) ready to upload
//             </span>
//         </div>
//     )}

//     {/* Photo Previews */}
//     {previews.length > 0 && (
//         <div className="flex flex-wrap gap-2">
//             {previews.map((src, idx) => (
//                 <div key={idx} className="relative group">
//                     <img
//                         src={src}
//                         alt=""
//                         onClick={() => {
//                             setLbPhotos(previews);
//                             setLbIdx(idx);
//                             setLbOpen(true);
//                         }}
//                         className="w-16 h-16 object-cover
//                                    rounded-lg border-2 border-slate-200
//                                    cursor-zoom-in hover:border-blue-400
//                                    transition-all"
//                     />
//                     {/* Remove */}
//                     <button
//                         type="button"
//                         onClick={() => removeFile(idx)}
//                         className="absolute -top-1.5 -right-1.5
//                                    w-5 h-5 bg-red-500 text-white
//                                    rounded-full flex items-center
//                                    justify-center opacity-0
//                                    group-hover:opacity-100
//                                    transition-opacity shadow-sm"
//                     >
//                         <X size={10} />
//                     </button>
//                 </div>
//             ))}

//             {/* Add More */}
//             {files.length < 10 && (
//                 <button
//                     type="button"
//                     onClick={() => cameraRef.current?.click()}
//                     className="w-16 h-16 border-2 border-dashed
//                                border-blue-200 rounded-lg
//                                flex flex-col items-center
//                                justify-center text-blue-400
//                                hover:border-blue-400 hover:bg-blue-50
//                                transition-colors"
//                 >
//                     <Camera size={14} />
//                     <span className="text-[9px] mt-1">Add</span>
//                 </button>
//             )}
//         </div>
//     )}
// </div>

//                     {/* Submit Button */}
//                     <div className="pt-1">
//                         <Button
//                             type="submit"
//                             variant="primary"
//                             disabled={saving}
//                             isLoading={saving}
//                         >
//                             {saving ? 'Submitting...' : (
//                                 <span className="flex items-center gap-2">
//                                     Submit Update
//                                     {gpsStatus === 'success' && (
//                                         <span className="text-[11px]
//                                                          bg-white/20 px-2 py-0.5
//                                                          rounded-full">
//                                             📍 GPS
//                                         </span>
//                                     )}
//                                     {files.length > 0 && (
//                                         <span className="text-[11px]
//                                                          bg-white/20 px-2 py-0.5
//                                                          rounded-full">
//                                             📸 {files.length}
//                                         </span>
//                                     )}
//                                 </span>
//                             )}
//                         </Button>
//                     </div>

//                 </form>
//             </div>

//             {/* update history  */}
//             <div className="bg-white rounded-xl border
//                             border-slate-200/80 overflow-hidden">

//                 <div className="px-5 py-3.5 border-b border-slate-100
//                                 flex items-center justify-between">
//                     <h3 className="text-sm font-bold text-slate-700">
//                         Update History
//                     </h3>
//                     <span className="text-[11px] text-slate-400 bg-slate-100
//                                      px-2 py-0.5 rounded-full">
//                         {hist.length} updates
//                     </span>
//                 </div>

//                 {hist.length === 0 ? (
//                     <div className="text-center py-10">
//                         <p className="text-slate-400 text-sm">
//                             No updates yet
//                         </p>
//                     </div>
//                 ) : (
//                     <div className="overflow-x-auto">
//                         <table className="w-full min-w-[600px]">
//                             <thead>
//                                 <tr className="bg-slate-50/80
//                                                border-b border-slate-100">
//                                     {['Date & Time', 'Status', 'Progress',
//                                       'Photos', 'GPS', 'Remarks', 'By']
//                                       .map(h => (
//                                         <th key={h}
//                                             className="px-4 py-2.5 text-left
//                                                        text-[10px] font-semibold
//                                                        text-slate-500 uppercase
//                                                        tracking-wide">
//                                             {h}
//                                         </th>
//                                     ))}
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {hist.map((h, i) => (
//                                     <tr key={h.id || i}
//                                         className="border-t border-slate-50
//                                                    hover:bg-slate-50/50
//                                                    transition-colors">

//                                         {/* Date */}
//                                         <td className="px-4 py-3">
//                                             <p className="text-[12px] text-slate-600 font-medium">
//                                                 {new Date(h.created_at)
//                                                     .toLocaleDateString('en-IN', {
//                                                         day:   '2-digit',
//                                                         month: 'short'
//                                                     })}
//                                             </p>
//                                             <p className="text-[10px] text-slate-400">
//                                                 {new Date(h.created_at)
//                                                     .toLocaleTimeString('en-IN', {
//                                                         hour:   '2-digit',
//                                                         minute: '2-digit'
//                                                     })}
//                                             </p>
//                                         </td>

//                                         {/* Status */}
//                                         <td className="px-4 py-3">
//                                             <Badge status={h.new_status} />
//                                         </td>

//                                         {/* Progress */}
//                                         <td className="px-4 py-3">
//                                             <div className="flex items-center gap-2">
//                                                 <div className="w-16 h-1.5 bg-slate-100
//                                                                 rounded-full overflow-hidden">
//                                                     <div
//                                                         className="h-full bg-blue-500
//                                                                    rounded-full"
//                                                         style={{
//                                                             width: `${h.new_progress || 0}%`
//                                                         }}
//                                                     />
//                                                 </div>
//                                                 <span className="text-[12px] text-slate-500">
//                                                     {h.new_progress ?? 0}%
//                                                 </span>
//                                             </div>
//                                         </td>

//                                         {/* Photos */}
//                                         <td className="px-4 py-3">
//                                             <HistoryPhotos
//                                                 photos={h.photos || []}
//                                             />
//                                         </td>

//                                         {/* GPS */}
//                                         <td className="px-4 py-3">
//                                             {h.latitude && h.longitude ? (
//                                                 <a
//                                                     href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`}
//                                                     target="_blank"
//                                                     rel="noreferrer"
//                                                     className="flex items-center gap-1
//                                                                text-[11px] font-medium
//                                                                text-emerald-600
//                                                                hover:text-emerald-700"
//                                                 >
//                                                     <MapPin size={11} />
//                                                     View
//                                                 </a>
//                                             ) : (
//                                                 <span className="text-[11px]
//                                                                  text-slate-300">
//                                                     —
//                                                 </span>
//                                             )}
//                                         </td>

//                                         {/* Remarks */}
//                                         <td className="px-4 py-3 max-w-[140px]">
//                                             <p className="text-[12px] text-slate-500
//                                                           truncate"
//                                                title={h.remarks || ''}>
//                                                 {h.remarks || '—'}
//                                             </p>
//                                         </td>

//                                         {/* By */}
//                                         <td className="px-4 py-3">
//                                             <p className="text-[12px] text-slate-500
//                                                           whitespace-nowrap">
//                                                 {h.updater?.full_name || '—'}
//                                             </p>
//                                         </td>

//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 )}
//             </div>

//             {/* Lightbox for preview photos */}
//             {lbOpen && lbPhotos.length > 0 && (
//                 <Lightbox
//                     photos={lbPhotos}
//                     index={lbIdx}
//                     onClose={() => setLbOpen(false)}
//                     onPrev={() => setLbIdx(i =>
//                         (i - 1 + lbPhotos.length) % lbPhotos.length)}
//                     onNext={() => setLbIdx(i =>
//                         (i + 1) % lbPhotos.length)}
//                 />
//             )}

//         </div>
//     );
// };

// export default ActivityDetail;