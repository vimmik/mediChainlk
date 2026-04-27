'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Slim progress bar that fires on every internal link click and completes
 * when the pathname changes (route transition done).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(pathname);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crawlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Crawl progress from current value toward 85 (never completes on its own)
  const crawl = (current: number) => {
    if (current >= 85) return;
    const step = current < 30 ? 18 : current < 55 ? 10 : current < 75 ? 5 : 2;
    const next = Math.min(current + step, 85);
    crawlTimerRef.current = setTimeout(() => {
      setProgress(next);
      crawl(next);
    }, 280);
  };

  const clearTimers = () => {
    if (crawlTimerRef.current) clearTimeout(crawlTimerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
  };

  // Listen for any internal-navigation click to start the bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a, [role="link"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('http') ||
        href.startsWith('mailto') ||
        href.startsWith('tel') ||
        (anchor as HTMLAnchorElement).target === '_blank'
      ) return;

      clearTimers();
      setVisible(true);
      setProgress(8);
      crawl(8);
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Finish when pathname actually changes
  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    clearTimers();
    setProgress(100);

    finishTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 380);

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="nav-progress-track" aria-hidden="true">
      <div className="nav-progress-fill" style={{ width: `${progress}%` }} />
    </div>
  );
}
