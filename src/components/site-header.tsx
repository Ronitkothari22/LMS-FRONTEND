'use client';

import { ExitIcon } from '@radix-ui/react-icons';
import { useLogout, useUser } from '@/hooks/auth';
import { getUserNameFromToken, generateUserInitials } from '@/lib/utils/token';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export function SiteHeader() {
  const logout = useLogout();
  const { data: user } = useUser();
  const [storedUserData, setStoredUserData] = useState<{ name?: string } | null>(null);
  const { theme, setTheme } = useTheme();

  // Get user name from token as a fallback
  const tokenName = getUserNameFromToken();

  // Get user data from local storage on client side only
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      setStoredUserData(JSON.parse(userData));
    }
  }, []);

  // Get user name and initials - use token name or stored data as fallback
  // Ensure we always have a consistent name that won't disappear
  const userName =
    user?.name && user.name !== 'user'
      ? user.name
      : storedUserData?.name && storedUserData.name !== 'user'
        ? storedUserData.name
        : tokenName;

  // Generate user initials from name
  const userInitials = generateUserInitials(userName || 'User');

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="flex h-16 items-center px-3 sm:px-6 w-full">
        {/* Mobile hamburger menu */}
        <div className="flex items-center gap-3 md:hidden">
          <MobileNav />
        </div>

        {/* Spacer to push user dropdown to the right */}
        <div className="flex-1"></div>

        {/* Right side - User dropdown menu */}
        <div className="flex items-center">
          {/* User dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-1 sm:gap-2 p-1 px-1 sm:px-2 h-auto"
              >
                <div className="h-8 w-8 min-h-8 min-w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm aspect-square">
                  <span className="font-medium text-sm leading-none">{userInitials}</span>
                </div>
                <span className="hidden lg:inline text-sm font-medium">{userName}</span>
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem> */}
              {/* <DropdownMenuSeparator /> */}

              {/* Theme Toggle Section */}
              <DropdownMenuLabel className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Theme
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setTheme('light')}
                className={`${theme === 'light' ? 'bg-primary/10 text-primary' : ''}`}
              >
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
                {theme === 'light' && (
                  <div className="ml-auto h-2 w-2 bg-primary rounded-full"></div>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('dark')}
                className={`${theme === 'dark' ? 'bg-primary/10 text-primary' : ''}`}
              >
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
                {theme === 'dark' && (
                  <div className="ml-auto h-2 w-2 bg-primary rounded-full"></div>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('system')}
                className={`${theme === 'system' ? 'bg-primary/10 text-primary' : ''}`}
              >
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
                {theme === 'system' && (
                  <div className="ml-auto h-2 w-2 bg-primary rounded-full"></div>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-500 focus:text-red-500"
              >
                <ExitIcon className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
