'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface WordCloudWord {
  text: string;
  count: number;
  weight: number;
}

interface WordCloudProps {
  words: WordCloudWord[];
  className?: string;
  maxWords?: number;
  animate?: boolean;
}

interface PositionedWord extends WordCloudWord {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotation: number;
}

export function WordCloud({ words, className, maxWords = 50, animate = true }: WordCloudProps) {
  const [animatedWords, setAnimatedWords] = useState<PositionedWord[]>([]);
  const [positionedWords, setPositionedWords] = useState<PositionedWord[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort words by weight/count and limit to maxWords
  const sortedWords = useMemo(() => {
    return [...words].sort((a, b) => b.weight - a.weight).slice(0, maxWords);
  }, [words, maxWords]);

  // Generate positions for words in a cloud formation
  const generateWordPositions = (words: WordCloudWord[]): PositionedWord[] => {
    if (words.length === 0) return [];

    const maxWeight = Math.max(...words.map(w => w.weight));
    const minWeight = Math.min(...words.map(w => w.weight));
    
    // Brand colors palette
    const colors = [
      '#14C8C8', '#0FB6B6', '#0A9999', '#067B7B', 
      '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
      '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6',
      '#10B981', '#059669', '#047857', '#065F46'
    ];

    return words.map((word, index) => {
      // Calculate font size (between 14px and 56px)
      const minSize = 14;
      const maxSize = 56;
      const normalizedWeight = maxWeight === minWeight ? 1 : (word.weight - minWeight) / (maxWeight - minWeight);
      const fontSize = minSize + (normalizedWeight * (maxSize - minSize));
      
      // Generate position in a cloud-like formation
      // Use spiral/circular positioning for better distribution
      const angle = (index * 137.5) * (Math.PI / 180); // Golden angle for better distribution
      const radius = Math.sqrt(index + 1) * 25; // Spiral outward
      
      // Add some randomness to make it more natural
      const randomOffset = 30;
      const x = 50 + (Math.cos(angle) * radius) / 6 + (Math.random() - 0.5) * randomOffset;
      const y = 50 + (Math.sin(angle) * radius) / 6 + (Math.random() - 0.5) * randomOffset;
      
      // Ensure words stay within bounds
      const clampedX = Math.max(5, Math.min(95, x));
      const clampedY = Math.max(10, Math.min(90, y));
      
      return {
        ...word,
        x: clampedX,
        y: clampedY,
        fontSize,
        color: colors[index % colors.length],
        rotation: (Math.random() - 0.5) * 25, // -12.5 to +12.5 degrees
      };
    });
  };

  // Generate positions when sortedWords change
  useEffect(() => {
    const positioned = generateWordPositions(sortedWords);
    setPositionedWords(positioned);
  }, [sortedWords]);

  // Animate words in sequence
  useEffect(() => {
    if (!animate || positionedWords.length === 0) {
      setAnimatedWords(positionedWords);
      return;
    }

    setAnimatedWords([]);
    
    positionedWords.forEach((word, index) => {
      setTimeout(() => {
        setAnimatedWords(prev => [...prev, word]);
      }, index * 120);
    });
  }, [positionedWords, animate]);

  const displayWords = animate ? animatedWords : positionedWords;

  if (sortedWords.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8 text-center",
        "bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50",
        "rounded-lg border border-gray-200/50 dark:border-gray-700/50",
        className
      )}>
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto bg-gradient-to-r from-[#14C8C8]/20 to-[#0FB6B6]/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#14C8C8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Waiting for responses...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full min-h-[400px] overflow-hidden",
        "bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30",
        "dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20",
        "rounded-lg border border-blue-200/50 dark:border-blue-800/30",
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6]" 
             style={{
               backgroundImage: `radial-gradient(circle at 25% 25%, rgba(20, 200, 200, 0.1) 0%, transparent 50%), 
                                radial-gradient(circle at 75% 75%, rgba(15, 182, 182, 0.1) 0%, transparent 50%)`
             }} />
      </div>

      {/* Words positioned absolutely for cloud formation */}
      {displayWords.map((word, index) => (
        <span
          key={`${word.text}-${index}`}
          className={cn(
            "absolute font-bold cursor-default select-none transition-all duration-500",
            "hover:scale-110 hover:drop-shadow-lg hover:z-10",
            "whitespace-nowrap",
            animate && "animate-in fade-in zoom-in-50 duration-700 fill-mode-both"
          )}
          style={{
            left: `${word.x}%`,
            top: `${word.y}%`,
            fontSize: `${word.fontSize}px`,
            color: word.color,
            transform: `translate(-50%, -50%) rotate(${word.rotation}deg)`,
            animationDelay: animate ? `${index * 120}ms` : '0ms',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            fontWeight: Math.min(900, 400 + (word.weight * 100)),
          }}
          title={`"${word.text}" - ${word.count} ${word.count === 1 ? 'response' : 'responses'}`}
        >
          {word.text}
        </span>
      ))}

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#14C8C8]/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Center glow effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-[#14C8C8]/5 to-[#0FB6B6]/5 rounded-full blur-xl" />
    </div>
  );
} 