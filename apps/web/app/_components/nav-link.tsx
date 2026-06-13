'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NavLink = ({ to, children }: { to: string; children: string }) => {
  const pathname = usePathname();
  const [hash, setHash] = useState('');

  // Handle hash changes on the client side only
  useEffect(() => {
    setHash(window.location.hash);

    // Listen for hash changes
    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Split the 'to' prop into pathname and hash parts
  const [toPathname, toHash] = to.split('#');

  const isActive = toHash
    ? pathname === toPathname && hash === `#${toHash}`
    : pathname === to && hash === '';

  return (
    <Link
      href={to}
      className={`nav-link-v2 text-[11px] xl:text-[15px] px-2 xl:px-4 py-4  ${isActive ? 'active' : ''}`}
    >
      {children}
    </Link>
  );
};

export default NavLink;
