"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, NotebookPen } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExitWipe, setShowExitWipe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/nori/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setShowExitWipe(true);
        setTimeout(() => {
          router.push("/v2/nori");
          router.refresh();
        }, 800);
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      <LoadingScreen mode="in" />
      {showExitWipe && <LoadingScreen mode="out" />}

      <div className="w-full max-w-md mb-4 text-left font-mono">
        <Link href="/v2" className="text-xs uppercase font-bold tracking-widest hover:text-[#1A1A1A] text-[#777777] transition-colors">
          ← BACK TO PORTAL
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-8 rounded-3xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center font-mono">
          <div className="w-16 h-16 bg-[#FF9D00]/10 rounded-2xl flex items-center justify-center mb-4">
            <NotebookPen className="w-8 h-8 text-[#FF9D00]" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-[#1A1A1A]">
            NORI'S NOTE
          </h1>
          <p className="text-[#777777] text-xs font-bold uppercase tracking-widest mt-1">
            ENTER PASSWORD TO UNLOCK STAGE
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-left font-mono">
            <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider block">
              PASSWORD
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#777777]">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ENTER PASSWORD..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:border-[#FF9D00] focus:ring-2 focus:ring-[#FF9D00]/20 transition-all font-mono text-sm"
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs mt-2 font-bold font-mono"
              >
                [ERROR: {error.toUpperCase()}]
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF9D00] hover:bg-[#FF8C00] text-black font-black uppercase tracking-widest py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 group cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 font-mono shadow-md shadow-[#FF9D00]/20"
          >
            {loading ? "AUTHENTICATING..." : "ENTER"}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
