"use client";

import { useState } from 'react';
import { Survey } from '@/lib/api/surveys';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubmitSurvey } from '@/hooks/surveys';
import { CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

interface SurveyFormProps {
  survey: Survey;
  onSubmitted?: () => void;
  disabled?: boolean; // when user already submitted
}

export function SurveyForm({ survey, onSubmitted, disabled }: SurveyFormProps) {
  const { mutate: submitSurvey, isPending } = useSubmitSurvey();

  // Local state for answers
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  const handleChange = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    const payload = {
      surveyId: survey.id,
      responses: Object.entries(answers).map(([questionId, responseValue]) => ({
        questionId,
        responseValue,
      })),
    };

    submitSurvey(payload, {
      onSuccess: () => {
        onSubmitted?.();
      },
    });
  };

  // Calculate progress
  const totalQuestions = survey.questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // Check if all required questions are answered
  const requiredQuestions = survey.questions.filter(q => q.isRequired);
  const answeredRequiredQuestions = requiredQuestions.filter(q => answers[q.id] !== undefined);
  const canSubmit = answeredRequiredQuestions.length === requiredQuestions.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Survey Header */}
      <Card className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700">
        <div className="h-1 bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6]" />
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {survey.title}
              </CardTitle>
              {survey.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {survey.description}
                </p>
              )}
            </div>
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
            </div>
          </div>
          
          {/* Progress Bar */}
          {!disabled && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Progress: {answeredQuestions} of {totalQuestions} questions</span>
                <span>{Math.round(progressPercentage)}% complete</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Survey Questions */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {survey.questions
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((q, index) => {
            const isReq = q.isRequired;
            const answer = answers[q.id];
            const isAnswered = answer !== undefined;

            return (
              <Card key={q.id} className={`transition-all duration-300 ${
                isAnswered 
                  ? 'border-green-200 bg-green-50/20 dark:border-green-800/50 dark:bg-green-900/10' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isAnswered 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {isAnswered ? <CheckCircleIcon className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
                        {q.questionText}
                        {isReq && <span className="text-red-500 ml-1">*</span>}
                      </CardTitle>
                      {isReq && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          This question is required
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {q.questionType === 'RATING_SCALE' && (
                    <RadioGroup
                      value={answer?.toString() || ''}
                      onValueChange={(val) => handleChange(q.id, Number(val))}
                      className="grid grid-cols-2 md:grid-cols-5 gap-4"
                      disabled={disabled}
                    >
                      {(() => {
                        // Handle rating scale with labels
                        if (q.options && typeof q.options === 'object' && 'labels' in q.options) {
                          const labels = q.options.labels || {};
                          return Object.entries(labels).map(([value, label]) => (
                            <label key={value} className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                              <RadioGroupItem value={value} />
                              <span className="text-center text-sm font-medium">{label}</span>
                              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{value}</span>
                            </label>
                          ));
                        }
                        // Fallback to 1-5 scale
                        return [1, 2, 3, 4, 5].map((val) => (
                          <label key={val} className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                            <RadioGroupItem value={val.toString()} />
                            <span className="text-sm font-medium">{val}</span>
                          </label>
                        ));
                      })()}
                    </RadioGroup>
                  )}

                  {q.questionType === 'SINGLE_CHOICE' && q.options && (
                    <RadioGroup
                      value={answer?.toString() || ''}
                      onValueChange={(val) => handleChange(q.id, val)}
                      className="space-y-3"
                      disabled={disabled}
                    >
                      {Array.isArray(q.options) ? q.options.map((opt, idx) => (
                        <label key={idx} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                          <RadioGroupItem value={opt} />
                          <span className="text-sm">{opt}</span>
                        </label>
                      )) : null}
                    </RadioGroup>
                  )}

                  {q.questionType === 'TEXT' && (
                    <Textarea
                      value={answer?.toString() || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      disabled={disabled}
                      placeholder="Enter your response..."
                      className="min-h-[100px] resize-none"
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}

        {/* Submit Section */}
        <Card className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                {!canSubmit && !disabled && (
                  <>
                    <AlertCircleIcon className="h-4 w-4 text-amber-500" />
                    <span>Please answer all required questions to submit</span>
                  </>
                )}
                {canSubmit && !disabled && (
                  <>
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span>Ready to submit your responses</span>
                  </>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={disabled || isPending || !canSubmit}
                className="bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] hover:from-[#0FB6B6] hover:to-[#14C8C8] text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed px-8 py-2"
              >
                {disabled 
                  ? 'Survey Submitted' 
                  : isPending 
                    ? 'Submitting...' 
                    : 'Submit Survey'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
} 