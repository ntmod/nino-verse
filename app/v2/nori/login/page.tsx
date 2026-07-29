"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        // Redirect to v2 Nori Note dashboard upon successful authorization
        router.push("/v2/nori");
        router.refresh();
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
    <main className="relative w-full min-h-screen bg-[#ffffff] flex flex-col items-center justify-center p-4 select-none text-[#000000] font-sans">
      <div className="w-full max-w-md mb-4 text-left font-mono">
        <Link href="/v2" className="text-[10px] uppercase font-bold tracking-wider hover:underline text-[#777777]">
          ← BACK TO PORTAL
        </Link>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-[#ffffff] border-3 border-[#000000] p-8 rounded-none shadow-none relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center font-mono">
          <div className="w-16 h-16 bg-[#000000] text-[#ffffff] border-3 border-[#000000] flex items-center justify-center mb-4 rounded-none">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-[#000000]">
            NORI WORKSPACE
          </h1>
          <p className="text-[#777777] text-xs mt-2 uppercase tracking-wide">
            ENTER PASSWORD TO UNLOCK STAGE
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-[#000000] uppercase tracking-wider font-mono">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD..."
                className="w-full px-4 py-3 bg-[#ffffff] border-3 border-[#000000] rounded-none text-[#000000] placeholder-[#cccccc] focus:outline-none focus:bg-[#ffffff] transition-all font-mono"
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#FF0000] text-xs mt-2 font-bold font-mono"
              >
                [ERROR: {error.toUpperCase()}]
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#000000] text-[#ffffff] border-3 border-[#000000] font-bold uppercase tracking-wider py-3.5 px-6 rounded-none flex items-center justify-center gap-2 group cursor-pointer transition-all hover:bg-[#ffffff] hover:text-[#000000] active:scale-95 disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : "UNLOCK STAGE"}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
