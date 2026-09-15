import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook: returns true once the target element scrolls into view.
 * Triggers the chart and section animations.
 */
export function useInView(options = {}) {
  const [inView, setInView] = useState(false);
  const [node, setNode] = useState(null);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [setNode, inView];
}
