import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/client";
import PaginationBar from "../components/ui/Pagination";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Edit, Trash2, Search, Plus, Activity, Filter, X, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const emptyForm = { activity_name: "", planned_start_date: "", planned_end_date: "" };

const Activities = () => {
  const { role } = useAuth();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(null);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [crudLoading, setCrudLoading] = useState(false);

  const isFirstRender = useRef(true);

  const fetchData = useCallback(async (pg = 1, lmt = 10, srch = "") => {
    try {
      setLoading(true);
      const url = role === "Admin" ? "/admin/activities" : role === "Supervisor" ? "/supervisor/activities" : "/worker/tasks";
      const r = await API.get(url, { params: { page: pg, limit: lmt, search: srch.trim() } });
      setData(r.data.data || []);
      setPagination(r.data.pagination || null);
    } catch (err) {
      console.error("[Activities]", err?.response?.data || err.message);
      setData([]); setPagination(null);
    } finally { setLoading(false); }
  }, [role]);

  useEffect(() => { fetchData(page, limit, search); }, [page, limit, fetchData]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(1); fetchData(1, limit, search);
  }, [search]);

  const handlePageChange = (pg) => setPage(pg);
  const handleLimitChange = (lmt) => { setLimit(lmt); setPage(1); };

  const handleChange = (e) => { setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })); setFormError(""); };

  const openAdd = () => { setFormData(emptyForm); setFormError(""); setAddModal(true); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.activity_name.trim()) { setFormError("Activity name is required."); return; }
    if (formData.planned_start_date && formData.planned_end_date && formData.planned_end_date < formData.planned_start_date) {
      setFormError("End date cannot be before start date."); return;
    }
    setCrudLoading(true);
    try {
      await API.post("/admin/activities", {
        activity_name: formData.activity_name.trim(),
        planned_start_date: formData.planned_start_date || null,
        planned_end_date: formData.planned_end_date || null,
      });
      toast.success("Activity created!");
      setAddModal(false); setFormData(emptyForm);
      fetchData(page, limit, search);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to create activity.");
    } finally { setCrudLoading(false); }
  };

  const openEdit = (item) => { setActiveItem(item); setFormData({ activity_name: item.activity_name || "" }); setFormError(""); setEditModal(true); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.activity_name.trim()) { setFormError("Activity name is required."); return; }
    setCrudLoading(true);
    try {
      await API.put(`/admin/activities/${activeItem.id}`, { activity_name: formData.activity_name.trim() });
      toast.success("Activity updated!");
      setEditModal(false); setActiveItem(null);
      fetchData(page, limit, search);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to update activity.");
    } finally { setCrudLoading(false); }
  };

  const openDelete = (item) => { setActiveItem(item); setDeleteModal(true); };

  const handleDelete = async () => {
    setCrudLoading(true);
    try {
      await API.delete(`/admin/activities/${activeItem.id}`);
      toast.success("Activity deleted.");
      setDeleteModal(false); setActiveItem(null);
      if (data.length === 1 && page > 1) setPage((prev) => prev - 1);
      else fetchData(page, limit, search);
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to delete."); }
    finally { setCrudLoading(false); }
  };

  const title = role === "Admin" ? "Activities Master" : role === "Supervisor" ? "My Activities" : "My Tasks";
  const totalItems = pagination?.total ?? data.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {totalItems} items{pagination && pagination.totalPages > 1 && ` · Page ${pagination.page} of ${pagination.totalPages}`}
          </p>
        </div>
        {role === "Admin" && (
          <button onClick={openAdd} className="px-4 py-2.5 text-xs font-semibold bg-violet-600 text-white rounded-2xl hover:bg-violet-700 flex items-center gap-2 transition-all shadow-md shadow-violet-500/20">
            <Plus size={14} /> Add Activity
          </button>
        )}
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={role === "Admin" ? "Search activities..." : "Search by location or activity..."}
            className="w-full pl-10 pr-10 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Activity size={24} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-medium">{search ? `No results for "${search}"` : "No activities found"}</p>
            {role === "Admin" && !search && (
              <button onClick={openAdd} className="mt-2 px-4 py-2 text-xs font-semibold bg-violet-600 text-white rounded-2xl hover:bg-violet-700 transition-all">+ Add First Activity</button>
            )}
          </div>
        ) : role === "Admin" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/40">
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest w-16">S.No</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Activity Name</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest w-20">Active</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((a, i) => (
                    <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-[12px] text-slate-400 font-mono">{(page - 1) * limit + i + 1}</td>
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">{a.activity_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${a.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {a.is_active ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(a)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all" title="Edit"><Edit size={15} /></button>
                          <button onClick={() => openDelete(a)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all" title="Delete"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar pagination={pagination} onPageChange={handlePageChange} onLimitChange={handleLimitChange} limit={limit} />
          </>
        ) : role === "Supervisor" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/40">
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Activity</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Start</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">End</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Worker</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((a) => (
                    <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">{a.location?.location_name || "-"}</td>
                      <td className="px-5 py-3.5 text-[13px] text-slate-500 font-medium">{a.activity?.activity_name || "-"}</td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-500">{a.planned_start_date ? new Date(a.planned_start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "-"}</td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-500">{a.planned_end_date ? new Date(a.planned_end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "-"}</td>
                      <td className="px-5 py-3.5"><Badge status={a.status} /></td>
                      <td className="px-5 py-3.5">
                        {a.worker?.full_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">{a.worker.full_name[0]}</div>
                            <span className="text-[12px] text-slate-600 font-medium">{a.worker.full_name}</span>
                          </div>
                        ) : <span className="text-[12px] text-amber-500 font-semibold">Not Assigned</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => nav(`/supervisor/activities/${a.id}`)} className="px-3 py-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all flex items-center gap-1">
                          View <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar pagination={pagination} onPageChange={handlePageChange} onLimitChange={handleLimitChange} limit={limit} />
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/40">
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Activity</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Start</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">End</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Progress</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((a) => (
                    <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">{a.location?.location_name || "-"}</td>
                      <td className="px-5 py-3.5 text-[13px] text-slate-500 font-medium">{a.activity?.activity_name || "-"}</td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-500">{a.planned_start_date ? new Date(a.planned_start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "-"}</td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-500">{a.planned_end_date ? new Date(a.planned_end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "-"}</td>
                      <td className="px-5 py-3.5"><Badge status={a.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${a.progress_pct || 0}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">{a.progress_pct || 0}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => nav(`/worker/tasks/${a.id}`)} className="px-3 py-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all flex items-center gap-1">
                          View <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar pagination={pagination} onPageChange={handlePageChange} onLimitChange={handleLimitChange} limit={limit} />
          </>
        )}
      </motion.div>

      {/* ── ADD MODAL ── */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <div className="mb-5">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Add New Activity</h3>
            <p className="text-xs text-slate-400 mt-1">Create a new activity in the master list</p>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Activity Name *" name="activity_name" value={formData.activity_name} onChange={handleChange} placeholder="e.g. Road Marking" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Planned Start Date</label>
                <input type="date" name="planned_start_date" value={formData.planned_start_date} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Planned End Date</label>
                <input type="date" name="planned_end_date" value={formData.planned_end_date} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
              </div>
            </div>
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-xs text-rose-600 font-medium">{formError}</div>
            )}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">Cancel</button>
              <Button type="submit" loading={crudLoading} className="w-auto px-5 py-2.5 text-xs">Create Activity</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && activeItem && (
        <Modal onClose={() => setEditModal(false)}>
          <div className="mb-5">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Edit Activity</h3>
            <p className="text-xs text-slate-400 mt-1">Editing: <span className="font-semibold text-slate-600">{activeItem.activity_name}</span></p>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input label="Activity Name *" name="activity_name" value={formData.activity_name} onChange={handleChange} />
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-xs text-rose-600 font-medium">{formError}</div>
            )}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">Cancel</button>
              <Button type="submit" loading={crudLoading} className="w-auto px-5 py-2.5 text-xs bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteModal && activeItem && (
        <Modal onClose={() => setDeleteModal(false)}>
          <div className="text-center">
            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-rose-500" /></div>
            <h3 className="text-lg font-extrabold text-slate-800 mb-1">Delete Activity</h3>
            <p className="text-sm text-slate-500 mb-1">Are you sure you want to delete</p>
            <p className="text-sm font-bold text-slate-700 mb-3">"{activeItem.activity_name}"</p>
            <p className="text-xs text-rose-500 font-semibold mb-6">⚠️ This will also remove it from all locations!</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteModal(false)} className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">Cancel</button>
              <button onClick={handleDelete} disabled={crudLoading} className="px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-2xl flex items-center gap-2 transition-all">
                {crudLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {crudLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Activities;




















// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import API from '../api/client';
// import PaginationBar from '../components/ui/Pagination';
// import Badge from '../components/ui/Badge';
// import Modal from '../components/ui/Modal';
// import Input from '../components/ui/Input';
// import Button from '../components/ui/Button';
// import { Edit, Trash2 } from 'lucide-react';

// // Empty Form 
// const emptyForm = {
//     activity_name: '',
//     planned_start_date: '',
//     planned_end_date: ''
// };

// // main components
// const Activities = () => {
//     const { role } = useAuth();
//     const nav = useNavigate();

//     // data states
//     const [loading, setLoading]       = useState(true);
//     const [data, setData]             = useState([]);
//     const [search, setSearch]         = useState('');
//     const [page, setPage]             = useState(1);
//     const [limit, setLimit]           = useState(10);
//     const [pagination, setPagination] = useState(null);

//     // crud states 
//     const [addModal, setAddModal]       = useState(false);
//     const [editModal, setEditModal]     = useState(false);
//     const [deleteModal, setDeleteModal] = useState(false);
//     const [activeItem, setActiveItem]   = useState(null);
//     const [formData, setFormData]       = useState(emptyForm);
//     const [formError, setFormError]     = useState('');
//     const [crudLoading, setCrudLoading] = useState(false);

//     const isFirstRender = useRef(true);

//     // fetch data
//     const fetchData = useCallback(async (pg = 1, lmt = 10, srch = '') => {
//         try {
//             setLoading(true);
//             const url =
//                 role === 'Admin'      ? '/admin/activities' :
//                 role === 'Supervisor' ? '/supervisor/activities' :
//                                         '/worker/tasks';

//             const r = await API.get(url, {
//                 params: { page: pg, limit: lmt, search: srch.trim() }
//             });

//             setData(r.data.data || []);
//             setPagination(r.data.pagination || null);
//         } catch (err) {
//             console.error('[Activities]', err?.response?.data || err.message);
//             setData([]);
//             setPagination(null);
//         } finally {
//             setLoading(false);
//         }
//     }, [role]);

//     // Page / Limit change pe fetch
//     useEffect(() => {
//         fetchData(page, limit, search);
//     }, [page, limit, fetchData]);

//     // Search change pe page 1 reset + fetch
//     useEffect(() => {
//         if (isFirstRender.current) {
//             isFirstRender.current = false;
//             return;
//         }
//         setPage(1);
//         fetchData(1, limit, search);
//     }, [search]);

//     //  Pagination Handlers 
//     const handlePageChange  = (pg)  => setPage(pg);
//     const handleLimitChange = (lmt) => { setLimit(lmt); setPage(1); };

//     // form handler 
//     const handleChange = (e) => {
//         setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
//         setFormError('');
//     };

//     //create 
//     const openAdd = () => {
//         setFormData(emptyForm);
//         setFormError('');
//         setAddModal(true);
//     };

//     const handleCreate = async (e) => {
//         e.preventDefault();
//         if (!formData.activity_name.trim()) {
//             setFormError('Activity name is required.');
//             return;
//         }

//         // validatation 
//         if(formData.planned_start_date && formData.planned_end_date &&
//             formData.planned_end_data < formData.planned_start_date
//         ){
//             setFormError('End date cannot be before start date.')
//             return;
//         }
//         setCrudLoading(true);
//         try {
//             await API.post('/admin/activities', {
//                 activity_name: formData.activity_name.trim(),
//                 // display_order: formData.display_order
//                 //     ? parseInt(formData.display_order)
//                 //     : 0
//                 planned_start_date: formData.planned_start_date || null,
//                 planned_end_date: formData.planned_end_date || null,
//             });
//             setAddModal(false);
//             setFormData(emptyForm);
//             fetchData(page, limit, search);
//         } catch (err) {
//             setFormError(
//                 err?.response?.data?.message || 'Failed to create activity.'
//             );
//         } finally {
//             setCrudLoading(false);
//         }
//     };

//     // update
//     const openEdit = (item) => {
//         setActiveItem(item);
//         setFormData({
//             activity_name: item.activity_name || '',
//             // display_order: String(item.display_order ?? '')
//         });
//         setFormError('');
//         setEditModal(true);
//     };

//     const handleUpdate = async (e) => {
//         e.preventDefault();
//         if (!formData.activity_name.trim()) {
//             setFormError('Activity name is required.');
//             return;
//         }
//         setCrudLoading(true);
//         try {
//             await API.put(`/admin/activities/${activeItem.id}`, {
//                 activity_name: formData.activity_name.trim(),
//                 // display_order: formData.display_order
//                 //     ? parseInt(formData.display_order)
//                 //     : 0
//             });
//             setEditModal(false);
//             setActiveItem(null);
//             fetchData(page, limit, search);
//         } catch (err) {
//             setFormError(
//                 err?.response?.data?.message || 'Failed to update activity.'
//             );
//         } finally {
//             setCrudLoading(false);
//         }
//     };

//     // delete
//     const openDelete = (item) => {
//         setActiveItem(item);
//         setDeleteModal(true);
//     };

//     const handleDelete = async () => {
//         setCrudLoading(true);
//         try {
//             await API.delete(`/admin/activities/${activeItem.id}`);
//             setDeleteModal(false);
//             setActiveItem(null);

//             // Last item delete hone pe prev page pe jao
//             if (data.length === 1 && page > 1) {
//                 setPage(prev => prev - 1);
//             } else {
//                 fetchData(page, limit, search);
//             }
//         } catch (err) {
//             alert(err?.response?.data?.message || 'Failed to delete.');
//         } finally {
//             setCrudLoading(false);
//         }
//     };

//     // helpers
//     const title = role === 'Admin'      ? 'Activities Master' :
//                   role === 'Supervisor' ? 'My Activities'     : 'My Tasks';

//     const totalItems = pagination?.total ?? data.length;


//     // render 
//     return (
//         <div className="space-y-4">

//             {/* Header*/}
//             <div className="flex items-center justify-between flex-wrap gap-3">
//                 <div>
//                     <h2 className="text-lg font-bold text-slate-800">
//                         {title}
//                     </h2>
//                     <p className="text-xs text-slate-400">
//                         {totalItems} items
//                         {pagination && pagination.totalPages > 1 &&
//                             ` · Page ${pagination.page} of ${pagination.totalPages}`
//                         }
//                     </p>
//                 </div>

//                 {/*  Add Button - Sirf Admin ke liye */}
//                 {role === 'Admin' && (
//                     <button
//                         onClick={openAdd}
//                         className="px-3 py-2 text-xs font-medium bg-blue-600 
//                                    text-white rounded-lg hover:bg-blue-700 
//                                    flex items-center gap-1.5"
//                     >
//                         <svg className="w-4 h-4" fill="none"
//                             stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M12 4v16m8-8H4" />
//                         </svg>
//                         Add Activity
//                     </button>
//                 )}
//             </div>

//             {/* search*/}
//             <div className="bg-white rounded-xl border border-slate-200/80 p-4">
//                 <div className="relative max-w-sm">
//                     <svg className="absolute left-3 top-1/2 -translate-y-1/2 
//                                     w-4 h-4 text-slate-400"
//                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                     </svg>
//                     <input
//                         type="text"
//                         value={search}
//                         onChange={e => setSearch(e.target.value)}
//                         placeholder={
//                             role === 'Admin'
//                                 ? 'Search activities...'
//                                 : 'Search by location or activity...'
//                         }
//                         className="w-full pl-10 pr-9 py-2 border border-slate-200 
//                                    rounded-lg text-sm focus:outline-none 
//                                    focus:ring-2 focus:ring-blue-500/20 
//                                    focus:border-blue-500"
//                     />
//                     {search && (
//                         <button
//                             onClick={() => setSearch('')}
//                             className="absolute right-3 top-1/2 -translate-y-1/2 
//                                        text-slate-400 hover:text-slate-600"
//                         >
//                             <svg className="w-4 h-4" fill="none"
//                                 stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth={2}
//                                     d="M6 18L18 6M6 6l12 12" />
//                             </svg>
//                         </button>
//                     )}
//                 </div>
//             </div>

//             {/* table */}
//             <div className="bg-white rounded-xl border 
//                             border-slate-200/80 overflow-hidden">
//                 {loading ? (
//                     <div className="flex items-center justify-center py-20">
//                         <div className="w-6 h-6 border-[3px] border-blue-600 
//                                         border-t-transparent rounded-full 
//                                         animate-spin" />
//                     </div>

//                 ) : data.length === 0 ? (
//                     <div className="text-center py-16">
//                         <p className="text-slate-400 text-sm">
//                             {search
//                                 ? `No results for "${search}"`
//                                 : 'No activities found'
//                             }
//                         </p>
//                         {/*  Add button in empty state */}
//                         {role === 'Admin' && !search && (
//                             <button
//                                 onClick={openAdd}
//                                 className="mt-3 px-4 py-2 text-xs font-medium 
//                                            bg-blue-600 text-white rounded-lg 
//                                            hover:bg-blue-700"
//                             >
//                                 + Add First Activity
//                             </button>
//                         )}
//                     </div>

//                 ) : role === 'Admin' ? (
//                     // admin table 
//                     <>
//                         <div className="overflow-x-auto">
//                             <table className="w-full">
//                                 <thead>
//                                     <tr className="bg-slate-50/80 border-b 
//                                                    border-slate-100">
//                                         <th className="px-5 py-2.5 text-left 
//                                                        text-[10px] font-semibold 
//                                                        text-slate-500 uppercase 
//                                                        tracking-wide w-16">
//                                             S.No
//                                         </th>
//                                         <th className="px-5 py-2.5 text-left 
//                                                        text-[10px] font-semibold 
//                                                        text-slate-500 uppercase 
//                                                        tracking-wide">
//                                             Activity Name
//                                         </th>
//                                         {/* <th className="px-5 py-2.5 text-left 
//                                                        text-[10px] font-semibold 
//                                                        text-slate-500 uppercase 
//                                                        tracking-wide w-24">
//                                             Order
//                                         </th> */}
//                                         <th className="px-5 py-2.5 text-left 
//                                                        text-[10px] font-semibold 
//                                                        text-slate-500 uppercase 
//                                                        tracking-wide w-20">
//                                             Active
//                                         </th>
//                                         {/*  Actions Column */}
//                                         <th className="px-5 py-2.5 text-left 
//                                                        text-[10px] font-semibold 
//                                                        text-slate-500 uppercase 
//                                                        tracking-wide w-24">
//                                             Actions
//                                         </th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {data.map((a, i) => (
//                                         <tr key={a.id}
//                                             className="border-t border-slate-50 
//                                                        hover:bg-slate-50/50">
//                                             {/* S.No */}
//                                             <td className="px-5 py-3 text-[12px] 
//                                                            text-slate-400 font-mono">
//                                                 {(page - 1) * limit + i + 1}
//                                             </td>

//                                             {/* Activity Name */}
//                                             <td className="px-5 py-3 text-[12px] 
//                                                            font-medium text-slate-700">
//                                                 {a.activity_name}
//                                             </td>

//                                             {/* Display Order */}
//                                             {/* <td className="px-5 py-3 text-[12px] 
//                                                            text-slate-500">
//                                                 {a.display_order ?? '-'}
//                                             </td> */}

//                                             {/* Active Status */}
//                                             <td className="px-5 py-3">
//                                                 <span className={`px-2 py-0.5 
//                                                     rounded-md text-[11px] 
//                                                     font-semibold
//                                                     ${a.is_active
//                                                         ? 'bg-emerald-50 text-emerald-700'
//                                                         : 'bg-red-50 text-red-700'
//                                                     }`}>
//                                                     {a.is_active ? 'Yes' : 'No'}
//                                                 </span>
//                                             </td>

//                                             {/*  Actions */}
//                                             <td className="px-5 py-3">
//                                                 <div className="flex items-center gap-1.5">
//                                                     {/* Edit */}
//                                                     <button
//                                                         onClick={() => openEdit(a)}
//                                                         className="p-1.5 text-emerald-600 
//                                                                    bg-emerald-50 
//                                                                    hover:bg-emerald-100 
//                                                                    rounded-md"
//                                                         title="Edit"
//                                                     >
//                                                         <Edit className="w-4 h-4" />
//                                                     </button>

//                                                     {/* Delete */}
//                                                     <button
//                                                         onClick={() => openDelete(a)}
//                                                         className="p-1.5 text-red-600 
//                                                                    bg-red-50 
//                                                                    hover:bg-red-100 
//                                                                    rounded-md"
//                                                         title="Delete"
//                                                     >
//                                                         <Trash2 className="w-4 h-4" />
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                         <PaginationBar
//                             pagination={pagination}
//                             onPageChange={handlePageChange}
//                             onLimitChange={handleLimitChange}
//                             limit={limit}
//                         />
//                     </>

                

//                 ) :  role === 'Supervisor' ?  (
//                     // supervisor worker table
//                     <>
//                         <div className="overflow-x-auto">
//             <table className="w-full">
//                 <thead>
//                     <tr className="bg-slate-50/80 border-b border-slate-100">
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             Location
//                         </th>
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             Activity
//                         </th>
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             Start
//                         </th>
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             End
//                         </th>
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             Status
//                         </th>
//                         {/*  Supervisor CAN see Worker column */}
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             Worker
//                         </th>
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide" />
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {data.map(a => (
//                         <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50/50">
//                             <td className="px-5 py-3 text-[12px] font-medium text-slate-700">
//                                 {a.location?.location_name || '-'}
//                             </td>
//                             <td className="px-5 py-3 text-[12px] text-slate-500">
//                                 {a.activity?.activity_name || '-'}
//                             </td>
//                             <td className="px-5 py-3 text-[12px] text-slate-500">
//                                 {a.planned_start_date
//                                     ? new Date(a.planned_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
//                                     : '-'}
//                             </td>
//                             <td className="px-5 py-3 text-[12px] text-slate-500">
//                                 {a.planned_end_date
//                                     ? new Date(a.planned_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
//                                     : '-'}
//                             </td>
//                             <td className="px-5 py-3">
//                                 <Badge status={a.status} />
//                             </td>
//                             {/*  Supervisor sees assigned worker or "Not Assigned" */}
//                             <td className="px-5 py-3 text-[12px] text-slate-500">
//                                 {a.worker?.full_name ? (
//                                     <div className="flex items-center gap-1.5">
//                                         <div className="w-5 h-5 bg-blue-500 rounded-md flex items-center justify-center text-white text-[8px] font-bold">
//                                             {a.worker.full_name[0]}
//                                         </div>
//                                         <span>{a.worker.full_name}</span>
//                                     </div>
//                                 ) : (
//                                     <span className="text-amber-500 font-medium">
//                                         Not Assigned
//                                     </span>
//                                 )}
//                             </td>
//                             <td className="px-5 py-3">
//                                 <button
//                                     onClick={() => nav(`/supervisor/activities/${a.id}`)}
//                                     className="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
//                                 >
//                                     View
//                                 </button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//         <PaginationBar
//             pagination={pagination}
//             onPageChange={handlePageChange}
//             onLimitChange={handleLimitChange}
//             limit={limit}
//         />
//     </>

// ) : (

//         // worker table 
//     <>
//         <div className="overflow-x-auto">
//             <table className="w-full">
//                 <thead>
//                     <tr className="bg-slate-50/80 border-b border-slate-100">
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             Location
//                         </th>
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             Activity
//                         </th>
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             Start
//                         </th>
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             End
//                         </th>
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             Status
//                         </th>
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
//                             Progress
//                         </th>
                        
//                         {/*  NO Worker column for Worker role */}
//                         <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide" />
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {data.map(a => (
//                         <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50/50">
//                             <td className="px-5 py-3 text-[12px] font-medium text-slate-700">
//                                 {a.location?.location_name || '-'}
//                             </td>
//                             <td className="px-5 py-3 text-[12px] text-slate-500">
//                                 {a.activity?.activity_name || '-'}
//                             </td>
//                             <td className="px-5 py-3 text-[12px] text-slate-500">
//                                 {a.planned_start_date
//                                     ? new Date(a.planned_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
//                                     : '-'}
//                             </td>
//                             <td className="px-5 py-3 text-[12px] text-slate-500">
//                                 {a.planned_end_date
//                                     ? new Date(a.planned_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
//                                     : '-'}
//                             </td>
//                             <td className="px-5 py-3">
//                                 <Badge status={a.status} />
//                             </td>
//                             {/*  Show Progress % instead of Worker */}
//                             <td className="px-5 py-3 text-[12px] text-slate-500">
//                                 <div className="flex items-center gap-2">
//                                     <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                                         <div
//                                             className="h-full bg-blue-500 rounded-full"
//                                             style={{ width: `${a.progress_pct || 0}%` }}
//                                         />
//                                     </div>
//                                     <span>{a.progress_pct || 0}%</span>
//                                 </div>
//                             </td>
//                             <td className="px-5 py-3">
//                                 <button
//                                     onClick={() => nav(`/worker/tasks/${a.id}`)}
//                                     className="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
//                                 >
//                                     View
//                                 </button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>

//                         <PaginationBar
//                             pagination={pagination}
//                             onPageChange={handlePageChange}
//                             onLimitChange={handleLimitChange}
//                             limit={limit}
//                         />
//                     </>
//                 )}
//             </div>

//                 {/* modal only for admin  */}

//             {/* add modal*/}
//             {addModal && (
//                 <Modal onClose={() => setAddModal(false)}>
//                     <h3 className="text-sm font-bold text-slate-800 mb-1">
//                         Add New Activity
//                     </h3>
//                     <p className="text-xs text-slate-400 mb-5">
//                         Create a new activity in the master list.
//                     </p>
//                     <form onSubmit={handleCreate} className="space-y-4">
//                         <Input
//                             label="Activity Name *"
//                             name="activity_name"
//                             value={formData.activity_name}
//                             onChange={handleChange}
//                             placeholder="e.g. Road Marking"
//                         />
//                         {/* <Input
//                             label="Display Order"
//                             name="display_order"
//                             type="number"
//                             value={formData.display_order}
//                             onChange={handleChange}
//                             placeholder="e.g. 1"
//                         /> */}
//                         {
//                             <div className="grid grid-cols-2 gap-3">
//                                 <div>
//                                     <label className='block text-xs font-semibold
//                                     text-slate-600 mb-1.5'>
//                                         Planned Start Date
//                                     </label>
//                                     <input
//                                         type="date"
//                                         name="planned_start_date"
//                                         value={formData.planned_start_date}
//                                         onChange={handleChange}
//                                         className="w-full px-3 py-2 border border-slate-200 
//                                         rounded-lg text-sm focus:outline-none 
//                                         focus:ring-2 focus:ring-blue-500/20 
//                                          focus:border-blue-500"
//                                     />
//                                 </div>
//                                 <div>
//                                 <label className="block text-xs font-semibold 
//                                       text-slate-600 mb-1.5">
//                                     Planned End Date
//                                 </label>
//                                 <input
//                                 type="date"
//                                     name="planned_end_date"
//                                     value={formData.planned_end_date}
//                                     onChange={handleChange}
//                                     className="w-full px-3 py-2 border border-slate-200 
//                                    rounded-lg text-sm focus:outline-none 
//                                    focus:ring-2 focus:ring-blue-500/20 
//                                    focus:border-blue-500"
//                                 />
//                             </div>
//                         </div>
//                         }
//                         {formError && (
//                             <p className="text-xs text-red-500 bg-red-50 
//                                           border border-red-100 rounded-lg 
//                                           px-3 py-2">
//                                 {formError}
//                             </p>
//                         )}
//                         <div className="flex gap-2 justify-end pt-3">
//                             <button
//                                 type="button"
//                                 onClick={() => setAddModal(false)}
//                                 className="px-4 py-2 text-xs font-medium 
//                                            text-slate-600 bg-slate-100 
//                                            hover:bg-slate-200 rounded-lg"
//                             >
//                                 Cancel
//                             </button>
//                             <Button
//                                 type="submit"
//                                 loading={crudLoading}
//                                 className="w-auto px-4 py-2 text-xs"
//                             >
//                                 Create Activity
//                             </Button>
//                         </div>
//                     </form>
//                 </Modal>
//             )}

//             {/* edit modal*/}
//             {editModal && activeItem && (
//                 <Modal onClose={() => setEditModal(false)}>
//                     <h3 className="text-sm font-bold text-slate-800 mb-1">
//                         Edit Activity
//                     </h3>
//                     <p className="text-xs text-slate-400 mb-5">
//                         Editing:{' '}
//                         <span className="font-semibold text-slate-600">
//                             {activeItem.activity_name}
//                         </span>
//                     </p>
//                     <form onSubmit={handleUpdate} className="space-y-4">
//                         <Input
//                             label="Activity Name *"
//                             name="activity_name"
//                             value={formData.activity_name}
//                             onChange={handleChange}
//                         />
//                         {/* <Input
//                             label="Display Order"
//                             name="display_order"
//                             type="number"
//                             value={formData.display_order}
//                             onChange={handleChange}
//                         /> */}
//                         {/* {formError && (
//                             <p className="text-xs text-red-500 bg-red-50 
//                                           border border-red-100 rounded-lg 
//                                           px-3 py-2">
//                                 {formError}
//                             </p>
//                         )} */}
//                         <div className="flex gap-2 justify-end pt-3">
//                             <button
//                                 type="button"
//                                 onClick={() => setEditModal(false)}
//                                 className="px-4 py-2 text-xs font-medium 
//                                            text-slate-600 bg-slate-100 
//                                            hover:bg-slate-200 rounded-lg"
//                             >
//                                 Cancel
//                             </button>
//                             <Button
//                                 type="submit"
//                                 loading={crudLoading}
//                                 className="w-auto px-4 py-2 text-xs 
//                                            bg-emerald-600 hover:bg-emerald-700"
//                             >
//                                 Save Changes
//                             </Button>
//                         </div>
//                     </form>
//                 </Modal>
//             )}

//             {/* delete modal */}
//             {deleteModal && activeItem && (
//                 <Modal onClose={() => setDeleteModal(false)}>
//                     <div className="flex items-center justify-center w-12 h-12 
//                                     bg-red-100 rounded-full mx-auto mb-4">
//                         <svg className="w-6 h-6 text-red-600" fill="none"
//                             stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
//                         </svg>
//                     </div>
//                     <h3 className="text-sm font-bold text-slate-800 
//                                    text-center mb-1">
//                         Delete Activity
//                     </h3>
//                     <p className="text-xs text-slate-500 text-center mb-1">
//                         Are you sure you want to delete
//                     </p>
//                     <p className="text-sm font-semibold text-slate-700 
//                                   text-center mb-1">
//                         "{activeItem.activity_name}"
//                     </p>
//                     <p className="text-xs text-red-500 text-center mb-6">
//                         ⚠️ This will also remove it from all locations!
//                     </p>
//                     <div className="flex gap-2 justify-end">
//                         <button
//                             onClick={() => setDeleteModal(false)}
//                             className="px-4 py-2 text-xs font-medium 
//                                        text-slate-600 bg-slate-100 
//                                        hover:bg-slate-200 rounded-lg"
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             onClick={handleDelete}
//                             disabled={crudLoading}
//                             className="px-4 py-2 text-xs font-medium text-white 
//                                        bg-red-600 hover:bg-red-700 
//                                        disabled:bg-red-400 rounded-lg 
//                                        flex items-center gap-1.5"
//                         >
//                             {crudLoading && (
//                                 <span className="w-3 h-3 border-2 border-white 
//                                                  border-t-transparent rounded-full 
//                                                  animate-spin" />
//                             )}
//                             {crudLoading ? 'Deleting...' : 'Yes, Delete'}
//                         </button>
//                     </div>
//                 </Modal>
//             )}

//         </div>
//     );
// };

// export default Activities;