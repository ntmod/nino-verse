"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import LoadingScreenOut from "./LoadingScreenOut";

export default function BackComponent({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showExitWipe, setShowExitWipe] = useState(false);

  // Reset exit wipe when navigating to a new page
  useEffect(() => {
    setShowExitWipe(false);
  }, [pathname]);

  const handleBack = () => {
    setShowExitWipe(true);
    
    // Determine where to go back to
    let targetPath = "/";
    if (pathname === "/nori/note") {
        targetPath = "/nori";
    }

    setTimeout(() => {
      router.push(targetPath);
    }, 800);
  };

  const isLight = variant === "light";

  return (
    <>
      {showExitWipe && <LoadingScreenOut />}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        onClick={handleBack}
        className={`fixed top-2 left-4 z-[100] flex items-center gap-2 transition-colors group cursor-pointer ${
          isLight ? "text-white/70 hover:text-white" : "text-slate-400 hover:text-slate-900"
        }`}
      >
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
          isLight 
            ? "border-white/10 group-hover:border-white group-hover:bg-white/10" 
            : "border-black/5 group-hover:border-[#FF9D00] group-hover:bg-[#FF9D00]/10"
        }`}>
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </div>
        <span className="text-sm font-bold uppercase tracking-widest hidden md:block">Back</span>
      </motion.button>
    </>
  );
}
