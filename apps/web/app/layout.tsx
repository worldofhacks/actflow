import { getUserRoleFromCookies } from '@/actions/role';
import { Toaster } from '@/components/ui/toaster';
import { Role } from '@/types/user';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import 'react-multi-carousel/lib/styles.css';
import {
  exeroeFuturistic,
  geist,
  geistMono,
  onest,
  sora,
  sourceCodePro,
  spaceGrotesk,
} from '../lib/config/fonts';
import { getCurrentUser } from '../lib/service/userService';
import Navbar from './_components/navbar';
import './globals.css';
import { Providers } from './Providers';

export const metadata: Metadata = {
  title: 'Be the First to Experience Act Flow',
  description: 'Act Flow is a platform for creating and managing AI agents.',
  openGraph: {
    images: [
      {
        url: '/logos/logo-v2.png',
        alt: 'Act Flow Logo',
        width: 1300,
        height: 1080,
      },
    ],
    title: 'Be the First to Experience Act Flow',
    description: 'Act Flow is a platform for creating and managing AI agents.',
    url: 'https://actflow.ai',
    siteName: 'Act Flow',
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/logos/logo-v2.png',
  },
  metadataBase: new URL('https://actflow.ai'),
  twitter: {
    images: [{ url: '/logos/logo-v2.png', alt: 'Act Flow Logo', width: 1300, height: 1080 }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userRole = await getUserRoleFromCookies();
  const userResponse = await getCurrentUser();
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/newLogo.png" />
      </head>
      <body
        className={`${sora.variable} ${sourceCodePro.variable} ${spaceGrotesk.variable} ${onest.variable} ${geist.variable} ${geistMono.variable} ${exeroeFuturistic.variable}  bg-black font-onest`}
      >
        {/* Background layers are now positioned over the body bg-color */}
        <div className="fixed inset-0 bg-repeat opacity-[0.04] z-[-1] bg-[url(/images/backgroundMeshIcon.png)] bg-[length:86px_86px]" />

        <Providers>
          <Suspense>
            <Navbar userRole={userRole ?? Role.User} user={userResponse.data} />
          </Suspense>

          {/* Main content with padding to account for fixed nav */}
          <main className="relative lg:pt-[92px] pt-[64px]">{children}</main>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
