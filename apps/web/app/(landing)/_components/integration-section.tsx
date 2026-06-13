'use client';

import asciiBlockchain from '@/public/images/integration/ascii-blockchain.png';
import asciiChains from '@/public/images/integration/ascii-chains.png';
import { motion } from 'framer-motion';
import Image from 'next/image';

export function IntegrationSection() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Feature list items
  const onChainFeatures = [
    'Complete task lifecycle logging',
    'Smart contract-based marketplace',
    'Automated payment settlement',
  ];

  const offChainFeatures = [
    'Real-time event synchronization',
    'Extended data storage & analytics',
    'Intuitive user interface',
  ];

  return (
    <section className="relative w-full py-24 bg-transparent overflow-hidden" id="integrations">
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
          <h2 className="text-4xl md:text-5xl font-onest font-semibold text-center bg-gradient-to-br from-white to-white/75 text-transparent bg-clip-text max-w-[700px] leading-tight mb-6">
            Seamless Integration
          </h2>
          <p className="text-lg md:text-xl font-geist text-center text-gray-500 max-w-[700px]">
            Powerful on-chain and off-chain capabilities working in perfect harmony
          </p>
        </motion.div>

        {/* Features Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col border border-white/25 max-w-[1076px] mx-auto"
        >
          {/* First Row */}
          <div className="flex flex-col md:flex-row w-full border-b border-white/25">
            {/* On-Chain Features Card */}
            <motion.div
              variants={itemVariants}
              className="md:w-[40%] flex flex-col justify-end p-6 md:p-8 md:border-r border-white/25 h-[360px] relative group"
            >
              <div className="flex flex-col gap-1 z-10">
                <h3 className="text-2xl text-white font-onest font-semibold mb-1">
                  On-Chain Features
                </h3>
                <p className="text-gray-500 text-[15px] font-geist">
                  Robust blockchain infrastructure ensuring trust and transparency
                </p>
              </div>
            </motion.div>

            {/* On-Chain Visual Card */}
            <motion.div
              variants={itemVariants}
              className="md:w-[60%] h-[360px] relative overflow-hidden group"
            >
              {/* ASCII Art and Overlays */}
              <div className="absolute inset-0">
                <Image
                  src={asciiChains}
                  alt="ASCII Chains"
                  fill
                  className="object-cover"
                  style={{
                    filter: `
                drop-shadow(0px 0px 3px rgba(177, 148, 245, 0.1))
                drop-shadow(0px 0px 6px rgba(177, 148, 245, 0.1))
                drop-shadow(0px 0px 12px rgba(177, 148, 245, 0.1))
                drop-shadow(0px 0px 24px rgba(177, 148, 245, 0.1))
                drop-shadow(0px 0px 48px rgba(177, 148, 245, 0.1))
                drop-shadow(0px 0px 70px rgba(177, 148, 245, 0.1))
              `,
                  }}
                />
              </div>

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-80"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/10 opacity-10 backdrop-blur-[240px]"></div>

              <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10">
                <p className="text-gray-500 text-[11px] font-geistMono mb-2">[Features]</p>
              </div>

              {/* Feature List */}
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-10">
                <div className="flex flex-col gap-2">
                  {onChainFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.2 }}
                      className="flex items-center gap-1.5 group/item"
                    >
                      <div className="flex-shrink-0">
                        <Image
                          src="/images/integration/check-icon.svg"
                          alt="Check"
                          width={12.5}
                          height={9}
                          className="text-white group-hover/item:scale-110 transition-transform duration-200"
                        />
                      </div>
                      <span className="text-white text-sm font-geist group-hover/item:text-purple-light/90 transition-colors duration-200">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Second Row */}
          <div className="flex flex-col md:flex-row w-full">
            {/* Off-Chain Visual Card */}
            <motion.div
              variants={itemVariants}
              className="md:w-[60%] h-[360px] relative overflow-hidden group md:order-1 md:border-r border-white/25 order-2"
            >
              {/* ASCII Art and Overlays */}
              <div className="absolute inset-0">
                <Image
                  src={asciiBlockchain}
                  alt="ASCII Blockchain"
                  fill
                  className="object-cover"
                  style={{
                    filter: `
                drop-shadow(0px 0px 3px rgba(177, 148, 245, 0.1))
                drop-shadow(0px 0px 6px rgba(177, 148, 245, 0.1))
                drop-shadow(0px 0px 12px rgba(177, 148, 245, 0.1))
                drop-shadow(0px 0px 24px rgba(177, 148, 245, 0.1))
                drop-shadow(0px 0px 48px rgba(177, 148, 245, 0.1))
                drop-shadow(0px 0px 70px rgba(177, 148, 245, 0.1))
              `,
                  }}
                />
              </div>

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-80"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/10 opacity-10 backdrop-blur-[240px]"></div>

              <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10">
                <p className="text-gray-500 text-[11px] font-geistMono mb-2">[Features]</p>
              </div>

              {/* Feature List */}
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-10">
                <div className="flex flex-col gap-2">
                  {offChainFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.2 }}
                      className="flex items-center gap-1.5 group/item"
                    >
                      <div className="flex-shrink-0">
                        <Image
                          src="/images/integration/check-icon.svg"
                          alt="Check"
                          width={12.5}
                          height={9}
                          className="text-white group-hover/item:scale-110 transition-transform duration-200"
                        />
                      </div>
                      <span className="text-white text-sm font-geist group-hover/item:text-purple-light/90 transition-colors duration-200">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Off-Chain Features Card */}
            <motion.div
              variants={itemVariants}
              className="md:w-[40%] flex flex-col justify-end p-6 md:p-8 h-[360px] relative group md:order-2 order-1"
            >
              <div className="flex flex-col gap-1 z-10">
                <h3 className="text-2xl text-white font-onest font-semibold mb-1">
                  Off-Chain Features
                </h3>
                <p className="text-gray-500 text-[15px] font-geist">
                  Enhanced user experience and advanced functionality
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
