import React from 'react';

const StatCard = ({ value, label, valueColor = 'text-slate-800' }) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 text-center">
            <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
            <p className="text-[10px] text-slate-400 font-medium">{label}</p>
        </div>
    );
};

export default StatCard;
