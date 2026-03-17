import QueryProvider from '@/providers/query-provider';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import { Toaster } from 'sonner';
import { AuthExpiredHandler } from '@/components/auth/auth-expired-handler';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Joining Dots',
  description: 'Your Skills. Your Career. Your Growth.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          suppressHydrationWarning
        >
          <QueryProvider>
            <AuthExpiredHandler />
            {children}
          </QueryProvider>
        </ThemeProvider>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
