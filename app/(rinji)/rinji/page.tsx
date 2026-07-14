'use client'

import { motion } from "framer-motion";
import { ArrowLeft, Brain, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LoadingScreen from "@/components/LoadingScreen";
import BackComponent from "@/components/BackComponent";

export default function RinjiBrainPage() {
  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 overflow-hidden">
      <LoadingScreen mode="in" />
      <BackComponent variant="light" />

      {/* Dynamic Purple/Indigo background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-indigo-950/20 to-transparent blur-[120px] scale-110" />
      </div>

      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6 flex flex-col items-center"
        >
          {/* Glowing icon graphic */}
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-35 animate-pulse" />
            <Image 
              src="/rinji-brain.jpg" 
              alt="Rinji's Brain" 
              width={140} 
              height={140} 
              className="relative rounded-3xl border border-white/10 shadow-2xl object-cover" 
            />
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              NEW PORTAL INITIALIZED
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
              Rinji's Brain
            </h1>
            <p className="text-xs text-slate-400 max-w-xs font-bold leading-relaxed pt-2">
              Your digital second brain is under construction! In the future, you'll be able to link notes, map concepts, and dump your thoughts in a visually stunning cat-guided workspace.
            </p>
          </div>

          <div className="pt-4 w-full">
            <Link 
              href="/"
              className="inline-flex w-full justify-center py-4 bg-purple-600 hover:bg-purple-750 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-900/10 cursor-pointer"
            >
              Back to Portal
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
