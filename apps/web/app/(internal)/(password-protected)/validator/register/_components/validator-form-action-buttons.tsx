'use client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { createValidator } from '@/lib/service/validatorService';
import { useRouter } from 'next/navigation';
import { useFormContext } from 'react-hook-form';
import { ValidatorFormValues } from './validator-form-wrapper';

export const ValidatorActionButtons = () => {
  const form = useFormContext<ValidatorFormValues>();
  const router = useRouter();

  const onSubmit = async (data: ValidatorFormValues) => {
    try {
      const validatorData = {
        metadata: data.description,
        fromWallet: data.fromWallet,
        topics: data.topics,
        expireAtTs: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
      };

      const response = await createValidator(validatorData);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Your validator profile has been created.',
        });

        router.push('/board');
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create validator profile.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating validator:', error);
      toast({
        title: 'Error',
        description: 'Failed to create validator profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex gap-x-2 items-center ">
      <Button variant="outline" onClick={() => router.back()}>
        Cancel
      </Button>
      <div className="flex space-x-2">
        <Button type="button" onClick={form.handleSubmit(onSubmit)}>
          Register as Validator
        </Button>
      </div>
    </div>
  );
};
