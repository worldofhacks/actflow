'use client';

import { Button } from '@/components/ui/button';
import asciiPC from '@/public/images/plugins/ascii-pc.png';
import comingSoon from '@/public/images/plugins/comingSoon.png';
import rotatedPlugin from '@/public/images/plugins/rotatedPlugin.png';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export function PluginsSection() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Feature items data
  const featuresData = [
    {
      icon: '/images/plugins/share-network-icon.svg',
      title: 'Seamless connectivity',
    },
    {
      icon: '/images/plugins/user-gear-icon.svg',
      title: 'Enhanced agent capabilities',
    },
    {
      icon: '/images/plugins/cloud-check-icon.svg',
      title: 'Real-time synchronization',
    },
  ];

  return (
    <section className="relative w-full py-24 overflow-hidden" id="plugins">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 backdrop-blur-3xl opacity-30"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-purple-light/5 blur-[150px] rounded-full"></div>

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto px-4 max-w-[1076px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center mb-20"
        >
          <div className="bg-black border-[0.5px] border-gray-section-starter-border rounded-xl px-3 py-2 mb-4 backdrop-blur-md">
            <span className="text-[11px] font-geistMono text-gray-section-starter">Plugins</span>
          </div>
          <h2 className=" font-onest font-semibold text-center bg-gradient-to-br from-white to-white/75 text-transparent bg-clip-text max-w-[700px] text-heading-2 mb-6">
            MCP and Plugin Support
          </h2>
          <p className="text-lg md:text-xl font-geist text-center text-gray-500 max-w-[700px]">
            Extend your agent capabilities with our growing ecosystem of plugins
          </p>
        </motion.div>

        {/* Plugin Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col md:flex-row gap-12 md:gap-20 mt-16"
        >
          {/* Left side - Plugin information */}
          <motion.div variants={itemVariants} className="flex-1 order-2 md:order-1">
            <div className="mb-3 hidden md:block">
              <div className="inline-block bg-black border-[0.5px] border-gray-section-starter-border rounded-xl px-3 py-2 mb-4 backdrop-blur-md">
                <span className="text-[11px] font-geistMono text-gray-section-starter">
                  Native Integration
                </span>
              </div>
            </div>
            <h3 className="text-2xl font-geistMono font-semibold text-white mb-4">
              Plugins and MCP
            </h3>
            <p className="text-gray-500 text-[15px] leading-relaxed mb-6">
              Our native ElizaOS plugin and MCP provides seamless integration between ACTFlow and
              all agents. Unlock powerful capabilities and enhanced performance with zero
              configuration.
            </p>

            {/* Feature list */}
            <div className="space-y-4 mb-6">
              {featuresData.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center space-x-3 group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#121212] to-[#272727] flex items-center justify-center rounded-lg border border-white/3 group-hover:border-white/10 transition-all duration-300">
                    <Image
                      src={feature.icon}
                      alt={feature.title}
                      width={16}
                      height={16}
                      className="group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-sm font-geist text-white group-hover:text-purple-light transition-colors duration-300">
                    {feature.title}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="relative"
            >
              <Link target="_blank" href="https://github.com/ACT-LABS-IO">
                <Button>Github</Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex-1 relative min-h-[400px] order-1 md:order-2"
          >
            <div className="absolute inset-0 shadow-2xl">
              <div className="absolute inset-0 text-center px-4 md:px-0">
                <div className="relative inline-block ">
                  <Image
                    src={asciiPC}
                    alt="ASCII art"
                    className="object-contain border border-white/10 rounded-2xl bg-[#080808]"
                    style={{
                      position: 'relative',
                      zIndex: 2,
                    }}
                  />

                  <Image
                    src={rotatedPlugin}
                    alt="ASCII art"
                    className="object-contain rounded-2xl"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 1,
                      background: '#2D2D2D',
                      transform: 'rotate(-7deg)', // Anti-clockwise rotation
                      filter:
                        'brightness(0.5) ' /* Reduce brightness for dullness */ +
                        'contrast(0.7) ' /* Reduce contrast for flatness */ +
                        'sepia(0.5) ' /* Add vintage effect */ +
                        'hue-rotate(0deg) ' /* Rotate color hue toward purple */ +
                        'saturate(1.2)' /* Slightly boost saturation to enhance purple */,
                    }}
                  />

                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundImage: 'url(/dotPattern.png)',
                      backgroundRepeat: 'repeat',
                      backgroundSize: '20px 20px',
                      opacity: 0.1,
                      zIndex: 3,
                      pointerEvents: 'none', // Ensures clicks pass through to the image
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-20 opacity-50"></div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col items-center justify-center border border-gray-700 border-dashed rounded-2xl py-8 px-6 md:px-12 backdrop-blur-sm bg-white/3 max-w-[636px] mx-auto"
        >
          <div className="flex mb-6">
            <Image
              src={comingSoon}
              alt="Coming Soon"
              className="w-[81px] h-[33px] md:w-[120px] md:h-[48px]"
            />
          </div>

          <h3 className="text-2xl font-geistMono font-semibold text-white mb-4 text-center">
            More Plugins Coming Soon
          </h3>
          <p className="text-gray-500 text-[15px] leading-relaxed mb-6 text-center max-w-[600px]">
            We&apos;re expanding our plugin ecosystem to support more agent kits and platforms. Stay
            tuned for additional integrations to enhance your agent capabilities.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
