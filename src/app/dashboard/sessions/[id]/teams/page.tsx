import { Suspense } from 'react';
import { Metadata } from 'next';
import { TeamsPageClient } from './teams-page-client';

interface TeamsPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Teams',
  description: 'View and manage teams for this session',
};

export default function TeamsPage({ params }: TeamsPageProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<div>Loading teams...</div>}>
        <TeamsPageClient sessionId={params.id} />
      </Suspense>
    </div>
  );
} 