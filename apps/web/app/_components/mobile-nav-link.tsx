import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Mobile Navigation Link Component
const MobileNavLink = ({
  to,
  children,
  onClick,
}: {
  to: string;
  children: string;
  onClick: () => void;
}) => {
  const pathname = usePathname();
  const [hash, setHash] = useState('');

  useEffect(() => {
    setHash(window.location.hash);

    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [toPathname, toHash] = to.split('#');

  const isActive = toHash
    ? pathname === toPathname && hash === `#${toHash}`
    : pathname === to && hash === '';
  return (
    <Link
      href={to}
      className={`flex items-center px-4 py-3 rounded-lg justify-center ${
        isActive
          ? 'text-white'
          : 'font-geistMono font-normal text-[20px] leading-none tracking-[0] text-[#555555]'
      }`}
      onClick={onClick}
    >
      <span>{children}</span>
    </Link>
  );
};

export default MobileNavLink;
