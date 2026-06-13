import Image from 'next/image';
import { CompleteProfileForm } from './_components/complete-profile-form';
export default function CompleteProfilePage() {
  return (
    <div className=" overflow-hidden my-auto mx-auto inset-0 px-4 py-8">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/ascii-stars.png"
          alt="ASCII Stars"
          fill
          style={{ objectFit: 'cover' }}
          quality={100}
          priority
        />
      </div>

      {/* ASCII Planet Background */}
      <div className="absolute mx-auto my-auto -z-20 lg:size-4/5 inset-0 ">
        <Image
          src="/images/ascii-planet.png"
          alt="ASCII Planet"
          fill
          quality={100}
          priority
          className="flex w-full h-full object-cover overflow-visible opacity-40"
        />
      </div>

      {/* ASCII Planet Glow Background */}
      {/* <div className="absolute inset-0 -z-20">
        <Image
          src="/images/ascii-planet-glow.png"
          alt="ASCII Planet"
          fill
          style={{ objectFit: 'cover', opacity: 0.15 }}
          quality={100}
          priority
        />
      </div> */}
      <CompleteProfileForm />
    </div>
  );
}
