'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ErrorDisplayProps {
  errorMessage: string;
}
export function ErrorDisplay({ errorMessage }: ErrorDisplayProps) {
  return (
    <div className="inset-0 mx-auto my-auto p-4">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/ascii-stars.png"
          alt="ASCII Stars"
          fill
          style={{ objectFit: 'cover' }}
          quality={100}
          priority
        />
      </div>

      <div className="absolute mx-auto my-auto -z-20 lg:size-4/5 inset-0 ">
        <Image
          src="/images/ascii-planet.png"
          alt="ASCII Planet"
          fill
          quality={100}
          priority
          className="flex w-full h-full object-cover overflow-visible opacity-40"
        />
      </div>

      <Card className="max-w-md w-full border border-act-border shadow-[inset_0px_0px_16px_0px_#FFFFFF33]">
        <CardHeader className="pb-0">
          <CardTitle className="text-center text-xl text-white">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>

            <div className="text-center space-y-2">
              <p className="text-white text-base">{errorMessage}</p>
              <p className="text-act-2-gray-light text-sm">
                Please try again or contact support if the problem persists.
              </p>
            </div>

            <Link href="/?login=true">
              <Button className="w-full" variant="secondary">
                Return to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
