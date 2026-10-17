'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PrototypeSwitcher({ variant, basePath, options }: {
  variant: string;
  basePath: string;
  options: readonly { key: string; label: string }[];
}) {
  const router = useRouter();
  const index = Math.max(0, options.findIndex(option => option.key === variant));
  const previous = options[(index + options.length - 1) % options.length];
  const next = options[(index + 1) % options.length];
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const keydown = (event: KeyboardEvent) => {
      if (!(event.target instanceof HTMLElement) || event.target.closest('input, textarea, select, [contenteditable]') || event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      router.replace(`${basePath}?variant=${event.key === 'ArrowLeft' ? previous.key : next.key}`, { scroll: false });
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [router, basePath, previous.key, next.key]);
  if (process.env.NODE_ENV === 'production') return null;
  return <nav aria-label="เปรียบเทียบดีไซน์ตัวอย่าง" className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-[11000] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#302d27] p-2 text-[#fffdf7] shadow-xl lg:bottom-5">
    <Link aria-label="ดีไซน์ก่อนหน้า" scroll={false} href={`${basePath}?variant=${previous.key}`} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"><ChevronLeft size={18} /></Link>
    <span className="min-w-40 text-center text-xs"><b>{variant}</b><span className="ml-2 opacity-70">{options[index].label}</span></span>
    <Link aria-label="ดีไซน์ถัดไป" scroll={false} href={`${basePath}?variant=${next.key}`} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"><ChevronRight size={18} /></Link>
  </nav>;
}
