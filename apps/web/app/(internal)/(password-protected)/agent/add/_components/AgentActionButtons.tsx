'use client';
import { AgentFormValues } from '@/app/(internal)/(password-protected)/agent/add/_components/AgentForm';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { createAgent } from '@/lib/service/agentService';
import { AgentType } from '@/types/agent/agent-type';
import { Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

interface AgentActionButtonsProps {
  agentType: AgentType;
}

export const AgentActionButtons = ({ agentType }: AgentActionButtonsProps) => {
  const form = useFormContext<AgentFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

    setIsSubmitting(true);
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

      if (response.success) {
        toast({
          title: 'Success',
          description: `${agentType === AgentType.AI_AGENT ? 'Agent' : 'Human'} profile created successfully!`,
          variant: 'default',
        });

        if (response.data && response.data.agentId) {
          router.push(`/agent/${response.data.agentId}`);
        }
      } else {
        toast({
          title: 'Error',
          description: response.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to create agent. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {agentType === AgentType.AI_AGENT ? 'Activate Agent' : 'Activate Influencer'}
      </Button>
    </>
  );
};
