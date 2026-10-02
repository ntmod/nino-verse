'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { claimNoriPeek } from '@/lib/nori-peek.mjs';
import { playUISound } from '@/lib/ui-sounds.mjs';

export default function NoriPeek() {
  const anchor = useRef<HTMLDivElement>(null);
  const seen = useInView(anchor);
  const reducedMotion = useReducedMotion();
  const { language } = useLanguage();
  const [phase, setPhase] = useState<'hidden' | 'peek' | 'hello'>('hidden');

  useEffect(() => {
    if (!seen || reducedMotion) return;
    const appear = window.setTimeout(() => {
      if (document.visibilityState === 'visible' && claimNoriPeek()) setPhase('peek');
    }, 1400);
    const hide = window.setTimeout(() => setPhase(value => value === 'hello' ? value : 'hidden'), 8500);
    return () => { window.clearTimeout(appear); window.clearTimeout(hide); setPhase('hidden'); };
  }, [seen, reducedMotion]);

  useEffect(() => {
    if (phase !== 'hello') return;
    const hide = window.setTimeout(() => setPhase('hidden'), 3500);
    return () => window.clearTimeout(hide);
  }, [phase]);

  return <div ref={anchor} className="pointer-events-none absolute right-3 top-0 z-30 h-px w-16">
    <AnimatePresence>
      {seen && phase !== 'hidden' && <motion.button
        key="nori"
        type="button"
        aria-label={language === 'th' ? 'เจอ Nori แล้ว! แตะเพื่อทักทาย' : 'Found Nori! Tap to say hello'}
        onClick={() => { setPhase('hello'); playUISound('click'); }}
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 28 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        whileTap={{ scale: 0.92 }}
        className="pointer-events-auto absolute bottom-0 right-0 h-11 w-16 overflow-hidden rounded-t-full focus-visible:outline-2 focus-visible:outline-[#b97423]"
      >
        <motion.div animate={phase === 'hello' ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }} transition={{ duration: 0.4 }}>
          <Image src="/animations/nori/cat-idle.webp" alt="" width={64} height={64} unoptimized />
        </motion.div>
      </motion.button>}
    </AnimatePresence>
    <AnimatePresence>
      {seen && phase === 'hello' && <motion.p role="status" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-[72px] bottom-1 w-max max-w-[170px] rounded-xl border border-[#d9cebb] bg-[#fffdf5] px-3 py-2 text-xs text-[#635744] shadow-sm">
        {language === 'th' ? 'อ๊ะ เจอแล้ว! แอบดูสมุดอยู่ 🍙' : 'Found me! Just peeking 🍙'}
      </motion.p>}
    </AnimatePresence>
  </div>;
}
