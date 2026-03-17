import { cn } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon } from '@radix-ui/react-icons';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: number;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  change,
  className,
}: StatCardProps) {
  return (
    <div className={cn(
      'group relative rounded-xl bg-gradient-to-br from-card to-card/80 dark:from-slate-900 dark:to-slate-800 p-6 shadow-lg dark:shadow-2xl border border-border/50 backdrop-blur-sm hover:shadow-xl dark:hover:shadow-primary/10 transition-all duration-300 hover:scale-105 overflow-hidden',
      className
    )}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 dark:from-primary/10 dark:via-transparent dark:to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">{title}</p>
          <div className="bg-gradient-to-br from-primary/20 to-primary/30 dark:from-primary/30 dark:to-primary/40 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">{value}</h3>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center rounded-lg px-2 py-1 text-xs font-medium shadow-sm transition-all duration-300',
                change > 0
                  ? 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                  : 'bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
              )}
            >
              {change > 0 ? (
                <ArrowUpIcon className="mr-1 h-3 w-3" />
              ) : (
                <ArrowDownIcon className="mr-1 h-3 w-3" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
    </div>
  );
}
