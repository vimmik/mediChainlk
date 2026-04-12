'use client';

import { getFirebaseAuth } from '@/lib/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Label } from '@medichainlk/ui';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Eye, EyeOff, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
        /* backend unreachable â€” stay on login */
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

      const tokenResult = await credential.user.getIdTokenResult(true);
      const role = tokenResult.claims['role'];
      if (role !== 'system_admin' && role !== 'pharmacy_admin') {
        await signOut(auth);
        setServerError('Access denied. This portal is for system and pharmacy administrators only.');
        return;
      }

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
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@pharmacy.lk"
          {...register('email')}
          aria-invalid={!!errors.email}
          className="login-input"
        />
        {errors.email && (
          <p className="text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            {...register('password')}
            aria-invalid={!!errors.password}
            className="login-input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            tabIndex={-1}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-red-400 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 rounded-xl font-semibold text-sm text-white
          bg-linear-to-r from-blue-500 to-blue-600
          hover:from-blue-400 hover:to-blue-500
          disabled:opacity-60 disabled:cursor-not-allowed
          transition-all duration-200 glow-blue mt-2"
      >
        {isSubmitting ? 'Signing inâ€¦' : 'Sign in'}
      </button>

      <div className="text-center pt-1">
        <Link
          href="/forgot-password"
          className="text-xs text-slate-500 hover:text-slate-300 underline-offset-4 hover:underline transition-colors"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}

function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg">
      <div className="glass-card rounded-2xl p-8 max-w-sm w-full mx-4">
        <h2 className="text-lg font-bold text-slate-100 mb-3">Configuration Error</h2>
        <p className="text-sm text-red-400">
          reCAPTCHA site key is not configured. Set{' '}
          <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded font-mono">
            NEXT_PUBLIC_RECAPTCHA_SITE_KEY
          </code>{' '}
          in .env.local and restart the dev server.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    return <ConfigError />;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{ async: true, defer: true, appendTo: 'head' }}
    >
      <div className="min-h-screen flex items-center justify-center mesh-bg px-4 py-12">
        {/* Glass card panel */}
        <div className="glass-card rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl badge-blue flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text leading-tight">MediChainLK</h1>
              <p className="text-[11px] text-slate-500 leading-tight">Admin Portal</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-100">Welcome back</h2>
            <p className="text-xs text-slate-500 mt-1">Sign in to your administrator account</p>
          </div>

          <Suspense fallback={<div className="h-48 animate-pulse bg-white/5 rounded-xl" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </GoogleReCaptchaProvider>
  );
}
