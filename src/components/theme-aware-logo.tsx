'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ThemeAwareLogoProps {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

export function ThemeAwareLogo({
  width = 24,
  height = 24,
  className = '',
  alt = 'Joining Dots Logo',
}: ThemeAwareLogoProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use black logo as default during SSR and initial load
  // This prevents the blank space during loading
  // const logoSrc = mounted
  //   ? theme === 'dark' || resolvedTheme === 'dark'
  //     ? '/assets/images/logo_white.png'
  //     : '/assets/images/logo_black.png'
  //   : '/assets/images/logo_black.png';
    
    const logoSrc = mounted
    ? theme === 'dark' || resolvedTheme === 'dark'
      ? '/assets/images/logo.png'
      : '/assets/images/logo.png'
    : '/assets/images/logo.png'; // Default to black logo during SSR

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={logoSrc}
        alt={alt}
        width={width}
        height={height}
        className="object-contain max-w-full max-h-full"
        priority
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: `${width}px`,
          maxHeight: `${height}px`,
        }}
      />
    </div>
  );
} 