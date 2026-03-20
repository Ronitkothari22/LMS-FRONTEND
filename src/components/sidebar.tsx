'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Users, BarChart3, Route } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClientOnly } from '@/components/client-only';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';

interface SidebarProps {
  className?: string;
}

function DashboardSidebarContent({ className }: SidebarProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Check if the current path is in a specific section
  const isActive = (path: string) => {
    // For dashboard, only match exact path to fix highlighting issue
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    // For other paths, check if the pathname starts with the path
    return pathname.startsWith(path);
  };

  return (
    <Sidebar
      className={cn(
        'border-r border-border/50 bg-gradient-to-b from-background via-background/95 to-background/90 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800/90 z-40 w-64 min-w-64 flex-shrink-0 shadow-xl dark:shadow-2xl backdrop-blur-sm',
        className
      )}
      collapsible={isMobile ? 'offcanvas' : 'none'}
    >
        <div className="p-0 h-full">
          <div className="flex flex-col h-full">
            {/* Header Section */}
            <div className="p-6 border-b border-border/30">
              {/* Logo */}
              <div className="flex items-center justify-center">
                <ThemeAwareLogo
                  width={250}
                  height={120}
                  className=""
                />
              </div>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 p-4">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-2">
                    {/* Dashboard */}
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/dashboard'}
                        className={`${
                          pathname === '/dashboard'
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg border border-primary/50'
                            : 'hover:bg-muted/50 dark:hover:bg-slate-700/50 text-foreground/80 hover:text-foreground bg-muted/20 dark:bg-slate-800/20 border border-border/30 hover:border-primary/30'
                        } rounded-xl py-3 transition-all duration-300 hover:shadow-md`}
                      >
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-4"
                        >
                          <div
                            className={`${pathname === '/dashboard' ? 'bg-white/20 shadow-sm' : 'bg-primary/10 dark:bg-primary/20'} p-2 rounded-lg transition-all duration-300`}
                          >
                            <BarChart3
                              className={`h-4 w-4 ${
                                pathname === '/dashboard'
                                  ? 'text-white'
                                  : 'text-primary'
                              }`}
                            />
                          </div>
                          <span className="font-semibold text-sm">
                            Dashboard
                          </span>
                          {pathname === '/dashboard' && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Sessions */}
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive('/dashboard/sessions')}
                        className={`${
                          isActive('/dashboard/sessions')
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg border border-primary/50'
                            : 'hover:bg-muted/50 dark:hover:bg-slate-700/50 text-foreground/80 hover:text-foreground bg-muted/20 dark:bg-slate-800/20 border border-border/30 hover:border-primary/30'
                        } rounded-xl py-3 transition-all duration-300 hover:shadow-md`}
                      >
                        <Link
                          href="/dashboard/sessions"
                          className="flex items-center gap-3 px-4"
                        >
                          <div
                            className={`${isActive('/dashboard/sessions') ? 'bg-white/20 shadow-sm' : 'bg-primary/10 dark:bg-primary/20'} p-2 rounded-lg transition-all duration-300`}
                          >
                            <Users
                              className={`h-4 w-4 ${
                                isActive('/dashboard/sessions')
                                  ? 'text-white'
                                  : 'text-primary'
                              }`}
                            />
                          </div>
                          <span className="font-semibold text-sm">
                            Sessions
                          </span>
                          {isActive('/dashboard/sessions') && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* LMS */}
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive('/dashboard/lms')}
                        className={`${
                          isActive('/dashboard/lms')
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg border border-primary/50'
                            : 'hover:bg-muted/50 dark:hover:bg-slate-700/50 text-foreground/80 hover:text-foreground bg-muted/20 dark:bg-slate-800/20 border border-border/30 hover:border-primary/30'
                        } rounded-xl py-3 transition-all duration-300 hover:shadow-md`}
                      >
                        <Link
                          href="/dashboard/lms"
                          className="flex items-center gap-3 px-4"
                        >
                          <div
                            className={`${isActive('/dashboard/lms') ? 'bg-white/20 shadow-sm' : 'bg-primary/10 dark:bg-primary/20'} p-2 rounded-lg transition-all duration-300`}
                          >
                            <Route
                              className={`h-4 w-4 ${
                                isActive('/dashboard/lms')
                                  ? 'text-white'
                                  : 'text-primary'
                              }`}
                            />
                          </div>
                          <span className="font-semibold text-sm">
                            LMS
                          </span>
                          {isActive('/dashboard/lms') && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Live Poll */}
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive('/dashboard/live-poll')}
                        className={`${
                          isActive('/dashboard/live-poll')
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg border border-primary/50'
                            : 'hover:bg-muted/50 dark:hover:bg-slate-700/50 text-foreground/80 hover:text-foreground bg-muted/20 dark:bg-slate-800/20 border border-border/30 hover:border-primary/30'
                        } rounded-xl py-3 transition-all duration-300 hover:shadow-md`}
                      >
                        <Link
                          href="/dashboard/live-poll"
                          className="flex items-center gap-3 px-4"
                        >
                          <div
                            className={`${isActive('/dashboard/live-poll') ? 'bg-white/20 shadow-sm' : 'bg-primary/10 dark:bg-primary/20'} p-2 rounded-lg transition-all duration-300`}
                          >
                            <BarChart3
                              className={`h-4 w-4 ${
                                isActive('/dashboard/live-poll')
                                  ? 'text-white'
                                  : 'text-primary'
                              }`}
                            />
                          </div>
                          <span className="font-semibold text-sm">
                            Live Poll
                          </span>
                          {isActive('/dashboard/live-poll') && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>


                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>

            {/* Footer Section */}
            <div className="p-4 border-t border-border/30 bg-gradient-to-r from-muted/20 to-muted/10 dark:from-slate-800/20 dark:to-slate-700/10">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                  <span>Learning Platform</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Sidebar>
  );
}

export function DashboardSidebar({ className }: SidebarProps) {
  return (
    <ClientOnly
      fallback={
        <div className="border-r border-border/50 bg-gradient-to-b from-background via-background/95 to-background/90 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800/90 z-40 w-64 min-w-64 flex-shrink-0 shadow-xl dark:shadow-2xl backdrop-blur-sm">
          <div className="p-6 border-b border-border/30">
            <div className="flex items-center justify-center">
              <div className="h-30 w-30 bg-muted/60 dark:bg-slate-800/60 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      }
    >
      <DashboardSidebarContent className={className} />
    </ClientOnly>
  );
}

export { Sidebar };
