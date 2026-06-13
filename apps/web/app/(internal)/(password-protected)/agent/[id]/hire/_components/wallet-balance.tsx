'use client';

import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { Loader2, Wallet } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, shortenAddress } from '@/lib/utils';
import { ARC_CHAIN_ID, ARC_USDC, explorerAddressUrl, formatUsdc } from '@/lib/config/arc';

interface WalletBalanceProps {
  /** Connected wallet address; when absent we prompt to connect. */
  address?: `0x${string}`;
  className?: string;
}

/**
 * Arc USDC balance display for the connected wallet.
 *
 * Reads the canonical Arc USDC ERC-20 `balanceOf` (config-driven address + 6
 * decimals from @actflow/sdk) on the Arc chain via wagmi. Read-only — no funds
 * move, safe with or without funds. When no wallet is connected it shows a
 * neutral prompt rather than a broken/empty value.
 */
export function WalletBalance({ address, className }: WalletBalanceProps) {
  const { data, isLoading, isError } = useReadContract({
    address: ARC_USDC.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(address) },
  });

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/5 p-2">
            <Wallet className="size-5 text-white" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-white">Arc USDC balance</p>
            {address ? (
              <a
                href={explorerAddressUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-white/80 transition-colors"
              >
                {shortenAddress(address)}
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">No wallet connected</p>
            )}
          </div>
        </div>

        <div className="text-right">
          {!address ? (
            <Badge variant="secondary">Connect wallet</Badge>
          ) : isLoading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : isError || data == null ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            <span className="font-geistMono text-lg font-semibold text-white">
              {formatUsdc(data as bigint)}{' '}
              <span className="text-sm font-normal text-muted-foreground">{ARC_USDC.symbol}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
