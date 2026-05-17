"use client"
import LoadingScreenIn from "@/components/LoadingScreenIn";
import BackComponent from "@/components/BackComponent";
import { motion } from "framer-motion";

export default function Ninjinpage() {
  return (
    <main className="relative min-h-screen bg-[#FF9D00] flex flex-col items-center justify-center p-8 overflow-hidden">
      <LoadingScreenIn />
      <BackComponent variant="light" />
      
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-black text-white italic tracking-tighter uppercase drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] leading-none">
            Ninjin
          </h1>
          <p className="text-xl md:text-2xl font-bold text-white/60 mt-6 uppercase tracking-[0.4em]">
            Quest Initialized
          </p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            className="mt-16 relative inline-block group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative px-8 py-4 bg-black/30 backdrop-blur-2xl rounded-2xl border border-white/10 flex items-center gap-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
              </span>
              <span className="text-white text-sm md:text-base font-black uppercase tracking-[0.4em]">
                Under Development
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      </div>
    </main>
  );
}