'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword } from '@/lib/service/authService';
import { useState } from 'react';
import { z } from 'zod';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  async function onSubmit(event: React.FormEvent) {
    try {
      event.preventDefault();
      setError(null);
      // check if email is valid
      const emailSchema = z.string().email();
      if (!email || !emailSchema.safeParse(email).success) {
        setError('Email is invalid!');
        return;
      }
      setIsLoading(true);
      const response = await forgotPassword({ email });
      if (response.success) {
        setSuccess(true);
      } else {
        setError('Failed to send email!');
      }
    } catch (error) {
      setError('Failed to send email!');
      console.error('Error sending email', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError(null);
              }}
            />
          </div>
          <Button disabled={isLoading || success}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        {success && <p className="text-sm text-green-500 mt-2">Email sent!</p>}
      </form>
    </div>
  );
}
