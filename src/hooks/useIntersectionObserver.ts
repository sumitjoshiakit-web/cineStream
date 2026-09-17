import { useEffect, useRef } from 'react';

interface UseIntersectionObserverProps {
  onIntersect: () => void;
  enabled?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Custom hook wrapping IntersectionObserver for Infinite Scroll pagination.
 * Fires onIntersect when the target element enters the viewport with rootMargin prefetching.
 */
export function useIntersectionObserver({
  onIntersect,
  enabled = true,
  rootMargin = '250px',
  threshold = 0.1,
}: UseIntersectionObserverProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          onIntersect();
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [onIntersect, enabled, rootMargin, threshold]);

  return targetRef;
}
