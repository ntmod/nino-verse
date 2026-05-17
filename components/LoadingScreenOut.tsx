"use client";

import { motion } from "framer-motion";

export default function LoadingScreenOut() {
  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: "0%" }}
      transition={{ 
        duration: 0.8, 
        ease: [0.65, 0, 0.35, 1] 
      }}
      className="fixed inset-0 bg-white z-[9999] pointer-events-none"
    />
  );
}
