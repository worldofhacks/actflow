import { Geist, Geist_Mono, Onest, Sora, Source_Code_Pro, Space_Grotesk } from 'next/font/google';
import localFont from 'next/font/local';

export const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

export const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-code-pro',
  display: 'swap',
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const onest = Onest({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-onest',
  display: 'swap',
});

export const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const exeroeFuturistic = localFont({
  src: [
    {
      path: '../../public/fonts/Exeroe.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Futuristic.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-exeroe-futuristic',
  display: 'swap',
});
