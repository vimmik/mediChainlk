'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase';
import { Button, Label } from '@medichainlk/ui';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const auth = getFirebaseAuth();
    if (auth) {
      // Always show success — don't reveal whether email exists
      await sendPasswordResetEmail(auth, data.email).catch(() => null);
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg px-4 py-12">
      <div className="glass-card rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <h1 className="text-lg font-bold gradient-text leading-tight">MediChainLK</h1>
        </div>

        {submitted ? (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Check your inbox</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
                If an account exists for that email, a password reset link has been sent.
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full rounded-xl gap-2 mt-2">
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">Reset Password</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Enter your email and we&apos;ll send a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-600 dark:text-slate-400 text-xs">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@pharmacy.lk"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    className="login-input pl-10 w-full"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl font-semibold h-11 transition-all duration-200 glow-blue mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>

              <div className="text-center pt-1">
                <Link
                  href="/login"
                  className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to sign in
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
