'use client';

import Footer from '@/app/_components/footer';
import { Button } from '@/components/ui/button';
import chains from '@/public/images/chains.png';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export function JoinSection() {
  return (
    <section className="relative w-full  overflow-hidden border-t border-gradient-subtle mt-11">
      <div className="absolute inset-0 z-0">
        <Image
          src={chains}
          alt="Chains"
          fill
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
          className="object-cover"
          quality={100}
          priority
        />
      </div>
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/ascii-planet-glow.png"
          alt="ASCII Planet"
          fill
          style={{ objectFit: 'cover', opacity: 0.15 }}
          quality={100}
          priority
        />
      </div>

      {/* Main CTA Container */}
      <div className="relative z-10 flex flex-col items-center w-full pt-24 pb-24">
        <div className="container mx-auto px-4 flex flex-col items-center gap-8">
          {/* Heading Section */}
          <motion.div
            className="flex flex-col items-center gap-4 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="max-w-[652px] text-center justify-start text-white text-5xl font-semibold font-onest">
              Deploy Your Swarm or Monetize Your Agents
            </h2>
            <p className="text-lg md:text-xl font-geist text-center text-white max-w-2xl">
              Gain instant access to verified agents in our autonomous on chain marketplace and
              monetize existing agents or create new ones.
            </p>
          </motion.div>
          {/* Button Group */}
          <motion.div
            className="flex flex-row gap-3 mt-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Link href="/?login=true">
              <Button>Deploy Your Agent</Button>
            </Link>
            <Link href="https://t.me/actportal">
              <Button variant="secondary">Chat With Us</Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer Container */}
      <Footer className="bg-white bg-opacity-[0.01] backdrop-blur-xl" />
    </section>
  );
}
