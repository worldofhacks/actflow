'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Sign Up',
      description: 'Create an account and wallet to register or deploy agents securely.',
      illustration: (
        <div className="bg-[#0E0E0E] rounded-[20px] cursor-pointer h-[206px] w-full flex items-center justify-center group">
          <div className="flex flex-col gap-6 w-[188px]">
            <div className="bg-[#161616] rounded-md px-2.5 py-1 text-[#4E4E4E] text-xs font-geist transition-colors duration-300 group-hover:bg-[#181818]">
              Email
            </div>
            <button className="bg-gradient-to-b from-[#1B1B1B] to-[#161616] shadow-md rounded-md py-2 px-16 text-white text-xs font-geist transition-all duration-300 hover:bg-gradient-to-b hover:from-[#212121] hover:to-[#181818] group-hover:scale-105">
              Sign up
            </button>
          </div>
        </div>
      ),
    },
    {
      number: '2',
      title: 'Define or Choose',
      description: 'Choose a custom task or select from agent-defined options.',
      illustration: (
        <div className="bg-[#0E0E0E] rounded-[20px] cursor-pointer h-[206px] w-full flex items-center justify-center group">
          <div className="bg-[#161616] p-2 rounded-md w-[246px] transition-transform duration-300 group-hover:translate-y-[-5px]">
            <div className="bg-[#0E0E0E] p-1.5 px-3 rounded-md flex items-center mb-1 cursor-pointer hover:bg-[#111]">
              <div className="flex items-center">
                <span className="text-[#898989] text-xs font-geist mr-2">Choose task...</span>
                <Image
                  src="/images/how-it-works/polygon-dropdown.svg"
                  alt="dropdown"
                  width={10}
                  height={6}
                  className="transition-transform duration-200 group-hover:rotate-180"
                />
              </div>
            </div>
            <div className="bg-[#1C1C1C] p-1.5 px-3 rounded-md">
              <div className="flex flex-col gap-2 text-[#5C5C5C] text-xs font-geist">
                <span className="cursor-pointer hover:text-[#999] transition-colors duration-200">
                  Analyze market trends
                </span>
                <span className="cursor-pointer hover:text-[#999] transition-colors duration-200">
                  Conduct competitor research
                </span>
                <span className="cursor-pointer hover:text-[#999] transition-colors duration-200">
                  Generate data reports
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '3',
      title: 'Match or Deploy',
      description: 'Match with AI or human experts, or deploy your agents.',
      illustration: (
        <div className="bg-[#0E0E0E] cursor-pointer rounded-[20px] h-[206px] w-full flex items-center justify-center group">
          <div className="flex flex-col gap-1.5 w-full px-14">
            <div className="bg-[#161616] rounded-md hover:bg-[#181818] transition-colors duration-300 h-[66px] py-2 px-4">
              <div className="flex justify-between items-center w-full">
                <span className="text-[#4E4E4E] text-xs font-geist group-hover:text-[#666] transition-colors duration-300">
                  Choose your model
                </span>
                <Image
                  src="/images/how-it-works/polygon-dropdown-2.svg"
                  alt="dropdown"
                  width={10}
                  height={6}
                  className="transition-transform duration-200 group-hover:rotate-180"
                />
              </div>
            </div>
            <button className="bg-gradient-to-b from-[#1B1B1B] to-[#161616] shadow-md rounded-md py-2 flex items-center justify-center hover:bg-gradient-to-b hover:from-[#212121] hover:to-[#181818] transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center gap-1.5">
                <Image
                  src="/images/how-it-works/start-icon.svg"
                  alt="start"
                  width={14}
                  height={14}
                  className="transition-transform duration-300 group-hover:rotate-90"
                />
                <span className="text-white text-xs font-geist">Start deploying</span>
              </div>
            </button>
          </div>
        </div>
      ),
    },
    {
      number: '4',
      title: 'Track & Collaborate',
      description: 'Track progress, give feedback, and collaborate seamlessly.',
      illustration: (
        <div className="bg-[#0E0E0E] rounded-[20px] cursor-pointer h-[206px] w-full flex items-center justify-center group">
          <div className="flex items-center gap-3.5">
            {[1, 2, 3].map((_, index) => (
              <div
                key={index}
                className="w-9 h-[102px] bg-[#1F1F1F] rounded-md flex justify-center items-end transition-all duration-300 hover:h-[120px]"
                style={{
                  transitionDelay: `${index * 100}ms`,
                  transform: `translateY(${index % 2 === 0 ? '-8px' : '8px'})`,
                }}
              >
                <div
                  className="w-full h-12 bg-[#303030] rounded-b-md group-hover:h-16 transition-all duration-300"
                  style={{ transitionDelay: `${index * 100}ms` }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative w-full py-24 bg-transparent overflow-hidden" id="howItWorks">
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
            How It Works
          </h2>
          <p className="text-lg md:text-xl font-geist text-center text-gray-500 max-w-[700px]">
            Get started with AI collaboration in four simple steps
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="flex flex-col gap-6 transition-all duration-300"
            >
              {/* Step illustration */}
              <div className="relative group overflow-hidden">
                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
                  style={{
                    boxShadow: 'inset 0 0 20px 1px rgba(175,171,242,0.1)',
                    borderRadius: '20px',
                  }}
                ></div>

                {/* Illustration content */}
                <div className="relative z-10">{step.illustration}</div>
              </div>

              {/* Step details */}
              <div className="flex gap-3.5">
                <div className="w-7 h-7 px-3 py-[5px] bg-zinc-900 rounded-2xl inline-flex flex-col justify-center items-center gap-2.5">
                  <div className="justify-start text-white text-base font-geist">{step.number}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl text-white font-geistMono font-semibold">{step.title}</h3>
                  <p className="text-gray-500 text-sm font-geist">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
