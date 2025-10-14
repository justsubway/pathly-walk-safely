import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export const useLenis = () => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis if not already done
    if (!lenisRef.current) {
      lenisRef.current = new Lenis({
        lerp: 0.06,
        wheelMultiplier: 0.7,
        gestureOrientation: 'vertical',
        touchMultiplier: 1.1,
        syncTouch: true,
        syncTouchLerp: 0.06,
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    }

    const lenis = lenisRef.current;

    // RAF function for smooth updates
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      if (lenis) {
        lenis.destroy();
        lenisRef.current = null;
      }
    };
  }, []);

  return lenisRef.current;
};
