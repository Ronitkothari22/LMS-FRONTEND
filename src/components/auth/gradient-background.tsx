'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export default function GradientBackground({
  children,
  className = '',
}: GradientBackgroundProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a default gradient (light mode) as placeholder during SSR and initial load
  // This prevents the blank space during loading
  const gradientClass = mounted
    ? theme === 'dark' || resolvedTheme === 'dark'
      ? 'auth-gradient-dark'
      : 'auth-gradient-light'
    : 'auth-gradient-light'; // Default to light gradient during SSR

  return <div className={`${className} ${gradientClass}`}>{children}</div>;
}
