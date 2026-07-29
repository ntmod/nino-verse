"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sword, NotebookPen, ChevronLeft, ChevronRight, Play, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";

interface Platform {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  path: string;
  accentColor: string;
  bgGradient: string;
  mixBlendMode: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "ninjin",
    title: "Ninjin's Quest",
    subtitle: "Gamify My Life",
    description: "Turn your daily routines, chores, and habits into an RPG adventure with your orange cat Ninjin. Level up stats, earn fish coins, and secure patrols!",
    icon: <Sword className="w-6 h-6" strokeWidth={2.5} />,
    image: "/animations/ninjin-intro.gif",
    path: "/ninjin",
    accentColor: "#FF9D00",
    bgGradient: "from-amber-600 via-[#FF9D00] to-orange-600",
    mixBlendMode: "mix-blend-multiply"
  },
  {
    id: "nori",
    title: "Nori's Note",
    subtitle: "Personal Expense Tracker",
    description: "Log your daily transactions, keep track of monthly recurring bills, and set budgets in a sleek, simple, and beautifully visual cat-friendly interface.",
    icon: <NotebookPen className="w-6 h-6" strokeWidth={2.5} />,
    image: "/animations/nori-intro.gif",
    path: "/nori",
    accentColor: "#1A1A1A",
    bgGradient: "from-zinc-900 via-neutral-900 to-slate-900",
    mixBlendMode: "mix-blend-lighten"
  },
  {
    id: "rinji",
    title: "Rinji's Brain",
    subtitle: "Knowledge Base",
    description: "Connect the dots in your mind. A digital brain dump space for notes, ideas, mind maps, and raw creative brainstorming.",
    icon: <Brain className="w-6 h-6" strokeWidth={2.5} />,
    image: "/rinji-brain.jpg",
    path: "/rinji",
    accentColor: "#A855F7",
    bgGradient: "from-purple-900 via-fuchsia-950 to-indigo-900",
    mixBlendMode: "normal"
  }
];

export default function Home() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const currentPlatform = PLATFORMS[currentIndex];

  const handleNext = () => {
    if (isExiting) return;
    setDirection("right");
    setCurrentIndex((prev) => (prev + 1) % PLATFORMS.length);
  };

  const handlePrev = () => {
    if (isExiting) return;
    setDirection("left");
    setCurrentIndex((prev) => (prev - 1 + PLATFORMS.length) % PLATFORMS.length);
  };

  const handleEnter = () => {
    if (isExiting) return;
    setIsExiting(true);
    // Redirect after loading animation triggers
    setTimeout(() => {
      router.push(currentPlatform.path);
    }, 800);
  };

  // Keyboard navigation support
  useEffect(() => {
    router.replace('/v2')
    // const handleKeyDown = (e: KeyboardEvent) => {
    //   if (e.key === "ArrowRight") handleNext();
    //   if (e.key === "ArrowLeft") handlePrev();
    //   if (e.key === "Enter") handleEnter();
    // };
    // window.addEventListener("keydown", handleKeyDown);
    // return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isExiting]);

  // Framer Motion slide variants
  const slideVariants = {
    enter: (dir: "left" | "right") => ({
      x: dir === "right" ? 150 : -150,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }
    },
    exit: (dir: "left" | "right") => ({
      x: dir === "right" ? -150 : 150,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }
    })
  };

  return (
    <main className="relative w-full h-screen bg-slate-950 overflow-hidden flex flex-col justify-between items-center py-8 px-4 font-sans select-none">
      <LoadingScreen mode="in" />
      {isExiting && <LoadingScreen mode="out" />}

      {/* Dynamic Background Gradient Glow */}
      <div className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out">
        <div className={`absolute inset-0 bg-gradient-to-br ${currentPlatform.bgGradient} opacity-30 blur-[80px] scale-110`} />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[60px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
          <h1 className="text-sm font-black tracking-[0.3em] text-white uppercase italic">
            NINO-VERSE<span className="text-[#FF9D00]">.</span>
          </h1>
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Select Adventure
        </span>
      </header>

      {/* Main Slide Carousel Section */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between my-auto gap-4">
        
        {/* Left Arrow */}
        <button 
          onClick={handlePrev}
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Carousel Card Wrapper */}
        <div className="flex-1 flex justify-center items-center h-[420px] md:h-[480px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentPlatform.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-md bg-slate-900/60 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden"
            >
              {/* Highlight Ring inside card */}
              <div 
                className="absolute inset-0 border border-white/5 rounded-[2.5rem] pointer-events-none transition-colors duration-1000"
                style={{ borderColor: `${currentPlatform.accentColor}15` }}
              />

              {/* Platform Image / Animation */}
              <div className="h-[180px] md:h-[220px] w-full flex items-center justify-center relative">
                <div 
                  className="absolute w-36 h-36 rounded-full blur-3xl opacity-30 transition-all duration-1000"
                  style={{ backgroundColor: currentPlatform.accentColor }}
                />
                <img 
                  src={currentPlatform.image} 
                  alt={currentPlatform.title} 
                  className={`max-h-[170px] md:max-h-[200px] object-contain pointer-events-none drop-shadow-2xl rounded-2xl z-10 ${currentPlatform.mixBlendMode}`} 
                />
              </div>

              {/* Title & Description */}
              <div className="space-y-2 md:space-y-3 z-10">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: currentPlatform.accentColor }}>
                    {currentPlatform.icon}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
                    {currentPlatform.title}
                  </h2>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF9D00]">
                  {currentPlatform.subtitle}
                </p>
                <p className="text-xs text-slate-400 font-bold max-w-xs mx-auto leading-relaxed">
                  {currentPlatform.description}
                </p>
              </div>

              {/* Enter Button */}
              <button 
                onClick={handleEnter}
                className="mt-6 md:mt-8 px-8 py-3.5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 cursor-pointer group"
              >
                Enter App
                <Play className="w-3.5 h-3.5 fill-current transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Arrow */}
        <button 
          onClick={handleNext}
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

      </div>

      {/* Navigation Indicators */}
      <footer className="relative z-10 flex flex-col items-center gap-4 mb-4">
        <div className="flex gap-2">
          {PLATFORMS.map((platform, idx) => (
            <button
              key={platform.id}
              onClick={() => {
                setDirection(idx > currentIndex ? "right" : "left");
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? "w-6" : "w-2 bg-slate-700"
              }`}
              style={{
                backgroundColor: idx === currentIndex ? currentPlatform.accentColor : undefined
              }}
            />
          ))}
        </div>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          Use ← → arrow keys to navigate
        </p>
      </footer>
    </main>
  );
}
