import React from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';

interface CategoryAverage {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  dailyAverage: number;
}

interface MetricsCardProps {
  dailyAverage: number;
  breakdown?: CategoryAverage[];
  isLoading?: boolean;
}

export default function MetricsCard({ dailyAverage, breakdown = [], isLoading = false }: MetricsCardProps) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] animate-pulse min-h-[100px] flex flex-col justify-center w-full">
        <div className="h-3 bg-slate-100 rounded-full w-24 mb-2" />
        <div className="h-6 bg-slate-100 rounded-full w-36 mb-4" />
        <div className="flex gap-2">
          <div className="h-8 bg-slate-100 rounded-full w-20" />
          <div className="h-8 bg-slate-100 rounded-full w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-6 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col w-full group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Daily Average</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900 italic leading-none">
            THB {dailyAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <Link href="/nori/settings/daily-average">
          <button 
            title="Configure daily average categories"
            className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center hover:bg-slate-900 hover:border-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <Settings className="w-4 h-4 transition-colors" />
          </button>
        </Link>
      </div>

      {breakdown.length > 0 && (
        <div className="mt-6 pt-6 border-t border-black/5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">By Category</p>
          <div className="flex flex-wrap gap-2">
            {breakdown.map((item) => (
              <div 
                key={item.categoryId} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-black/5 text-[11px] font-bold text-slate-700 hover:bg-white hover:shadow-sm transition-all"
              >
                <span className="text-sm">{item.categoryIcon}</span>
                <span className="text-slate-400 uppercase text-[9px] font-black tracking-wider">{item.categoryName}</span>
                <span className="text-slate-900">
                  THB {item.dailyAverage.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
