'use client';

import { useEffect, useState } from 'react';
import { getCookie } from 'cookies-next';

interface TokenPayload {
  [key: string]: unknown;
}

export function DebugToken() {
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null);

  useEffect(() => {
    try {
      const token = getCookie('accessToken');
      if (token) {
        const base64Url = token.toString().split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          setTokenPayload(JSON.parse(jsonPayload));
        }
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }, []);

  if (!tokenPayload) {
    return <div>No token found</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-md">
      <h3 className="font-bold mb-2">Token Payload:</h3>
      <pre className="text-xs overflow-auto max-h-40">
        {JSON.stringify(tokenPayload, null, 2)}
      </pre>
    </div>
  );
}
