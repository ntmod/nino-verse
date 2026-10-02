"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, NotebookPen } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function LoginPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { language } = useLanguage();
  const th = language === "th";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExitWipe, setShowExitWipe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
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
          router.push("/dashboard");
          router.refresh();
        }, reducedMotion ? 0 : 800);
      } else {
        setError(th ? "รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง" : "Unable to sign in. Please check your password.");
        setLoading(false);
      }
    } catch {
      setError(th ? "เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง" : "Unable to connect. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-[#f5f0e5] px-6 py-16 font-mono text-[#292722]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(#b7a78a 0.6px, transparent 0.6px)", backgroundSize: "6px 6px" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-[#d9cebb] sm:inset-5" />
      {showExitWipe && <motion.div initial={reducedMotion ? false : { y: "100%" }} animate={{ y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fffdf5]">
        <p role="status" className="text-sm font-bold text-[#7f715d]">{th ? "เปิดสมุดของคุณ…" : "Opening your ledger…"}</p>
      </motion.div>}

      <div className="relative z-10 mb-5 w-full max-w-sm text-left">
        <Link href="/" className="text-[10px] uppercase tracking-[0.15em] text-[#93846b] transition-colors hover:text-[#292722]">
          {th ? "← กลับหน้าปก" : "← Back to title screen"}
        </Link>
      </div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm border border-[#e1d7c5] bg-[#fffdf5] px-6 py-8 shadow-[4px_6px_0_#e7dece,0_16px_40px_rgba(78,62,36,0.08)] sm:p-9"
      >
        <div className="flex flex-col items-center mb-8 text-center font-mono">
          <div className="mb-5 flex h-14 w-14 -rotate-6 items-center justify-center border border-[#dab781] bg-[#f9ebcf]">
            <NotebookPen className="h-7 w-7 text-[#b97423]" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-[#292722]">
            NORINOTE
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-[#7f715d]">
            {th ? "ปลดล็อกสมุด แล้วจดเรื่องราวต่อ" : "Unlock your ledger. Pick up your story."}
          </p>
        </div>

        <form onSubmit={handleSubmit} aria-busy={loading} className="space-y-6">
          <div className="space-y-2 text-left font-mono">
            <label htmlFor="ledger-password" className="text-[10px] font-bold text-[#292722] uppercase tracking-wider block">
              {th ? "รหัสผ่าน" : "Password"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#93846b]">
                <Lock className="w-5 h-5" />
              </span>
              <input
                id="ledger-password"
                type="password"
                autoComplete="current-password"
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? "ledger-login-error" : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={th ? "ใส่รหัสผ่านของคุณ" : "Your password…"}
                className="w-full border-0 border-b border-[#cbbda5] bg-[#f5f0e5]/50 py-3.5 pl-12 pr-4 text-sm text-[#292722] transition-colors placeholder:text-[#ab9b83] focus:border-[#b97423] focus:outline-2 focus:outline-offset-2 focus:outline-[#e9a342] disabled:opacity-60"
              />
            </div>
            {error && (
              <motion.p
                id="ledger-login-error"
                role="alert"
                initial={reducedMotion ? false : { opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs mt-2 font-bold font-mono"
              >
                {error}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full cursor-pointer items-center justify-center gap-3 border border-[#b97423] bg-[#e9a342] px-6 py-3.5 text-sm font-bold text-[#372b1c] shadow-[0_4px_0_#ba7b2c] transition-colors hover:bg-[#f0b35a] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#b97423] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (th ? "กำลังปลดล็อก…" : "Unlocking…") : (th ? "เปิดสมุด" : "Open your ledger")}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
        <p className="mt-8 border-t border-dashed border-[#d9cebb] pt-4 text-center text-[8px] uppercase tracking-[0.18em] text-[#93846b]">{th ? "เรื่องราวการใช้เงินในแต่ละวัน" : "Your everyday money stories"}</p>
      </motion.div>
    </main>
  );
}
