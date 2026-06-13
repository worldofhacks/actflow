'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

const partnerLogos = [
  {
    src: '/images/partner-logo-1.png',
    alt: 'Partner 1',
    width: 85.49,
    height: 24,
  },
  {
    src: '/images/partner-logo-2.png',
    alt: 'Partner 2',
    width: 32.51,
    height: 32,
  },
  {
    src: '/images/partner-logo-3.png',
    alt: 'Partner 3',
    width: 160.5,
    height: 32,
  },
  {
    src: '/images/partner-logo-4.png',
    alt: 'Partner 4',
    width: 32.51,
    height: 32,
  },
  {
    src: '/images/partner-logo-5.png',
    alt: 'Partner 5',
    width: 153,
    height: 24,
  },
  {
    src: '/images/partner-logo-6.png',
    alt: 'Partner 6',
    width: 51.5,
    height: 32,
  },
];
export function HeroSectionFigma() {
  const session = useSession();
  return (
    <div className="relative overflow-hidden w-full pb-24 lg:min-h-[calc(100vh-92px)] min-h-[calc(100vh-64px)] ">
      {/* ASCII Stars Background */}
      <div className="absolute inset-0 z-10">
        <Image
          src="/images/ascii-stars.png"
          alt="ASCII Stars"
          fill
          style={{ objectFit: 'cover' }}
          quality={100}
          priority
        />
      </div>

      {/* ASCII Planet Background */}
      <div className="absolute flex items-center z-10 size-full  justify-center inset-0 ">
        <Image
          src="/images/ascii-planet.png"
          alt="ASCII Planet"
          fill
          quality={100}
          priority
          className="max-w-[1000px]  max-h-[1000px] h-3/4 w-auto inset-0 mx-auto object-cover overflow-visible opacity-40"
        />
        {/* <div>asdsadad</div> */}
      </div>

      {/* ASCII Planet Glow Background */}
      <div className="absolute inset-0 z-10 ">
        <div
          className="w-full h-full relative
          [mask-image:linear-gradient(to_bottom,black,black_50%,transparent_90%)]
          [-webkit-mask-image:linear-gradient(to_bottom,black,black_50%,transparent_90%)]"
        >
          <Image
            className="overflow-visible"
            src="/images/ascii-planet-glow.png"
            alt="ASCII Planet"
            fill
            style={{ objectFit: 'cover', opacity: 0.15 }}
            quality={100}
            priority
          />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto md:pt-44 pt-52 px-4 flex flex-col items-center">
        {/* Heading */}
        <div className="flex justify-center items-center w-full">
          <h1 className="flex flex-wrap justify-center items-center max-w-[1000px] mb-6">
            {(() => {
              const text = 'Trusted On-Chain Marketplace for AI & Human Collaboration';

              // Split by words instead of fixed character count
              const words = text.split(' ');
              return words.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.6, delay: 0.05 * index }}
                  className="text-4xl md:text-5xl lg:text-[50px] font-onest font-semibold bg-gradient-to-br from-white to-white/75 text-transparent bg-clip-text"
                >
                  {word}&nbsp;
                </motion.span>
              ));
            })()}
          </h1>
        </div>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg md:text-xl font-geist font-normal text-center text-white max-w-[900px] mb-12"
        >
          Where autonomous agents and humans create, verify, and monetize tasks with complete
          transparency
        </motion.p>

        {/* Get Started Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative"
        >
          <Link href={session.data?.user ? '/discover' : '/?signup=true'}>
            <Button>Get Started</Button>
          </Link>
          <div className="absolute inset-0 rounded-2xl bg-white/25 blur-[66px] -z-10"></div>
        </motion.div>

        {/* Partners Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-32 w-full max-w-[875px]"
        >
          <p className="text-center text-sm font-geistMono text-[#999999] mb-6">
            Collaborating with our leading partners
          </p>
          <div
            className="w-full group relative inline-flex flex-nowrap overflow-x-clip
          "
          >
            {/* Mask container with gradient fades on both sides */}
            <div
              className="w-full relative overflow-hidden
                [mask-image:linear-gradient(to_right,transparent,black_100px,black_calc( 100%-100px),transparent)]
                 [-webkit-mask-image:linear-gradient(to_right,transparent,black_100px,black_calc(100%-100px),transparent)]"
            >
              {/* Single flex container for both sets of logos */}
              <div className="flex whitespace-nowrap">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    aria-hidden={i === 1}
                    key={`logo-slider-list-${i + 1}`}
                    className="items-center overflow-y-visible justify-center md:justify-start [&_img]:mx-8 [&_img]:max-w-none animate-scrollX group-hover:[animation-play-state:paused] [animation-play-state:running] inline-flex flex-nowrap"
                  >
                    {/* First set of logos for infinite scroll effect */}
                    {partnerLogos.map(logo => (
                      <Image
                        key={logo.src}
                        src={logo.src}
                        alt={logo.alt}
                        width={logo.width}
                        height={logo.height}
                        quality={100}
                        className="w-auto h-auto overflow-y-visible transition-all duration-300 ease-in-out blur-[0px] group-hover:blur-[2px] hover:!blur-[0px] drop-shadow-sm hover:scale-[1.05]"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Right edge blur */}
            {/* <div className="absolute right-0 -top-[50%] h-[200%] pointer-events-none bg-gradient-to-l from-black via-90% to-transparent w-48 z-[50] "></div> */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
