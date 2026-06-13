import telegram from '@/public/logos/tg.png';
import x from '@/public/logos/x.png';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from './logo';

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  return (
    <footer
      className={`relative bg-black pt-4 pb-4 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-white/0 before:via-white/50 before:to-white/0 ${className}`}
    >
      {/* large screen footer */}
      <div className="justify-between items-center lg:px-[72px] px-10 flex">
        {/* logo */}
        <div>
          <Logo />
        </div>
        {/* links */}
        <div className="flex items-center justify-center w-full gap-4">
          <Link
            target="_blank"
            href="https://t.me/actportal"
            className="text-gray-500 hover:text-white font-geistMono font-normal text-[14px] leading-none tracking-[-0.01em]"
          >
            <Image width={20} height={20} src={telegram} alt="Telegram" />
          </Link>

          <Link
            target="_blank"
            href="https://x.com/ACTICOMMUNITY"
            className="text-gray-500 hover:text-white font-geistMono font-normal text-[14px] leading-none tracking-[-0.01em]"
          >
            <Image width={30} height={30} src={x} alt="X" />
          </Link>
        </div>
        {/* copyright */}
        <div>
          <p className="font-geistMono font-normal text-[14px] leading-none tracking-[-0.01em] text-right text-gray-500">
            &copy;{new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
