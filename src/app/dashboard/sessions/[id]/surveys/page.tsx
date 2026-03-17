'use client';

import { useParams } from 'next/navigation';
import { useSessionSurveys, useMySurveyResponses } from '@/hooks/surveys';
import { SurveyCard } from '@/components/surveys';
import { ArrowLeftIcon, ClipboardIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SessionSurveysPage() {
  const params = useParams();
  const sessionId = params?.id as string;
  const router = useRouter();

  const { data: surveys, isLoading, isError } = useSessionSurveys(sessionId);
  const { data: myResponses } = useMySurveyResponses(sessionId);

  // Create a set of completed survey IDs for quick lookup
  const completedSurveyIds = new Set(myResponses?.map(r => r.surveyId) || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] bg-clip-text text-transparent">
              Session Surveys
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Complete surveys to provide valuable feedback
            </p>
          </div>
          <Badge variant="secondary" className="bg-[#14C8C8]/10 text-[#14C8C8] border-[#14C8C8]/20">
            {surveys?.length || 0} survey{surveys && surveys.length !== 1 ? 's' : ''} available
          </Badge>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-1 bg-gray-200 dark:bg-gray-700" />
                <CardHeader>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <ClipboardIcon className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-lg font-medium text-red-900 dark:text-red-100">
                  Failed to load surveys
                </h3>
                <p className="mt-1 text-red-600 dark:text-red-400">
                  There was an error loading the surveys. Please try again later.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {surveys && surveys.length === 0 && !isLoading && (
          <Card className="border-dashed border-2 border-gray-200 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-800/30">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#14C8C8]/10 to-[#0FB6B6]/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <ClipboardIcon className="w-10 h-10 text-[#14C8C8]" />
                </div>
                <CardTitle className="text-gray-600 dark:text-gray-300 text-xl mb-2">
                  No Surveys Available
                </CardTitle>
                <CardDescription className="max-w-sm mx-auto text-gray-500 dark:text-gray-400">
                  There are currently no surveys available for this session. Check back later or contact the session organizer.
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Surveys Grid */}
        {surveys && surveys.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey, index) => (
              <div
                key={survey.id}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{ 
                  animationDelay: `${index * 100}ms`, 
                  animationFillMode: 'both' 
                }}
              >
                <SurveyCard 
                  survey={survey} 
                  sessionId={sessionId}
                  isCompleted={completedSurveyIds.has(survey.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {surveys && surveys.length > 0 && (
          <Card className="bg-gradient-to-r from-[#14C8C8]/5 to-[#0FB6B6]/5 border-[#14C8C8]/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#14C8C8]">
                    {surveys.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Surveys
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {completedSurveyIds.size}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Completed
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {surveys.length - completedSurveyIds.size}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Remaining
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 