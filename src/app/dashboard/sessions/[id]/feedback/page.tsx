'use client';

import { useParams } from 'next/navigation';
import { FeedbackList } from '@/components/feedback';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function SessionFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const handleGoBack = () => {
    router.push(`/dashboard/sessions/${sessionId}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">Session Feedback</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  View and complete feedback forms for this session
                </p>
              </div>
            </div>
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Session
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Feedback List */}
      <FeedbackList sessionId={sessionId} />
    </div>
  );
} 