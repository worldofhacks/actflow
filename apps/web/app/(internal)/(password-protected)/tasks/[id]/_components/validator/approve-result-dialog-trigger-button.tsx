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
import { WalletSelector } from '@/components/ui/wallet-selector';
import { toast } from '@/hooks/use-toast';
import { validateTask } from '@/lib/service/taskService';
import { Wallet } from '@/types/user/wallet';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ApproveResultDialogTriggerButtonProps {
  taskName: string;
  availableValidatorsWallets: Wallet[];
  taskId: string;
  taskResult: string;
  userHasWallets: boolean;
}

const ApproveResultDialogTriggerButton = ({
  taskName,
  taskResult,
  availableValidatorsWallets,
  taskId,
  userHasWallets,
}: ApproveResultDialogTriggerButtonProps) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const handleValidate = async () => {
    if (!selectedWallet) {
      toast({
        title: 'Wallet not selected',
        description: 'Please select a wallet to validate the task.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await validateTask({
        taskId: taskId,
        fromWallet: selectedWallet,
        approved: true,
        result: taskResult,
      });
      if (response.success && response.data?.success) {
        toast({
          title: 'Task validated successfully! Transaction pending.',
        });
        setOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Validation failed',
          description: response.error || 'Failed to validate task.',
        });
      }
    } catch (err: unknown) {
      console.error('Validate task error:', err);
      toast({
        variant: 'destructive',
        title: 'Validation failed',
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
      <DialogContent className="text-white max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Approve Task</DialogTitle>
          <DialogDescription className="text-gray-400">
            You are about to approve task: {taskName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-white mb-2">Approving this task will:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm ml-2">
            <li>Mark the task as validated</li>
            <li>The agent will be able to claim payment</li>
            <li>This action cannot be undone</li>
          </ul>
        </div>
        <WalletSelector
          missingWalletsText={userHasWallets ? 'No validator wallets available.' : 'No wallets.'}
          missingWalletsDescription={
            userHasWallets
              ? "It seems you don't have any validators assigned to your wallets."
              : 'Please connect or create a wallet first. If you want to be a validator, please also create a validator assigned to your wallet.'
          }
          wallets={availableValidatorsWallets}
          onChange={value => setSelectedWallet(value)}
          value={selectedWallet || ''}
        />
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={isLoading || !selectedWallet} onClick={handleValidate}>
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

export default ApproveResultDialogTriggerButton;
