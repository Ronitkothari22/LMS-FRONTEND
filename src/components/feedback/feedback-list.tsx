'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionFeedback, useFeedbackStats } from '@/hooks/feedback';
import { FeedbackCard } from './feedback-card';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  BarChart3,
  FileText 
} from 'lucide-react';

interface FeedbackListProps {
  sessionId: string;
  onFeedbackSelect?: (feedbackId: string) => void;
}

export function FeedbackList({ sessionId, onFeedbackSelect }: FeedbackListProps) {
  const router = useRouter();
  const { data: feedbackForms, isLoading, error } = useSessionFeedback(sessionId);
  const { data: stats } = useFeedbackStats(sessionId);
  
  const [activeTab, setActiveTab] = useState('all');

  const handleFillFeedback = (feedbackId: string) => {
    if (onFeedbackSelect) {
      onFeedbackSelect(feedbackId);
    } else {
      router.push(`/feedback/${feedbackId}?sessionId=${sessionId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load feedback forms. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!feedbackForms || feedbackForms.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <CardTitle className="text-gray-600 dark:text-gray-400 mb-2">
            No Feedback Forms Available
          </CardTitle>
          <p className="text-gray-500 dark:text-gray-400">
            There are no feedback forms for this session yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const availableFeedback = feedbackForms.filter(f => f.isActive && !f.hasSubmitted);
  const completedFeedback = feedbackForms.filter(f => f.hasSubmitted);
  const inactiveFeedback = feedbackForms.filter(f => !f.isActive);

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                  <p className="text-2xl font-bold">{stats.available}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                  <p className="text-2xl font-bold">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Forms */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All
            <Badge variant="secondary" className="ml-1">
              {feedbackForms.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Available
            {availableFeedback.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {availableFeedback.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed
            {completedFeedback.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {completedFeedback.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Inactive
            {inactiveFeedback.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {inactiveFeedback.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {feedbackForms.map((feedback) => (
            <FeedbackCard
              key={feedback.id}
              feedback={feedback}
              onFillFeedback={handleFillFeedback}
            />
          ))}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {availableFeedback.length > 0 ? (
            availableFeedback.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onFillFeedback={handleFillFeedback}
              />
            ))
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  No feedback forms available to fill
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedFeedback.length > 0 ? (
            completedFeedback.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onFillFeedback={handleFillFeedback}
                disabled
              />
            ))
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <CheckCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  No feedback forms completed yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveFeedback.length > 0 ? (
            inactiveFeedback.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onFillFeedback={handleFillFeedback}
                disabled
              />
            ))
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  No inactive feedback forms
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 