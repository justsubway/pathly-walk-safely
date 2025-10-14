import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis with heavy, fluid settings for "buttery" feel
    lenisRef.current = new Lenis({
      lerp: 0.06, // Lower lerp for more inertia and weight
      wheelMultiplier: 0.7, // Reduced wheel sensitivity for heavier feel
      gestureOrientation: 'vertical',
      touchMultiplier: 1.1, // Better touch experience
      syncTouch: true,
      syncTouchLerp: 0.06, // Smooth touch sync with more inertia
      duration: 1.4, // Slower scroll speed for heavy feel
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing for smooth deceleration
    });

    const lenis = lenisRef.current;

    // Enhanced RAF function for smooth updates with Framer Motion integration
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Add scroll event listeners for enhanced effects
    lenis.on('scroll', (e) => {
      // This can be used to trigger custom scroll-based animations
      // Framer Motion will automatically sync with Lenis
    });

    // Cleanup
    return () => {
      if (lenis) {
        lenis.destroy();
        lenisRef.current = null;
      }
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScrollProvider;
