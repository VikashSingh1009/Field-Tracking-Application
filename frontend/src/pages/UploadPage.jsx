import { useState, useEffect } from "react";
import React from "react";
import API from "../api/client";
import Badge from "../components/ui/Badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  XCircle, Eye, Clock,  Layers,
  CloudUpload, ArrowUpCircle, X,
} from "lucide-react";  //fileText Download
const UploadPage = () => {
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [excelView, setExcelView] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await API.get("/admin/upload/history");
      setHistory(response.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    setExcelView(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const response = await API.post("/admin/upload/excel", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
      fetchHistory();
      if (response.data.success !== false) {
        toast.success(`${response.data.processed_rows || 0} rows imported successfully!`);
      } else {
        toast.error(response.data.message || "Upload failed");
      }
      if (response.data.upload_id) fetchExcelView(response.data.upload_id);
    } catch (e) {
      setResult({ success: false, message: e.response?.data?.message || "Upload failed" });
      toast.error(e.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fetchExcelView = async (uploadId) => {
    try {
      setViewLoading(true);
      const response = await API.get(`/admin/upload/${uploadId}/view`);
      setExcelView(response.data);
    } catch (e) {
      console.error("Excel view error:", e);
    } finally {
      setViewLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const viewUpload = (uploadId) => {
    fetchExcelView(uploadId);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Upload Data</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Upload Excel file to import locations and activities
        </p>
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`relative rounded-3xl border-2 border-dashed p-10 text-center transition-all cursor-pointer overflow-hidden
          ${dragOver
            ? "border-violet-500 bg-violet-50/60 scale-[1.01] shadow-xl shadow-violet-500/10"
            : "border-slate-200 bg-white hover:border-violet-400 hover:bg-slate-50/50 shadow-sm"
          }`}
      >
        {/* Decorative bg */}
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-violet-500/5 backdrop-blur-[1px]">
            <div className="text-center">
              <ArrowUpCircle size={40} className="text-violet-500 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-bold text-violet-600">Drop your file here</p>
            </div>
          </div>
        )}

        <input
          type="file" accept=".xlsx,.xls" id="fileInput" className="hidden"
          onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }}
        />
        <label htmlFor="fileInput" className="cursor-pointer">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
            uploading ? "bg-violet-100" : "bg-violet-50 group-hover:bg-violet-100"
          }`}>
            {uploading ? (
              <div className="w-6 h-6 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CloudUpload size={26} className="text-violet-500" />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {uploading ? "Uploading & Processing..." : "Drop your Excel file here or click to browse"}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Supports .xlsx and .xls files</p>
        </label>
      </motion.div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`rounded-2xl border-2 p-5 ${
            result.success === false
              ? "bg-rose-50 border-rose-200"
              : result.failed_rows === 0
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                result.success === false ? "bg-rose-100" : result.failed_rows === 0 ? "bg-emerald-100" : "bg-amber-100"
              }`}>
                {result.success === false
                  ? <XCircle size={17} className="text-rose-600" />
                  : result.failed_rows === 0
                    ? <CheckCircle2 size={17} className="text-emerald-600" />
                    : <AlertTriangle size={17} className="text-amber-600" />
                }
              </div>
              <h3 className="text-sm font-bold text-slate-800">Upload Result</h3>
            </div>
          </div>
          {result.message && result.success === false && (
            <p className="text-xs text-rose-600 font-medium mb-2">{result.message}</p>
          )}
          {result.processed_rows !== undefined && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-emerald-600">{result.processed_rows} rows saved</span>
              </div>
              <div className="w-px h-4 bg-slate-300" />
              <div className="flex items-center gap-2 text-xs font-semibold">
                <XCircle size={14} className="text-rose-500" />
                <span className="text-rose-600">{result.failed_rows} rows failed</span>
              </div>
            </div>
          )}
          {result.activities_found?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {result.activities_found.map((a) => (
                <span key={a} className="px-2.5 py-1 bg-white rounded-lg text-[11px] font-semibold text-violet-600 border border-violet-100 shadow-sm">
                  {a}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Excel Data View */}
      {viewLoading && (
        <div className="bg-white rounded-3xl border border-slate-100 py-12 text-center shadow-sm">
          <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Loading Excel data...</p>
        </div>
      )}

      {excelView && !viewLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
        >
          {/* Header */}
          <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <FileSpreadsheet size={17} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-700 tracking-tight">
                  {excelView.upload?.file_name || "Uploaded Data"}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {excelView.locations?.length || 0} locations · {excelView.activities?.length || 0} activities
                </p>
              </div>
            </div>
            <button onClick={() => setExcelView(null)}
              className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Excel Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 sticky left-0 bg-slate-800 z-10 min-w-[40px]">S.No</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 sticky left-[40px] bg-slate-800 z-10 min-w-[200px]">Location</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 min-w-[80px]">Type</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 min-w-[80px]">Phase</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 min-w-[100px]">Supervisor</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 min-w-[80px]">Vendor</th>
                  {(excelView.activities || []).map((act, i) => (
                    <th key={act.id || i} colSpan={4}
                      className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-slate-700 bg-violet-900">
                      {act.activity_name}
                    </th>
                  ))}
                </tr>

                {/* Sub Headers */}
                <tr className="bg-slate-700 text-slate-300">
                  <th className="px-3 py-1.5 border-r border-slate-600 sticky left-0 bg-slate-700 z-10"></th>
                  <th className="px-3 py-1.5 border-r border-slate-600 sticky left-[40px] bg-slate-700 z-10"></th>
                  <th className="px-3 py-1.5 border-r border-slate-600"></th>
                  <th className="px-3 py-1.5 border-r border-slate-600"></th>
                  <th className="px-3 py-1.5 border-r border-slate-600"></th>
                  <th className="px-3 py-1.5 border-r border-slate-600"></th>
                  {(excelView.activities || []).map((act, i) => (
                    <React.Fragment key={`sub-${act.id || i}`}>
                      <th className="px-2 py-1.5 text-[9px] font-medium border-r border-slate-600 min-w-[70px]">Start</th>
                      <th className="px-2 py-1.5 text-[9px] font-medium border-r border-slate-600 min-w-[70px]">End</th>
                      <th className="px-2 py-1.5 text-[9px] font-medium border-r border-slate-600 min-w-[80px]">Status</th>
                      <th className="px-2 py-1.5 text-[9px] font-medium border-r border-slate-600 min-w-[80px]">Remarks</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {(excelView.locations || []).map((loc, idx) => {
                  const actMap = {};
                  if (Array.isArray(loc.activities)) {
                    loc.activities.forEach((la) => {
                      const name = la.activity?.activity_name;
                      if (name) actMap[name] = la;
                    });
                  } else if (typeof loc.activities === "object") {
                    Object.assign(actMap, loc.activities);
                  }

                  return (
                    <tr key={loc.location_id || loc.id || idx}
                      className={`border-t border-slate-100 hover:bg-violet-50/40 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                      <td className="px-3 py-2.5 text-[11px] text-slate-400 font-mono border-r border-slate-100 sticky left-0 bg-inherit z-10">
                        {loc.serial_number || idx + 1}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 sticky left-[40px] bg-inherit z-10">
                        <p className="text-[12px] font-semibold text-slate-700 truncate max-w-[190px]">{loc.location_name}</p>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-500 border-r border-slate-100">{loc.location_type || "-"}</td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-500 border-r border-slate-100">{loc.phase?.phase_name || loc.phase || "-"}</td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-500 border-r border-slate-100">{loc.supervisor?.full_name || loc.supervisor || "-"}</td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-500 border-r border-slate-100">{loc.vendor?.vendor_name || loc.vendor || "-"}</td>
                      {(excelView.activities || []).map((act, ai) => {
                        const actData = actMap[act.activity_name] || {};
                        const startDate = actData.planned_start_date || actData.start_date || "";
                        const endDate = actData.planned_end_date || actData.end_date || "";
                        const status = actData.status || actData.activity_status || "";
                        const remarks = actData.remarks || "";
                        return (
                          <React.Fragment key={`data-${act.id || ai}`}>
                            <td className="px-2 py-2.5 text-[10px] text-slate-500 border-r border-slate-50">
                              {startDate ? new Date(startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "-"}
                            </td>
                            <td className="px-2 py-2.5 text-[10px] text-slate-500 border-r border-slate-50">
                              {endDate ? new Date(endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "-"}
                            </td>
                            <td className="px-2 py-2.5 border-r border-slate-50"><Badge status={status} /></td>
                            <td className="px-2 py-2.5 text-[10px] text-slate-400 border-r border-slate-50 max-w-[100px] truncate">{remarks || "-"}</td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <Layers size={13} />
              {excelView.locations?.length || 0} locations × {excelView.activities?.length || 0} activities
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <Clock size={13} />
              Uploaded: {excelView.upload?.uploaded_at ? new Date(excelView.upload.uploaded_at).toLocaleString() : "-"}
            </div>
          </div>
        </motion.div>
      )}

      {/* Upload History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
      >
        <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 rounded-2xl flex items-center justify-center">
              <Clock size={17} className="text-violet-600" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Upload History</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            {history.length} uploads
          </span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Upload size={22} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-medium">No uploads yet</p>
            <p className="text-xs text-slate-300">Upload an Excel file to see history</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/40">
                  {["File", "Rows", "Saved", "Failed", "Status", "Date", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700 max-w-[200px] truncate">{h.file_name}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500 font-medium">{h.total_rows}</td>
                    <td className="px-5 py-3.5 text-[13px] text-emerald-600 font-bold">{h.processed_rows}</td>
                    <td className="px-5 py-3.5 text-[13px] text-rose-500 font-bold">{h.failed_rows}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                        h.status === "Completed" ? "bg-emerald-50 text-emerald-700" : h.status === "Failed" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                      }`}>{h.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-400 font-medium">
                      {h.uploaded_at ? new Date(h.uploaded_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => viewUpload(h.id)}
                        className="px-3 py-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all flex items-center gap-1.5">
                        <Eye size={12} /> View Data
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadPage;


























// import { useState, useEffect } from 'react';
// import React from 'react';
// import API from '../api/client';
// import Badge from '../components/ui/Badge';

// const UploadPage = () => {
//     const [uploading, setUploading]     = useState(false);
//     const [history, setHistory]         = useState([]);
//     const [result, setResult]           = useState(null);
//     const [dragOver, setDragOver]       = useState(false);

//     // Excel View Data
//     const [excelView, setExcelView]     = useState(null);
//     const [viewLoading, setViewLoading] = useState(false);

    

//     // fetch upload history 
//     const fetchHistory = async () => {
//         try {
//             const response = await API.get('/admin/upload/history');
//             setHistory(response.data.data || []);
//         } catch (err) {
//             console.log(err);
//         }
//     };

//     // useEffect(() => {
//     //     const load = async () => {
//     //     await fetchHistory();
//     //     };
//     //     load();
//     // }, []);

//     useEffect(() => {
//         fetchHistory();
//     }, []);

//     // handle file upload 
//     const handleFile = async (file) => {
//         if (!file) return;
//         setUploading(true);
//         setResult(null);
//         setExcelView(null);

//         const fd = new FormData();  //formdata can send json file 
//         fd.append('file', file);

//         try {
//             const response = await API.post('/admin/upload/excel', fd, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });
//             setResult(response.data);
//             fetchHistory();

//             // Upload success hone ke baad Excel view load
//             if (response.data.upload_id) {
//                 fetchExcelView(response.data.upload_id);
//             }
//         } catch (e) {
//             setResult({
//                 success: false,
//                 message: e.response?.data?.message || 'Upload failed'
//             });
//         } finally {
//             setUploading(false);
//         }
//     };

//     // fetch excel view Data 
//     // Backend se uploaded data as Excel format

//     const fetchExcelView = async (uploadId) => {
//         try {
//             setViewLoading(true);
//             const response = await API.get(`/admin/upload/${uploadId}/view`);
//             setExcelView(response.data);
//         } catch (e) {
//             console.error('Excel view error:', e);
//         } finally {
//             setViewLoading(false);
//         }
//     };

//     // Drag and Drop handlers
//     const onDrop = (e) => {
//         e.preventDefault();
//         setDragOver(false);
//         const fetch = e.dataTransfer.files[0];
//         if (fetch) handleFile(fetch);
//     };


//     // view any history uplaod 
//     const viewUpload = (uploadId) => {
//         fetchExcelView(uploadId);
//     };

//     return (
//         <div className="space-y-5">
//             {/* Page Title */}
//             <div>
//                 <h2 className="text-lg font-bold text-slate-800">Upload Data</h2>
//                 <p className="text-xs text-slate-400">Upload Excel file to import locations and activities</p>
//             </div>

//             <div
//                 onDrop={onDrop}
//                 onDragOver={e => {
//                      e.preventDefault(); 
//                      setDragOver(true); 
//                 }}
//                 onDragLeave={() => setDragOver(false)}
//                 className={`bg-white rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer
//                     ${dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-400'}`}
//             >
//                 <input
//                     type="file"
//                     accept=".xlsx,.xls"
//                     id="fileInput"
//                     className="hidden"
//                     onChange={e => { 
//                         handleFile(e.target.files[0]); 
//                         e.target.value = ''; 
//                     }}
//                 />
//                 <label htmlFor="fileInput" className="cursor-pointer">
//                     <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
//                         {uploading ? (
//                             <div className="w-5 h-5 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
//                         ) : (
//                             <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//                                     d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                             </svg>
//                         )}
//                     </div>
//                     <p className="text-sm font-medium text-slate-700">
//                         {uploading ? 'Uploading & Processing...' : 'Drop your Excel file here or click to browse'}
//                     </p>
//                     <p className="text-xs text-slate-400 mt-1">Supports .xlsx and .xls files</p>
//                 </label>
//             </div>


//             {result && (
//                 <div className={`rounded-xl border p-4 ${
//                     result.success === false
//                         ? 'bg-red-50 border-red-200'
//                         : result.failed_rows === 0
//                             ? 'bg-emerald-50 border-emerald-200'
//                             : 'bg-amber-50 border-amber-200'
//                 }`}>
//                     <div className="flex items-center justify-between mb-4">
//                         <h3 className="text-sm font-bold text-slate-800">Upload Result</h3>
//                         <span className="material-symbols-outlined text-[24px]">
//                             {result.success === false ? 'error' : result.failed_rows === 0 ? 'check_circle' : 'warning'}
//                         </span>
//                     </div>
//                     {result.message && result.success === false && (
//                         <p className="text-xs text-red-600">{result.message}</p>
//                     )}
//                     {result.processed_rows !== undefined && (
//                         <p className="text-[11px] font-semibold text-slate-600 mt-2 flex items-center gap-2">
//                             <span className="text-emerald-600 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> {result.processed_rows} rows saved</span>
//                             <span className="text-slate-300">|</span>
//                             <span className="text-red-600 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {result.failed_rows} rows failed</span>
//                         </p>
//                     )}
//                     {result.activities_found?.length > 0 && (
//                         <div className="flex flex-wrap gap-1.5 mt-2">
//                             {result.activities_found.map(a => (
//                                 <span key={a} className="px-2 py-0.5 bg-white/80 rounded-md text-[11px] font-medium text-blue-600 border border-blue-100">
//                                     {a}
//                                 </span>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//             )}

//             {/* excel data view - Same as Excel */}

//             {viewLoading && (
//                 <div className="bg-white rounded-xl border border-slate-200/80 py-10 text-center">
//                     <div className="w-6 h-6 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
//                     <p className="text-sm text-slate-400">Loading Excel data...</p>
//                 </div>
//             )}

//             {excelView && !viewLoading && (
//                 <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
//                     {/* Header */}
//                     <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
//                         <div className="flex items-center gap-2">
//                             <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//                                     d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                             </svg>
//                             <div>
//                                 <h3 className="text-sm font-bold text-slate-700">
//                                     {excelView.upload?.file_name || 'Uploaded Data'}
//                                 </h3>
//                                 <p className="text-[10px] text-slate-400">
//                                     {excelView.locations?.length || 0} locations · {excelView.activities?.length || 0} activities
//                                 </p>
//                             </div>
//                         </div>
//                         <button
//                             onClick={() => setExcelView(null)}
//                             className="text-slate-400 hover:text-slate-600 transition-colors"
//                         >
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                             </svg>
//                         </button>
//                     </div>

//                     {/* Excel Table */}
//                     <div className="overflow-x-auto">
//                         <table className="w-full min-w-[1200px]">
//                             <thead>
//                                 <tr className="bg-slate-800 text-white">
//                                     {/* Fixed Columns */}
//                                     <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide border-response border-slate-700 sticky left-0 bg-slate-800 z-10 min-w-[40px]">
//                                         S.No
//                                     </th>
//                                     <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide border-response border-slate-700 sticky left-[40px] bg-slate-800 z-10 min-w-[200px]">
//                                         Location
//                                     </th>
//                                     <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide border-response border-slate-700 min-w-[80px]">
//                                         Type
//                                     </th>
//                                     <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide border-response border-slate-700 min-w-[80px]">
//                                         Phase
//                                     </th>
//                                     <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide border-response border-slate-700 min-w-[100px]">
//                                         Supervisor
//                                     </th>
//                                     <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide border-response border-slate-700 min-w-[80px]">
//                                         Vendor
//                                     </th>

//                                     {/* Dynamic Activity Columns */}
//                                     {(excelView.activities || []).map((act, i) => (
//                                         <th
//                                             key={act.id || i}
//                                             colSpan={4}
//                                             className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide border-response border-slate-700 bg-blue-900"
//                                         >
//                                             {act.activity_name}
//                                         </th>
//                                     ))}
//                                 </tr>

//                                 {/* HEADER ROW 2 - Sub Headers */}
//                                 <tr className="bg-slate-700 text-slate-300">
//                                     {/* Fixed Column placeholders */}
//                                     <th className="px-3 py-1.5 border-response border-slate-600 sticky left-0 bg-slate-700 z-10"></th>
//                                     <th className="px-3 py-1.5 border-response border-slate-600 sticky left-[40px] bg-slate-700 z-10"></th>
//                                     <th className="px-3 py-1.5 border-response border-slate-600"></th>
//                                     <th className="px-3 py-1.5 border-response border-slate-600"></th>
//                                     <th className="px-3 py-1.5 border-response border-slate-600"></th>
//                                     <th className="px-3 py-1.5 border-response border-slate-600"></th>

//                                     {/* Activity sub-headers: Start | End | Status | Remarks */}
//                                     {(excelView.activities || []).map((act, i) => (
//                                         <React.Fragment key={`sub-${act.id || i}`}>
//                                             <th className="px-2 py-1.5 text-[9px] font-medium border-response border-slate-600 min-w-[70px]">Start</th>
//                                             <th className="px-2 py-1.5 text-[9px] font-medium border-response border-slate-600 min-w-[70px]">End</th>
//                                             <th className="px-2 py-1.5 text-[9px] font-medium border-response border-slate-600 min-w-[80px]">Status</th>
//                                             <th className="px-2 py-1.5 text-[9px] font-medium border-response border-slate-600 min-w-[80px]">Remarks</th>
//                                         </React.Fragment>
//                                     ))}
//                                 </tr>
//                             </thead>

//                             {/* data rows  */}
//                             <tbody>
//                                 {(excelView.locations || []).map((loc, idx) => {
//                                     // Activities ko object me convert karo
//                                     const actMap = {};
//                                     if (Array.isArray(loc.activities)) {
//                                         loc.activities.forEach(la => {
//                                             const name = la.activity?.activity_name;
//                                             if (name) actMap[name] = la;
//                                         });
//                                     } else if (typeof loc.activities === 'object') {
//                                         Object.assign(actMap, loc.activities);
//                                     }

//                                     return (
//                                         <tr key={loc.location_id || loc.id || idx}
//                                             className={`border-t border-slate-100 hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
//                                             {/* Fixed Columns */}
//                                             <td className="px-3 py-2.5 text-[11px] text-slate-400 font-mono border-response border-slate-100 sticky left-0 bg-inherit z-10">
//                                                 {loc.serial_number || idx + 1}
//                                             </td>
//                                             <td className="px-3 py-2.5 border-response border-slate-100 sticky left-[40px] bg-inherit z-10">
//                                                 <p className="text-[11px] font-semibold text-slate-700 truncate max-w-[190px]">
//                                                     {loc.location_name}
//                                                 </p>
//                                             </td>
//                                             <td className="px-3 py-2.5 text-[11px] text-slate-500 border-response border-slate-100">
//                                                 {loc.location_type || '-'}
//                                             </td>
//                                             <td className="px-3 py-2.5 text-[11px] text-slate-500 border-response border-slate-100">
//                                                 {loc.phase?.phase_name || loc.phase || '-'}
//                                             </td>
//                                             <td className="px-3 py-2.5 text-[11px] text-slate-500 border-response border-slate-100">
//                                                 {loc.supervisor?.full_name || loc.supervisor || '-'}
//                                             </td>
//                                             <td className="px-3 py-2.5 text-[11px] text-slate-500 border-response border-slate-100">
//                                                 {loc.vendor?.vendor_name || loc.vendor || '-'}
//                                             </td>

//                                             {/* Activity Data Columns */}
//                                             {(excelView.activities || []).map((act, ai) => {
//                                                 const actData = actMap[act.activity_name] || {};

//                                                 // Handle both formats
//                                                 const startDate = actData.planned_start_date || actData.start_date || '';
//                                                 const endDate   = actData.planned_end_date || actData.end_date || '';
//                                                 const status    = actData.status || actData.activity_status || '';
//                                                 const remarks   = actData.remarks || '';

//                                                 return (
//                                                     <React.Fragment key={`data-${act.id || ai}`}>
//                                                         <td className="px-2 py-2.5 text-[10px] text-slate-500 border-response border-slate-50">
//                                                             {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '-'}
//                                                         </td>
//                                                         <td className="px-2 py-2.5 text-[10px] text-slate-500 border-response border-slate-50">
//                                                             {endDate ? new Date(endDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '-'}
//                                                         </td>
//                                                         <td className="px-2 py-2.5 border-response border-slate-50">
//                                                             <Badge status={status} />
//                                                         </td>
//                                                         <td className="px-2 py-2.5 text-[10px] text-slate-400 border-response border-slate-50 max-w-[100px] truncate">
//                                                             {remarks || '-'}
//                                                         </td>
//                                                     </React.Fragment>
//                                                 );
//                                             })}
//                                         </tr>
//                                     );
//                                 })}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* Footer */}
//                     <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
//                         <p className="text-[11px] text-slate-400">
//                             Showing {excelView.locations?.length || 0} locations × {excelView.activities?.length || 0} activities
//                         </p>
//                         <p className="text-[11px] text-slate-400">
//                             Uploaded: {excelView.upload?.uploaded_at
//                                 ? new Date(excelView.upload.uploaded_at).toLocaleString()
//                                 : '-'}
//                         </p>
//                     </div>
//                 </div>
//             )}

//             {/* upload history  */}
//             <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
//                 <div className="px-5 py-3.5 border-b border-slate-100">
//                     <h3 className="text-sm font-bold text-slate-700">Upload History</h3>
//                 </div>

//                 {history.length === 0 ? (
//                     <div className="text-center py-10">
//                         <p className="text-slate-400 text-sm">No uploads yet</p>
//                     </div>
//                 ) : (
//                     <table className="w-full">
//                         <thead>
//                             <tr className="bg-slate-50/80 border-b border-slate-100">
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">File</th>
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Rows</th>
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Saved</th>
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Failed</th>
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Date</th>
//                                 <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide"></th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {history.map(h => (
//                                 <tr key={h.id} className="border-t border-slate-50 hover:bg-slate-50/50">
//                                     <td className="px-5 py-3 text-[12px] font-medium text-slate-700 max-w-[200px] truncate">
//                                         {h.file_name}
//                                     </td>
//                                     <td className="px-5 py-3 text-[12px] text-slate-500">{h.total_rows}</td>
//                                     <td className="px-5 py-3 text-[12px] text-emerald-600 font-medium">{h.processed_rows}</td>
//                                     <td className="px-5 py-3 text-[12px] text-red-500 font-medium">{h.failed_rows}</td>
//                                     <td className="px-5 py-3">
//                                         <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold
//                                             ${h.status === 'Completed'
//                                                 ? 'bg-emerald-50 text-emerald-700'
//                                                 : h.status === 'Failed'
//                                                     ? 'bg-red-50 text-red-700'
//                                                     : 'bg-amber-50 text-amber-700'}`}>
//                                             {h.status}
//                                         </span>
//                                     </td>
//                                     <td className="px-5 py-3 text-[12px] text-slate-400">
//                                         {h.uploaded_at ? new Date(h.uploaded_at).toLocaleDateString() : '-'}
//                                     </td>
//                                     <td className="px-5 py-3">
//                                         <button
//                                             onClick={() => viewUpload(h.id)}
//                                             className="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
//                                         >
//                                             View Data
//                                         </button>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 )}
//             </div>
//         </div>
//     );
// };

// // React import for Fragment

// export default UploadPage;