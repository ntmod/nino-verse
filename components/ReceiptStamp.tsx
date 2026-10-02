'use client';

import { useEffect } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { PawPrint } from "lucide-react";
import { playUISound } from "@/lib/ui-sounds.mjs";
import { useLanguage } from "@/lib/language-context";

export default function ReceiptStamp({ label, animated = true }: { label?: string; animated?: boolean }) {
  const { language } = useLanguage();
  const th = language === "th";
  const reducedMotion = useReducedMotion();
  const still = !animated || reducedMotion;
  useEffect(() => {
    if (!animated) return;
    const timer = window.setTimeout(() => playUISound("stamp"), reducedMotion ? 0 : 1150);
    return () => window.clearTimeout(timer);
  }, [animated, reducedMotion]);
  return (
            <div aria-hidden="true" className="pointer-events-none relative mt-5 h-24 select-none">
              <div className="absolute bottom-7 left-1/2 w-[320px] max-w-[calc(100%+16px)] -translate-x-1/2">
                <motion.svg viewBox="0 0 56 56" className="w-full overflow-visible text-[#416b54]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                  initial={still ? false : { opacity: 0, scale: 1.6, rotate: -16 }}
                  animate={{ opacity: 0.22, scale: 1, rotate: -12 }}
                  transition={still ? { duration: 0 } : { delay: 1.15, duration: 0.16, ease: "easeIn" }}
                >
                  <circle cx="28" cy="28" r="23" strokeWidth="2.5" />
                  <circle cx="28" cy="28" r="19" strokeWidth="1" strokeDasharray="2 3" opacity="0.65" />
                  <PawPrint x={16} y={16} width={24} height={24} strokeWidth={2} />
                  {[[3, 14], [50, 5], [55, 36]].map(([cx, cy], index) => (
                    <circle key={index} cx={cx} cy={cy} r={index === 1 ? 1 : 1.5} fill="currentColor" stroke="none" opacity="0.65" />
                  ))}
                </motion.svg>
              </div>
              <motion.p className="absolute inset-x-0 bottom-0 text-center text-sm font-black text-[#416b54]"
                initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: still ? 0 : 1.3, duration: still ? 0 : 0.2 }}
              >{label ?? (th ? "จดให้แล้ว!" : "Noted!")}</motion.p>
              {!still && (
                <motion.div
                  initial={{ opacity: 0, x: 28, y: 6 }}
                  animate={{ opacity: [0, 1, 1, 1, 1, 0], x: [28, 0, -8, -8, 0, 28], y: [6, 0, -8, 3, 0, 6] }}
                  transition={{ delay: 0.55, duration: 1.6, times: [0, 0.18, 0.34, 0.4, 0.72, 1] }}
                  className="absolute right-4 top-0 h-20 w-20"
                >
                  <Image src="/animations/nori/cat-idle.webp" alt="" width={80} height={80} unoptimized />
                  <motion.div
                    initial={{ x: 0, y: 0, rotate: 0 }}
                    animate={{ x: [0, -12, -18, -12, 0], y: [0, -14, 10, -4, 0], rotate: [0, -25, -7, -12, 0] }}
                    transition={{ delay: 0.8, duration: 0.85, times: [0, 0.3, 0.41, 0.65, 1] }}
                    className="absolute -left-1 top-8 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#292722] text-[#e9a342]"
                    style={{ borderRadius: "50%", clipPath: "circle(50%)" }}
                  >
                    <PawPrint className="h-5 w-5" />
                  </motion.div>
                </motion.div>
              )}
            </div>
  );
}
