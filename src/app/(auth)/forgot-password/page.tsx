'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ThemeToggle } from '@/components/global/theme-toggle';
import { GeistSans } from 'geist/font/sans';
import AuthLayout from '@/components/auth/auth-layout';
import { useRequestPasswordReset } from '@/hooks/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { RequestPasswordResetRequest } from '@/types/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const requestPasswordReset = useRequestPasswordReset();
  const [successMessage, setSuccessMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      // Ensure email is treated as required by TypeScript
      const requestData: RequestPasswordResetRequest = {
        email: data.email,
      };
      const response = await requestPasswordReset.mutateAsync(requestData);
      if (response.success) {
        setSuccessMessage(response.message);
      } else {
        console.error('Failed to send reset link:', response.message);
      }
    } catch (error) {
      console.error('Error sending reset link:', error);
      setSuccessMessage(
        'An error occurred while sending the reset link. Please try again.'
      );
    }
  };

  return (
    <AuthLayout>
      <div className="w-full space-y-6 px-4 sm:px-6">
        {/* Theme toggle in top right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Forgot Password form */}
        <div className="space-y-2 text-center">
          <h1
            className={`text-[28px] sm:text-[35px] font-semibold tracking-[-0.025em] text-foreground ${GeistSans.className}`}
          >
            Forgot Password?
          </h1>
          <p className="text-[16px] sm:text-[20px] text-muted-foreground font-light">
            Enter your email and we&apos;ll send you a code to reset your
            password
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <label className="text-[20px] font-semibold text-foreground">
              Email
            </label>
            <Input
              type="email"
              placeholder="name@company.com"
              className="h-[52px] bg-secondary text-[20px] font-light"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-[45px] sm:h-[52px] text-[16px] sm:text-[20px] font-semibold bg-[#5644EE] hover:bg-[#4935E8] text-white"
            disabled={isSubmitting || requestPasswordReset.isPending}
          >
            {isSubmitting || requestPasswordReset.isPending
              ? 'Sending...'
              : 'Send Reset OTP'}
          </Button>
        </form>

        {successMessage && (
          <p className="text-center text-green-500">{successMessage}</p>
        )}

        <p className="text-center text-[20px] text-muted-foreground">
          Remember your password?{' '}
          <Link
            href="/login"
            className="text-foreground font-semibold hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
