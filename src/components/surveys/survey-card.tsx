import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

interface SurveyCardProps {
  survey: {
    id: string;
    title: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
    startDate?: string;
    endDate?: string;
    isOptional?: boolean;
    questions?: Array<{ id: string }>;
    responses?: Array<{ id: string }>;
  };
  sessionId: string;
  isCompleted?: boolean;
}

export function SurveyCard({ survey, sessionId, isCompleted = false }: SurveyCardProps) {
  const { id, title, description, status, isOptional, questions, responses } = survey;
  
  const questionCount = questions?.length || 0;
  const responseCount = responses?.length || 0;
  
  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'ACTIVE') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'INACTIVE') return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircleIcon className="h-3 w-3" />;
    if (status === 'ACTIVE') return <ClockIcon className="h-3 w-3" />;
    return <AlertCircleIcon className="h-3 w-3" />;
  };

  return (
    <Link 
      href={`/dashboard/sessions/${sessionId}/surveys/${id}`}
      className="block group transition-all duration-300 hover:scale-[1.02]"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-[#14C8C8]/10 group-hover:border-[#14C8C8]/30">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6]" />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#14C8C8] transition-colors line-clamp-2">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {description}
                </CardDescription>
              )}
            </div>
            
            <div className="flex flex-col gap-2 items-end">
              <Badge 
                variant="secondary" 
                className={`text-xs font-medium border ${getStatusColor()} flex items-center gap-1`}
              >
                {getStatusIcon()}
                {isCompleted ? 'Completed' : status || 'Draft'}
              </Badge>
              
              {isOptional && (
                <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                  Optional
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <CheckCircleIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs">
                {questionCount} Question{questionCount !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CalendarIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs">
                {responseCount} Response{responseCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          {isCompleted && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Survey Completed</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Thank you for your participation!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
} 