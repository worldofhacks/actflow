'use client';
import { AgentFormValues } from '@/app/(internal)/(password-protected)/agent/add/_components/AgentForm';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { createAgent } from '@/lib/service/agentService';
import { provisionAgentIdentity } from '@/lib/service/provisioningService';
import { AgentType } from '@/types/agent/agent-type';
import { Rocket } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { AgentProvisionedState } from './AgentForm';

interface AgentActionButtonsProps {
  agentType: AgentType;
  /**
   * Called once the agent is created AND its ENS + ERC-8004 identity is
   * provisioned (preview or bound). Drives the wizard's confirmation step.
   */
  onProvisioned: (state: AgentProvisionedState) => void;
}

/** The two-phase progress of the activate button. */
type Phase = 'idle' | 'creating' | 'provisioning';

export const AgentActionButtons = ({ agentType, onProvisioned }: AgentActionButtonsProps) => {
  const form = useFormContext<AgentFormValues>();
  const [phase, setPhase] = useState<Phase>('idle');

  const isSubmitting = phase !== 'idle';

  const handleActivate = async () => {
    const valid = await form.trigger();

    if (!valid) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the form errors before submitting.',
        variant: 'destructive',
      });
      return;
    }

    // Check if at least one skill is enabled
    const formValues = form.getValues();
    const enabledSkills = formValues.skills.filter(skill => skill.enabled);

    if (enabledSkills.length === 0) {
      toast({
        title: 'Missing Capabilities',
        description: 'Please enable at least one capability before activating.',
        variant: 'destructive',
      });
      return;
    }

    setPhase('creating');
    try {
      const response = await createAgent({
        fromWallet: formValues.fromWallet,
        topic: formValues.topic,
        skills: enabledSkills.map(({ skillName, fee, executionDuration, autoAssign }) => ({
          skillName,
          enabled: true,
          fee,
          executionDuration,
          autoAssign,
        })),
        metadata: {
          name: formValues.name,
          description: formValues.description,
          socialUrl: formValues.socialUrl,
          profileType: agentType,
        },
      });

      if (!response.success || !response.data) {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create agent.',
          variant: 'destructive',
        });
        setPhase('idle');
        return;
      }

      const created = response.data;
      // Prefer the wallet address (0x...) as the provisioning identifier — it is
      // the ERC-8004 NFT owner / ENS subname owner — falling back to the mongo id.
      const provisionId = created.agentId || created.id;
      // The agent's ENS-powered profile route (/agent/[id]).
      const profileHref = `/agent/${created.agentId || created.id}`;

      toast({
        title: 'Success',
        description: `${agentType === AgentType.AI_AGENT ? 'Agent' : 'Human'} profile created successfully!`,
        variant: 'default',
      });

      // Phase 2: provision the ENS + ERC-8004 identity. The API is fully
      // dry-run/mock-safe (returns a labeled preview with no on-chain tx when no
      // funds/creds are present), so this step never blocks agent creation.
      setPhase('provisioning');
      const provision = await provisionAgentIdentity({
        agentId: provisionId,
        x402: true,
      });

      if (provision.success && provision.data) {
        onProvisioned({ result: provision.data, profileHref });
        return;
      }

      // Provisioning failed but the agent WAS created — don't strand the user.
      // Surface the error and still let them reach the profile.
      toast({
        title: 'Identity provisioning skipped',
        description:
          (provision.error || 'Could not provision the agent identity.') +
          ' The agent was created — opening its profile.',
        variant: 'destructive',
      });
      window.location.assign(profileHref);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to create agent. Please try again later.',
        variant: 'destructive',
      });
      setPhase('idle');
    }
  };

  const label =
    phase === 'provisioning'
      ? 'Provisioning identity…'
      : phase === 'creating'
        ? agentType === AgentType.AI_AGENT
          ? 'Activating Agent…'
          : 'Activating Influencer…'
        : agentType === AgentType.AI_AGENT
          ? 'Activate Agent'
          : 'Activate Influencer';

  return (
    <>
      <Button
        className="flex items-center justify-center"
        onClick={handleActivate}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent" />
        ) : (
          <Rocket className="h-4 w-4 mr-2" />
        )}
        {label}
      </Button>
    </>
  );
};
