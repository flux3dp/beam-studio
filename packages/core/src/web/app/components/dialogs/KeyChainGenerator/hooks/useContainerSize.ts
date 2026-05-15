import { useEffect, useRef, useState } from 'react';

const useContainerSize = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ height: 300, width: 400 });

  useEffect(() => {
    const el = containerRef.current;

    if (!el) return undefined;

    let rafId = 0;
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() =>
        setSize({ height: entry.contentRect.height, width: entry.contentRect.width }),
      );
    });

    observer.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return { containerRef, size };
};

export default useContainerSize;
