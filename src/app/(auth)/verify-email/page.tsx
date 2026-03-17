'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/global/theme-toggle';
import { GeistSans } from 'geist/font/sans';
import AuthLayout from '@/components/auth/auth-layout';
import { useVerifyEmail } from '@/hooks/auth';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  // Redirect to login if no email is provided
  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyEmail = useVerifyEmail();

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  const handleChange = (index: number, value: string) => {
    // Handle pasted content
    if (value.length > 1) {
      // Remove any non-numeric characters
      const numericValue = value.replace(/\D/g, '');

      // Take only first 6 digits
      const digits = numericValue.slice(0, 6).split('');

      // Fill the OTP array with the digits
      const newOtp = [...otp];
      digits.forEach((digit, idx) => {
        if (idx < 6) {
          newOtp[idx] = digit;
        }
      });

      setOtp(newOtp);

      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();

      return;
    }

    // Handle single digit input
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numericValue = pastedData.replace(/\D/g, '');
    const digits = numericValue.slice(0, 6).split('');

    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < 6) {
        newOtp[idx] = digit;
      }
    });

    setOtp(newOtp);

    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const otpValue = otp.join('');

    // Validate OTP format
    if (otpValue.length !== 6 || !/^\d+$/.test(otpValue)) {
      alert('Please enter a valid 6-digit code');
      return;
    }

    try {
      console.log('Submitting verification code:', { email, otp: otpValue });
      await verifyEmail.mutateAsync({ email, otp: otpValue });
    } catch (error) {
      console.error('Error verifying email:', error);
      // Most error handling is done in the auth.ts file
    }
  };

  if (!email) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <AuthLayout>
      <div className="w-full space-y-6 px-4 sm:px-6">
        {/* Theme toggle in top right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Verify Email form */}
        <div className="space-y-2 text-center">
          <h1
            className={`text-[28px] sm:text-[35px] font-semibold tracking-[-0.025em] text-foreground ${GeistSans.className}`}
          >
            Check your email for a code
          </h1>
          <p className="text-[16px] sm:text-[20px] text-muted-foreground font-light">
            We&apos;ve sent a 6-digit code to {email}. Enter it soon before it
            expires.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP Input */}
          <div className="flex justify-center gap-2 sm:gap-[19px]">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={index === 0 ? 6 : 1}
                className="w-[45px] h-[45px] sm:w-[86px] sm:h-[88px] text-center text-[18px] sm:text-[24px] font-semibold bg-background border-2 border-input focus:border-[#5644EE] focus:ring-0 outline-none rounded-none"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                required
              />
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-[45px] sm:h-[52px] text-[16px] sm:text-[20px] font-semibold bg-[#5644EE] hover:bg-[#4935E8] text-white"
            disabled={verifyEmail.isPending || otp.some((digit) => !digit)}
          >
            {verifyEmail.isPending ? 'Verifying...' : 'Submit'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
