'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you are looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This could be due to a mistyped URL or a broken link. If you were
            trying to access a session, please try going back to the sessions
            page and selecting it again.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            className="w-full sm:w-auto"
            onClick={() => router.push('/dashboard/sessions')}
          >
            Go to Sessions
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
