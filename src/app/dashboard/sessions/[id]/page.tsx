'use client';

import { useParams } from 'next/navigation';
import SessionPageClient from './session-page-client';

// Make this a client component to avoid issues with params
export default function SessionPage() {
  // Use useParams hook to get the id parameter
  const params = useParams();
  const id = params?.id as string;

  // Pass the id to the client component which will handle data fetching
  return <SessionPageClient id={id} />;
}
