'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthExpiredHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthExpired = () => {
      router.push('/login');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [router]);

  return null;
}
