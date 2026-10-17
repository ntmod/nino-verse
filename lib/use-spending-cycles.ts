'use client';
import { useEffect, useState } from 'react';
import { cycleService } from './services/cycleService';
import type { CycleState } from './cycle-config';

export function useSpendingCycles() {
  const [state, setState] = useState<CycleState | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let generation = 0;
    const day = () => Math.floor((Date.now() + 7 * 3600000) / 86400000);
    let loadedDay = day();
    const load = () => { loadedDay = day(); const request = ++generation; void cycleService.get().then(data => { if (active && request === generation) { setState(data); setError(false); } }).catch(() => { if (active && request === generation) setError(true); }); };
    load();
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const nextMidnight = (day() + 1) * 86400000 - 7 * 3600000;
      timer = setTimeout(() => { load(); schedule(); }, Math.max(100, nextMidnight - Date.now() + 100));
    };
    const onFocus = () => { if (loadedDay !== day()) load(); };
    schedule();
    window.addEventListener('nori:cycles-changed', load);
    window.addEventListener('focus', onFocus);
    return () => { active = false; clearTimeout(timer); window.removeEventListener('nori:cycles-changed', load); window.removeEventListener('focus', onFocus); };
  }, [retry]);
  return { state, setState, error, retry: () => setRetry(value => value + 1) };
}
