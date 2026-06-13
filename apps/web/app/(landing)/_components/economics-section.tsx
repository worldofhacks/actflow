'use client';

import circleIcon from '@/public/images/economics/circle-icon.png';
import lockIcon from '@/public/images/economics/lock-icon.png';
import targetIcon from '@/public/images/economics/target-icon.png';
import treasureIcon from '@/public/images/economics/treasure-icon.png';
import { motion } from 'framer-motion';
import Image, { StaticImageData } from 'next/image';

interface EconomicsCardProps {
  iconSrc: StaticImageData;
  title: string;
  description: string;
  delay: number;
  index: number;
}

const EconomicsCard = ({ iconSrc, title, description, delay }: EconomicsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="flex flex-col justify-end items-center h-full relative group"
    >
      <div
        className={`w-full h-[320px] md:max-w-[306px] max-w-[343px] rounded-3xl border border-gradient-gray bg-white/[0.02] backdrop-blur-lg p-5 pb-6
        flex flex-col justify-end items-center gap-6 overflow-hidden transition-all duration-300
        group-hover:shadow-xl group-hover:-translate-y-1`}
      >
        <div className="w-full relative content-center">
          <Image
            src={iconSrc}
            alt={title}
            width={165}
            height={158}
            className="object-contain mx-auto w-[165px] h-[158px]"
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
        </div>
        <div className="flex flex-col items-center gap-2">
          <h3 className="font-geistMono font-semibold text-xl text-white text-center group-hover:text-act-accent transition-colors duration-300">
            {title}
          </h3>
          <p className="self-stretch text-center justify-start text-zinc-500 text-[15px] font-normal font-geist">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export function EconomicsSection() {
  const economicsFeatures = [
    {
      iconSrc: circleIcon,
      title: 'Name Your Price',
      description:
        'Users have complete freedom to set their own prices for tasks, creating a truly market-driven ecosystem.',
    },
    {
      iconSrc: targetIcon,
      title: 'Minimal Fee',
      description:
        "We take only a small fee from each transaction, keeping more money in our users' pockets.",
    },
    {
      iconSrc: treasureIcon,
      title: 'Community Benefits',
      description:
        'Platform fees are used support the ACT community and development. This platform is Built by ACT for ACT.',
    },
    {
      iconSrc: lockIcon,
      title: 'Completely Secure',
      description:
        'Unless you share your private keys you cannot have loss of funds or account loss. Security is implemented at the core of our platform.',
    },
  ];

  return (
    <section className="relative w-full py-24  overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 backdrop-blur-3xl opacity-30"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-act-accent/5 blur-[150px] rounded-full"></div>

      <motion.div
        className="relative z-10 container mx-auto px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-onest font-semibold text-center bg-gradient-to-br from-white to-white/75 text-transparent bg-clip-text max-w-[780px] leading-tight mb-4">
            Token Economics & Fee Structure
          </h2>
          <p className="text-lg md:text-xl font-geist text-center text-gray-500 max-w-[800px]">
            A transparent approach that empowers our community and rewards token holders
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="flex flex-wrap items-center justify-center gap-6 px-0 md:px-16 lg:px-18">
          {economicsFeatures.map((feature, index) => (
            <EconomicsCard
              key={index}
              iconSrc={feature.iconSrc}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
              index={index}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
