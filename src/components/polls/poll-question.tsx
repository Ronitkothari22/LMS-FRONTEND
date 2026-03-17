'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import type { Question, QuestionType } from '@/types/content';

interface PollQuestionProps {
  pollId?: string;
  question: Question;
  onSubmitResponse?: (
    answer: string | string[] | number,
    type: QuestionType
  ) => void;
  onSubmit?: (response: {
    questionId: string;
    answer: string | string[] | number;
    type: QuestionType;
    pollId?: string;
  }) => void;
}

export function PollQuestionComponent({
  pollId,
  question,
  onSubmitResponse,
  onSubmit,
}: PollQuestionProps) {
  // State for different question types
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textResponse, setTextResponse] = useState<string>('');
  const [scaleValue, setScaleValue] = useState<number[]>([5]);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = () => {
    // Allow multiple submissions for word cloud questions
    if (submitted && question.type !== 'WORD_CLOUD') return;

    let answer: string | string[] | number;

    switch (question.type) {
      case 'SINGLE_CHOICE':
        if (!selectedOption) {
          alert('Please select an option');
          return;
        }
        answer = selectedOption;
        break;

      case 'MULTIPLE_CHOICE':
        if (selectedOptions.length === 0) {
          alert('Please select at least one option');
          return;
        }
        answer = selectedOptions;
        break;

      case 'WORD_CLOUD':
      case 'OPEN_TEXT':
      case 'Q_AND_A':
        if (!textResponse.trim()) {
          alert('Please enter a response');
          return;
        }
        answer = textResponse.trim();
        break;

      case 'SCALE':
      case 'RANKING':
        answer = scaleValue[0];
        break;

      default:
        alert('Unknown question type');
        return;
    }

    // Handle both callback types
    if (onSubmitResponse) {
      onSubmitResponse(answer, question.type);
    } else if (onSubmit) {
      onSubmit({
        questionId: question.id,
        answer,
        type: question.type,
        pollId,
      });
    }

    // Only set submitted to true for non-word-cloud questions
    if (question.type !== 'WORD_CLOUD') {
      setSubmitted(true);
    } else {
      // For word cloud questions, clear the text input for the next submission
      setTextResponse('');
    }
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'SINGLE_CHOICE':
        return (
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedOptions([...selectedOptions, option.id]);
                    } else {
                      setSelectedOptions(
                        selectedOptions.filter((id) => id !== option.id)
                      );
                    }
                  }}
                />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'WORD_CLOUD':
        return (
          <Input
            placeholder="Enter a word or short phrase"
            value={textResponse}
            onChange={(e) => setTextResponse(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textResponse.trim()) {
                handleSubmit();
              }
            }}
            maxLength={50}
          />
        );

      case 'OPEN_TEXT':
      case 'Q_AND_A':
        return (
          <Textarea
            placeholder="Enter your response"
            value={textResponse}
            onChange={(e) => setTextResponse(e.target.value)}
            rows={4}
          />
        );

      case 'SCALE':
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1</span>
              <span>10</span>
            </div>
            <Slider
              value={scaleValue}
              onValueChange={setScaleValue}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-center">
              <span className="text-lg font-semibold text-foreground">{scaleValue[0]}</span>
            </div>
          </div>
        );

      case 'RANKING':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rank from 1 (lowest) to 10 (highest)
            </p>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1</span>
              <span>10</span>
            </div>
            <Slider
              value={scaleValue}
              onValueChange={setScaleValue}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-center">
              <span className="text-lg font-semibold text-foreground">
                Rank: {scaleValue[0]}
              </span>
            </div>
          </div>
        );

      default:
        return <p className="text-muted-foreground">Unknown question type</p>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700">
      {/* Gradient border effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-r from-[#14C8C8]/20 via-[#0FB6B6]/20 to-[#14C8C8]/20" />
      
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6]" />
      
      <CardHeader className="relative">
        <CardTitle className="text-xl text-[#14C8C8] dark:text-[#14C8C8] font-bold">
          {question.text}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400 bg-gradient-to-r from-[#14C8C8]/10 to-[#0FB6B6]/10 px-3 py-1.5 rounded-full border border-[#14C8C8]/20 inline-block w-fit">
          Type: {question.type.replace('_', ' ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative">
        {renderQuestionInput()}

        <Button
          onClick={handleSubmit}
          disabled={submitted && question.type !== 'WORD_CLOUD'}
          className="w-full bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] hover:from-[#0FB6B6] hover:to-[#14C8C8] text-white shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {question.type === 'WORD_CLOUD' 
            ? 'Add Word' 
            : submitted 
              ? 'Response Submitted' 
              : 'Submit Response'
          }
        </Button>

        {submitted && question.type !== 'WORD_CLOUD' && (
          <div className="text-center bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200/50 dark:border-green-800/30">
            <p className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
              </div>
              Your response has been submitted successfully!
            </p>
          </div>
        )}

        {question.type === 'WORD_CLOUD' && (
          <div className="text-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
              </div>
              You can submit multiple words for this question!
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-br from-[#14C8C8]/5 to-[#0FB6B6]/5 pointer-events-none" />
    </Card>
  );
}
