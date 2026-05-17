"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sword, NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingScreenOut from "@/components/LoadingScreenOut";
import Image from 'next/image';
export default function Home() {
  const router = useRouter();
  const [isNinjinActive, setIsNinjinActive] = useState(false);
  const [isNoriActive, setIsNoriActive] = useState(false);
  const [isExiting, setIsExiting] = useState<null | "ninjin" | "nori">(null);
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [isStacked, setIsStacked] = useState(false);

  useEffect(() => {
    const checkStacked = () => setIsStacked(window.innerWidth < 1024);
    checkStacked();
    window.addEventListener("resize", checkStacked);
    return () => window.removeEventListener("resize", checkStacked);
  }, []);

  const handleNinjinClick = () => {
    setIsExiting("ninjin");
    // Start white wipe after background expansion
    setTimeout(() => setShowExitWipe(true), 600);
    // Redirect after wipe covers screen
    setTimeout(() => router.push("/ninjin"), 1400);
  };

  const handleNoriClick = () => {
    setIsExiting("nori");
    // Start white wipe after background expansion
    setTimeout(() => setShowExitWipe(true), 600);
    // Redirect after wipe covers screen
    setTimeout(() => router.push("/nori"), 1400);
  };

  const isTransitioning = !!isExiting;

  return (
    <main className="relative w-full h-screen bg-gray-100 overflow-hidden flex flex-col lg:flex-row font-sans">
      {showExitWipe && <LoadingScreenOut />}
      {/* Ninjin Button (Left/Top side, orange) */}
      <motion.div
        onClick={() => {
          if (!isTransitioning) {
            if (isNinjinActive) {
              handleNinjinClick();
            } else {
              setIsNinjinActive(true);
              setIsNoriActive(false);
            }
          }
        }}
        initial={{ 
          x: isStacked ? 0 : "-100%", 
          y: isStacked ? "-100%" : 0, 
          clipPath: isStacked ? "polygon(0 0, 100% 0, 100% 0, 0 0)" : "polygon(0 0, 0 0, 0 100%, 0 100%)" 
        }}
        animate={{
          x: 0,
          y: 0,
          clipPath: isExiting === "ninjin"
            ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
            : isExiting === "nori"
              ? "polygon(0 0, 100% 0, 100% 0, 0 0)"
              : isStacked
                ? "polygon(0 0, 100% 0, 100% 35%, 0 65%)"
                : "polygon(0 0, 60% 0, 40% 100%, 0 100%)"
        }}
        transition={{
          x: { type: "tween", duration: 1.2, ease: "circOut" },
          y: { type: "tween", duration: 1.2, ease: "circOut" },
          // clipPath: { duration: 1.2, ease: "circOut" }
        }}
        className={`absolute left-0 top-0 w-full h-full bg-[#FF9D00] group ${isTransitioning ? (isExiting === "ninjin" ? "z-50" : "z-0") : (isNinjinActive ? "z-20" : "z-10")
          }`}
      >
        <motion.div
          initial={{
            opacity: 0,
            x: isStacked ? "-50%" : "-150%",
            y: isStacked ? "-150%" : "-50%",
            left: isStacked ? "50%" : "25%",
            top: isStacked ? "25%" : "50%"
          }}
          animate={{
            opacity: isExiting === "nori" ? 0 : 1,
            x: isExiting === "ninjin" ? "-50%" : "-50%",
            scale: isNinjinActive ? (isStacked ? 0.85 : 0.75) : 1,
            left: isExiting === "ninjin" ? "50%" : (isStacked ? "50%" : "25%"),
            top: isExiting === "ninjin" ? "50%" : (isStacked ? "25%" : "50%"),
          }}
          whileInView={{ x: "-50%" }}
          viewport={{ once: true }}
          transition={{
            x: { duration: 1.2, ease: "circOut", delay: 0.2 },
            delay: isTransitioning ? 0 : 0.8,
            duration: isTransitioning ? 0.8 : 1,
            scale: { duration: 0.4, ease: "easeInOut" },
            left: { duration: 0.8, ease: [0.65, 0, 0.35, 1] },
            top: { duration: 0.8, ease: [0.65, 0, 0.35, 1] }
          }}
          className="absolute flex flex-col items-center whitespace-nowrap"
        >
          <div className="h-[240px] flex items-end justify-center pb-10">
            <AnimatePresence>
              {isNinjinActive && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Image src="/animations/ninjin-intro.gif" alt="Ninjin" width={280} height={280} priority className="mb-[-40px] mix-blend-multiply drop-shadow-2xl pointer-events-none" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-4 md:gap-6 pr-4 md:pr-10">
            <motion.div
              animate={{ rotate: isNinjinActive ? 45 : 0 }}
              transition={{ duration: 0.4 }}
            >
              <Sword className="w-10 h-10 md:w-16 md:h-16 text-white drop-shadow-lg" strokeWidth={3} />
            </motion.div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-7xl lg:text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] select-none uppercase pr-2 md:pr-4">
                Ninjin
              </span>
              <AnimatePresence mode="wait">
                {isNinjinActive && !isExiting && (
                  <motion.span
                    initial={{ opacity: 0, x: 20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: "auto" }}
                    exit={{ opacity: 0, x: 20, width: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="text-3xl md:text-5xl font-bold text-white/90 italic tracking-tighter overflow-visible whitespace-nowrap uppercase pr-2 md:pr-4"
                  >
                    's Quest
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
          <motion.div
            className="h-1 md:h-1.5 bg-white mt-2 md:mt-4 origin-left"
            animate={{ width: isNinjinActive ? '100%' : (isStacked ? '80px' : '160px') }}
            transition={{ duration: 0.4 }}
          />

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isNinjinActive && !isTransitioning ? 1 : 0,
              y: isNinjinActive && !isTransitioning ? 0 : 20,
              pointerEvents: isNinjinActive && !isTransitioning ? "auto" : "none"
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleNinjinClick();
            }}
            className="cursor-pointer mt-8 md:mt-12 px-6 py-3 md:px-10 md:py-4 bg-white text-[#FF9D00] rounded-full font-black text-xl md:text-2xl uppercase tracking-tighter flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] group/btn"
          >
            Enter
            <Sword className="w-5 h-5 md:w-6 md:h-6 group-hover/btn:rotate-12 transition-transform" />
          </motion.button>
        </motion.div>
      </motion.div>


      {/* Nori Button (Right/Bottom side, black) */}
      <motion.div
        onClick={() => {
          if (!isTransitioning) {
            if (isNoriActive) {
              handleNoriClick();
            } else {
              setIsNoriActive(true);
              setIsNinjinActive(false);
            }
          }
        }}
        initial={{ 
          x: isStacked ? 0 : "100%", 
          y: isStacked ? "100%" : 0, 
          clipPath: isStacked ? "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" : "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)" 
        }}
        animate={{
          x: 0,
          y: 0,
          clipPath: isExiting === "nori"
            ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
            : isExiting === "ninjin"
              ? "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)"
              : isStacked
                ? "polygon(0 65%, 100% 35%, 100% 100%, 0 100%)"
                : "polygon(60% 0, 100% 0, 100% 100%, 40% 100%)"
        }}
        transition={{
          x: { type: "tween", duration: 1.2, ease: "circOut" },
          y: { type: "tween", duration: 1.2, ease: "circOut" },
          // clipPath: { duration: 1.2, ease: "circOut" }
        }}
        className={`absolute left-0 top-0 w-full h-full bg-[#1A1A1A] group ${isTransitioning ? (isExiting === "nori" ? "z-50" : "z-0") : (isNoriActive ? "z-20" : "z-5")
          }`}
      >
        <motion.div
          initial={{
            opacity: 0,
            x: isStacked ? "-50%" : "150%",
            y: isStacked ? "150%" : "-50%",
            left: isStacked ? "50%" : "75%",
            top: isStacked ? "75%" : "50%"
          }}
          animate={{
            opacity: isExiting === "ninjin" ? 0 : 1,
            x: isExiting === "nori" ? "-50%" : "-50%",
            scale: isNoriActive ? (isStacked ? 0.85 : 0.75) : 1,
            left: isExiting === "nori" ? "50%" : (isStacked ? "50%" : "75%"),
            top: isExiting === "nori" ? "50%" : (isStacked ? "75%" : "50%"),
          }}
          whileInView={{ x: "-50%" }}
          viewport={{ once: true }}
          transition={{
            x: { duration: 1.2, ease: "circOut", delay: 0.2 },
            delay: isTransitioning ? 0 : 0.8,
            duration: isTransitioning ? 0.8 : 1,
            scale: { duration: 0.4, ease: "easeInOut" },
            left: { duration: 0.8, ease: [0.65, 0, 0.35, 1] },
            top: { duration: 0.8, ease: [0.65, 0, 0.35, 1] }
          }}
          className="absolute flex flex-col items-center whitespace-nowrap"
        >
          <div className="h-[240px] flex items-end justify-center pb-10">
            <AnimatePresence>
              {isNoriActive && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Image src="/animations/nori-intro.gif" alt="Nori" width={280} height={280} priority className="rounded-3xl mix-blend-lighten drop-shadow-[0_0_20px_rgba(255,157,0,0.2)] pointer-events-none" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-4 md:gap-6 pr-4 md:pr-10">
            <motion.div
              animate={{ scale: isNoriActive ? 1.2 : 1, rotate: isNoriActive ? -5 : 0 }}
              transition={{ duration: 0.4 }}
            >
              <NotebookPen className="w-10 h-10 md:w-16 md:h-16 text-white drop-shadow-lg" strokeWidth={3} />
            </motion.div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-7xl lg:text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] select-none uppercase pr-2 md:pr-4">
                Nori
              </span>
              <AnimatePresence mode="wait">
                {isNoriActive && !isExiting && (
                  <motion.span
                    initial={{ opacity: 0, x: -20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: "auto" }}
                    exit={{ opacity: 0, x: -20, width: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="text-3xl md:text-5xl font-bold text-white/90 italic tracking-tighter overflow-visible whitespace-nowrap uppercase pr-2 md:pr-4"
                  >
                    's Note
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
          <motion.div
            className="h-1 md:h-1.5 bg-white mt-2 md:mt-4 origin-right"
            animate={{ width: isNoriActive ? '100%' : (isStacked ? '80px' : '160px') }}
            transition={{ duration: 0.4 }}
          />

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isNoriActive && !isTransitioning ? 1 : 0,
              y: isNoriActive && !isTransitioning ? 0 : 20,
              pointerEvents: isNoriActive && !isTransitioning ? "auto" : "none"
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleNoriClick();
            }}
            className="cursor-pointer mt-8 md:mt-12 px-6 py-3 md:px-10 md:py-4 bg-white text-[#1A1A1A] rounded-full font-black text-xl md:text-2xl uppercase tracking-tighter flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] group/btn"
          >
            Enter
            <NotebookPen className="w-5 h-5 md:w-6 md:h-6 group-hover/btn:-rotate-12 transition-transform" />
          </motion.button>
        </motion.div>
      </motion.div>
    </main>
  );
}


