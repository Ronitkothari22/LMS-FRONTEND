'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/global/theme-toggle';
import { GeistSans } from 'geist/font/sans';
import AuthLayout from '@/components/auth/auth-layout';
import { useLogin } from '@/hooks/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // Format the data to ensure consistency
      const formattedData = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      console.log('Attempting login with email:', formattedData.email);
      await login.mutateAsync(formattedData);
    } catch (error) {
      console.error('Error in login form submission:', error);
      // Most error handling is done in the auth.ts file
    }
  };

  return (
    <AuthLayout>
      <div className="w-full space-y-6">
        {/* Theme toggle in top right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Login form */}
        <div className="space-y-2 text-center">
          <h1
            className={`text-[35px] font-semibold tracking-[-0.025em] text-foreground ${GeistSans.className}`}
          >
            Sign In
          </h1>
          <p className="text-[20px] text-muted-foreground font-light">
            Enter your email below to sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Social Buttons */}
          {/* <div className="grid grid-cols-2 gap-[19px]">
            <Button
              variant="outline"
              className="w-full h-[52px] text-[20px] font-semibold"
            >
              <GithubIcon className="mr-3 h-5 w-5" />
              Github
            </Button>
            <Button
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
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-[20px] text-muted-foreground hover:text-primary"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-[52px] text-[20px] font-semibold bg-[#5644EE] hover:bg-[#4935E8] text-white"
            disabled={isSubmitting || login.isPending}
          >
            {isSubmitting || login.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-[20px] text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-foreground font-semibold hover:text-primary"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
