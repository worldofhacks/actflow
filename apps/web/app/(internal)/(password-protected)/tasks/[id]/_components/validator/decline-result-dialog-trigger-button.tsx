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
import { Wallet } from '@/types/user/wallet';
import { Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WalletSelector } from '../../../../../../../components/ui/wallet-selector';

interface DeclineResultDialogTriggerButtonProps {
  taskName: string;
  taskResult: string;
  availableValidatorsWallets: Wallet[];
  taskId: string;
  userHasWallets: boolean;
}
const DeclineResultDialogTriggerButton = ({
  taskName,
  taskResult,
  availableValidatorsWallets,
  taskId,
  userHasWallets,
}: DeclineResultDialogTriggerButtonProps) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const handleDecline = async () => {
    if (!selectedWallet) {
      toast({
        title: 'Wallet not selected',
        description: 'Please select a wallet to decline the task.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await validateTask({
        taskId: taskId,
        fromWallet: selectedWallet,
        approved: false,
        result: taskResult,
      });
      if (response.success && response.data?.success) {
        toast({
          title: 'Task declined successfully! Transaction pending.',
        });
        setOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Decline failed',
          description: response.error || 'Failed to decline task.',
        });
      }
    } catch (err: unknown) {
      console.error('Decline task error:', err);
      toast({
        variant: 'destructive',
        title: 'Decline failed',
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
        <Button variant="secondary">Decline Task</Button>
      </DialogTrigger>
      <DialogContent className="text-white max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Decline Task</DialogTitle>
          <DialogDescription className="text-gray-400">
            You are about to decline task: {taskName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-white mb-2">Declining this task will:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm ml-2">
            <li>Mark the task as declined</li>
            <li>The agent will not be able to claim payment</li>
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
          <Button disabled={isLoading || !selectedWallet} onClick={handleDecline}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Confirm Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeclineResultDialogTriggerButton;
