'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';
import { resendVerificationEmail, verifyEmail } from '@/lib/service/authService';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Define the form schema with Zod
const formSchema = z.object({
  code: z.string().min(6, { message: 'Verification code must be 6 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

export function VerifyEmailForm({ email }: { email: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [resendTime, setResendTime] = useState(0);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
    },
  });

  const onResendEmail = async () => {
    if (resendTime > 0) return; // Prevent multiple requests

    setResendTime(60); // Set timer to 60 seconds (1 minute)
    console.log('resending email');
    const response = await resendVerificationEmail(email);
    if (response?.success) {
      toast({
        title: 'Email sent!',
        description: 'Please check your email for the verification code.',
      });
    } else {
      toast({
        title: 'Failed to send email!',
        description: response?.error ? response.error : 'Failed to send email!',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (resendTime > 0) {
      interval = setInterval(() => {
        setResendTime(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTime]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const response = await verifyEmail(email, data.code);

      if (response?.success) {
        toast({
          title: 'Profile completed!',
          description: 'You can now start using ACT Flow AI.',
        });
        router.push('/discover');
      } else {
        toast({
          title: 'Failed to verify email!',
          description: response?.error ? response.error : 'Failed to verify email!',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying email', error);
      toast({
        title: 'Failed to verify email!',
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
        <CardTitle>Verify email</CardTitle>
        <CardDescription>Please enter the code sent to {email}</CardDescription>
      </CardHeader>
      <CardContent className="gap-4 flex flex-col">
        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputOTP className="w-full" maxLength={6} {...field}>
                      <InputOTPGroup className="w-full justify-center flex ">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot className="size-16" key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}Verify email
            </Button>
          </form>
        </Form>

        <p className="text-sm text-gray-500">
          Didn&apos;t receive an email?{' '}
          <Button
            type="button"
            className="p-0"
            size="sm"
            variant="link"
            onClick={onResendEmail}
            disabled={resendTime > 0}
          >
            {resendTime > 0 ? `Resend in ${resendTime}s` : 'Resend email'}
          </Button>
        </p>
      </CardContent>
    </Card>
  );
}
