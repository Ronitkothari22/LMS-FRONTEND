'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFeedback } from '@/hooks/feedback';
import { FeedbackForm } from '@/components/feedback';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedbackId = params.id as string;
  const sessionId = searchParams.get('sessionId') as string;

  const { data: feedback, isLoading, error } = useFeedback(feedbackId, sessionId);

  // Check if sessionId is missing
  if (!sessionId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Session information is missing. Please access this feedback form from the session page.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmitSuccess = () => {
    // Navigate back to the session or show success message
    if (feedback?.sessionId) {
      router.push(`/dashboard/sessions/${feedback.sessionId}/feedback`);
    } else {
      router.push('/dashboard');
    }
  };

  const handleCancel = () => {
    if (feedback?.sessionId) {
      router.push(`/dashboard/sessions/${feedback.sessionId}/feedback`);
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading feedback form...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load feedback form. Please try again later.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Feedback form not found or you don&apos;t have access to it.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <FeedbackForm
        feedback={feedback}
        sessionId={feedback.sessionId}
        onSubmitSuccess={handleSubmitSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
} 