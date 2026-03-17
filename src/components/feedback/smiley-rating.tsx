'use client';

import { SmileyRating, SMILEY_RATINGS } from '@/types/feedback';
import { cn } from '@/lib/utils';

interface SmileyRatingProps {
  value?: SmileyRating;
  onChange: (rating: SmileyRating) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SmileyRatingComponent({ 
  value, 
  onChange, 
  disabled = false, 
  size = 'md',
  className 
}: SmileyRatingProps) {
  const sizeClasses = {
    sm: 'text-2xl p-2',
    md: 'text-3xl p-3',
    lg: 'text-4xl p-4'
  };

  const ratings = Object.entries(SMILEY_RATINGS).map(([key, ratingData]) => ({
    rating: key as SmileyRating,
    ...ratingData
  }));

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {ratings.map(({ rating, emoji, label }) => (
        <button
          key={rating}
          type="button"
          onClick={() => !disabled && onChange(rating)}
          disabled={disabled}
          className={cn(
            "transition-all duration-200 rounded-full border-2 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            sizeClasses[size],
            value === rating
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-110 shadow-lg"
              : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
            disabled
              ? "opacity-50 cursor-not-allowed hover:scale-100"
              : "cursor-pointer"
          )}
          title={label}
          aria-label={`Rate ${label}`}
        >
          <span className="block">{emoji}</span>
        </button>
      ))}
    </div>
  );
}

interface SmileyRatingDisplayProps {
  value: SmileyRating;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function SmileyRatingDisplay({ 
  value, 
  size = 'md', 
  showLabel = false,
  className 
}: SmileyRatingDisplayProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const ratingData = SMILEY_RATINGS[value];
  
  if (!ratingData) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn(sizeClasses[size])}>{ratingData.emoji}</span>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {ratingData.label}
        </span>
      )}
    </div>
  );
} 