'use client';

import newLogo from '@/public/newLogo.png';
import Image from 'next/image';
import Link from 'next/link';

export function Logo({ url }: { url?: string }) {
  return (
    <Link href={url || '/'} className="flex items-center gap-2">
      {/* Image */}
      <Image src={newLogo} alt="logo" width={27.52} height={17.84} />
      {/* Text */}
      <h1 className="text-white font-exeroeFuturistic font-semibold text-[24px] leading-none tracking-[0]">
        ACT
      </h1>
    </Link>
  );
}
