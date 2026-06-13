import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerUser } from '@/lib/service/authService';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Lock, Mail, User, Wallet } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Define schemas for login and signup forms
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z
  .object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
    termsAccepted: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

type AuthMode = 'login' | 'signup';

const AuthDialogForm = ({
  open,
  onOpenChange,
  mode,
  setMode,
  onWalletLogin,
  errorFromServer,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onWalletLogin: () => Promise<void>;
  errorFromServer?: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const referrer = searchParams.get('referrer');
  const [error, setError] = useState(errorFromServer);

  const router = useRouter();

  // Setup form for login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Setup form for signup
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  // Reset error when switching modes
  useEffect(() => {
    setError('');
    loginForm.reset();
    signupForm.reset();
  }, [mode, loginForm, signupForm]);

  useEffect(() => {
    const showSignUp = searchParams.get('signup') === 'true';
    const showLogin = searchParams.get('login') === 'true';
    if (showSignUp || showLogin) {
      setMode(showSignUp ? 'signup' : 'login');
    }
  }, [setMode, searchParams]);

  const handleEmailLogin = async (data: LoginFormValues) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (response?.error) {
        // Parse the error JSON if possible to get the detailed message
        try {
          const errorData = JSON.parse(response.error);
          setError(errorData.message || 'Login failed');
        } catch {
          // If not JSON, use the error directly
          setError(response.error);
        }
      } else if (response?.ok) {
        // Successful login
        if (onOpenChange) {
          onOpenChange(false);
        }
        router.push('/discover');
      }
    } catch (error) {
      setError('An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (data: SignupFormValues) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await registerUser({
        username: data.name,
        name: data.name,
        email: data.email,
        password: data.password,
        ...(referrer && { referrer }),
      });
      if (!response.success) {
        setError(response.error);
        return;
      }

      await signIn('credentials', {
        email: data.email,
        password: data.password,
        callbackUrl: '/verify',
      });
    } catch (error) {
      console.error(error);
      setError('Registration failed, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = (open: boolean) => {
    console.log('handleModalClose', open);
    // if the modal is closed, remove the signup and login params
    // from the url to open the modal again
    if (open === false) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('signup');
      newSearchParams.delete('login');
      router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
    }
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-[600px]">
        <DialogTitle>{mode === 'login' ? 'Welcome back!' : 'Create your account'}</DialogTitle>
        <DialogDescription>
          {mode === 'login'
            ? 'Sign in to your account to continue'
            : 'Join the future of creator collaboration'}
        </DialogDescription>

        {/* Wallet Login Button */}
        <div className="w-full space-y-3 mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onWalletLogin}
            className="w-full h-11"
            disabled={isLoading}
          >
            <span className="flex items-center justify-center">
              <Wallet className="h-5 w-5 mr-2" />
              Continue with Wallet
            </span>
          </Button>
        </div>

        <div className="relative w-full my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2A2438]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2  text-gray-400">Or continue with email</span>
          </div>
        </div>

        {mode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="w-full space-y-4">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 z-10 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  className="block w-full pl-10 pr-3"
                  placeholder="you@example.com"
                  {...loginForm.register('email')}
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 z-10 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type="password"
                  className="block w-full pl-10 pr-3"
                  placeholder="••••••••"
                  {...loginForm.register('password')}
                />
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id="remember-me"
                  className="h-4 w-4 bg-act-surface border-[#2A2438] rounded focus:ring-act-2-purple text-act-2-purple-light"
                  {...loginForm.register('rememberMe')}
                />
                <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </Label>
              </div>
              <Link
                href="/forgot-password?login=false"
                className="text-sm text-act-2-purple hover:text-act-2-purple-light"
              >
                Forgot password?
              </Link>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              <span className="flex items-center justify-center">
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Button>

            <p className="text-center text-sm text-gray-400 mt-6">
              Don&apos;t have an account?{' '}
              <Button
                type="button"
                variant="link"
                onClick={() => setMode('signup')}
                className="text-act-2-purple hover:text-act-2-purple-light p-0"
                disabled={isLoading}
              >
                Sign up
              </Button>
            </p>
          </form>
        ) : (
          <form onSubmit={signupForm.handleSubmit(handleEmailSignup)} className="w-full space-y-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 z-10 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="name"
                  type="text"
                  className="block w-full pl-10 pr-3"
                  placeholder="John Doe"
                  {...signupForm.register('name')}
                />
              </div>
              {signupForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {signupForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 z-10 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  className="block w-full pl-10 pr-3"
                  placeholder="you@example.com"
                  {...signupForm.register('email')}
                />
              </div>
              {signupForm.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 z-10 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type="password"
                  className="block w-full pl-10 pr-3"
                  placeholder="••••••••"
                  {...signupForm.register('password')}
                />
              </div>
              {signupForm.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {signupForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 z-10 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="block w-full pl-10 pr-3"
                  placeholder="••••••••"
                  {...signupForm.register('confirmPassword')}
                />
              </div>
              {signupForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {signupForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <Checkbox
                id="terms"
                onCheckedChange={() => {
                  signupForm.setValue('termsAccepted', !signupForm.getValues('termsAccepted'));
                }}
                className="h-4 w-4 bg-act-surface border-[#2A2438] rounded focus:ring-act-2-purple text-act-2-purple-light"
                {...signupForm.register('termsAccepted')}
              />
              <Label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
                I agree to the{' '}
                <Link
                  href="/terms?login=false"
                  className="text-act-2-purple hover:text-act-2-purple-light"
                >
                  Terms
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy?login=false"
                  className="text-act-2-purple hover:text-act-2-purple-light"
                >
                  Privacy Policy
                </Link>
              </Label>
            </div>
            {signupForm.formState.errors.termsAccepted && (
              <p className="text-red-500 text-sm">
                {signupForm.formState.errors.termsAccepted.message}
              </p>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              <span className="flex items-center justify-center">
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Button>

            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <Button
                type="button"
                variant="link"
                onClick={() => setMode('login')}
                className="text-act-2-purple hover:text-act-2-purple-light font-medium p-0"
                disabled={isLoading}
              >
                Sign in
              </Button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialogForm;
