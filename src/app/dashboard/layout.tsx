'use client';

import { SiteHeader } from '@/components/site-header';
// import { SiteFooter } from '@/components/site-footer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DashboardSidebar } from '@/components/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCookie } from 'cookies-next';
import { useUser } from '@/hooks/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is authenticated on the client side
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = getCookie('accessToken');
      
      if (!accessToken) {
        console.log('No access token found, redirecting to login');
        router.push('/login');
        return;
      }

      // If we have a token but no user data yet, wait a bit more
      if (accessToken && !user && isLoading) {
        console.log('Token exists but user data is loading, waiting...');
        return;
      }

      // If we have a token but no user data after loading, redirect
      if (accessToken && !user && !isLoading) {
        console.log('Token exists but no user data, redirecting to login');
        router.push('/login');
        return;
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [router, user, isLoading]);

  // Show loading state while checking authentication
  if (isCheckingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, don't render the dashboard
  if (!user) {
    return null; // This will trigger the redirect in useEffect
  }

  return (
    <div className="relative min-h-screen">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <DashboardSidebar />
          <div className="flex flex-col flex-1 w-full min-w-0">
            <SiteHeader />
            <main className="flex-1 bg-muted/40 w-full">
              <ScrollArea className="h-[calc(100vh-4rem)]">
                <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
                  {children}
                </div>
              </ScrollArea>
            </main>
            {/* <SiteFooter /> */}
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
