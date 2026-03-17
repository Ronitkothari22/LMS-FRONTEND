'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/global/theme-toggle';
import { GeistSans } from 'geist/font/sans';
import AuthLayout from '@/components/auth/auth-layout';
import { useResetPassword } from '@/hooks/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const resetPassword = useResetPassword();
  const [successMessage, setSuccessMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!email) {
      console.error('Email is required for password reset.');
      return;
    }
    try {
      const response = await resetPassword.mutateAsync({
        email: email as string,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      if (response.message) {
        setSuccessMessage(response.message);
      }
    } catch {
      // Error handling is done in the auth.ts file
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="space-y-2 text-center">
        <h1
          className={`text-[35px] font-semibold tracking-[-0.025em] text-foreground ${GeistSans.className}`}
        >
          Reset Password
        </h1>
        <p className="text-[20px] text-muted-foreground font-light">
          Enter the OTP sent to your email and your new password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* OTP Input */}
        <div className="space-y-3">
          <label className="text-[20px] font-semibold text-foreground">
            OTP
          </label>
          <Input
            type="text"
            placeholder="Enter OTP"
            className="h-[52px] bg-secondary text-[20px] font-light"
            {...register('otp')}
            aria-invalid={errors.otp ? 'true' : 'false'}
          />
          {errors.otp && (
            <p className="text-sm text-red-500">{errors.otp.message}</p>
          )}
        </div>

        {/* New Password Input */}
        <div className="space-y-3">
          <label className="text-[20px] font-semibold text-foreground">
            New Password
          </label>
          <Input
            type="password"
            className="h-[52px] bg-secondary text-[20px] font-light"
            {...register('newPassword')}
            aria-invalid={errors.newPassword ? 'true' : 'false'}
          />
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirm Password Input */}
        <div className="space-y-3">
          <label className="text-[20px] font-semibold text-foreground">
            Confirm Password
          </label>
          <Input
            type="password"
            className="h-[52px] bg-secondary text-[20px] font-light"
            {...register('confirmPassword')}
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-[52px] text-[20px] font-semibold bg-[#5644EE] hover:bg-[#4935E8] text-white"
          disabled={isSubmitting || resetPassword.isPending}
        >
          {isSubmitting || resetPassword.isPending
            ? 'Resetting...'
            : 'Reset Password'}
        </Button>
      </form>

      {successMessage && (
        <p className="text-center text-green-500">{successMessage}</p>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
