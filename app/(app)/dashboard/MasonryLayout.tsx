'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { layoutMasonry } from '@/lib/masonry-layout.mjs';
import styles from './layout.module.css';

export default function MasonryLayout({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = container.current!;
    const cards = Array.from(element.children) as HTMLElement[];
    let frame = 0;
    const arrange = () => {
      frame = 0;
      const columns = Number(getComputedStyle(element).getPropertyValue('--columns'));
      const width = (element.clientWidth - (columns - 1) * 24) / columns;
      const { positions, height } = layoutMasonry(cards.map(card => card.offsetHeight), columns);
      cards.forEach((card, index) => {
        card.style.left = `${positions[index].column * (width + 24)}px`;
        card.style.top = `${positions[index].top}px`;
      });
      element.style.height = `${height}px`;
    };
    arrange();
    const observer = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(arrange);
    });
    observer.observe(element);
    cards.forEach(card => observer.observe(card));
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  return <div ref={container} className={styles.masonry}>{children}</div>;
}
