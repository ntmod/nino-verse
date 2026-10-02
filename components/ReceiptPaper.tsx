'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

import { playUISound } from "@/lib/ui-sounds.mjs";

export default function ReceiptPaper({ title, children, onClose }: {
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const paperAnimation = useAnimationControls();
  const closingRef = useRef(false);
  const mounted = useRef(false);
  const [closing, setClosing] = useState(false);
  const reducedMotion = useReducedMotion();
  const { language } = useLanguage();

  useEffect(() => {
    const dialog = dialogRef.current;
    mounted.current = true;
    dialog?.showModal();
    playUISound("paper");
    return () => { mounted.current = false; dialog?.close(); };
  }, []);

  useEffect(() => {
    if (closingRef.current) return;
    void paperAnimation.start({ y: 0, transition: { duration: reducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] } });
  }, [paperAnimation, reducedMotion]);

  const requestClose = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    if (!reducedMotion) {
      await paperAnimation.start({
        y: [null, 12, window.innerHeight],
        x: [0, 6, 24],
        rotate: [0, -3, 8],
        rotateX: [0, 10, 18],
        scaleY: [1, 0.96, 0.86],
        opacity: [1, 1, 0],
        transition: { duration: 0.42, times: [0, 0.25, 1], ease: [0.4, 0, 0.7, 1] },
      });
    }
    if (mounted.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); void requestClose(); }}
      onClick={event => { if (event.target === event.currentTarget) void requestClose(); }}
      aria-busy={closing}
      style={{ overflowY: closing ? 'hidden' : 'auto' }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none items-center justify-center overflow-y-auto border-0 bg-transparent p-4 open:flex backdrop:bg-[#292722]/40 backdrop:backdrop-blur-sm"
    >
      <div className="pointer-events-none relative my-auto w-full max-w-[360px] py-3">
        <div aria-hidden="true" className="absolute inset-x-2 top-0 z-10 h-3 rounded-[6px] bg-[#252525] shadow-lg" style={{ opacity: closing ? 0 : 1, transition: 'opacity 150ms' }} />
        <div className={`${closing ? "overflow-visible" : "overflow-hidden"} px-1 pb-6`}>
          <motion.div
            initial={reducedMotion ? false : { y: "-100%" }}
            animate={paperAnimation}
            className="pointer-events-auto relative bg-[#fffdf5] px-5 pb-10 pt-8 font-mono text-[#292722] shadow-xl sm:px-7"
            style={{ transformPerspective: 700, transformOrigin: '50% 40%', clipPath: "polygon(0 0,100% 0,100% 98%,95% 100%,90% 98%,85% 100%,80% 98%,75% 100%,70% 98%,65% 100%,60% 98%,55% 100%,50% 98%,45% 100%,40% 98%,35% 100%,30% 98%,25% 100%,20% 98%,15% 100%,10% 98%,5% 100%,0 98%)" }}
          >
            <motion.div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[44%] h-10"
              initial={{ opacity: 0 }} animate={{ opacity: closing ? 1 : 0 }} transition={{ duration: 0.12 }}
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(78,62,36,0.12), rgba(255,253,245,0.65), transparent)' }} />
            <div className="text-center">
              <p className="text-2xl font-black italic tracking-tighter">NORINOTE</p>
              <h2 id={titleId} className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[#416b54]">{title}</h2>
            </div>
            {children}
            <button autoFocus type="button" disabled={closing} onClick={() => void requestClose()} className="mt-5 min-h-11 w-full bg-[#292722] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#b97423] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500">
              {language === "th" ? "เสร็จแล้ว" : "Done"}
            </button>
          </motion.div>
        </div>
      </div>
    </dialog>
  );
}
