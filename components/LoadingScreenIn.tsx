"use client";

import { motion } from "framer-motion";

export default function LoadingScreenIn() {
  return (
    <motion.div
      initial={{ x: "0%" }}
      animate={{ x: "100%" }}
      transition={{ 
        duration: 0.8, 
        ease: [0.65, 0, 0.35, 1] 
      }}
      className="fixed inset-0 bg-white z-[1000] pointer-events-none"
    />
  );
}
