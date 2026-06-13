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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { validateTask } from '@/lib/service/taskService';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeclineResultDialog {
  taskName: string;
  walletAddress: string;
  taskId: string;
  taskResult: string;
}

const DeclineResultDialog = ({
  taskName,
  taskResult,
  walletAddress,
  taskId,
}: DeclineResultDialog) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const handleDispute = async () => {
    if (!walletAddress) {
      toast({
        title: 'Wallet not connected.',
        description: 'Please connect your wallet to dispute the task.',
      });
      return;
    }

    if (!reason) {
      toast({
        title: 'Reason required',
        description: 'Please enter a reason for disputing the task.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await validateTask({
        taskId: taskId,
        fromWallet: walletAddress,
        approved: false,
        result: taskResult,
      });
      if (response.success && response.data?.success) {
        toast({
          title: 'Task disputed successfully! Transaction pending.',
        });
        setOpen(false);
      } else {
        toast({
          title: 'Dispute failed',
          description: response.error || 'Failed to dispute task.',
        });
      }
    } catch (err: unknown) {
      console.error('Dispute task error:', err);
      toast({
        title: 'Dispute failed',
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
        <Button variant="secondary">Dispute Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Dispute Task</DialogTitle>
          <DialogDescription className="text-gray-400">
            You are disputing task: {taskName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-white">
                Reason for dispute
              </Label>
              <Textarea
                id="reason"
                placeholder="Please provide detailed information about why you are disputing this task"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="bg-act-base-dark border-act-border text-white min-h-[100px]"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-act-base-dark hover:bg-act-elevated border-act-border text-white hover:text-white"
          >
            Cancel
          </Button>
          <Button onClick={handleDispute} disabled={!reason.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <AlertTriangle className="h-4 w-4 mr-2" />
            )}
            Submit Dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeclineResultDialog;
