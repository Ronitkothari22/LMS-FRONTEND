'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, ChevronDown } from 'lucide-react';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [homeExpanded, setHomeExpanded] = useState(true);
  const [learningExpanded, setLearningExpanded] = useState(true);
  const pathname = usePathname();

  // Check if the current path is in a specific section
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-9 w-9", className)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96 p-0 max-w-[85vw]">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>
            Navigate through the dashboard sections
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full bg-gradient-to-b from-background via-background/95 to-background/90 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800/90">
          <div className="flex flex-col space-y-4 p-6">
            {/* Logo Section - Clean and centered like auth screens */}
            <div className="flex items-center justify-center pb-6 border-b border-border/30">
              <div className="w-44 h-16 sm:w-48 sm:h-20 md:w-52 md:h-24 flex items-center justify-center">
                <ThemeAwareLogo
                  width={180}
                  height={70}
                  className="drop-shadow-sm"
                />
              </div>
            </div>

            {/* Batch Name */}
            {/* <div className="text-foreground/80 font-medium px-3 py-2 bg-muted/60 dark:bg-slate-800/60 rounded-md shadow-inner text-center text-sm border border-border/20">
              Batch Name
            </div> */}

            {/* Home section */}
            <div className="space-y-2">
              <button
                onClick={() => setHomeExpanded(!homeExpanded)}
                className="flex items-center justify-between w-full text-foreground font-medium cursor-pointer bg-muted/40 dark:bg-slate-800/40 rounded-md px-3 py-2 hover:bg-muted/60 dark:hover:bg-slate-700/60 transition-colors duration-200 text-sm border border-border/20"
              >
                <span>Home</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${homeExpanded ? 'rotate-180' : ''} text-muted-foreground`}
                />
              </button>

              {homeExpanded && (
                <div className="pl-4 space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300",
                      pathname === '/dashboard'
                        ? 'bg-primary text-white shadow-md'
                        : 'hover:bg-muted/50 dark:hover:bg-slate-700/50 text-foreground hover:text-primary'
                    )}
                  >
                    <div
                      className={cn(
                        "p-1.5 rounded-md transition-colors duration-300",
                        pathname === '/dashboard' ? 'bg-white/20' : 'bg-primary/10'
                      )}
                    >
                      <Image
                        src="/icons/dashboard-icon.svg"
                        alt="Dashboard"
                        width={18}
                        height={18}
                        className={pathname === '/dashboard' ? 'dashboard-icon-active' : 'dashboard-icon-inactive'}
                      />
                    </div>
                    <span className="font-medium text-sm">
                      {pathname === '/dashboard' && '→'} Dashboard
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Learning Path section */}
            <div className="space-y-2">
              <button
                onClick={() => setLearningExpanded(!learningExpanded)}
                className="flex items-center justify-between w-full text-foreground font-medium cursor-pointer bg-muted/40 dark:bg-slate-800/40 rounded-md px-3 py-2 hover:bg-muted/60 dark:hover:bg-slate-700/60 transition-colors duration-200 text-sm border border-border/20"
              >
                <span>Learning Path</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${learningExpanded ? 'rotate-180' : ''} text-muted-foreground`}
                />
              </button>

              {learningExpanded && (
                <div className="pl-4 space-y-1">
                  {[
                    { href: '/dashboard/sessions', label: 'Sessions', icon: '/icons/quiz-icon.svg' },
                    { href: '/dashboard/live-poll', label: 'Live Poll', icon: '/icons/live-poll-icon.svg' },
                    { href: '/dashboard/contents', label: 'Contents', icon: '/icons/content-icon.svg' },
                    { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: '/icons/leaderboard-icon.svg' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300",
                        isActive(item.href)
                          ? 'bg-primary text-white shadow-md'
                          : 'hover:bg-muted/50 dark:hover:bg-slate-700/50 text-foreground hover:text-primary'
                      )}
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded-md transition-colors duration-300",
                          isActive(item.href) ? 'bg-white/20' : 'bg-primary/10'
                        )}
                      >
                        <Image
                          src={item.icon}
                          alt={item.label}
                          width={18}
                          height={18}
                          className={isActive(item.href) ? 'brightness-200' : ''}
                        />
                      </div>
                      <span className="font-medium text-sm">
                        {isActive(item.href) && '→'} {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
