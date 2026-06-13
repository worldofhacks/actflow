'use client';

import { toast } from '@/hooks/use-toast';
import { createTask } from '@/lib/service/taskService';
import { AgentDetails } from '@/types/agent/agent';
import { PricingModels } from '@/types/PricingModels';
import { CreateTaskRequest } from '@/types/tasks/create-task.request';
import { Wallet } from '@/types/user/wallet';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, CheckCircle, Loader2, ShieldAlert, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { WalletInfoDisplay, WalletSelector } from '../ui/wallet-selector';

export type AgentType = 'invite' | 'assign';

// Define the form schema with zod
const taskFormSchema = z
  .object({
    name: z.string().min(1, { message: 'Task name is required' }),
    topic: z.string().min(1, { message: 'Task category is required' }),
    reward: z.string().min(1, { message: 'Reward is required' }),
    prompt: z.string().min(1, { message: 'Prompt is required' }),
    fromWallet: z.string().min(1, { message: 'Wallet selection is required' }),
    skill: z.string(),
    validation: z.boolean().default(false),
    validationReward: z.string().optional(),
    submissionDuration: z
      .number()
      .int()
      .min(1, { message: 'Submission duration is required' })
      .default(7),
    executionDuration: z
      .number()
      .int()
      .min(1, { message: 'Validation duration is required' })
      .default(3),
  })
  .refine(
    data => {
      // Skip validation if validation is false
      if (!data.validation) return true;
      // Validate validationReward when validation is true
      return !!data.validationReward && parseFloat(data.validationReward) >= 0.00001;
    },
    {
      message: 'Validation reward is required and must be at least 0.00001 IP',
      path: ['validationReward'], // Path to the field with the issue
    },
  );

// Define the form values type
type TaskFormValues = z.infer<typeof taskFormSchema>;

interface SharedTaskFormProps {
  topics: string[];
  assignedAgent?: AgentDetails;
  invitedAgents?: AgentDetails[];
  setSelectedInvitedAgents?: (agents: AgentDetails[]) => void;
  cancelUrl?: string;
  wallets?: Wallet[];
  onSuccessRedirect?: (taskId: string) => void;
  resultData?: { content: string; taskId: string };
  isHireScenario?: boolean;
  skills?: string[];
}

export default function SharedTaskForm({
  wallets,
  topics,
  skills: skillsFromProps,
  assignedAgent,
  invitedAgents,
  cancelUrl = '/discover',
  onSuccessRedirect,
  resultData,
  setSelectedInvitedAgents,
  isHireScenario = false,
}: SharedTaskFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const skills =
    assignedAgent?.skills?.map(skill => ({
      label: `${skill.skillName.split(':').at(1)} (${skill.fee} IP) ${skill.autoAssign ? '(Auto-Assignable)' : ''}`,
      value: skill.skillName,
    })) || skillsFromProps?.map(skill => ({ label: skill, value: skill }));

  const categoryFromUrl = searchParams.get('category') || assignedAgent?.topic || '';

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '',
      reward: '0.00001',
      prompt: '',
      fromWallet: wallets && wallets.length > 0 ? wallets[0].address : '',
      topic: categoryFromUrl || (topics.length > 0 ? topics[0] : ''),
      skill: skills && skills.length > 0 ? skills[0].value : '',
      validation: false,
      validationReward: '0.00001',
      submissionDuration: 604800, // 7 days in seconds
      executionDuration: 259200, // 3 days in seconds
    },
    mode: 'onChange',
  });

  const isFormValid = form.formState.isValid;

  useEffect(() => {
    if (categoryFromUrl) {
      form.setValue('topic', categoryFromUrl as string);
    }
  }, [categoryFromUrl, form]);

  useEffect(() => {
    if (wallets && wallets.length > 0 && !form.getValues('fromWallet')) {
      form.setValue('fromWallet', wallets[0].address);
    }
  }, [wallets, form]);

  const onSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);

    try {
      const baseTaskData = {
        fromWallet: data.fromWallet,
        topic: data.skill,
        reward: data.reward,
        contextId: '0',
        submissionDuration: data.submissionDuration,
        executionDuration: data.executionDuration,
        payload: {
          serviceName: data.name,
          prompt: data.prompt || '',
          pricingModel: PricingModels.FIXED_PRICE,
          skills: data.skill ? [data.skill] : [],
        },
        validationReward: data.validation ? data.validationReward : undefined,
      };
      const isAutoAssignableSkill = assignedAgent?.skills?.find(
        skill => skill.skillName === data.skill,
      )?.autoAssign;
      let taskData;
      if (isAutoAssignableSkill) {
        taskData = {
          ...baseTaskData,
          assignedAgent: assignedAgent?.agentId || '',
        };
      } else if (invitedAgents && invitedAgents.length > 0) {
        taskData = {
          ...baseTaskData,
          invitedAgents: invitedAgents?.map(agent => agent.agentId) || [],
        };
      } else {
        taskData = {
          ...baseTaskData,
        };
      }

      const response = await createTask(taskData as CreateTaskRequest);

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      // Handle redirect after successful task creation
      if (response.data?.taskId) {
        if (onSuccessRedirect) {
          onSuccessRedirect(response.data.taskId);
        } else {
          router.push(`/tasks/${response.data.taskId}`);
        }
      } else {
        router.push('/tasks');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create task',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add handlers for approve and dispute actions
  const handleApprove = (taskId: string) => {
    // Implement approval logic
    toast({
      title: 'Success',
      description: `Task ${taskId} result approved`,
    });
  };

  const handleDispute = (taskId: string) => {
    // Implement dispute logic
    toast({
      title: 'Dispute Filed',
      description: `Your dispute for task ${taskId} has been submitted for review`,
    });
  };

  const updateCategoryParam = (newCategory: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', newCategory);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isHireScenario && assignedAgent
            ? `Hire ${assignedAgent.metadata?.name || 'Agent'}`
            : 'Task Details'}
        </CardTitle>
        <CardDescription>
          {isHireScenario && assignedAgent
            ? `Define your task for ${assignedAgent.metadata?.name || 'this agent'} to complete.`
            : 'Create a task to hire an AI Agent to complete your project.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fromWallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-gray-300 mb-2">
                    Select Wallet
                  </FormLabel>
                  <FormControl>
                    <WalletSelector
                      wallets={wallets}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('fromWallet') && wallets && (
              <WalletInfoDisplay
                wallet={wallets.find(w => w.address === form.watch('fromWallet'))}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-gray-300 mb-2">
                    Task Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., AI-Powered Ad Strategy Q1 2025"
                      className="block w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display topic as read-only when it comes from the agent (hire scenario)
                or when an agent is assigned; otherwise, show topic selector */}
            {isHireScenario || assignedAgent ? (
              <div>
                <FormLabel className="block text-sm font-medium text-gray-300 mb-2">
                  Task Category
                </FormLabel>
                <p>{assignedAgent?.topic || topics[0] || 'No category available'}</p>
                <input
                  type="hidden"
                  {...form.register('topic')}
                  value={assignedAgent?.topic || topics[0] || ''}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-300 mb-2">
                      Task Category
                    </FormLabel>
                    <Select
                      onValueChange={value => {
                        field.onChange(value);
                        updateCategoryParam(value);
                      }}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {topics.map(topic => (
                            <SelectItem key={topic} value={topic}>
                              {topic}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="reward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-gray-300 mb-2">
                    Reward
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute text-act-2-purple z-10 left-3 top-1/2 -translate-y-1/2 ">
                        IP
                      </span>
                      <Input
                        type="number"
                        className="pl-12 w-full"
                        step="0.00001"
                        min="0.00001"
                        placeholder="e.g., 0.00001"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <p className="text-sm text-gray-400 mt-2">Minimum reward: 0.00001 IP</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-gray-300 mb-2">
                    Prompt
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Specify details about what the AI Agent needs to do..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="submissionDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-300 mb-2">
                      Submission Duration (seconds)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        className="w-full"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-400 mt-2">
                      Time in seconds for agents to be assigned to the task
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="executionDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-300 mb-2">
                      Execution Duration (seconds)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        className="w-full"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-400 mt-2">
                      Time in seconds for agents to submit the result
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="skill"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-gray-300 mb-2">
                    Select Skill
                  </FormLabel>
                  <Select
                    onValueChange={value => {
                      field.onChange(value);
                      if (setSelectedInvitedAgents) {
                        setSelectedInvitedAgents(
                          invitedAgents?.filter(agent =>
                            agent.skills?.some(skill => skill.skillName === value),
                          ) ?? [],
                        );
                      }
                    }}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a skill" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {skills?.map(skill => (
                          <SelectItem key={skill.value} value={skill.value}>
                            {skill.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-400 mt-2">
                    {skills?.length === 0
                      ? 'No skills available for this agent'
                      : 'Select one skill required for this task'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validation"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        <FormLabel className="font-medium text-gray-300">Add Validation</FormLabel>
                      </div>
                      <p className="text-sm text-gray-400">
                        If you want to validate the task result, you can add a validation reward.
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('validation') && (
              <FormField
                control={form.control}
                name="validationReward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-300 mb-2">
                      Validation Reward
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute text-act-2-purple z-10 left-3 top-1/2 -translate-y-1/2 ">
                          IP
                        </span>
                        <Input
                          type="number"
                          className="pl-12 w-full"
                          step="0.00001"
                          min="0.00001"
                          placeholder="e.g., 0.00001"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <p className="text-sm text-gray-400 mt-2">
                      Minimum validation reward: 0.00001 IP
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Button variant="secondary" type="button" onClick={() => router.push(cancelUrl)}>
                <span className="flex items-center justify-center">
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </span>
              </Button>
              <Button type="submit" disabled={!isFormValid || isSubmitting}>
                <span className="flex items-center justify-center">
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Bot className="h-5 w-5 mr-2" />
                  )}
                  {isSubmitting ? 'Creating...' : isHireScenario ? 'Hire Agent' : 'Create Task'}
                </span>
              </Button>
            </div>
          </form>
        </Form>

        {/* Display Result Data Section */}
        {resultData && (
          <div className="mt-8 border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Task Results</h3>
            <div className="bg-gray-800 p-4 rounded-md mb-4">
              <pre className="whitespace-pre-wrap text-sm">{resultData.content}</pre>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleDispute(resultData.taskId)}
                className="border-red-500 hover:bg-red-900/20"
              >
                <span className="flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 mr-2 text-red-500" />
                  Dispute Result
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleApprove(resultData.taskId)}
                className="border-green-500 hover:bg-green-900/20"
              >
                <span className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Approve Result
                </span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
