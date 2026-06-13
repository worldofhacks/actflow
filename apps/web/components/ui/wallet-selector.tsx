'use client';

import { Wallet } from '@/types/user/wallet';
import { Wallet as WalletIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface WalletSelectorProps {
  missingWalletsText?: string;
  missingWalletsDescription?: string;
  wallets?: Wallet[];
  value: string;
  onChange: (value: string) => void;
}

export function WalletSelector({
  wallets,
  value,
  onChange,
  missingWalletsText = 'No wallets available',
  missingWalletsDescription = 'Please connect or create a wallet first',
}: WalletSelectorProps) {
  if (!wallets || wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-center rounded-lg border border-act-2-dark-gray-200">
        <WalletIcon className="h-8 w-8 text-act-2-gray-medium mb-2" />
        <p className="text-act-2-gray-light">{missingWalletsText}</p>
        <p className="text-sm px-3 text-act-2-gray-medium mt-1">{missingWalletsDescription}</p>
      </div>
    );
  }

  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger>
        <SelectValue placeholder="Select a wallet">
          {value && <WalletSelectorItem wallet={wallets.find(w => w.address === value)!} />}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {wallets.map(wallet => (
            <SelectItem
              className="w-full flex items-start flex-col gap-y-1 "
              key={wallet.address}
              value={wallet.address}
            >
              <div className="flex w-full items-center justify-between">
                <div>
                  <span className="font-mono text-sm text-white truncate max-w-[150px]">
                    {wallet.name}
                  </span>
                </div>
              </div>
              <div className="flex w-full space-x-3 mt-0.5">
                <div className="text-xs flex items-center">
                  <span className="text-act-2-gray-medium mr-1">Native:</span>
                  <span className="text-act-2-purple-light font-medium">
                    {wallet.nativeBalance || '0'}
                  </span>
                </div>
                <div className="text-xs flex items-center">
                  <span className="text-act-2-gray-medium mr-1">Token:</span>
                  <span className="text-act-2-purple font-medium">
                    {wallet.tokenBalance || '0'}
                  </span>
                </div>

                <div className="text-xs flex items-center">
                  <span className="text-act-2-gray-medium mr-1">Address:</span>
                  <span className="text-act-2-purple font-medium">
                    {wallet.address.substring(0, 6)}...
                    {wallet.address.substring(wallet.address.length - 4)}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function WalletInfoDisplay({ wallet }: { wallet: Wallet | undefined }) {
  if (!wallet) return null;

  return (
    <div className="mt-3 p-3 bg-white/5 border rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-sm text-act-2-gray-light">Selected Wallet</span>
        {wallet.isApprovedForMarketPlace && (
          <span className="text-xs  text-act-2-purple-light px-2 py-0.5 rounded-full">
            Approved
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-full">
            <WalletIcon className="h-4 w-4 text-act-2-purple-light" />
          </div>
          <span className="font-mono text-sm text-white">{wallet.name}</span>
          <span className="text-xs text-act-2-gray-medium">
            {wallet.address.substring(0, 6)}...
            {wallet.address.substring(wallet.address.length - 4)}
          </span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="text-xs px-2 py-1 bg-act-2-dark-blue-gray rounded-xl flex items-center">
            <span className="text-act-2-gray-medium mr-1">Native:</span>
            <span className="text-act-2-purple-light font-medium">
              {wallet.nativeBalance || '0'}
            </span>
          </div>
          <div className="text-xs px-2 py-1 bg-act-2-dark-blue-gray rounded-xl flex items-center">
            <span className="text-act-2-gray-medium mr-1">Token:</span>
            <span className="text-act-2-purple font-medium">{wallet.tokenBalance || '0'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletSelectorItem({ wallet }: { wallet: Wallet }) {
  return (
    <div className="flex items-center gap-x-3">
      <div>
        <WalletIcon className="h-4 w-4 text-white" />
      </div>
      <span className="font-mono text-sm ">{wallet.name}</span>
    </div>
  );
}
