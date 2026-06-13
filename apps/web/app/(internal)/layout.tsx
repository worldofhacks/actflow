import Footer from '@/app/_components/footer';
import Image from 'next/image';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 w-screen h-screen -z-10">
        <Image
          src="/images/ascii-planet-glow.png"
          alt="ASCII Planet"
          fill
          quality={100}
          priority
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          className="opacity-[0.2]"
        />
      </div>
      <div>
        <main className="py-20 h-full w-full  flex flex-col lg:min-h-[calc(100vh-92px-56px)] min-h-[calc(100vh-64px-56px)] lg:max-w-[1296px] lg:mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </>
  );
}
