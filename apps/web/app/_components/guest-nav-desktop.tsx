// components/ui/v2/TopNavigationV2.tsx

import NavLink from '@/app/_components/nav-link';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Logo } from './logo';

// 1. Logo Component
const NavLogo: React.FC = () => {
  return (
    <div className="w-1/2  ">
      <Logo url="/" />
    </div>
  );
};

// 2. Links Component
const NavLinks: React.FC = () => {
  return (
    <div className="hidden md:flex w-full items-center justify-center md:space-x-2">
      <NavLink to="/">Home</NavLink>
      <NavLink to="/#howItWorks">How It Works</NavLink>
      <NavLink to="/#features">Features</NavLink>
      <NavLink to="/#integrations">Integrations</NavLink>
      <NavLink to="/#plugins">Plugins</NavLink>
      <NavLink to="/#faq">FAQ</NavLink>
    </div>
  );
};

// 3. Action Buttons Component
interface NavButtonsProps {
  setShowLoginModal: (show: boolean) => void;
  setShouldLoginWithWallet: (should: boolean) => void;
  setAuthMode: (mode: 'login' | 'signup') => void;
  isLoading: boolean;
}

const NavButtons: React.FC<NavButtonsProps> = ({
  setShowLoginModal,
  setShouldLoginWithWallet,
  setAuthMode,
  isLoading,
}) => {
  return (
    <div className="hidden md:flex w-1/2  md:items-center justify-end md:space-x-4">
      <Button
        variant="secondary"
        onClick={() => {
          setShowLoginModal(true);
          setShouldLoginWithWallet(false);
          setAuthMode('login');
        }}
        disabled={isLoading}
      >
        Sign In
      </Button>
      <Button
        onClick={() => {
          setShowLoginModal(true);
          setShouldLoginWithWallet(false);
          setAuthMode('signup');
        }}
        disabled={isLoading}
      >
        Get Started
      </Button>
    </div>
  );
};

// Main GuestNav component that composes the three components
const GuestNavDesktop: React.FC<NavButtonsProps> = props => {
  return (
    <nav className="hidden lg:flex  items-center justify-between bg-transparent backdrop-blur-sm sticky top-0 z-10 h-[92px] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-white/0 after:via-white/50 after:to-white/0">
      <div className="sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16">
          <NavLogo />
          <NavLinks />
          <NavButtons {...props} />
        </div>
      </div>
    </nav>
  );
};

export { GuestNavDesktop, NavButtons, NavLinks, NavLogo };
