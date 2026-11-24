'use client';

import { useSyncExternalStore } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEnabled, subscribeSound, setSoundEnabled } from '@/lib/ui-sounds.mjs';
import { useLanguage } from '@/lib/language-context';

export default function SoundToggle() {
  const enabled = useSyncExternalStore(subscribeSound, soundEnabled, () => false);
  const { language } = useLanguage();
  const label = language === 'th' ? (enabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์') : (enabled ? 'Mute sound effects' : 'Enable sound effects');
  const Icon = enabled ? Volume2 : VolumeX;
  return <button type="button" aria-label={label} title={label} aria-pressed={enabled} onClick={() => setSoundEnabled(!enabled)} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-highlight-ink focus-visible:outline-2 focus-visible:outline-highlight-ink"><Icon aria-hidden="true" className="h-4 w-4" /></button>;
}
