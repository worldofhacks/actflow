'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 opacity-20">
        <Image
          src="/images/ascii-planet-glow.png"
          alt=""
          fill
          quality={100}
          priority
          className="object-cover bg-center h-screen w-screen"
        />
      </div>

      <Card className="max-w-md w-full border border-act-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-center">Processing Your Request</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>

            <p className="text-act-2-gray-light text-center">
              We&apos;re redirecting you to the appropriate page. Please wait a moment...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
