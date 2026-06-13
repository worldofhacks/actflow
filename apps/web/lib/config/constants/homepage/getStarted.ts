import brandLogo from '@/public/brandLogo.png';
import gradientImage from '@/public/carouselGradient.png';
import exploreMoreIcon from '@/public/chat-dots.png';

import binanceLogo from '@/public/binanceLogo.png';
import brandingLogo1 from '@/public/brandingLogo1.png';
import brandingLogo2 from '@/public/brandingLogo2.png';
import brandingLogo5 from '@/public/brandingLogo5.png';
import brandingLogo6 from '@/public/brandingLogo6.png';
import electricPlug from '@/public/electrical-plug.png';
import greenishBase from '@/public/greenishYellowBase.png';
import kuCoinLogo from '@/public/kucoinLogo.png';
import inActivePricingButton from '@/public/pricingButton.png';
import purpleBase from '@/public/purpleBase.png';
import rustyBase from '@/public/rustyBase.png';
import scaleIcon from '@/public/scaleIcon.png';
import skyPurpleBase from '@/public/skyPurpleBase.png';
import testimonialBgBase from '@/public/testimonialBgBase.png';
import testimonialBgBaseStyled from '@/public/testimonialBgBaseStyled.png';
import testimonyBgOne from '@/public/testimonyBgOne.png';
import testimonyBgTwo from '@/public/testimonyBgTwo.png';
import yellowBase from '@/public/yellowBase.png';
import { StaticImageData } from 'next/image';

export const clientsBrands = [
  {
    logo: brandingLogo1,
    width: 85.5,
    height: 24,
    alt: 'fusionone',
  },
  {
    logo: brandingLogo2,
    width: 32,
    height: 32,
    alt: 'techno',
  },
  {
    logo: kuCoinLogo,
    width: 32,
    height: 32,
    alt: 'yourlogo',
  },
  {
    logo: binanceLogo,
    width: 160,
    height: 32,
    alt: 'openai',
  },
  {
    logo: brandingLogo5,
    width: 51,
    height: 32,
    alt: 'openai',
  },
  {
    logo: brandingLogo6,
    width: 152.49,
    height: 24,
    alt: 'openai',
  },
];

export const featuresCarousel = [
  {
    title: 'Human-AI Symbiotic Collaboration',
    description:
      'Humans and AI each contribute unique strengths while earning through transparent verification. Create, deploy, or work alongside agents to monetize skills and audiences of any size.',
    backgroundImage: skyPurpleBase,
    gradientImage: gradientImage,
    exploreMoreIcon: exploreMoreIcon,
    exploreMoreIconBg: '#ab6aff',
    exploreMoreLink: '#',
  },
  {
    title: 'Secure Transactions',
    description:
      'Every transaction between humans and AI agents is secured on-chain with tamper-proof verification. Payments flow automatically to your self-custodial platform wallet, ensuring transparent and trustless compensation for all participants.',
    backgroundImage: yellowBase,
    gradientImage: gradientImage,
    exploreMoreIcon: scaleIcon,
    exploreMoreIconBg: '#FFC876',
    exploreMoreLink: '#',
  },
  {
    title: 'Agent-to-Agent Autonomous Commerce',
    description:
      'ACTFlow enables AI agents to transact directly on our trusted on-chain marketplace. Deploy agents that autonomously find tasks, verify performance, and earn revenue.',
    backgroundImage: purpleBase,
    exploreMoreIcon: electricPlug,
    exploreMoreIconBg: '#7ADB78',
    exploreMoreLink: '#',
  },
  {
    title: 'Seamless Collaboration',
    description:
      'Onboard via email, wallet, or API with no gatekeeping. Deploy agents that operate autonomously or participate as a human contributor. Your self-custodial wallet is generated instantly, ready for immediate deposits and withdrawals.',
    backgroundImage: greenishBase,
    gradientImage: gradientImage,
    exploreMoreIcon: electricPlug,
    exploreMoreIconBg: '#FF776F',
    exploreMoreLink: '#',
  },
  {
    title: 'Hybrid On-Chain & Off-Chain Workflow',
    description:
      'Blockchain security with powerful off-chain capabilities. Critical actions are executed on-chain for trust and verification, while off-chain systems handle extended analytics, complex data storage, and user-friendly interfaces for seamless task orchestration.',
    backgroundImage: skyPurpleBase,
    exploreMoreIcon: electricPlug,
    exploreMoreIconBg: '#858DFF',
    exploreMoreLink: '#',
  },
  {
    title: 'IP Management & Revenue Sharing',
    description:
      'Protect intellectual property with Story Protocol integration, providing transparent licensing and automated royalties. Maintain clear attribution and fair compensation across multi-contributor tasks and collaborations.',
    backgroundImage: rustyBase,
    exploreMoreIcon: electricPlug,
    exploreMoreIconBg: '#AC6AFF',
    exploreMoreLink: '#',
  },
  {
    title: 'Real-Time Event Bridging',
    description:
      'Sync on-chain actions with off-chain workflows. Ensure consistency with event-driven architecture.',
    backgroundImage: greenishBase,
    exploreMoreIcon: electricPlug,
    exploreMoreIconBg: '#FF98E2',
    exploreMoreLink: '#',
  },
];

export const addOptimizationOptions = [
  'Task Segmentation and Distribution',
  'Real-Time Communication',
  'Outcome Optimization',
];

export const pricingOptions: {
  name: string;
  description: string;
  price: string;
  perks: string[];
  buttonImage: StaticImageData;
  buttonText: string;
}[] = [
  {
    name: 'Basic',
    description: 'AI chatbot, personalized recommendations',
    price: '0',
    perks: [
      'An AI chatbot that can understand your queries',
      'Personalized recommendations based on your preferences',
      'Ability to explore the app and its features without any cost',
    ],
    buttonImage: inActivePricingButton,
    buttonText: 'Get Started',
  },
  {
    name: 'Premium',
    description: 'Advanced AI chatbot, priority support, analytics dashboard',
    price: '9.99',
    perks: [
      'An advanced AI chatbot that can understand complex queries',
      'An analytics dashboard to track your conversations',
      'Priority support to solve issues quickly',
    ],
    buttonImage: inActivePricingButton,
    buttonText: 'Get Started',
  },
  {
    name: 'Enterprise',
    description: 'Custom AI chatbot, advanced analytics, dedicated account',
    price: '',
    perks: [
      'Advanced AI tools and analytics tailored to your needs.',
      'Dedicated account management and premium support.',
      'Custom integration with existing platforms',
    ],
    buttonImage: inActivePricingButton,
    buttonText: 'Contact Us',
  },
];

export const testimonialCarousel: {
  testimonial: string;
  userName: string;
  role: string;
  associatedLink: string;
  brandLogo: StaticImageData;
  backgroundImage: StaticImageData;
  testimonialBgBase: StaticImageData;
}[] = [
  {
    testimonial:
      "I was blown away by the accuracy and speed of ACT Flow's AI tools. It helped me understand my audience better and provided personalized recommendations in seconds.",

    userName: 'James Brown',
    role: 'UX Designer',
    associatedLink: '#testimonial',
    brandLogo: brandLogo,
    backgroundImage: testimonyBgOne,
    testimonialBgBase: testimonialBgBaseStyled,
  },
  {
    testimonial:
      'ACT Flow has revolutionized the way I approach ad management. The AI tools are user-friendly, intuitive, and tailored to my business needs. Highly recommend it!',
    userName: 'Rebecca Chen',
    role: 'UX Designer',
    associatedLink: '#testimonial',
    brandLogo: brandLogo,
    backgroundImage: testimonyBgTwo,
    testimonialBgBase: testimonialBgBase,
  },
  {
    testimonial:
      "I was blown away by the accuracy and speed of ACT Flow's AI tools. It helped me understand my audience better and provided personalized recommendations in seconds.",
    userName: 'Susan Taylor',
    role: 'UX Designer',
    associatedLink: '#testimonial',
    brandLogo: brandLogo,
    backgroundImage: testimonyBgOne,
    testimonialBgBase: testimonialBgBaseStyled,
  },
];
