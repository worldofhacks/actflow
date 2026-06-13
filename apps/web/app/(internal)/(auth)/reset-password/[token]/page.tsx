import { ResetPasswordForm } from '@/app/(internal)/(auth)/reset-password/[token]/_components/reset-password-form';
import heroBg from '@/public/anime-hero-bg.png';
import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your password',
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute inset-x-0 flex justify-center -z-20 overflow-hidden">
        <Image
          src={heroBg}
          alt="Wait Background"
          className="animate-[kenburns_10s_ease-in-out_infinite] object-cover w-full
            md:object-center object-top min-h-screen"
          quality={100}
          priority
        />
      </div>
      <div className="bg-act-base-dark rounded-2xl p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted-foreground">Enter your new password below.</p>
          </div>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
