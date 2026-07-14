"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, NotebookPen, ArrowRight } from "lucide-react";
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
          router.push("/nori");
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
    <main className="relative w-full min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4 overflow-hidden font-sans">
      {showExitWipe && <LoadingScreen mode="out" />}
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF9D00]/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#FF9D00]/10 border border-[#FF9D00]/25 rounded-2xl flex items-center justify-center mb-4">
            <NotebookPen className="w-8 h-8 text-[#FF9D00]" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-white mb-2">
            Nori Workspace
          </h1>
          <p className="text-slate-400 text-sm text-center">
            Please enter your password to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#FF9D00]/50 focus:ring-1 focus:ring-[#FF9D00]/50 transition-all font-mono"
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs mt-2 pl-1 font-semibold"
              >
                {error}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF9D00] hover:bg-[#FF8C00] text-black font-black uppercase tracking-widest py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 group cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Unlock Dashboard"}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
