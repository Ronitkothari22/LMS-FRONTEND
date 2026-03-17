'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSurvey, useMySurveyResponses } from '@/hooks/surveys';
import { SurveyForm } from '@/components/surveys';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircleIcon, AlertCircleIcon, ClockIcon } from 'lucide-react';

export default function SurveyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;
  const surveyId = params?.surveyId as string;

  const { data: survey, isLoading, isError } = useSurvey(surveyId);
  const {
    data: myResponses,
    isLoading: loadingResponses,
  } = useMySurveyResponses(sessionId);

  // Determine if user already answered this survey
  const alreadySubmitted = myResponses?.some((r) => r.surveyId === surveyId);

  useEffect(() => {
    if (survey && survey.status === 'INACTIVE') {
      toast.warning('This survey is not active');
    }
  }, [survey]);

  const handleSubmissionComplete = () => {
    toast.success('Survey submitted successfully!');
    setTimeout(() => {
      router.push(`/dashboard/sessions/${sessionId}/surveys`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="hover:bg-[#14C8C8]/10 hover:text-[#14C8C8] transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {survey?.title || 'Survey'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Please take a moment to complete this survey
            </p>
          </div>
          {survey && (
            <div className="flex gap-2">
              {survey.isOptional && (
                <Badge variant="outline" className="text-xs">
                  Optional
                </Badge>
              )}
              {survey.isAnonymous && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  Anonymous
                </Badge>
              )}
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  survey.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {survey.status}
              </Badge>
            </div>
          )}
        </div>

        {/* Loading State */}
        {(isLoading || loadingResponses) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14C8C8]"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading survey...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {isError && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                  Failed to Load Survey
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  There was an error loading this survey. It may have been removed or you may not have access to it.
                </p>
                <Button 
                  onClick={() => router.push(`/dashboard/sessions/${sessionId}/surveys`)}
                  variant="outline"
                >
                  Back to Surveys
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Survey Content */}
        {survey && (
          <div className="space-y-6">
            {/* Completion Status */}
            {alreadySubmitted && (
              <Card className="border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-green-900 dark:text-green-100">
                        Survey Already Completed
                      </h3>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        Thank you for your participation! You have already submitted your response to this survey.
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push(`/dashboard/sessions/${sessionId}/surveys`)}
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      View All Surveys
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Survey Status Warning */}
            {survey.status !== 'ACTIVE' && (
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="h-5 w-5 text-amber-600" />
                    <div>
                      <h3 className="font-medium text-amber-900 dark:text-amber-100">
                        Survey Status: {survey.status}
                      </h3>
                      <p className="text-amber-700 dark:text-amber-300 text-sm">
                        This survey is currently not active. You may still view the questions but cannot submit responses.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Survey Form */}
            <SurveyForm
              survey={survey}
              disabled={alreadySubmitted || survey.status !== 'ACTIVE'}
              onSubmitted={handleSubmissionComplete}
            />

            {/* Survey Info */}
            <Card className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Survey Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Questions:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {survey.questions?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {survey.isAnonymous ? 'Anonymous' : 'Identified'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Required:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {survey.isOptional ? 'No' : 'Yes'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Multiple Responses:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {survey.allowMultipleResponses ? 'Allowed' : 'Not Allowed'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 