import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@medichainlk/ui';

/**
 * Custom 404. Intentionally sparse — we don't want to reveal neighbouring
 * routes or internal naming to anyone probing the URL space.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground font-bold">
              404
            </div>
            <CardTitle className="text-xl">Page not found</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist, or has been moved.
          </p>

          <div className="flex gap-2 pt-2">
            <Button asChild variant="default" className="flex-1">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
