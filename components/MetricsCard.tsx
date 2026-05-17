import React from 'react';

interface MetricsCardProps {
  dailyAverage: number;
  savingsMet: number;
}

export default function MetricsCard({ dailyAverage, savingsMet }: MetricsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <div className="p-4 md:p-6 rounded-3xl bg-white border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Daily Average</p>
        <p className="text-2xl font-black text-slate-900 italic">THB {dailyAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <div className="p-4 md:p-6 rounded-3xl bg-white border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Savings Goal</p>
        <p className="text-2xl font-black text-[#FF9D00] italic">{savingsMet}% Met</p>
      </div>
    </div>
  );
}
