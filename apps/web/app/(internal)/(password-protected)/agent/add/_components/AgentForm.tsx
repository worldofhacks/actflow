'use client';
import { AgentType } from '@/types/agent/agent-type';
import { Wallet } from '@/types/user/wallet';
import { ProvisionResult } from '@/types/provisioning';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as z from 'zod';
import { AgentActionButtons } from './AgentActionButtons';
import { AgentFormControls } from './AgentFormControls';
import { AgentProvisionResult } from './AgentProvisionResult';
import { AgentTypeSelector } from './AgentTypeSelector';

interface AgentFormProps {
  initialAgentType: AgentType;
  wallets?: Wallet[];
  topics: string[];
}
const agentFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  profileType: z.enum(['ai_agent', 'human']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  socialUrl: z.string().url('Must be a valid URL'),
  fromWallet: z.string().min(1, 'Wallet selection is required'),
  topic: z.string().min(1, 'Topic selection is required'),
  skills: z
    .array(
      z.object({
        skillName: z.string().min(1, 'Skill name is required'),
        enabled: z.boolean().default(false),
        fee: z.string().min(1, 'Fee is required'),
        executionDuration: z.string().min(1, 'Execution duration is required'),
        autoAssign: z.boolean().default(false),
      }),
    )
    .min(1, 'At least one skill is required'),
  visibility: z.enum(['public', 'private']).default('public'),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;

/** The completed agent + its provisioned identity, shown as the confirmation step. */
export interface AgentProvisionedState {
  /** Provisioning result from POST /agents/provision (identity preview or bound). */
  result: ProvisionResult;
  /** Route to the new agent's ENS-powered profile (/agent/[id]). */
  profileHref: string;
}

const AgentForm = ({ initialAgentType, wallets, topics }: AgentFormProps) => {
  const [provisioned, setProvisioned] = useState<AgentProvisionedState | null>(null);
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
      profileType: initialAgentType,
      description: '',
      socialUrl: '',
      // fromWallet: wallets?.[0]?.address || '',
      topic: '',
      skills: [
        {
          skillName: 'Post',
          enabled: false,
          fee: '50',
          executionDuration: '3600',
          autoAssign: false,
        },
        {
          skillName: 'Comment',
          enabled: false,
          fee: '25',
          executionDuration: '3600',
          autoAssign: false,
        },
        {
          skillName: 'Reply',
          enabled: false,
          fee: '15',
          executionDuration: '3600',
          autoAssign: false,
        },
      ],
      visibility: 'public',
    },
  });

  useEffect(() => {
    form.setValue('profileType', initialAgentType);
  }, [initialAgentType, form]);

  // Confirmation step: once the agent is created AND its identity provisioned,
  // replace the form with the identity result (preview vs live, profile link).
  if (provisioned) {
    return (
      <div className="mt-4 flex w-full justify-center">
        <div className="w-full max-w-2xl">
          <AgentProvisionResult
            result={provisioned.result}
            profileHref={provisioned.profileHref}
          />
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <AgentTypeSelector initialAgentType={initialAgentType} />
      <div className="grid grid-cols-1 mt-4 lg:grid-cols-3 gap-4 w-full">
        <AgentFormControls agentType={initialAgentType} wallets={wallets} topics={topics} />
        <div className="col-span-2 lg:col-span-3 mt-6">
          <AgentActionButtons agentType={initialAgentType} onProvisioned={setProvisioned} />
        </div>
      </div>
    </FormProvider>
  );
};

export default AgentForm;
