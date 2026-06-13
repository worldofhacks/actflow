'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { validateTask } from '@/lib/service/taskService';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ApproveResultDialogProps {
  taskName: string;
  walletAddress: string;
  taskId: string;
  taskResult: string;
}

const ApproveResultDialog = ({
  taskName,
  taskResult,
  walletAddress,
  taskId,
}: ApproveResultDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const handleApprove = async () => {
    if (!walletAddress) {
      toast({
        title: 'Wallet not connected.',
        description: 'Please connect your wallet to approve the task.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await validateTask({
        taskId: taskId,
        fromWallet: walletAddress,
        approved: true,
        result: taskResult,
      });
      if (response.success && response.data?.success) {
        toast({
          title: 'Task approved successfully! Transaction pending.',
        });
        setOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Approval failed',
          description: response.error || 'Failed to approve task.',
        });
      }
    } catch (err: unknown) {
      console.error('Approve task error:', err);
      toast({
        variant: 'destructive',
        title: 'Approval failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Approve Task</Button>
      </DialogTrigger>
      <DialogContent className=" text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Approve Task</DialogTitle>
          <DialogDescription className="text-gray-400">
            You are about to approve task: {taskName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-white mb-2">Approving this task will:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm ml-2">
            <li>Release the payment to the agent</li>
            <li>Mark the task as completed</li>
            <li>This action cannot be undone</li>
          </ul>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="bg-act-base-dark hover:bg-act-elevated border-act-border text-white hover:text-white"
          >
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Confirm Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveResultDialog;
