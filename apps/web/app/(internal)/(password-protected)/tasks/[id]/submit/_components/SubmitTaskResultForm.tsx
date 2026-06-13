'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { submitTaskResult } from '@/lib/service/taskService';
import { AgentDetails } from '@/types/agent/agent';
import { SubmitResultDto } from '@/types/tasks/submit-result.request';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Clock, FileCheck, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../../../components/ui/select';

interface SubmitTaskResultFormProps {
  task: TaskDetails;
  userAgents: AgentDetails[];
}

const formSchema = z.object({
  fromWallet: z.string({
    required_error: 'Please select a wallet to submit from',
  }),
  result: z
    .string({
      required_error: 'Please provide your task result',
    })
    .min(10, {
      message: 'Result must be at least 10 characters',
    }),
});

export default function SubmitTaskResultForm({ task, userAgents }: SubmitTaskResultFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromWallet: userAgents[0]?.agentId || '',
      result: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const submitData: SubmitResultDto = {
        fromWallet: values.fromWallet,
        taskId: task.taskId,
        result: values.result,
      };

      const response = await submitTaskResult(submitData);

      if (response.success) {
        toast({
          title: 'Task result submitted successfully',
        });
        router.push(`/tasks/${task.taskId}`);
      } else {
        toast({
          title: 'Failed to submit',
          description: response.message,
        });
      }
    } catch (error) {
      toast({
        title: 'An error occurred while submitting your result',
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableAgentsToSubmit = userAgents.filter(agent =>
    task.invitedAgents.some(invitedAgent => invitedAgent.agentId === agent.agentId),
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Task Result</CardTitle>
            <CardDescription>
              Provide your completed work for task: {task.metadata?.serviceName || task.topic}
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
                      <FormLabel>Select agent</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAgentsToSubmit.map(agent => (
                            <SelectItem key={agent.agentId} value={agent.agentId}>
                              {agent.metadata?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="result"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Task Result</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your completed work or provide links/resources..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide detailed information about your completed work
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Task Result
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-act-2-gray-medium">Task Topic</h3>
              <p className="text-white">{task.topic}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-act-2-gray-medium">Task Reward</h3>
              <p className="text-act-2-purple-light">
                {(parseInt(task.reward) / 1e18).toFixed(6)} IP
              </p>
            </div>

            {task.metadata?.prompt && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-act-2-gray-medium">Task Description</h3>
                <p className="text-white text-sm">{task.metadata.prompt}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <div className="flex items-center text-sm text-act-2-gray-medium">
              <AlertCircle className="mr-2 h-4 w-4 text-act-2-purple-light" />
              Your submission will be reviewed by the task creator
            </div>
            <div className="flex items-center text-sm text-act-2-gray-medium">
              <FileCheck className="mr-2 h-4 w-4 text-act-2-purple-light" />
              Make sure your work meets all requirements before submitting
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
