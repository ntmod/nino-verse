"use client";

import { motion } from "framer-motion";

interface LoadingScreenProps {
  mode: "in" | "out";
}

export default function LoadingScreen({ mode }: LoadingScreenProps) {
  const isOut = mode === "out";
  return (
    <motion.div
      initial={{ x: isOut ? "-100%" : "0%" }}
      animate={{ x: isOut ? "0%" : "100%" }}
      transition={{ 
        duration: 0.8, 
        ease: [0.65, 0, 0.35, 1] 
      }}
      className={`fixed inset-0 bg-white pointer-events-none ${
        isOut ? "z-[9999]" : "z-[1000]"
      }`}
    />
  );
}
