"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, NotebookPen } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/lib/language-context";

export default function LoginPage() {
  const reducedMotion = useReducedMotion();
  const { language } = useLanguage();
  const th = language === "th";
  const [config, setConfig] = useState<{ ready: boolean; google: boolean } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/nori/auth-config').then(response => response.json()).then(value => { if (active) setConfig(value); }).catch(() => { if (active) setError('Unable to load sign-in options'); });
    if (new URL(window.location.href).searchParams.get('error')) setError('Unable to sign in with Google. Please try again.');
    return () => { active = false; };
  }, []);
  const signIn = async () => {
    if (loading || !config?.ready || !config.google) return;
    setLoading(true); setError('');
    try {
      const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/home', errorCallbackURL: '/login' });
      if (result.error) throw new Error(result.error.message);
    } catch {
      setError(th ? 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ ลองอีกครั้งนะ' : 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="notebook-page relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden px-6 py-16 font-mono text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(#b7a78a 0.6px, transparent 0.6px)", backgroundSize: "6px 6px" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-border sm:inset-5" />

      <div className="relative z-10 mb-5 w-full max-w-sm text-left">
        <Link href="/" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground">
          {th ? "← กลับหน้าปก" : "← Back to title screen"}
        </Link>
      </div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm notebook-leaf px-6 py-8 sm:p-9"
      >
        <div className="flex flex-col items-center mb-8 text-center font-mono">
          <div className="mb-5 flex h-14 w-14 -rotate-6 items-center justify-center border border-[#dab781] bg-[#f9ebcf]">
            <NotebookPen className="h-7 w-7 text-highlight-ink" />
          </div>
          <h1 className="notebook-title">
            NoriNote
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {th ? "ปลดล็อกสมุด แล้วจดเรื่องราวต่อ" : "Unlock your ledger. Pick up your story."}
          </p>
        </div>

        <button type="button" onClick={signIn} disabled={loading || !config?.ready || !config.google}
          className="group flex min-h-11 w-full items-center justify-center gap-3 border border-highlight-ink bg-highlight px-4 py-3.5 text-xs font-bold text-highlight-foreground shadow-[0_4px_0_var(--highlight-ink)] hover:bg-highlight-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-highlight-ink disabled:opacity-50">
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card font-sans font-black text-[#4285f4]">G</span>
          {loading ? (th ? 'กำลังเปิด Google…' : 'Opening Google…') : (th ? 'เข้าสู่ระบบด้วย Google' : 'Continue with Google')}
          {!loading && <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />}
        </button>
        <p className="mt-5 text-center text-[10px] leading-relaxed text-muted-foreground">{th ? 'ใช้บัญชี Google เพื่อเปิดสมุดของคุณ' : 'Your Google account opens your own notebook.'}</p>
        {error && <p role="alert" className="mt-4 text-xs text-red-500">{error}</p>}
        {config && (!config.ready || !config.google) && <p className="mt-3 text-center text-[10px] text-muted-foreground">{th ? 'กำลังเตรียมการเข้าสู่ระบบด้วย Google' : 'Google sign-in is not configured yet.'}</p>}
      </motion.div>
    </main>
  );
}
