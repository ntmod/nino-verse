'use client'

import { motion } from "framer-motion";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import LoadingScreenIn from "@/components/LoadingScreenIn";

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-white md:bg-gray-50 flex flex-col items-center justify-center p-6 pt-16 md:pt-24 pb-20">
      <LoadingScreenIn />

      <div className="w-full max-w-2xl flex flex-col items-center text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-col items-center gap-2">
            <Link href="/nori" className="flex items-center gap-1.5 text-gray-400 hover:text-black transition-colors text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              <ArrowLeft className="w-3 h-3" />
              Back to Home
            </Link>
            
            <div className="w-20 h-20 bg-[#FF9D00]/10 rounded-3xl flex items-center justify-center mb-4">
              <BarChart3 className="w-10 h-10 text-[#FF9D00]" />
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-black tracking-tighter uppercase italic leading-none">
              Analytics<span className="text-gray-200">/</span><span className="text-[#FF9D00]">Soon</span>
            </h1>
          </div>

          <div className="max-w-md mx-auto space-y-8 pt-4">
            <div className="p-4 w-full h-64 relative rounded-[2.5rem] overflow-hidden bg-white shadow-xl shadow-black/5 flex items-center justify-center">
              <img 
                src="/animations/nori/popup/cat-popup-info.gif" 
                alt="Under Construction"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-[#FF9D00] uppercase tracking-[0.3em]">Phase 1: Coming Soon</p>
              <p className="text-xs font-bold text-gray-400 leading-relaxed max-w-xs mx-auto">
                We're currently building advanced insights for your spending habits. Stay tuned for beautiful charts and deep financial analytics!
              </p>
            </div>

            <div className="pt-4">
              <Link 
                href="/nori"
                className="inline-block px-10 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
              >
                Return Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
