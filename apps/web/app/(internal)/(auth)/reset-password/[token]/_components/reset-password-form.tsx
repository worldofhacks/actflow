'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/lib/service/authService';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent) {
    try {
      event.preventDefault();
      setError(null);
      const passwordSchema = z.string().min(8).max(20);
      if (!password || !passwordSchema.safeParse(password).success) {
        setError('Password is invalid!');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match!');
        return;
      }
      setIsLoading(true);

      // The token is now available directly as a prop
      const response = await resetPassword({
        token,
        password,
      });
      if (response.success && response.data?._id) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.push('/');
        }, 2000);
      } else setError('Failed to reset password');
    } catch (error) {
      setError('Failed to reset password');
      console.error('Error resetting password:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect="off"
              disabled={isLoading}
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError(null);
              }}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect="off"
              disabled={isLoading}
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
            />
          </div>
          <Button disabled={isLoading || success}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password
          </Button>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        {success && <p className="text-sm text-green-500 mt-2">Password reset successfully!</p>}
      </form>
    </div>
  );
}
