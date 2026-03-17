'use client';

import { useState, useEffect } from 'react';

// Define consistent breakpoint
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Use consistent breakpoint
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isClient ? isMobile : false;
}
