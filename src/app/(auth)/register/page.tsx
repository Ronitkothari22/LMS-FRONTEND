'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/global/theme-toggle';
import { GeistSans } from 'geist/font/sans';
import AuthLayout from '@/components/auth/auth-layout';
import { useSignup } from '@/hooks/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const signup = useSignup();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      // Remove confirmPassword from the data sent to the API
      const { confirmPassword: _, ...signupData } = data;
      void _;

      console.log('Submitting signup data:', signupData);

      // Make sure the data matches the expected format on the backend
      const formattedData = {
        name: signupData.name.trim(),
        email: signupData.email.trim().toLowerCase(),
        password: signupData.password,
      };

      await signup.mutateAsync(formattedData);
    } catch (error) {
      console.error('Error in register form submission:', error);
      // Additional error handling if needed, but most is done in auth.ts and hooks
    }
  };

  return (
    <AuthLayout>
      <div className="w-full space-y-6">
        {/* Theme toggle in top right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Register form */}
        <div className="space-y-2 text-center">
          <h1
            className={`text-[35px] font-semibold tracking-[-0.025em] text-foreground ${GeistSans.className}`}
          >
            Create Account
          </h1>
          <p className="text-[20px] text-muted-foreground font-light">
            Enter your details below to create your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Social Buttons */}
          {/* <div className="grid grid-cols-2 gap-[19px]">
            <Button
              type="button"
              variant="outline"
              className="w-full h-[52px] text-[20px] font-semibold"
            >
              <GithubIcon className="mr-3 h-5 w-5" />
              Github
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-[52px] text-[20px] font-semibold"
            >
              <FcGoogle className="mr-3 h-5 w-5" />
              Google
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-[17px] text-muted-foreground font-light">
                OR CONTINUE WITH
              </span>
            </div>
          </div> */}

          {/* Name Input */}
          <div className="space-y-3">
            <label className="text-[20px] font-semibold text-foreground">
              Name
            </label>
            <Input
              type="text"
              placeholder="John Doe"
              className="h-[52px] bg-secondary text-[20px] font-light"
              {...register('name')}
              aria-invalid={errors.name ? 'true' : 'false'}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email Input */}
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

          {/* Password Input */}
          <div className="space-y-3">
            <label className="text-[20px] font-semibold text-foreground">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                className="h-[52px] bg-secondary text-[20px] font-light pr-12"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-[52px] w-12 px-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-3">
            <label className="text-[20px] font-semibold text-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                className="h-[52px] bg-secondary text-[20px] font-light pr-12"
                {...register('confirmPassword')}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-[52px] w-12 px-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
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
            disabled={isSubmitting || signup.isPending}
          >
            {isSubmitting || signup.isPending
              ? 'Creating account...'
              : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-[20px] text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-foreground font-semibold hover:text-primary"
          >
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
