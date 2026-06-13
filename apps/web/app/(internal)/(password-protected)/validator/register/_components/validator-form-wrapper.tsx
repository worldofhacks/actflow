'use client';
import { Wallet } from '@/types/user/wallet';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import * as z from 'zod';
import { ValidatorActionButtons } from './validator-form-action-buttons';
import { ValidatorFormControls } from './validator-form-controls';

interface ValidatorFormProps {
  wallets?: Wallet[];
  topics: string[];
}

const validatorFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  fromWallet: z.string().min(1, 'Wallet selection is required'),
  topics: z.array(z.string()).min(1, 'At least one topic is required'),
  minimumFee: z.string().min(1, 'Minimum fee is required'),
  visibility: z.enum(['public', 'private']).default('public'),
});

export type ValidatorFormValues = z.infer<typeof validatorFormSchema>;

const ValidatorForm = ({ wallets, topics }: ValidatorFormProps) => {
  const form = useForm<ValidatorFormValues>({
    resolver: zodResolver(validatorFormSchema),
    defaultValues: {
      name: '',
      description: '',
      fromWallet: '',
      topics: [],
      minimumFee: '10',
      visibility: 'public',
    },
  });

  return (
    <FormProvider {...form}>
      <div className="grid grid-cols-1 mt-4 lg:grid-cols-3 gap-4 w-full">
        <ValidatorFormControls wallets={wallets} topics={topics} />
        <div className="col-span-2 lg:col-span-3 mt-6">
          <ValidatorActionButtons />
        </div>
      </div>
    </FormProvider>
  );
};

export default ValidatorForm;
