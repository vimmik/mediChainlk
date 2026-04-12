'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@medichainlk/ui';

/**
 * 403 — Access denied.
 *
 * The Next.js middleware redirects here whenever a signed-in user tries to
 * reach a route their role + permissions don't cover. Each arrival is already
 * reported to /auth/session/violation; five within an hour locks the account.
 *
 * We show *why* (which permission is needed) so legitimate users can ask
 * the right question of their administrator — but we never disclose what
 * else the system contains.
 */
function UnauthorizedBody() {
  const params = useSearchParams();
  const attemptedPath = params.get('path');
  const requiredPermission = params.get('need');

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive font-bold">
            403
          </div>
          <CardTitle className="text-xl">Access denied</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your account does not have permission to view this page.
        </p>

        {attemptedPath && (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
            <div className="text-muted-foreground">Attempted</div>
            <div className="font-mono truncate" title={attemptedPath}>
              {attemptedPath}
            </div>
            {requiredPermission && (
              <>
                <div className="mt-2 text-muted-foreground">Required permission</div>
                <div className="font-mono">{requiredPermission}</div>
              </>
            )}
          </div>
        )}

        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          Repeated unauthorized access attempts will lock your account for one hour.
        </div>

        <div className="flex gap-2 pt-2">
          <Button asChild variant="default" className="flex-1">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/login">Sign in as another user</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<Card className="w-full max-w-md h-64 animate-pulse" />}>
        <UnauthorizedBody />
      </Suspense>
    </div>
  );
}
