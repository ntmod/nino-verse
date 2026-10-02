'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { playUISound } from '@/lib/ui-sounds.mjs';
import { GARDEN_SPOTS, nextGardenVisit } from '@/lib/nori-garden.mjs';

export default function NoriGardenActor({ night = false }: { night?: boolean }) {
  const anchor = useRef<HTMLDivElement>(null);
  const inView = useInView(anchor);
  const reducedMotion = useReducedMotion();
  const { language } = useLanguage();
  const th = language === 'th';
  const [visit, setVisit] = useState<ReturnType<typeof nextGardenVisit> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [greeting, setGreeting] = useState(0);
  const [showGreeting, setShowGreeting] = useState(false);
  useEffect(() => {
    if (!showGreeting) return;
    const timer = window.setTimeout(() => setShowGreeting(false), 3000);
    return () => window.clearTimeout(timer);
  }, [showGreeting, greeting]);
  const [foreground, setForeground] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    const update = () => setForeground(document.visibilityState === 'visible');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (!inView || !foreground || paused || reducedMotion || night) return;
    // Keep the first random draw client-side, and clean up on exit/unmount.
    if (!started.current) {
      const timer = window.setTimeout(() => { started.current = true; setVisit(nextGardenVisit()); }, 300);
      return () => window.clearTimeout(timer);
    }
    if (!visit || !loaded) return;
    const timer = window.setTimeout(() => {
      setLoaded(false);
      setVisit(previous => nextGardenVisit(previous));
    }, visit.duration * visit.loops);
    return () => window.clearTimeout(timer);
  }, [inView, foreground, paused, reducedMotion, visit, loaded, night]);

  const [x, y] = GARDEN_SPOTS[visit?.spot ?? 2];
  const size = Math.round(48 + (y - 45) / 46 * 60);
  const asset = paused || reducedMotion ? 'cat-idle' : night ? 'teftel-cat-09' : visit?.asset ?? 'cat-idle';
  return <div ref={anchor} className="pointer-events-none absolute inset-0">
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={visit?.sequence ?? 'idle'}
        initial={reducedMotion ? false : { opacity: 0, y: 6, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.9 }}
        transition={{ duration: reducedMotion ? 0 : 0.25 }}
        style={{ left: `${x}%`, top: `${y}%`, zIndex: 20 + Math.round((y * 4 - 142) / 280 * 100) }} className="absolute -translate-x-1/2 -translate-y-full">
        <button type="button" aria-label={th ? (paused ? 'ให้ Nori เล่นต่อ' : 'แตะ Nori เพื่อทักทาย') : (paused ? 'Let Nori keep playing' : 'Tap Nori to say hello')}
          onClick={() => { setLoaded(false); setPaused(value => !value); setGreeting(value => value + 1); setShowGreeting(true); playUISound('click'); }} style={{ width: size, height: size }} className="pointer-events-auto rounded-full focus-visible:outline-2 focus-visible:outline-[#b97423]">
          <Image key={asset} src={`/animations/nori/${asset}.webp`} alt="" width={size} height={size} unoptimized onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} />
        </button>
        {showGreeting && <motion.span key={`greeting-${greeting}`} role="status"
          initial={reducedMotion ? false : { opacity: 0, y: 5, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          className="pointer-events-none absolute bottom-full left-1/2 mb-1 flex w-max -translate-x-1/2 items-center gap-1.5 rounded-xl border border-[#d9cebb] bg-[#fffdf5] px-3 py-2 text-xs text-[#635744]">
          <Heart aria-hidden="true" className="h-3 w-3 fill-[#df95b0] text-[#df95b0]" />
          {night ? (th ? 'อยู่เป็นเพื่อนก่อนนอนนะ 🌙' : 'Keeping you company tonight 🌙') : (th ? ['พักดูดอกไม้กันไหม 🌿', 'ดีใจที่แวะมานะ', 'วันนี้ก็จดไปด้วยกันนะ'][greeting % 3] : ['A little flower break? 🌿', 'Glad you stopped by', 'Let’s journal together today'][greeting % 3])}
        </motion.span>}
      </motion.div>
    </AnimatePresence>
  </div>;
}
