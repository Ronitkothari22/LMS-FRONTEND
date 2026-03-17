'use client';

import { BellIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/auth';
import { getUserNameFromToken, generateUserInitials } from '@/lib/utils/token';

interface HeaderProps {
  className?: string;
}

export function DashboardHeader({ className }: HeaderProps) {
  const { data: user } = useUser();

  // Get user name from token as a fallback
  const tokenName = getUserNameFromToken();

  // Get user name and initials - use token name as fallback
  const userName = user?.name || tokenName || 'User';

  // Generate user initials from name
  const userInitials = generateUserInitials(userName);

  return (
    <header
      className={`flex justify-between items-center p-3 sm:p-4 md:px-6 border-b w-full bg-white ${className}`}
    >
      <div className="pl-0 lg:pl-0">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="rounded-full">
            <BellIcon className="h-6 w-6 text-gray-700" />
          </Button>
          {/* Notification indicator */}
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
        </div>

        {/* User Profile */}
        <div className="h-10 w-10 min-h-10 min-w-10 rounded-full bg-[#14C8C8] flex items-center justify-center text-white aspect-square">
          <span className="font-medium text-sm leading-none">{userInitials}</span>
        </div>
      </div>
    </header>
  );
}
