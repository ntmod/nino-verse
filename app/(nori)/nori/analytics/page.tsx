'use client'

import { motion } from "framer-motion";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";
import AnnualExpenseHistogram from "@/components/AnnualExpenseHistogram";

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-6 pt-16 md:pt-24 pb-20">
      <LoadingScreen mode="in" />

      <div className="w-full max-w-4xl flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/nori" className="flex items-center gap-1.5 text-gray-400 hover:text-black transition-colors mb-2 text-[10px] font-bold uppercase tracking-widest">
              <ArrowLeft className="w-3 h-3" />
              Back to Home
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF9D00]/10 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#FF9D00]" />
              </div>
              <h1 className="text-2xl font-black text-black tracking-tighter uppercase italic">
                Analytics
              </h1>
            </div>
          </motion.div>
        </div>

        {/* Histogram Component */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AnnualExpenseHistogram />
        </motion.div>
      </div>
    </main>
  );
}
