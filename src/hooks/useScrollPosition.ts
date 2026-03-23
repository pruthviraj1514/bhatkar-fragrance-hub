import { useState, useEffect } from 'react';

export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const updateScrollY = () => setScrollY(window.scrollY);

    window.addEventListener('scroll', updateScrollY, { passive: true });

    return () => window.removeEventListener('scroll', updateScrollY);
  }, []);

  return scrollY;
}