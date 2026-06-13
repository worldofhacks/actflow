'use client';

import EyeThumb from '@/public/eye-thumb.png';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export function Logo({ url }: { url?: string }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  return (
    <Link href={url || '/'} className="logo-link">
      <div className="h-10 flex items-center gap-3">
        <div className="w-9 h-9 relative">
          <div className="w-9 h-9 rounded-full flex items-center justify-center hover-gradient">
            {/* Poster image with fade-out effect when video plays */}
            <Image
              src={EyeThumb}
              alt="heroThumbnail"
              width={36}
              height={36}
              className={`rounded-full w-8 h-8 absolute transition-opacity duration-500 object-cover ${
                isVideoPlaying ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <video
              width="36"
              height="36"
              preload="none"
              autoPlay
              muted
              loop
              playsInline
              className={`rounded-full w-8 h-8 transition-opacity duration-500 ${
                isVideoPlaying ? 'opacity-100' : 'opacity-0'
              }`}
              onPlay={() => setIsVideoPlaying(true)}
              onError={() => setIsVideoPlaying(false)}
            >
              <source src="/heroVideo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
        <div className="flex items-center justify-start w-[126px] text-[28px] font-light leading-[28px] font-sora gap-1">
          <h3 className="gradient-Text">ACT</h3>
          <h3 className="text-white">Flow</h3>
        </div>
      </div>
    </Link>
  );
}
