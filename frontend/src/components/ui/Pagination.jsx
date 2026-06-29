import React from 'react';
import { ChevronLeft, ChevronRight, Rows3 } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const Pagination = ({ pagination, onPageChange, onLimitChange, limit }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, hasNextPage, hasPrevPage } = pagination;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-slate-100">
      
      {/* Showing info + Rows selector */}
      <div className="flex items-center gap-4">
        <p className="text-xs text-slate-500">
          Showing{' '}
          <span className="font-semibold text-slate-700">
            {Math.min((page - 1) * limit + 1, total)} – {Math.min(page * limit, total)}
          </span>
          {' '}of{' '}
          <span className="font-semibold text-slate-700">{total}</span>
          {' '}results
        </p>

        {onLimitChange && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <Rows3 size={13} className="text-slate-400" />
            <select
              value={limit}
              onChange={(e) => onLimitChange(parseInt(e.target.value))}
              className="text-xs border-2 border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 cursor-pointer hover:border-slate-300 transition-all"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1.5">
        
        {/* Previous */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-200 transition-all"
        >
          <ChevronLeft size={14} />
          Prev
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="px-2 text-xs text-slate-400 font-medium">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 text-xs font-bold rounded-xl transition-all duration-200 ${
                p === page
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40'
                  : 'text-slate-600 hover:bg-violet-50 hover:text-violet-600 border-2 border-slate-200 hover:border-violet-300'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-200 transition-all"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;














// import React from 'react';

// const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// const Pagination = ({ pagination, onPageChange, onLimitChange, limit }) => {
//     if (!pagination || pagination.totalPages <= 1) return null;

//     const { page, totalPages, total, hasNextPage, hasPrevPage } = pagination;

//     const getPageNumbers = () => {
//         const pages = [];
//         if (totalPages <= 7) {
//             for (let i = 1; i <= totalPages; i++) pages.push(i);
//         } else {
//             pages.push(1);
//             if (page > 3) pages.push('...');
//             const start = Math.max(2, page - 1);
//             const end   = Math.min(totalPages - 1, page + 1);
//             for (let i = start; i <= end; i++) pages.push(i);
//             if (page < totalPages - 2) pages.push('...');
//             pages.push(totalPages);
//         }
//         return pages;
//     };

//     return (
//         <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-white rounded-b-xl">
//             <div className="flex items-center gap-3">
//                 <p className="text-[11px] text-slate-400">
//                     Showing{' '}
//                     <span className="font-semibold text-slate-600">
//                         {Math.min((page - 1) * limit + 1, total)}
//                         –
//                         {Math.min(page * limit, total)}
//                     </span>
//                     {' '}of{' '}
//                     <span className="font-semibold text-slate-600">{total}</span>
//                 </p>

//                 {onLimitChange && (
//                     <div className="flex items-center gap-1.5">
//                         <span className="text-[11px] text-slate-400">Rows:</span>
//                         <select
//                             value={limit}
//                             onChange={e => onLimitChange(parseInt(e.target.value))}
//                             className="text-[11px] border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
//                         >
//                             {PAGE_SIZE_OPTIONS.map(s => (
//                                 <option key={s} value={s}>{s}</option>
//                             ))}
//                         </select>
//                     </div>
//                 )}
//             </div>

//             <div className="flex items-center gap-1">
//                 <button
//                     onClick={() => onPageChange(page - 1)}
//                     disabled={!hasPrevPage}
//                     className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
//                 >
//                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                     </svg>
//                     Prev
//                 </button>

//                 {getPageNumbers().map((p, i) =>
//                     p === '...' ? (
//                         <span key={`e-${i}`} className="px-1.5 text-[11px] text-slate-400">…</span>
//                     ) : (
//                         <button
//                             key={p}
//                             onClick={() => onPageChange(p)}
//                             className={`w-7 h-7 text-[11px] font-medium rounded-lg transition-colors
//                                 ${p === page
//                                     ? 'bg-blue-600 text-white'
//                                     : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
//                                 }`}
//                         >
//                             {p}
//                         </button>
//                     )
//                 )}

//                 <button
//                     onClick={() => onPageChange(page + 1)}
//                     disabled={!hasNextPage}
//                     className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
//                 >
//                     Next
//                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default Pagination;
