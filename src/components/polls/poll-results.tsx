'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PollResults, PollType } from '@/lib/api/polls';
import { Progress } from '@/components/ui/progress';
import { WordCloud } from './word-cloud';

interface PollResultsProps {
  question: string;
  type: PollType;
  results: PollResults;
  hasUserSubmitted?: boolean;
}

export function PollResultsComponent({
  question,
  type,
  results,
  hasUserSubmitted = false,
}: PollResultsProps) {
  // Render different result visualizations based on question type
  const renderResults = () => {
    switch (type) {
      case 'SINGLE_CHOICE':
      case 'MULTIPLE_CHOICE':
        return renderChoiceResults();
      case 'WORD_CLOUD':
        return renderWordCloudResults();
      case 'SCALE':
        return renderScaleResults();
      case 'OPEN_TEXT':
      case 'Q_AND_A':
        return renderTextResults();
      default:
        return (
          <div className="text-center text-gray-500 py-4">
            Results visualization not available for this question type.
          </div>
        );
    }
  };

  // Render results for choice-based questions
  const renderChoiceResults = () => {
    if (!results.options || results.options.length === 0) {
      return (
        <div className="text-center py-8 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
          <p className="text-gray-500 dark:text-gray-400">
            {hasUserSubmitted
              ? 'Your response has been submitted! Waiting for other participants...'
              : 'No responses yet.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.options.map((option) => (
          <div key={option.id} className="space-y-2 p-4 bg-gradient-to-r from-gray-50/30 to-gray-100/30 dark:from-gray-800/30 dark:to-gray-700/30 rounded-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900 dark:text-white">{option.text}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-[#14C8C8]/10 dark:bg-[#14C8C8]/20 px-2 py-1 rounded-full">
                {option.count} ({option.percentage.toFixed(1)}%)
              </span>
            </div>
            <Progress 
              value={option.percentage} 
              className="h-3 bg-gray-200 dark:bg-gray-700" 
              style={{
                '--progress-foreground': '#14C8C8'
              } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
    );
  };

  // Render word cloud results
  const renderWordCloudResults = () => {
    // Check if we have word cloud data (new format from socket)
    if (results.words && results.words.length > 0) {
      return (
        <WordCloud 
          words={results.words.map(word => ({
            text: word.text,
            count: word.weight, // Use weight as count for display
            weight: word.weight
          }))}
          animate={true}
        />
      );
    }

    // Fallback to responses format (legacy)
    if (results.responses && results.responses.length > 0) {
      // Convert responses to word cloud format
      const wordMap = new Map<string, { count: number; weight: number }>();
      
      results.responses.forEach(response => {
        const text = response.text.toLowerCase().trim();
        if (wordMap.has(text)) {
          const existing = wordMap.get(text)!;
          wordMap.set(text, { 
            count: existing.count + 1, 
            weight: existing.weight + 1 
          });
        } else {
          wordMap.set(text, { count: 1, weight: 1 });
        }
      });

      const words = Array.from(wordMap.entries()).map(([text, data]) => ({
        text,
        count: data.count,
        weight: data.weight
      }));

      return (
        <WordCloud 
          words={words}
          animate={true}
        />
      );
    }

    // No data available
    return (
      <div className="text-center py-8 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
        <p className="text-gray-500 dark:text-gray-400">
          {hasUserSubmitted
            ? 'Your response has been submitted! Waiting for other participants...'
            : 'No responses yet.'}
        </p>
      </div>
    );
  };

  // Render scale question results
  const renderScaleResults = () => {
    if (!results.distribution || results.distribution.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          {hasUserSubmitted
            ? 'Your response has been submitted! Waiting for other participants...'
            : 'No responses yet.'}
        </div>
      );
    }

    const maxCount = Math.max(
      ...results.distribution.map((item) => item.count)
    );

    return (
      <div className="space-y-6">
        <div className="text-center">
          <span className="text-2xl font-bold">
            {results.average?.toFixed(1) || 'N/A'}
          </span>
          <p className="text-sm text-gray-500">Average rating</p>
        </div>

        <div className="grid grid-cols-10 gap-1 mt-4">
          {results.distribution.map((item) => (
            <div key={item.value} className="flex flex-col items-center">
              <div
                className="w-full bg-gray-100 rounded-sm"
                style={{ height: '100px' }}
              >
                <div
                  className="bg-[#14C8C8] w-full rounded-sm transition-all duration-500"
                  style={{
                    height: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
                    marginTop: `${maxCount > 0 ? 100 - (item.count / maxCount) * 100 : 100}%`,
                  }}
                />
              </div>
              <span className="text-xs mt-1">{item.value}</span>
              <span className="text-xs text-gray-500">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render text-based responses
  const renderTextResults = () => {
    if (!results.responses || results.responses.length === 0) {
      return (
        <div className="text-center py-8 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
          <p className="text-gray-500 dark:text-gray-400">
            {hasUserSubmitted
              ? 'Your response has been submitted! Waiting for other participants...'
              : 'No responses yet.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.responses.map((response, index) => (
          <div 
            key={response.id} 
            className="bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
          >
            <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{response.text}</p>
            {response.user && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-600/50">
                <div className="w-6 h-6 bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {response.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{response.user.name}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700">
      {/* Gradient border effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-r from-[#14C8C8]/20 via-[#0FB6B6]/20 to-[#14C8C8]/20" />
      
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6]" />
      
      <CardHeader className="relative">
        <CardTitle className="text-xl text-[#14C8C8] dark:text-[#14C8C8] font-bold">{question}</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {hasUserSubmitted && results.totalResponses === 0
            ? 'Response submitted - waiting for results...'
            : `${results.totalResponses} ${results.totalResponses === 1 ? 'response' : 'responses'}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">{renderResults()}</CardContent>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-br from-[#14C8C8]/5 to-[#0FB6B6]/5 pointer-events-none" />
    </Card>
  );
}
