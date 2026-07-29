"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NinjinLockedPage() {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#000000] flex flex-col font-sans select-none pb-20">
      <main className="max-w-xl w-full mx-auto px-6 mt-20 flex-1 flex flex-col justify-center items-center text-center gap-8">
        <div className="border-3 border-[#000000] p-8 bg-[#ffffff] rounded-none space-y-6">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="text-left font-mono space-y-4"
          >
            <div className="text-[12px] font-bold text-[#FF0000] uppercase tracking-[0.25em]">
              [ERROR: STAGE_LOCKED]
            </div>
            <h1 className="font-heading text-4xl uppercase leading-none tracking-tight">
              NINJIN'S QUEST IS UNAVAILABLE
            </h1>
            <p className="text-sm leading-relaxed text-[#333333]">
              This stage is currently offline or undergoing system maintenance. Access is restricted.
            </p>
          </motion.div>

          <Link href="/v2" className="block w-full">
            <button className="w-full bg-[#000000] text-[#ffffff] border-3 border-[#000000] py-3.5 uppercase font-bold text-[12px] tracking-[2px] transition-colors hover:bg-[#ffffff] hover:text-[#000000] active:scale-95">
              RETURN TO STAGE SELECT
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}