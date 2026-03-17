import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built by{' '}
          <Link href="/" className="font-medium underline underline-offset-4">
            JoiningDots
          </Link>
          . All rights reserved.
        </p>
      </div>
    </footer>
  );
}
