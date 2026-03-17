'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Feedback, 
  FeedbackFormState, 
  FeedbackFormErrors, 
  FeedbackType, 
  SmileyRating,
  FeedbackQuestionResponse 
} from '@/types/feedback';
import { useSubmitFeedback } from '@/hooks/feedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SmileyRatingComponent } from './smiley-rating';
import { ArrowLeft, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackFormProps {
  feedback: Feedback;
  sessionId: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function FeedbackForm({ 
  feedback, 
  sessionId, 
  onSubmitSuccess, 
  onCancel 
}: FeedbackFormProps) {
  const router = useRouter();
  const { mutateAsync: submitFeedback, isPending } = useSubmitFeedback(sessionId);
  
  const [formState, setFormState] = useState<FeedbackFormState>({});
  const [errors, setErrors] = useState<FeedbackFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form state
  useEffect(() => {
    const initialState: FeedbackFormState = {};
    feedback.questions?.forEach(question => {
      initialState[question.id] = {};
    });
    setFormState(initialState);
  }, [feedback.questions]);

  const handleRatingChange = (questionId: string, rating: SmileyRating) => {
    setFormState(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        rating,
        textAnswer: undefined // Clear text answer when rating is set
      }
    }));
    
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleTextChange = (questionId: string, textAnswer: string) => {
    setFormState(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        textAnswer,
        rating: undefined // Clear rating when text answer is set
      }
    }));
    
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FeedbackFormErrors = {};
    
    feedback.questions?.forEach(question => {
      if (question.isRequired) {
        const answer = formState[question.id];
        if (!answer || (!answer.rating && !answer.textAnswer?.trim())) {
          newErrors[question.id] = 'This question is required';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const responses: FeedbackQuestionResponse[] = [];
      
      // Convert form state to API format
      Object.entries(formState).forEach(([questionId, answer]) => {
        if (answer.rating || answer.textAnswer?.trim()) {
          responses.push({
            questionId,
            rating: answer.rating,
            textAnswer: answer.textAnswer?.trim()
          });
        }
      });

      await submitFeedback({
        feedbackId: feedback.id,
        responses
      });

      toast.success('Feedback submitted successfully!');
      onSubmitSuccess?.();
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Error handling is done in the API function
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  if (feedback.hasSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800 dark:text-green-400">
              Feedback Already Submitted
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-400">
              You have already submitted feedback for &quot;{feedback.title}&quot;. Thank you for your participation!
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={handleCancel} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!feedback.isActive) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-gray-800 dark:text-gray-400">
              Feedback Inactive
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-gray-200 bg-gray-50 dark:bg-gray-900/20">
            <Clock className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-800 dark:text-gray-400">
              The feedback form &quot;{feedback.title}&quot; is currently inactive and not accepting responses.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={handleCancel} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{feedback.title}</CardTitle>
                {feedback.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {feedback.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {feedback.isAnonymous && (
                  <Badge variant="outline" className="text-xs">
                    Anonymous
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Questions */}
        {feedback.questions?.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-xs mt-1">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <Label className="text-base font-medium">
                      {question.question}
                      {question.isRequired && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {question.type === FeedbackType.SMILEY_SCALE ? 'Rate your experience' : 'Text response'}
                    </div>
                  </div>
                </div>

                {/* Question Input */}
                <div className="ml-8">
                  {question.type === FeedbackType.SMILEY_SCALE ? (
                    <SmileyRatingComponent
                      value={formState[question.id]?.rating}
                      onChange={(rating) => handleRatingChange(question.id, rating)}
                      disabled={isSubmitting}
                      className="py-4"
                    />
                  ) : (
                    <Textarea
                      value={formState[question.id]?.textAnswer || ''}
                      onChange={(e) => handleTextChange(question.id, e.target.value)}
                      placeholder="Enter your response..."
                      disabled={isSubmitting}
                      className="min-h-[100px] resize-none"
                      maxLength={1000}
                    />
                  )}
                </div>

                {/* Error Display */}
                {errors[question.id] && (
                  <Alert variant="destructive" className="ml-8">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors[question.id]}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Submit Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting || isPending}
                className="min-w-[120px]"
              >
                {isSubmitting || isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
} 