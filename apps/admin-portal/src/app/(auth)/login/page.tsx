'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { getFirebaseAuth } from '@/lib/firebase';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@medichainlk/ui';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/user-not-found':        'Incorrect email or password.',
  'auth/wrong-password':        'Incorrect email or password.',
  'auth/invalid-credential':    'Incorrect email or password.',
  'auth/invalid-email':         'Incorrect email or password.',
  'auth/too-many-requests':     'Too many attempts. Please wait a few minutes and try again.',
  'auth/user-disabled':         'This account has been disabled. Contact your administrator.',
  'auth/network-request-failed':'Network error. Check your connection and try again.',
  'auth/api-key-not-valid':     'Authentication is misconfigured. Contact your administrator.',
  'auth/invalid-api-key':       'Authentication is misconfigured. Contact your administrator.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';
  const reason = searchParams.get('reason');
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Keep a ref to the latest executor so async waits see updated values.
  const executorRef = useRef(executeRecaptcha);
  useEffect(() => {
    executorRef.current = executeRecaptcha;
  }, [executeRecaptcha]);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(() => {
    if (reason === 'locked') {
      return 'Your account is temporarily locked due to repeated unauthorized access attempts. Try again in an hour or contact your administrator.';
    }
    return '';
  });

  // Safety net: if somehow the user lands on /login with a valid session
  // (e.g. middleware bypassed by a bug), redirect them to the dashboard.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { authenticated?: boolean };
        if (!cancelled && data.authenticated) {
          router.replace(redirectTo);
        }
      } catch {
        /* backend unreachable — stay on login */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, redirectTo]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // Wait up to `timeoutMs` for reCAPTCHA script to load; polls the ref.
  const waitForRecaptcha = async (timeoutMs = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (executorRef.current) return executorRef.current;
      await new Promise((r) => setTimeout(r, 100));
    }
    return null;
  };

  const onSubmit = async (data: LoginForm) => {
    setServerError('');

    const execute = await waitForRecaptcha();
    if (!execute) {
      setServerError('Security check could not load. Check your connection and refresh.');
      return;
    }

    let recaptchaToken: string;
    try {
      recaptchaToken = await execute('admin_login');
    } catch {
      setServerError('Security check failed. Please try again.');
      return;
    }
    if (!recaptchaToken) {
      setServerError('Security check failed. Please try again.');
      return;
    }

    // Server-side token verification before Firebase call
    try {
      const verifyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/recaptcha/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: recaptchaToken, action: 'admin_login' }),
        },
      );
      if (!verifyRes.ok) {
        setServerError('Bot verification failed. Please try again.');
        return;
      }
    } catch {
      setServerError('Could not reach verification server. Check your connection.');
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setServerError('Authentication service unavailable. Check your Firebase configuration.');
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);

      // Verify this is a system_admin or pharmacy_admin
      const tokenResult = await credential.user.getIdTokenResult(true);
      const role = tokenResult.claims['role'];
      if (role !== 'system_admin' && role !== 'pharmacy_admin') {
        await signOut(auth);
        setServerError('Access denied. This portal is for system and pharmacy administrators only.');
        return;
      }

      // Exchange the Firebase ID token for an HttpOnly session cookie set by our backend.
      // The backend verifies the token, stores session in Redis, and sets a cookie JS
      // cannot read — eliminating the XSS token-theft path.
      const idToken = await credential.user.getIdToken();
      const sessionRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/session`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        },
      );
      if (!sessionRes.ok) {
        await signOut(auth);
        setServerError('Could not establish session. Please try again.');
        return;
      }

      router.push(redirectTo);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setServerError(FIREBASE_ERRORS[code] ?? 'Sign in failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('password')}
            aria-invalid={!!errors.password}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg">Configuration error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">
              reCAPTCHA site key is not configured. Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY in .env.local and restart the dev server.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{ async: true, defer: true, appendTo: 'head' }}
    >
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">MediChainLK</CardTitle>
            <p className="text-sm text-muted-foreground">Sign in to your admin or pharmacy account</p>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-md" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </GoogleReCaptchaProvider>
  );
}
