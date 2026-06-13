'use client';

import agentToAgent from '@/public/images/advantages/agent-to-agent.png';
import humanAi from '@/public/images/advantages/human-ai-collaboration.png';
import hybridWorkflow from '@/public/images/advantages/hybrid-workflow.png';
import realTimeEventBridging from '@/public/images/advantages/real-time-eventbridging.png';
import seamlessCollaboration from '@/public/images/advantages/seamless-collaboration.png';
import secureTransactions from '@/public/images/advantages/secure-transactions.png';
import { motion } from 'framer-motion';
import Image, { StaticImageData } from 'next/image';
import { useRef, useState } from 'react';

// Define the advantage card types
type AdvantageCard = {
  id: number;
  title: string;
  image: StaticImageData;
  description?: string;
};

export function AdvantagesSection() {
  const [isScrolling, setIsScrolling] = useState(false);
  // List of advantage cards from the Figma design
  const advantageCards: AdvantageCard[] = [
    {
      id: 1,
      title: 'Human-AI Symbiotic Collaboration',
      image: humanAi,
      description:
        'Enabling humans and AI to work together seamlessly, maximizing the unique strengths of each party.',
    },
    {
      id: 2,
      title: 'Secure Transactions',
      image: secureTransactions,
      description:
        'Robust security protocols ensuring safe, transparent, and tamper-proof transactions between all parties.',
    },
    {
      id: 3,
      title: 'Agent-to-Agent Autonomous Commerce',
      image: agentToAgent,
      description:
        'Allowing AI agents to collaborate, negotiate, and conduct transactions independently based on predefined parameters.',
    },
    {
      id: 4,
      title: 'Seamless Collaboration',
      image: seamlessCollaboration,
      description:
        'Frictionless interaction and information sharing between humans, AI agents, and systems.',
    },
    {
      id: 5,
      title: 'Hybrid On-Chain & Off-Chain Workflow',
      image: hybridWorkflow,
      description:
        'Combining the benefits of blockchain verification with the efficiency of off-chain processing.',
    },
    {
      id: 7,
      title: 'Real-Time EventBridging',
      image: realTimeEventBridging,
      description:
        'Instant synchronization of events and data across different platforms and systems.',
    },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAmount = 320 + 28; // card width (320px) + gap (28px)

  const scrollLeft = () => {
    if (containerRef.current) {
      setIsScrolling(true);

      // Calculate the current scroll position
      const currentScroll = containerRef.current.scrollLeft;

      // Determine how much we can actually scroll left without going beyond the boundary
      const actualScrollAmount = Math.min(scrollAmount, currentScroll);

      // Only scroll if there's actually space to scroll
      if (actualScrollAmount > 0) {
        containerRef.current.scrollBy({ left: -actualScrollAmount, behavior: 'smooth' });
      }

      setTimeout(() => {
        setIsScrolling(false);
      }, 200);
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      setIsScrolling(true);

      // Calculate how much space is left to scroll right
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollWidth = containerRef.current.scrollWidth;
      const clientWidth = containerRef.current.clientWidth;
      const maxScrollLeft = scrollWidth - clientWidth;
      const remainingScroll = maxScrollLeft - scrollLeft;

      // Determine how much we can actually scroll right without going beyond the boundary
      const actualScrollAmount = Math.min(scrollAmount, remainingScroll);

      // Only scroll if there's actually space to scroll
      if (actualScrollAmount > 0) {
        containerRef.current.scrollBy({ left: actualScrollAmount, behavior: 'smooth' });
      }

      setTimeout(() => {
        setIsScrolling(false);
      }, 200);
    }
  };

  return (
    <div className="relative w-full pb-24  overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 backdrop-blur-3xl opacity-30"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-40 bg-purple-light/5 blur-[150px] rounded-full"></div>

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto px-4">
        {/* Heading Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-onest font-semibold text-center bg-gradient-to-br from-white to-white/75 text-transparent bg-clip-text max-w-[506px] leading-tight mb-6">
            Trusted On-Chain Task Orchestration
          </h2>
          <p className="text-lg md:text-xl font-geist text-center text-gray-500 max-w-[400px]">
            Everything you need to manage and optimize your AI agent workforce
          </p>
        </motion.div>

        {/* Advantages Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 relative"
        >
          {/* Left edge blur */}
          <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-black to-transparent z-10"></div>
          <div
            ref={containerRef}
            className="flex overflow-x-auto scrollbar-hide gap-7 pb-4 snap-x px-12 rounded-xl"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {advantageCards.map(card => (
              <div
                key={card.id}
                className="w-80 h-96 relative bg-stone-950 rounded-[20px] overflow-hidden group flex-shrink-0 snap-center transition-transform duration-500 hover:-translate-y-2 hover:shadow-lg"
              >
                <div className="z-50 absolute group-hover:opacity-100 opacity-0 flex items-center justify-center w-full h-full group-hover:bg-black/50 transition-all  backdrop-blur-md text-white text-center pointer-events-none px-6">
                  <p className="group-hover:motion-preset-blur-up-lg motion-duration-300 motion-delay-75">
                    {card.description}
                  </p>
                </div>

                {/* SVG/Image container */}
                {/* align image to the center */}
                <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[250px] h-[250px] rounded-full bg-[rgba(175,171,242,0.1)] blur-[40px] opacity-70"></div>
                  </div>
                  <Image src={card.image} alt={card.title} className="object-cover" />
                </div>

                {/* Text container at bottom */}
                <div className="w-80 px-2.5 py-7 left-0 bottom-0 absolute inline-flex justify-center items-center gap-2.5 overflow-hidden">
                  <div className="w-60 h-12 text-center text-white text-xl font-medium font-['Geist_Mono']">
                    {card.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Right edge blur */}
          <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-black to-transparent z-10"></div>
        </motion.div>

        {/* Navigation Controls and Pagination */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col items-center justify-center gap-6"
        >
          {/* Navigation Arrows */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={scrollLeft}
              className="w-12 h-12 px-2.5 py-1 bg-gradient-to-b from-neutral-900 to-stone-950 rounded-[35px] outline outline-[0.50px] outline-offset-[-0.50px] outline-zinc-800 inline-flex flex-col justify-center items-center gap-2.5"
              aria-label="Previous Page"
              disabled={isScrolling}
            >
              <Image src="/images/advantages/arrow-left.png" alt="Previous" width={10} height={6} />
            </button>
            <button
              onClick={scrollRight}
              className="w-12 h-12 px-2.5 py-1 bg-gradient-to-b from-neutral-900 to-stone-950 rounded-[35px] outline outline-[0.50px] outline-offset-[-0.50px] outline-zinc-800 inline-flex flex-col justify-center items-center gap-2.5"
              aria-label="Next Page"
              disabled={isScrolling}
            >
              <Image src="/images/advantages/arrow-right.png" alt="Next" width={10} height={6} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
