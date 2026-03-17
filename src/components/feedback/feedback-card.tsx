'use client';

import { Feedback } from '@/types/feedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, MessageSquare, Star } from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackCardProps {
  feedback: Feedback;
  onFillFeedback: (feedbackId: string) => void;
  disabled?: boolean;
}

export function FeedbackCard({ feedback, onFillFeedback, disabled = false }: FeedbackCardProps) {
  const questionCount = feedback.questions?.length || 0;
  const smileyQuestions = feedback.questions?.filter(q => q.type === 'SMILEY_SCALE').length || 0;
  const textQuestions = feedback.questions?.filter(q => q.type === 'TEXT').length || 0;

  const handleFillFeedback = () => {
    if (!disabled && !feedback.hasSubmitted) {
      onFillFeedback(feedback.id);
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      feedback.hasSubmitted ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 
      !feedback.isActive ? 'border-gray-200 bg-gray-50 dark:bg-gray-900/20' : 
      'border-blue-200 hover:border-blue-300 cursor-pointer'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{feedback.title}</CardTitle>
              {feedback.hasSubmitted && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              {!feedback.isActive && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
              {feedback.isAnonymous && (
                <Badge variant="outline" className="text-xs">
                  Anonymous
                </Badge>
              )}
            </div>
            {feedback.description && (
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {feedback.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Questions Summary */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
            </div>
            {smileyQuestions > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{smileyQuestions} rating{smileyQuestions !== 1 ? 's' : ''}</span>
              </div>
            )}
            {textQuestions > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{textQuestions} text</span>
              </div>
            )}
          </div>

          {/* Session Information */}
          {feedback.session && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Session: {feedback.session.title}
            </div>
          )}

          {/* Created Date */}
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Created {format(new Date(feedback.createdAt), 'PPp')}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {feedback.hasSubmitted ? (
              <Button disabled className="w-full bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="h-4 w-4 mr-2" />
                Feedback Submitted
              </Button>
            ) : !feedback.isActive ? (
              <Button disabled className="w-full">
                <Clock className="h-4 w-4 mr-2" />
                Feedback Inactive
              </Button>
            ) : (
              <Button 
                onClick={handleFillFeedback}
                disabled={disabled}
                className="w-full"
                variant="default"
              >
                <FileText className="h-4 w-4 mr-2" />
                Fill Feedback
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 