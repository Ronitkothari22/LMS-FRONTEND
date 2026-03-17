import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          401 - Unauthorized
        </h1>
        <p className="text-center text-gray-600">
          Please log in to access this page.
        </p>
        <div className="flex flex-col space-y-4">
          <Button asChild className="w-full bg-[#14C8C8] hover:bg-[#0ea0a0]">
            <Link href="/login">Log In</Link>
          </Button>
          <p className="text-sm text-center text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#14C8C8] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
