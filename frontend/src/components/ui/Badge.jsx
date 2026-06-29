// import React from 'react';

const Badge = ({ status }) => {
    const m = {
        'Completed':   'bg-emerald-50 text-emerald-700',
        'In Progress': 'bg-blue-50 text-blue-700',
        'Not Started': 'bg-slate-100 text-slate-500',
        'Delayed':     'bg-red-50 text-red-700',
        'On Hold':     'bg-amber-50 text-amber-700',
        'Incomplete':  'bg-orange-50 text-orange-700', // ✅ SIRF YE 1 LINE ADD KI

    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${m[status] || m['Not Started']}`}>
            {status || 'N/A'}
        </span>
    );
};

export default Badge;
