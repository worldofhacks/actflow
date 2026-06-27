'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSiweSignIn } from '@/hooks/use-siwe-sign-in';
import { toast } from '@/hooks/use-toast';
import { registerUserByWallet } from '@/lib/service/authService';
import { signWalletNonce } from '@/lib/wallet-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/dist/client/components/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAccount, useSignMessage } from 'wagmi';
import { z } from 'zod';

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type FormValues = z.infer<typeof formSchema>;

export function CompleteProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const referrer = searchParams.get('referrer');
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const siweSignIn = useSiweSignIn();

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!address) {
      toast({
        title: 'Wallet not connected!',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const username = data.name.toLowerCase().replace(/\s+/g, '');

      // SIWE: sign the backend's single-use nonce message; /auth/wallet/register
      // requires this signature (verified server-side against the issued nonce).
      const signature = await signWalletNonce(address, signMessageAsync);

      const response = await registerUserByWallet(
        address,
        signature,
        data.email,
        username,
        data.name,
        referrer ?? undefined,
      );

      if (response?.success && response.data?.access_token) {
        toast({
          title: 'Profile completed!',
          description: 'You can now start using ActFlow.',
        });
        // sign in user with a signed SIWE message after successful profile completion
        await siweSignIn(address, '/discover');
      } else {
        toast({
          title: 'Failed to complete profile!',
          description: response?.message ? response.message : 'Failed to complete profile!',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error completing profile', error);
      toast({
        title: 'Failed to complete profile!',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="gap-6">
      <CardHeader>
        <CardTitle>Complete Profile</CardTitle>
        <CardDescription>Complete your profile to start using ACT Flow AI.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="name">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Name"
                type="text"
                autoCapitalize="none"
                autoComplete="name"
                autoCorrect="off"
                disabled={isLoading}
                {...register('name', {
                  onChange: () => errors.name && clearErrors('name'),
                })}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
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
                {...register('email', {
                  onChange: () => errors.email && clearErrors('email'),
                })}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading}>
              <span className="flex items-center justify-center">
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}Complete
                Profile
              </span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
