import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ImageIcon, MapPin, Filter, X, ChevronLeft, ChevronRight,
  ZoomIn, ExternalLink, RefreshCw, Search,
  CheckCircle2, AlertTriangle, Sparkles,
  Navigation, Clock, SlidersHorizontal, Grid3X3,
} from "lucide-react";
import { useLoading } from "../context/LoadingContext";

/* ─── Constants ─── */
const TYPE_STYLES = {
  Before: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "Before", grad: "from-amber-500 to-orange-600" },
  During: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400", label: "During", grad: "from-blue-500 to-indigo-600" },
  After:  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "After", grad: "from-emerald-500 to-teal-600" },
  Issue:  { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400", label: "Issue", grad: "from-rose-500 to-pink-600" },
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatTime = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

/* ─── Mini Map ─── */
const MiniMap = ({ latitude, longitude, workerName }) => {
  const lat = parseFloat(latitude), lng = parseFloat(longitude);
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }}
      className="mt-3 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
      <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.002},${lat - 0.002},${lng + 0.002},${lat + 0.002}&layer=mapnik&marker=${lat},${lng}`}
        width="100%" height="180" style={{ border: "none", display: "block" }} title={`Location of ${workerName}`} loading="lazy" />
      <a href={`https://www.google.com/maps?q=${lat},${lng}&z=17`} target="_blank" rel="noreferrer"
        className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-violet-50 transition-colors text-[11px] font-bold text-violet-600 border-t border-slate-200">
        <ExternalLink size={12} /> Open in Google Maps
      </a>
    </motion.div>
  );
};

/* ─── Lightbox ─── */
const Lightbox = ({ photos, currentIndex, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft") onPrev(); if (e.key === "ArrowRight") onNext(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
      <button onClick={onClose} className="absolute top-5 right-5 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all backdrop-blur-sm"><X size={20} /></button>
      <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm font-semibold">{currentIndex + 1} / {photos.length}</span>
      {photos.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-5 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all"><ChevronLeft size={22} /></button>
      )}
      <img src={`http://localhost:5000${photos[currentIndex]}`} alt="" onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-[88vw] object-contain rounded-3xl shadow-2xl" />
      {photos.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-5 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all"><ChevronRight size={22} /></button>
      )}
      {photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((p, i) => (
            <button key={i} onClick={(e) => e.stopPropagation()}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === currentIndex ? "border-white scale-110 shadow-xl" : "border-white/20 opacity-50 hover:opacity-80"}`}>
              <img src={`http://localhost:5000${p}`} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ─── CountUp ─── */
const CountUp = ({ value, className }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0; const end = value; const duration = 600; const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => { start += step; if (start >= end) { setDisplay(end); clearInterval(timer); } else setDisplay(start); }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span className={className}>{display}</span>;
};

/* ═══════════ EVIDENCE CARD ═══════════ */
const EvidenceCard = ({ item, index }) => {
  const [showMap, setShowMap] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const photos = item.photos || [];
  const hasGPS = !!(item.latitude && item.longitude);
  const typeStyle = TYPE_STYLES[item.photo_type] || TYPE_STYLES.During;
  const isTall = (index + 1) % 5 === 0;

  const openLightbox = (idx) => { setLightboxIdx(idx); setLightboxOpen(true); };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        whileHover={{ y: -3 }}
        className={`group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:border-slate-200 transition-all duration-300 flex flex-col ${isTall ? "md:row-span-2" : ""}`}
      >
        {/* Photo Area */}
        <div className={`relative overflow-hidden cursor-zoom-in ${isTall ? "aspect-[4/5]" : "aspect-video"}`}
          onClick={() => photos.length > 0 && openLightbox(0)}>
          {photos[0] ? (
            <img src={`http://localhost:5000${photos[0]}`} alt=""
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-90" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
              <ImageIcon size={isTall ? 48 : 36} />
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Zoom icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <ZoomIn size={32} className="text-white drop-shadow-lg" />
          </div>

          {/* Type Badge - Top Left */}
          <span className={`absolute top-3 left-3 px-3 py-1.5 rounded-2xl text-[11px] font-extrabold shadow-lg backdrop-blur-sm
            bg-gradient-to-r ${typeStyle.grad} text-white`}>
            {typeStyle.label}
          </span>

          {/* GPS Badge - Top Right */}
          {hasGPS && (
            <span className="absolute top-3 right-3 px-2.5 py-1.5 rounded-2xl text-[11px] font-extrabold bg-emerald-500 text-white shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
              <MapPin size={10} /> GPS
            </span>
          )}

          {/* Photos count - Bottom Right */}
          {photos.length > 1 && (
            <span className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/50 backdrop-blur-md text-white text-[11px] rounded-2xl font-bold">
              +{photos.length - 1}
            </span>
          )}
        </div>

        {/* Info Area */}
        <div className="p-4 flex flex-col flex-1">
          {/* Location */}
          <div className="flex items-start gap-2 mb-2">
            <MapPin size={14} className="text-violet-400 mt-0.5 shrink-0" />
            <p className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">
              {item.location_activity?.location?.location_name || "—"}
            </p>
          </div>

          {/* Activity */}
          <p className="text-[11px] text-slate-400 font-medium truncate mb-3">
            {item.location_activity?.activity?.activity_name || "—"}
          </p>

          {/* Remarks */}
          {item.remarks && (
            <div className="bg-slate-50 rounded-2xl px-3.5 py-2.5 mb-3 border border-slate-100">
              <p className="text-[11px] text-slate-500 italic leading-relaxed line-clamp-3">"{item.remarks}"</p>
            </div>
          )}

          {/* Thumbnail Strip */}
          {photos.length > 1 && (
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
              {photos.map((photo, idx) => (
                <button key={idx} onClick={(e) => { e.stopPropagation(); openLightbox(idx); }}
                  className="shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 border-transparent hover:border-violet-400 transition-all hover:scale-105">
                  <img src={`http://localhost:5000${photo}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                {item.updater?.full_name?.[0] || "?"}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">{item.updater?.full_name || "—"}</span>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400 font-medium">{formatDate(item.created_at)}</p>
              <p className="text-[10px] text-slate-300">{formatTime(item.created_at)}</p>
            </div>
          </div>

          {/* Map Toggle */}
          {hasGPS ? (
            <button onClick={(e) => { e.stopPropagation(); setShowMap((p) => !p); }}
              className={`mt-3 w-full py-2.5 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                showMap ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
              }`}>
              <Navigation size={12} className={showMap ? "text-violet-500" : ""} />
              {showMap ? "Hide Map" : "View Location on Map"}
            </button>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <MapPin size={11} /> No GPS data
            </div>
          )}

          {/* Map */}
          {showMap && hasGPS && (
            <MiniMap latitude={item.latitude} longitude={item.longitude} workerName={item.updater?.full_name || "Worker"} />
          )}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && photos.length > 0 && (
          <Lightbox photos={photos} currentIndex={lightboxIdx} onClose={() => setLightboxOpen(false)}
            onPrev={() => setLightboxIdx((i) => (i - 1 + photos.length) % photos.length)}
            onNext={() => setLightboxIdx((i) => (i + 1) % photos.length)} />
        )}
      </AnimatePresence>
    </>
  );
};

/* ═══════════ SKELETON LOADER ═══════════ */
const SkeletonCard = () => (
  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="aspect-video bg-slate-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
      <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
      <div className="h-16 bg-slate-100 rounded-2xl" />
      <div className="flex justify-between pt-3 border-t border-slate-100">
        <div className="h-4 bg-slate-200 rounded-lg w-24" />
        <div className="h-4 bg-slate-200 rounded-lg w-16" />
      </div>
    </div>
  </div>
);

/* ═══════════ STAT CARD ═══════════ */
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorMap = {
    violet: "from-violet-500 to-purple-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    blue: "from-blue-500 to-indigo-600",
    rose: "from-rose-500 to-pink-600",
  };
  return (
    <motion.div whileHover={{ y: -2 }}
      className="relative bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorMap[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="w-9 h-9 bg-${color}-50 rounded-xl flex items-center justify-center mb-3">
        <Icon size={17} className={`text-${color}-600`} />
      </div>
      <CountUp value={value} className="text-2xl font-extrabold text-slate-800 tracking-tight" />
      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{label}</p>
    </motion.div>
  );
};

/* ═══════════ MAIN ═══════════ */
const Evidence = () => {
  const { role } = useAuth();
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterGPS, setFilterGPS] = useState("");
  const [searchText, setSearchText] = useState("");

  const base = role === "Admin" ? "/admin" : role === "Supervisor" ? "/supervisor" : "/worker";

  const fetchData = useCallback(async () => {
    try { setLoading(true); const r = await API.get(`${base}/evidence`); const items = r.data.data || []; setData(items); setFiltered(items); }
    catch (err) { console.error(err); toast.error("Failed to load evidence"); }
    finally { setLoading(false); }
  }, [base]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Apply filters */
  useEffect(() => {
    let result = [...data];
    if (filterType) result = result.filter((i) => i.photo_type === filterType);
    if (filterLocation) result = result.filter((i) => i.location_activity?.location?.location_name?.toLowerCase().includes(filterLocation.toLowerCase()));
    if (filterGPS === "yes") result = result.filter((i) => i.latitude && i.longitude);
    else if (filterGPS === "no") result = result.filter((i) => !i.latitude || !i.longitude);
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter((i) =>
        i.location_activity?.location?.location_name?.toLowerCase().includes(q) ||
        i.location_activity?.activity?.activity_name?.toLowerCase().includes(q) ||
        i.updater?.full_name?.toLowerCase().includes(q) ||
        i.remarks?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [data, filterType, filterLocation, filterGPS, searchText]);

  const uniqueLocations = [...new Set(data.map((i) => i.location_activity?.location?.location_name).filter(Boolean))].sort();

  const stats = {
    total: data.length,
    withGPS: data.filter((i) => i.latitude && i.longitude).length,
    before: data.filter((i) => i.photo_type === "Before").length,
    during: data.filter((i) => i.photo_type === "During").length,
    after: data.filter((i) => i.photo_type === "After").length,
    issue: data.filter((i) => i.photo_type === "Issue").length,
  };

  const hasFilters = filterType || filterLocation || filterGPS || searchText;
  const clearFilters = () => { setFilterType(""); setFilterLocation(""); setFilterGPS(""); setSearchText(""); };

  /* ─── RENDER ─── */
  return (
    <div className="space-y-5">
      {/* ═══ HERO HEADER ═══ */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30">
              <Grid3X3 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-[28px] font-extrabold text-slate-800 tracking-tight">
                Evidence <span className="text-violet-600">Gallery</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                <Sparkles size={12} className="text-amber-400" />
                {filtered.length} of {data.length} uploads
                {stats.withGPS > 0 && <span className="text-emerald-500 font-bold">· {stats.withGPS} GPS verified</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={fetchData}
              className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => setShowFilters((p) => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-xs font-bold transition-all ${
                showFilters || hasFilters ? "bg-violet-50 border-violet-200 text-violet-600 shadow-md shadow-violet-500/10" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}>
              <SlidersHorizontal size={14} /> Filters
              {hasFilters && <span className="w-5 h-5 bg-violet-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{[
                filterType, filterGPS, filterLocation, searchText
              ].filter(Boolean).length}</span>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ STATS ROW ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Photos", value: stats.total, icon: ImageIcon, color: "violet" },
          { label: "GPS Verified", value: stats.withGPS, icon: Navigation, color: "emerald" },
          { label: "Before", value: stats.before, icon: Clock, color: "amber" },
          { label: "During", value: stats.during, icon: RefreshCw, color: "blue" },
          { label: "After", value: stats.after, icon: CheckCircle2, color: "emerald" },
          { label: "Issues", value: stats.issue, icon: AlertTriangle, color: "rose" },
        ].map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* ═══ FILTER PANEL ═══ */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                  <Filter size={15} className="text-violet-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Filter Evidence</h3>
              </div>
              {hasFilters && (
                <button onClick={clearFilters}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1.5 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all">
                  <X size={13} /> Clear All Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search anything..." value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium" />
              </div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 bg-white transition-all font-medium">
                <option value="">All Photo Types</option>
                {["Before", "During", "After", "Issue"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 bg-white transition-all font-medium">
                <option value="">All Locations</option>
                {uniqueLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
              <select value={filterGPS} onChange={(e) => setFilterGPS(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 bg-white transition-all font-medium">
                <option value="">All Photos</option>
                <option value="yes">GPS Verified Only</option>
                <option value="no">No GPS Only</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* <Spinner centered text="Loading your dashboard" /> */}


      {/* ═══ QUICK TYPE TABS ═══ */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "", label: "All", count: data.length },
          { key: "Before", label: "Before", count: stats.before },
          { key: "During", label: "During", count: stats.during },
          { key: "After", label: "After", count: stats.after },
          { key: "Issue", label: "Issue", count: stats.issue },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilterType(tab.key)}
            className={`shrink-0 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              filterType === tab.key
                ? "bg-violet-600 text-white shadow-xl shadow-violet-500/25 scale-[1.02]"
                : "bg-white border-2 border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}>
            {tab.label}
            <span className={`text-[11px] ${filterType === tab.key ? "text-white/60" : "text-slate-400"}`}>
              {tab.count}
            </span>
          </button>
        ))}
        {hasFilters && (
          <button onClick={clearFilters}
            className="shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all flex items-center gap-1.5">
            <X size={13} /> Reset
          </button>
        )}
      </div>

      {/* ═══ CONTENT ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-100 py-24 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <ImageIcon size={36} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-700 mb-1">
            {hasFilters ? "No matching evidence" : "No evidence yet"}
          </h3>
          <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">
            {hasFilters ? "Try adjusting or clearing the filters to see more results." : "Photos uploaded by workers will appear here."}
          </p>
          {hasFilters && (
            <button onClick={clearFilters}
              className="mt-5 px-6 py-3 bg-violet-50 text-violet-600 rounded-2xl text-sm font-bold hover:bg-violet-100 transition-all shadow-sm">
              Clear All Filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {filtered.map((item, index) => (
            <EvidenceCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Evidence;















// import { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '../context/AuthContext';
// import API from '../api/client';
// import { Image, MapPin, Filter, X,
//          ChevronLeft, ChevronRight,
//          ZoomIn, ExternalLink, RefreshCw } from 'lucide-react';
// // import AppLayout from '../components/Layout/AppLayout';

// // helpers
// const TYPE_STYLES = {
//     Before: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',  label: 'Before'  },
//     During: { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400',   label: 'During'  },
//     After:  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400',label: 'After'   },
//     Issue:  { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400',    label: 'Issue'   },
// };

// const formatDate = (d) =>
//     d ? new Date(d).toLocaleDateString('en-IN', {
//             day: '2-digit', month: 'short', year: 'numeric'
//         }) : '—';

// const formatTime = (d) =>
//     d ? new Date(d).toLocaleTimeString('en-IN', {
//             hour: '2-digit', minute: '2-digit'
//         }) : '';

// //  GPS Map Component (OpenStreetMap) 
// const MiniMap = ({ latitude, longitude, workerName }) => {
//     const lat = parseFloat(latitude);
//     const lng = parseFloat(longitude);

//     const mapUrl = [
//         `https://www.openstreetmap.org/export/embed.html`,
//         `?bbox=${lng - 0.002},${lat - 0.002},${lng + 0.002},${lat + 0.002}`,
//         `&layer=mapnik`,
//         `&marker=${lat},${lng}`
//     ].join('');

//     const googleUrl = `https://www.google.com/maps?q=${lat},${lng}&z=17`;

//     return (
//         <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
//             {/* Map Iframe */}
//             <iframe
//                 src={mapUrl}
//                 width="100%"
//                 height="180"
//                 style={{ border: 'none', display: 'block' }}
//                 title={`Location of ${workerName}`}
//                 loading="lazy"
//             />
//             {/* Open in Google Maps */}
//             <a
//                 href={googleUrl}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="flex items-center justify-center gap-1.5 py-2
//                            bg-slate-50 hover:bg-blue-50 transition-colors
//                            text-[11px] font-medium text-blue-600
//                            border-t border-slate-200"
//             >
//                 <ExternalLink size={11} />
//                 Open in Google Maps
//             </a>
//         </div>
//     );
// };

// // Photo lightbox
// const Lightbox = ({ photos, currentIndex, onClose, onPrev, onNext }) => {
//     useEffect(() => {
//         const handleKey = (e) => {
//             if (e.key === 'Escape')    onClose();
//             if (e.key === 'ArrowLeft') onPrev();
//             if (e.key === 'ArrowRight')onNext();
//         };
//         window.addEventListener('keydown', handleKey);
//         return () => window.removeEventListener('keydown', handleKey);
//     }, [onClose, onPrev, onNext]);

//     return (
//         <div
//             className="fixed inset-0 z-50 bg-black/90
//                        flex items-center justify-center p-4"
//             onClick={onClose}
//         >
//             {/* Close */}
//             <button
//                 onClick={onClose}
//                 className="absolute top-4 right-4 w-9 h-9
//                            bg-white/10 hover:bg-white/20
//                            rounded-full flex items-center justify-center
//                            text-white transition-colors"
//             >
//                 <X size={18} />
//             </button>

//             {/* Counter */}
//             <span className="absolute top-4 left-1/2 -translate-x-1/2
//                              text-white/70 text-sm font-medium">
//                 {currentIndex + 1} / {photos.length}
//             </span>

//             {/* Prev Button */}
//             {photos.length > 1 && (
//                 <button
//                     onClick={(e) => { e.stopPropagation(); onPrev(); }}
//                     className="absolute left-4 w-10 h-10
//                                bg-white/10 hover:bg-white/20
//                                rounded-full flex items-center justify-center
//                                text-white transition-colors"
//                 >
//                     <ChevronLeft size={20} />
//                 </button>
//             )}

//             {/* Image */}
//             <img
//                 src={`http://localhost:5000${photos[currentIndex]}`}
//                 alt={`Evidence ${currentIndex + 1}`}
//                 className="max-h-[85vh] max-w-[85vw]
//                            object-contain rounded-lg"
//                 onClick={(e) => e.stopPropagation()}
//             />

//             {/* Next Button */}
//             {photos.length > 1 && (
//                 <button
//                     onClick={(e) => { e.stopPropagation(); onNext(); }}
//                     className="absolute right-4 w-10 h-10
//                                bg-white/10 hover:bg-white/20
//                                rounded-full flex items-center justify-center
//                                text-white transition-colors"
//                 >
//                     <ChevronRight size={20} />
//                 </button>
//             )}

//             {/* Thumbnail Strip */}
//             {photos.length > 1 && (
//                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2
//                                 flex gap-2">
//                     {photos.map((p, i) => (
//                         <button
//                             key={i}
//                             onClick={(e) => { e.stopPropagation(); }}
//                             className={`w-12 h-12 rounded-md overflow-hidden
//                                         border-2 transition-all
//                                         ${i === currentIndex
//                                             ? 'border-white scale-110'
//                                             : 'border-white/30 opacity-60'
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

// // single evidence card
// const EvidenceCard = ({ item }) => {
//     const [showMap,      setShowMap]      = useState(false);
//     const [lightboxOpen, setLightboxOpen] = useState(false);
//     const [lightboxIdx,  setLightboxIdx]  = useState(0);

//     const photos     = item.photos || [];
//     const hasGPS     = !!(item.latitude && item.longitude);
//     const typeStyle  = TYPE_STYLES[item.photo_type] || TYPE_STYLES.During;

//     const openLightbox = (idx) => {
//         setLightboxIdx(idx);
//         setLightboxOpen(true);
//     };

//     return (
//         <>
//             <div className="bg-white rounded-xl border border-slate-200/80
//                             overflow-hidden hover:shadow-md transition-shadow
//                             flex flex-col">

//                 {/* ── PHOTO AREA ── */}
//                 <div className="relative aspect-video bg-slate-100 overflow-hidden
//                                 cursor-zoom-in group"
//                      onClick={() => photos.length > 0 && openLightbox(0)}>

//                     {/* Main Photo */}
//                     {photos[0] ? (
//                         <img
//                             src={`http://localhost:5000${photos[0]}`}
//                             alt="Evidence"
//                             className="w-full h-full object-cover
//                                        group-hover:scale-105 transition-transform
//                                        duration-300"
//                         />
//                     ) : (
//                         <div className="w-full h-full flex items-center
//                                         justify-center text-slate-300">
//                             <Image size={32} />
//                         </div>
//                     )}

//                     {/* Zoom hint */}
//                     {photos.length > 0 && (
//                         <div className="absolute inset-0 bg-black/0
//                                         group-hover:bg-black/20 transition-colors
//                                         flex items-center justify-center">
//                             <ZoomIn
//                                 size={28}
//                                 className="text-white opacity-0
//                                            group-hover:opacity-100 transition-opacity"
//                             />
//                         </div>
//                     )}

//                     {/* Photo Type Badge */}
//                     <span className={`absolute top-2 left-2 px-2 py-0.5
//                                       rounded-md text-[10px] font-semibold
//                                       ${typeStyle.bg} ${typeStyle.text}`}>
//                         {typeStyle.label}
//                     </span>

//                     {/* GPS Verified Badge */}
//                     {hasGPS && (
//                         <span className="absolute top-2 right-2 px-2 py-0.5
//                                          rounded-md text-[10px] font-semibold
//                                          bg-emerald-500 text-white
//                                          flex items-center gap-1">
//                             <MapPin size={9} />
//                             GPS
//                         </span>
//                     )}

//                     {/* Multiple photos indicator */}
//                     {photos.length > 1 && (
//                         <span className="absolute bottom-2 right-2 px-2 py-0.5
//                                          bg-black/60 text-white text-[10px]
//                                          rounded-md font-medium">
//                             +{photos.length - 1} more
//                         </span>
//                     )}
//                 </div>

//                 {/* ── INFO AREA ── */}
//                 <div className="p-3 flex flex-col flex-1">

//                     {/* Location + Activity */}
//                     <p className="text-[12px] font-semibold text-slate-700 truncate">
//                         📍 {item.location_activity?.location?.location_name || '—'}
//                     </p>
//                     <p className="text-[11px] text-slate-400 truncate mt-0.5">
//                         {item.location_activity?.activity?.activity_name || '—'}
//                     </p>

//                     {/* Remarks */}
//                     {item.remarks && (
//                         <p className="text-[10px] text-slate-500 mt-1.5
//                                       bg-slate-50 rounded-md px-2 py-1
//                                       line-clamp-2">
//                             "{item.remarks}"
//                         </p>
//                     )}

//                     {/* Footer */}
//                     <div className="flex items-center justify-between
//                                     mt-2 pt-2 border-t border-slate-100">
//                         <p className="text-[10px] text-slate-400">
//                             👤 {item.updater?.full_name || '—'}
//                         </p>
//                         <div className="text-right">
//                             <p className="text-[10px] text-slate-400">
//                                 {formatDate(item.created_at)}
//                             </p>
//                             <p className="text-[9px] text-slate-300">
//                                 {formatTime(item.created_at)}
//                             </p>
//                         </div>
//                     </div>

//                     {/* Multiple Photos Strip */}
//                     {photos.length > 1 && (
//                         <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
//                             {photos.map((photo, idx) => (
//                                 <button
//                                     key={idx}
//                                     onClick={() => openLightbox(idx)}
//                                     className="flex-shrink-0 w-10 h-10
//                                                rounded-md overflow-hidden
//                                                border-2 border-transparent
//                                                hover:border-blue-400
//                                                transition-all"
//                                 >
//                                     <img
//                                         src={`http://localhost:5000${photo}`}
//                                         alt=""
//                                         className="w-full h-full object-cover"
//                                     />
//                                 </button>
//                             ))}
//                         </div>
//                     )}

//                     {/* GPS Map Toggle */}
//                     {hasGPS ? (
//                         <button
//                             onClick={() => setShowMap(prev => !prev)}
//                             className={`mt-2 w-full py-1.5 rounded-lg
//                                         text-[11px] font-medium
//                                         flex items-center justify-center gap-1.5
//                                         transition-colors border
//                                         ${showMap
//                                             ? 'bg-blue-50 text-blue-600 border-blue-200'
//                                             : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
//                                         }`}
//                         >
//                             <MapPin size={11} />
//                             {showMap ? 'Hide Map' : 'View on Map'}
//                         </button>
//                     ) : (
//                         <div className="mt-2 flex items-center gap-1
//                                         text-[10px] text-slate-400">
//                             <MapPin size={10} />
//                             No GPS data
//                         </div>
//                     )}

//                     {/* Map */}
//                     {showMap && hasGPS && (
//                         <MiniMap
//                             latitude={item.latitude}
//                             longitude={item.longitude}
//                             workerName={item.updater?.full_name || 'Worker'}
//                         />
//                     )}
//                 </div>
//             </div>

//             {/* Lightbox */}
//             {lightboxOpen && photos.length > 0 && (
//                 <Lightbox
//                     photos={photos}
//                     currentIndex={lightboxIdx}
//                     onClose={() => setLightboxOpen(false)}
//                     onPrev={() => setLightboxIdx(i =>
//                         (i - 1 + photos.length) % photos.length)}
//                     onNext={() => setLightboxIdx(i =>
//                         (i + 1) % photos.length)}
//                 />
//             )}
//         </>
//     );
// };

// // main evidence page 
// const Evidence = () => {
//     const { role } = useAuth();

//     const [data,        setData]        = useState([]);
//     const [filtered,    setFiltered]    = useState([]);
//     const [loading,     setLoading]     = useState(true);
//     const [showFilters, setShowFilters] = useState(false);

//     // Filters
//     const [filterType,     setFilterType]     = useState('');
//     const [filterLocation, setFilterLocation] = useState('');
//     const [filterGPS,      setFilterGPS]      = useState('');
//     const [filterDate,     setFilterDate]     = useState('');
//     const [searchText,     setSearchText]     = useState('');

//     const base = role === 'Admin'
//         ? '/admin'
//         : role === 'Supervisor'
//         ? '/supervisor'
//         : '/worker';

//     // fetch evidence 
//     const fetchData = useCallback(async () => {
//         try {
//             setLoading(true);
//             const r = await API.get(`${base}/evidence`);
//             const items = r.data.data || [];
//             setData(items);
//             setFiltered(items);
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     }, [base]);

//     useEffect(() => { 
//         fetchData(); 
//     }, [fetchData]);

//     // apply filters
//     useEffect(() => {
//         let result = [...data];

//         if (filterType) {
//             result = result.filter(i => i.photo_type === filterType);
//         }

//         if (filterLocation) {
//             result = result.filter(i =>
//                 i.location_activity?.location?.location_name
//                     ?.toLowerCase()
//                     .includes(filterLocation.toLowerCase())
//             );
//         }

//         if (filterGPS === 'yes') {
//             result = result.filter(i => i.latitude && i.longitude);
//         } else if (filterGPS === 'no') {
//             result = result.filter(i => !i.latitude || !i.longitude);
//         }

//         if (filterDate) {
//             result = result.filter(i => {
//                 if (!i.created_at) return false;
//                 return i.created_at.startsWith(filterDate);
//             });
//         }

//         if (searchText) {
//             const q = searchText.toLowerCase();
//             result = result.filter(i =>
//                 i.location_activity?.location?.location_name
//                     ?.toLowerCase().includes(q) ||
//                 i.location_activity?.activity?.activity_name
//                     ?.toLowerCase().includes(q) ||
//                 i.updater?.full_name?.toLowerCase().includes(q) ||
//                 i.remarks?.toLowerCase().includes(q)
//             );
//         }

//         setFiltered(result);
//     }, [data, filterType, filterLocation, filterGPS, filterDate, searchText]);

//     // unique location for filter
//     const uniqueLocations = [...new Set(
//         data
//             .map(i => i.location_activity?.location?.location_name)
//             .filter(Boolean)
//     )];

//     // ─stats
//     const stats = {
//         total:      data.length,
//         withGPS:    data.filter(i => i.latitude && i.longitude).length,
//         before:     data.filter(i => i.photo_type === 'Before').length,
//         during:     data.filter(i => i.photo_type === 'During').length,
//         after:      data.filter(i => i.photo_type === 'After').length,
//         issue:      data.filter(i => i.photo_type === 'Issue').length,
//     };

//     const hasFilters = filterType || filterLocation ||
//                        filterGPS  || filterDate     || searchText;

//     const clearFilters = () => {
//         setFilterType('');
//         setFilterLocation('');
//         setFilterGPS('');
//         setFilterDate('');
//         setSearchText('');
//     };

//     // loading
//     if (loading) return (
//         <div className="flex items-center justify-center h-80">
//             <div className="w-6 h-6 border-[3px] border-blue-600
//                             border-t-transparent rounded-full animate-spin" />
//         </div>
//     );

//     return (
//         <div className="space-y-4">

//             {/* page header*/}
//             <div className="flex items-start justify-between">
//                 <div>
//                     <h2 className="text-lg font-bold text-slate-800">
//                         Evidence Gallery
//                     </h2>
//                     <p className="text-xs text-slate-400 mt-0.5">
//                         {filtered.length} of {data.length} uploads
//                         {stats.withGPS > 0 && (
//                             <span className="ml-2 text-emerald-500">
//                                 · {stats.withGPS} GPS verified
//                             </span>
//                         )}
//                     </p>
//                 </div>

//                 <div className="flex items-center gap-2">
//                     {/* Refresh */}
//                     <button
//                         onClick={fetchData}
//                         className="w-8 h-8 flex items-center justify-center
//                                    rounded-lg border border-slate-200
//                                    text-slate-500 hover:bg-slate-50
//                                    transition-colors"
//                     >
//                         <RefreshCw size={14} />
//                     </button>

//                     {/* Filter Toggle */}
//                     <button
//                         onClick={() => setShowFilters(p => !p)}
//                         className={`flex items-center gap-1.5 px-3 py-1.5
//                                     rounded-lg border text-[12px] font-medium
//                                     transition-colors
//                                     ${showFilters || hasFilters
//                                         ? 'bg-blue-50 border-blue-200 text-blue-600'
//                                         : 'border-slate-200 text-slate-600 hover:bg-slate-50'
//                                     }`}
//                     >
//                         <Filter size={13} />
//                         Filters
//                         {hasFilters && (
//                             <span className="w-4 h-4 bg-blue-600 text-white
//                                              rounded-full text-[9px]
//                                              flex items-center justify-center">
//                                 !
//                             </span>
//                         )}
//                     </button>
//                 </div>
//             </div>

//             {/* stats cards  */}
//             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
//                 {[
//                     { label: 'Total',      value: stats.total,   color: 'blue'    },
//                     { label: 'GPS Verified',value: stats.withGPS, color: 'emerald' },
//                     { label: 'Before',     value: stats.before,  color: 'amber'   },
//                     { label: 'During',     value: stats.during,  color: 'blue'    },
//                     { label: 'After',      value: stats.after,   color: 'emerald' },
//                     { label: 'Issue',      value: stats.issue,   color: 'red'     },
//                 ].map((s, i) => (
//                     <div key={i}
//                          className="bg-white rounded-xl border border-slate-200/80
//                                     p-3 text-center">
//                         <p className={`text-xl font-bold
//                             ${s.color === 'emerald' ? 'text-emerald-600' :
//                               s.color === 'amber'   ? 'text-amber-600'   :
//                               s.color === 'red'     ? 'text-red-600'     :
//                               'text-blue-600'}`}>
//                             {s.value}
//                         </p>
//                         <p className="text-[10px] text-slate-400 mt-0.5">
//                             {s.label}
//                         </p>
//                     </div>
//                 ))}
//             </div>

//             {/* filter panel */}
//             {showFilters && (
//                 <div className="bg-white rounded-xl border border-slate-200/80 p-4">
//                     <div className="flex items-center justify-between mb-3">
//                         <h3 className="text-sm font-semibold text-slate-700">
//                             Filter Evidence
//                         </h3>
//                         {hasFilters && (
//                             <button
//                                 onClick={clearFilters}
//                                 className="text-[11px] text-red-500
//                                            hover:text-red-700 flex items-center gap-1"
//                             >
//                                 <X size={11} /> Clear All
//                             </button>
//                         )}
//                     </div>

//                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

//                         {/* Search */}
//                         <div>
//                             <label className="text-[10px] font-medium text-slate-500 mb-1 block">
//                                 Search
//                             </label>
//                             <input
//                                 type="text"
//                                 placeholder="Location, worker..."
//                                 value={searchText}
//                                 onChange={e => setSearchText(e.target.value)}
//                                 className="w-full text-[12px] px-2.5 py-1.5
//                                            border border-slate-200 rounded-lg
//                                            focus:outline-none focus:border-blue-400"
//                             />
//                         </div>

//                         {/* Photo Type */}
//                         <div>
//                             <label className="text-[10px] font-medium text-slate-500 mb-1 block">
//                                 Photo Type
//                             </label>
//                             <select
//                                 value={filterType}
//                                 onChange={e => setFilterType(e.target.value)}
//                                 className="w-full text-[12px] px-2.5 py-1.5
//                                            border border-slate-200 rounded-lg
//                                            focus:outline-none focus:border-blue-400
//                                            bg-white"
//                             >
//                                 <option value="">All Types</option>
//                                 <option value="Before">Before</option>
//                                 <option value="During">During</option>
//                                 <option value="After">After</option>
//                                 <option value="Issue">Issue</option>
//                             </select>
//                         </div>

//                         {/* Location */}
//                         <div>
//                             <label className="text-[10px] font-medium text-slate-500 mb-1 block">
//                                 Location
//                             </label>
//                             <select
//                                 value={filterLocation}
//                                 onChange={e => setFilterLocation(e.target.value)}
//                                 className="w-full text-[12px] px-2.5 py-1.5
//                                            border border-slate-200 rounded-lg
//                                            focus:outline-none focus:border-blue-400
//                                            bg-white"
//                             >
//                                 <option value="">All Locations</option>
//                                 {uniqueLocations.map(loc => (
//                                     <option key={loc} value={loc}>{loc}</option>
//                                 ))}
//                             </select>
//                         </div>

//                         {/* GPS Filter */}
//                         <div>
//                             <label className="text-[10px] font-medium text-slate-500 mb-1 block">
//                                 GPS Status
//                             </label>
//                             <select
//                                 value={filterGPS}
//                                 onChange={e => setFilterGPS(e.target.value)}
//                                 className="w-full text-[12px] px-2.5 py-1.5
//                                            border border-slate-200 rounded-lg
//                                            focus:outline-none focus:border-blue-400
//                                            bg-white"
//                             >
//                                 <option value="">All Photos</option>
//                                 <option value="yes">✅ GPS Verified Only</option>
//                                 <option value="no">⚠️ No GPS Only</option>
//                             </select>
//                         </div>

//                     </div>
//                 </div>
//             )}

//             {/* filter tags */}
//             {hasFilters && (
//                 <div className="flex flex-wrap gap-2">
//                     {filterType && (
//                         <span className="flex items-center gap-1 px-2.5 py-1
//                                          bg-blue-50 text-blue-600 rounded-full
//                                          text-[11px] font-medium">
//                             Type: {filterType}
//                             <button onClick={() => setFilterType('')}>
//                                 <X size={10} />
//                             </button>
//                         </span>
//                     )}
//                     {filterGPS && (
//                         <span className="flex items-center gap-1 px-2.5 py-1
//                                          bg-emerald-50 text-emerald-600 rounded-full
//                                          text-[11px] font-medium">
//                             GPS: {filterGPS === 'yes' ? 'Verified' : 'Not Verified'}
//                             <button onClick={() => setFilterGPS('')}>
//                                 <X size={10} />
//                             </button>
//                         </span>
//                     )}
//                     {filterLocation && (
//                         <span className="flex items-center gap-1 px-2.5 py-1
//                                          bg-amber-50 text-amber-600 rounded-full
//                                          text-[11px] font-medium">
//                             📍 {filterLocation.substring(0, 20)}...
//                             <button onClick={() => setFilterLocation('')}>
//                                 <X size={10} />
//                             </button>
//                         </span>
//                     )}
//                 </div>
//             )}

//             {/* photo type filter tab */}
//             <div className="flex gap-2 overflow-x-auto pb-1">
//                 {[
//                     { key: '', label: `All (${data.length})` },
//                     { key: 'Before', label: `Before (${stats.before})` },
//                     { key: 'During', label: `During (${stats.during})` },
//                     { key: 'After',  label: `After  (${stats.after})`  },
//                     { key: 'Issue',  label: `Issue  (${stats.issue})`  },
//                 ].map(tab => (
//                     <button
//                         key={tab.key}
//                         onClick={() => setFilterType(tab.key)}
//                         className={`flex-shrink-0 px-3 py-1.5 rounded-lg
//                                     text-[12px] font-medium transition-colors
//                                     ${filterType === tab.key
//                                         ? 'bg-blue-600 text-white'
//                                         : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
//                                     }`}
//                     >
//                         {tab.label}
//                     </button>
//                 ))}
//             </div>

//             {/* evidence grid */}
//             {filtered.length === 0 ? (
//                 <div className="bg-white rounded-xl border border-slate-200/80
//                                 py-16 text-center">
//                     <div className="w-12 h-12 bg-slate-100 rounded-xl
//                                     flex items-center justify-center
//                                     mx-auto mb-3">
//                         <Image size={22} className="text-slate-400" />
//                     </div>
//                     <p className="text-sm font-medium text-slate-600">
//                         No evidence found
//                     </p>
//                     <p className="text-xs text-slate-400 mt-1">
//                         {hasFilters
//                             ? 'Try clearing the filters'
//                             : 'No photos uploaded yet'
//                         }
//                     </p>
//                     {hasFilters && (
//                         <button
//                             onClick={clearFilters}
//                             className="mt-3 px-4 py-1.5 bg-blue-50 text-blue-600
//                                        rounded-lg text-xs font-medium
//                                        hover:bg-blue-100 transition-colors"
//                         >
//                             Clear Filters
//                         </button>
//                     )}
//                 </div>
//             ) : (
//                 <div className="grid grid-cols-1 sm:grid-cols-2
//                                 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                     {filtered.map(item => (
//                         <EvidenceCard key={item.id} item={item} />
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default Evidence;