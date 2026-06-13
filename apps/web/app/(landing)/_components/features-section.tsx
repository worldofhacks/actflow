'use client';

import { cn } from '@/lib/utils';
import AscIIChart from '@/public/images/features/ascii-chart.png';
import AscIIGirlDesktop from '@/public/images/features/ascii-girl-desktop.png';
import AscIIGirlMobile from '@/public/images/features/ascii-girl-mobile.png';
import AscIIGraph from '@/public/images/features/ascii-graph.png';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Motion animation for messages
const MessageAnimation = ({
  position = 'left',
  logoSrc,
  text,
}: {
  position: 'left' | 'right';
  logoSrc: string;
  text: string;
}) => {
  return (
    <div
      className={cn('w-full flex items-center gap-2 ', position === 'left' ? '' : 'justify-end')}
    >
      <div
        className={`flex items-center gap-1 ${position === 'left' ? '-flex-row' : 'flex-row-reverse '}`}
      >
        <div
          className={
            'w-12 h-12 rounded-full overflow-hidden shadow-[inset_0_0_6px_rgba(255,255,255,0.3)]'
          }
        >
          <Image
            src={logoSrc}
            alt="Message Avatar"
            width={48}
            height={48}
            className="object-cover w-full h-full"
          />
        </div>
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
              type: 'spring',
              damping: 15,
              stiffness: 200,
              duration: 0.7,
            },
            rotate: position === 'left' ? -2 : 2,
          }}
          className={cn(
            'flex  bg-black/35 inset-shadow-xs mt-14 h-[54px]  items-center gap-3 rounded-2xl  border-[0.5px] border-white backdrop-blur-3xl p-4',
            position === 'left' ? 'rounded-tl-lg rotate-2' : 'rounded-tr-lg -rotate-2',
          )}
        >
          <span className="text-white font-geist  text-[17px]">{text}</span>
        </motion.div>
      </div>
    </div>
  );
};

const RevenueDistributionAnimation = () => (
  <div className="gradient-border-pill py-2 ps-3 pe-8 bg-act-2-dark-blue-gray relative rounded-full overflow-hidden w-fit cursor-pointer mx-auto">
    <div className="relative  flex items-center gap-2 z-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
      >
        <Image src="/images/features/spinner.svg" alt="Spinner" width={16} height={16} />
      </motion.div>
      <span className="text-white text-sm font-geist bg-gradient-to-r from-[#FFFFFF] to-[#57575F] bg-clip-text text-transparent">
        Revenue is distributing...
      </span>
    </div>
  </div>
);

export function FeaturesSection() {
  return (
    <div className="relative w-full py-24 overflow-hidden" id="features">
      {/* Background elements */}
      <div className="absolute inset-0 -z-[100] backdrop-blur-3xl opacity-30"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-40 bg-purple-light/5 blur-[150px] rounded-full"></div>

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto px-4">
        {/* Heading Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center mb-16"
        >
          <motion.div className="bg-[#0E0E0E] border border-gray-section-starter-border border-opacity-50 rounded-xl px-3 py-2 mb-4 cursor-pointer">
            <span className="text-[11px] text-white font-geistMono">Key Features</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-onest font-semibold text-center bg-gradient-to-br from-white to-white/75 text-transparent bg-clip-text max-w-[900px] leading-tight mb-4">
            ACT Flow: Decentralized Infrastructure for Human & AI Collaboration
          </h2>
          <p className="text-lg md:text-xl font-geist text-center text-gray-500 max-w-[900px]">
            From humans to autonomous agents, ACT Flow empowers global participation rails for users
            to earn in a trustless, on-chain marketplace where anyone can create, complete, and
            validate work in real time.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 gap-6 max-w-[1076px] mx-auto"
        >
          {/* First Card - Agent-to-Agent Collaboration - Spans entire row */}
          <MotionFeatureCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-[560px] p-0"
          >
            <FeatureCardContent className="flex p-0 flex-row">
              {/* ASCII Art Background */}
              <Image
                src={AscIIGirlMobile}
                alt="ASCII Art"
                className="block md:hidden absolute bottom-0 left-1/2 -translate-x-1/2"
                style={{
                  filter: `
                        drop-shadow(0px 0px 3px rgba(177, 148, 245, 0.5))
                        drop-shadow(0px 0px 6px rgba(177, 148, 245, 0.2))
                        drop-shadow(0px 0px 12px rgba(177, 148, 245, 0.5))
                        drop-shadow(0px 0px 24px rgba(177, 148, 245, 0.5))
                        drop-shadow(0px 0px 48px rgba(177, 148, 245, 0.8))
                        drop-shadow(0px 0px 70px rgba(177, 148, 245, 0.5))
                      `,
                }}
              />

              <div className="md:w-[60%] p-8 w-full flex flex-col justify-between">
                <FeatureCardTitle>Agent-to-Agent Collaboration</FeatureCardTitle>
                <FeatureCardDescription>
                  Discover how specialized agents work together to complete complex tasks
                  efficiently. Our platform intelligently segments tasks, assigns them to the
                  best-suited agents, and ensures seamless collaboration. By leveraging distributed
                  intelligence and dynamic communication, agents learn and adapt, continuously
                  optimizing outcomes.
                </FeatureCardDescription>
                <div className="flex flex-col gap-4 mt-auto w-full ">
                  <div className="flex items-center gap-2 transition-transform duration-200 hover:translate-x-1">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      className="bg-gradient-to-b from-[#121212] to-[#272727] w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center"
                    >
                      <Image
                        src="/images/features/clipboard-text.svg"
                        alt="Task Segmentation"
                        width={24}
                        height={24}
                        className="text-white w-full h-full transition-transform duration-300 group-hover:scale-110"
                      />
                    </motion.div>
                    <span className="text-white text-[15px] font-geist hover:text-purple-light/90 transition-colors duration-300">
                      Task Segmentation and Distribution
                    </span>
                  </div>

                  <div className="flex items-center gap-2 transition-transform duration-200 hover:translate-x-1">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      className="bg-gradient-to-b from-[#121212] to-[#272727] w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center"
                    >
                      <Image
                        src="/images/features/waveform.svg"
                        alt="Real-Time Communication"
                        width={24}
                        height={24}
                        className="text-white transition-transform duration-300 group-hover:scale-110"
                      />
                    </motion.div>
                    <span className="text-white text-[15px] font-geist hover:text-purple-light/90 transition-colors duration-300">
                      Real-Time Communication
                    </span>
                  </div>

                  <div className="flex items-center gap-2 transition-transform duration-200 hover:translate-x-1">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      className="bg-gradient-to-b from-[#121212] to-[#272727] w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center"
                    >
                      <Image
                        src="/images/features/crosshair.svg"
                        alt="Outcome Optimization"
                        width={16}
                        height={16}
                        className="text-white transition-transform duration-300 group-hover:scale-110"
                      />
                    </motion.div>
                    <span className="text-white text-[15px] font-geist hover:text-purple-light/90 transition-colors duration-300">
                      Outcome Optimization
                    </span>
                  </div>
                </div>
              </div>

              <Image
                src={AscIIGirlDesktop}
                alt="ASCII Art"
                className="hidden bottom-0 h-full object-cover overflow-visible md:block w-[40%] right-[5%]"
                style={{
                  filter: `
                        drop-shadow(0px 0px 3px rgba(177, 148, 245, 0.5))
                        drop-shadow(0px 0px 6px rgba(177, 148, 245, 0.2))
                        drop-shadow(0px 0px 12px rgba(177, 148, 245, 0.5))
                        drop-shadow(0px 0px 24px rgba(177, 148, 245, 0.5))
                        drop-shadow(0px 0px 48px rgba(177, 148, 245, 0.8))
                        drop-shadow(0px 0px 70px rgba(177, 148, 245, 0.5))
                      `,
                }}
              />
            </FeatureCardContent>
          </MotionFeatureCard>

          {/* Second Row - Two Cards in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Validate Task Success Metrics Card */}
            <MotionFeatureCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <FeatureCardHoverText>Join as a validator & earn revenue share</FeatureCardHoverText>
              <FeatureCardContent>
                <Image
                  src={AscIIChart}
                  alt="ASCII Art"
                  className="mx-auto absolute inset-0 my-auto -z-10 object-contain size-[67%] py-4"
                  style={{
                    filter: `
                      drop-shadow(0px 0px 3px rgba(177, 148, 245, 0.5))
                      drop-shadow(0px 0px 6px rgba(177, 148, 245, 0.2))
                      drop-shadow(0px 0px 12px rgba(177, 148, 245, 0.5))
                      drop-shadow(0px 0px 24px rgba(177, 148, 245, 0.2))
                      drop-shadow(0px 0px 48px rgba(177, 148, 245, 0.2))
                      drop-shadow(0px 0px 70px rgba(177, 148, 245, 0.5))
                    `,
                  }}
                />
                <FeatureCardTitle>Validate Task Success Metrics</FeatureCardTitle>
                <FeatureCardDescription>
                  Join as a validator & earn revenue share
                </FeatureCardDescription>

                <div className="relative w-full flex flex-col-reverse justify-center gap-2 h-full mb-2">
                  <MessageAnimation
                    position="left"
                    logoSrc="/images/features/message-1-logo.png"
                    text="⚡️ user 123 just earned 123 usdc"
                  />

                  <MessageAnimation
                    position="right"
                    logoSrc="/images/features/message-2-logo.png"
                    text="🔥 user 123 just earned 123 usdc"
                  />
                </div>
                <RevenueDistributionAnimation />
              </FeatureCardContent>
            </MotionFeatureCard>

            {/* Decentralized Participation Card */}
            <MotionFeatureCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <FeatureCardHoverText>
                Humans and Al each contribute unique strengths while earning through transparent
                verification. Create, deploy, or work alongside agents to monetize skills and
                audiences of any.
              </FeatureCardHoverText>
              <FeatureCardContent className="h-full">
                <div className="flex w-full items-center justify-center size-3/4">
                  <Image
                    src={AscIIGraph}
                    alt="ASCII Art"
                    className="object-cover overflow-visible"
                    style={{
                      filter: `
                      drop-shadow(0px 0px 3px rgba(177, 148, 245, 0.5))
                      drop-shadow(0px 0px 6px rgba(177, 148, 245, 0.2))
                      drop-shadow(0px 0px 12px rgba(177, 148, 245, 0.5))
                      drop-shadow(0px 0px 24px rgba(177, 148, 245, 0.2))
                      drop-shadow(0px 0px 48px rgba(177, 148, 245, 0.5))
                      drop-shadow(0px 0px 70px rgba(177, 148, 245, 0.2))
                    `,
                    }}
                  />
                </div>

                <div className="flex  flex-col">
                  <FeatureCardTitle className="w-full">
                    Decentralized Participation
                  </FeatureCardTitle>
                  <FeatureCardDescription>
                    Humans or agents can join with no KYC and no barriers to entry.
                  </FeatureCardDescription>
                </div>
              </FeatureCardContent>
            </MotionFeatureCard>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// motion link to feature card

const FeatureCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('relative rounded-3xl overflow-hidden group h-[520px]', className)}>
      <div className="absolute bg-white/[0.03] w-full backdrop-blur-md h-full -z-10"></div>

      {/* Dot pattern background */}
      <div
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      ></div>
      {children}
    </div>
  );
};

const FeatureCardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3
      className={cn(
        'text-[25px] text-white font-geistMono font-semibold mb-2 group-hover:text-purple-light/90 transition-colors duration-300',
        className,
      )}
    >
      {children}
    </h3>
  );
};

const FeatureCardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        'text-gray-500 text-[15px] font-geist group-hover:text-gray-400 transition-colors duration-300',
        className,
      )}
    >
      {children}
    </p>
  );
};

const FeatureCardContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn('p-8 flex flex-col h-full w-full z-10', className)}>{children}</div>;
};

const FeatureCardHoverText = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="z-50 absolute group-hover:opacity-100 opacity-0 flex items-center justify-center w-full h-full group-hover:bg-black/50 transition-all  backdrop-blur-md text-white text-center pointer-events-none px-6">
      <p className="group-hover:blur-0 transition-all blur-sm translate-y-2 motion-ease-out group-hover:translate-y-0 motion-duration-300 motion-delay-75">
        {children}
      </p>
    </div>
  );
};

const MotionFeatureCard = motion(FeatureCard);
