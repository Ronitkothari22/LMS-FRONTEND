'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleHelp, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LmsCreateAttemptPayload, LmsLevelAttemptResult, LmsQuestion } from '@/types/lms';

interface LmsLevelQuizSectionProps {
  questions: LmsQuestion[];
  isSubmitting?: boolean;
  result?: LmsLevelAttemptResult | null;
  readOnly?: boolean;
  initialAnswers?: Array<{
    questionId: string;
    selectedOptionIds: string[];
    textAnswer?: string | null;
    isCorrect?: boolean | null;
  }>;
  onSubmitAttempt: (payload: LmsCreateAttemptPayload) => void;
}

type QuizAnswerState = Record<
  string,
  {
    selectedOptionIds: string[];
    textAnswer: string;
  }
>;

export function LmsLevelQuizSection({
  questions,
  isSubmitting,
  result,
  readOnly = false,
  initialAnswers = [],
  onSubmitAttempt,
}: LmsLevelQuizSectionProps) {
  const [answers, setAnswers] = useState<QuizAnswerState>({});

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.position - b.position),
    [questions],
  );

  useEffect(() => {
    if (!initialAnswers.length) return;

    const seededAnswers: QuizAnswerState = {};
    for (const answer of initialAnswers) {
      seededAnswers[answer.questionId] = {
        selectedOptionIds: answer.selectedOptionIds || [],
        textAnswer: answer.textAnswer || '',
      };
    }
    setAnswers(seededAnswers);
  }, [initialAnswers]);

  const setSingleChoice = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        selectedOptionIds: [optionId],
        textAnswer: prev[questionId]?.textAnswer || '',
      },
    }));
  };

  const toggleMultiChoice = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers(prev => {
      const existing = prev[questionId]?.selectedOptionIds || [];
      const nextOptions = checked
        ? [...existing, optionId]
        : existing.filter(id => id !== optionId);

      return {
        ...prev,
        [questionId]: {
          selectedOptionIds: Array.from(new Set(nextOptions)),
          textAnswer: prev[questionId]?.textAnswer || '',
        },
      };
    });
  };

  const setTextAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        selectedOptionIds: prev[questionId]?.selectedOptionIds || [],
        textAnswer: value,
      },
    }));
  };

  const handleSubmit = () => {
    const payload: LmsCreateAttemptPayload = {
      answers: sortedQuestions.map(question => {
        const answer = answers[question.id] || {
          selectedOptionIds: [],
          textAnswer: '',
        };

        return {
          questionId: question.id,
          selectedOptionIds: answer.selectedOptionIds,
          textAnswer: answer.textAnswer.trim() || undefined,
        };
      }),
      timeSpentSeconds: 0,
    };

    onSubmitAttempt(payload);
  };

  if (!sortedQuestions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Check</CardTitle>
          <CardDescription>No quiz questions found for this level.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Check</CardTitle>
        <CardDescription>
          {readOnly
            ? 'Review mode: showing your latest submitted answers.'
            : 'Answer all required questions and submit your attempt.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {sortedQuestions.map(question => {
          const current = answers[question.id];

          return (
            <div key={question.id} className="rounded-xl border p-3">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline">Q{question.position}</Badge>
                <Badge variant="secondary">{question.type}</Badge>
                <Badge variant={question.isRequired ? 'default' : 'secondary'}>
                  {question.isRequired ? 'Required' : 'Optional'}
                </Badge>
              </div>

              <p className="text-sm font-medium">{question.questionText}</p>

              <div className="mt-3 space-y-2">
                {question.type === 'TEXT' && (
                  <Textarea
                    value={current?.textAnswer || ''}
                    onChange={event => setTextAnswer(question.id, event.target.value)}
                    placeholder="Type your answer"
                    rows={4}
                    disabled={readOnly}
                  />
                )}

                {question.type === 'SINGLE_CHOICE' &&
                  (question.options || []).map(option => {
                    const selected = current?.selectedOptionIds?.includes(option.id) || false;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          if (readOnly) return;
                          setSingleChoice(question.id, option.id);
                        }}
                        disabled={readOnly}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        {option.optionText}
                      </button>
                    );
                  })}

                {question.type === 'MULTIPLE_CORRECT' &&
                  (question.options || []).map(option => {
                    const checked = current?.selectedOptionIds?.includes(option.id) || false;

                    return (
                      <Label
                        key={option.id}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:border-primary/40"
                      >
                        <Checkbox
                          checked={checked}
                          disabled={readOnly}
                          onCheckedChange={value =>
                            toggleMultiChoice(question.id, option.id, Boolean(value))
                          }
                        />
                        <span className="text-sm">{option.optionText}</span>
                      </Label>
                    );
                  })}
              </div>

              {readOnly && (
                <div className="mt-3">
                  {initialAnswers.find(answer => answer.questionId === question.id)?.isCorrect ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/40" variant="outline">
                      Correct
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/10 text-rose-700 border-rose-500/40" variant="outline">
                      Incorrect
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {result && (
          <div className="rounded-xl border p-3 bg-muted/30">
            <p className="font-semibold text-sm mb-1">Latest Attempt</p>
            <div className="flex items-center gap-2 text-sm">
              {result.summary.passed ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Passed ({Math.round(result.summary.scorePercent)}%)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <XCircle className="h-4 w-4" />
                  Not Passed ({Math.round(result.summary.scorePercent)}%)
                </span>
              )}
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <CircleHelp className="h-4 w-4" />
                Attempt #{result.attempt.id.slice(0, 8)}
              </span>
            </div>
          </div>
        )}

        {!readOnly && (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting Attempt...' : 'Submit Attempt'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
