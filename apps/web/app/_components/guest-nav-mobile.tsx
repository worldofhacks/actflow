// components/ui/v2/GuestNavMobile.tsx

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import crossIcon from '@/public/crossIcon.png';
import menuIcon from '@/public/menuIcon.png';
import Image from 'next/image';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import MobileNavLink from './mobile-nav-link';

interface GuestNavMobileProps {
  isLoading: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  setShowLoginModal: (show: boolean) => void;
  setShouldLoginWithWallet: (should: boolean) => void;
  setAuthMode: (mode: 'login' | 'signup') => void;
}

// Mobile Logo Header Component
const MobileNavHeader: React.FC<{
  toggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}> = ({ toggleMobileMenu, isMobileMenuOpen }) => (
  <div className="flex items-center justify-between px-4 py-3 h-full">
    <Logo url="/" />
    <button
      onClick={toggleMobileMenu}
      className="w-8 h-8 relative before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-tr before:from-[#121212] before:to-[#272727] before:rounded-[6px] flex items-center justify-center"
    >
      {isMobileMenuOpen ? (
        <Image src={crossIcon} alt="Cross Icon" width={10} height={10} />
      ) : (
        <Image src={menuIcon} alt="Menu Icon" width={16} height={7} />
      )}
    </button>
  </div>
);

// Mobile Links Component
const MobileNavLinks: React.FC<{
  handleMobileNavLinkClick: () => void;
}> = ({ handleMobileNavLinkClick }) => (
  <div className="pb-4">
    <MobileNavLink to="/" onClick={handleMobileNavLinkClick}>
      Home
    </MobileNavLink>
    <MobileNavLink to="/#howItWorks" onClick={handleMobileNavLinkClick}>
      How It Works
    </MobileNavLink>
    <MobileNavLink to="/#features" onClick={handleMobileNavLinkClick}>
      Features
    </MobileNavLink>
    <MobileNavLink to="/#integrations" onClick={handleMobileNavLinkClick}>
      Integrations
    </MobileNavLink>
    <MobileNavLink to="/#plugins" onClick={handleMobileNavLinkClick}>
      Plugins
    </MobileNavLink>
    <MobileNavLink to="/#faq" onClick={handleMobileNavLinkClick}>
      FAQ
    </MobileNavLink>
  </div>
);

// Mobile Action Buttons Component
const MobileNavButtons: React.FC<{
  isLoading: boolean;
  closeMenu: () => void;
  setShowLoginModal: (show: boolean) => void;
  setShouldLoginWithWallet: (should: boolean) => void;
  setAuthMode: (mode: 'login' | 'signup') => void;
}> = ({ isLoading, closeMenu, setShowLoginModal, setShouldLoginWithWallet, setAuthMode }) => (
  <div className="pt-8 space-y-3 pb-8 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-white/0 before:via-white/50 before:to-white/0 w-full">
    <Button
      variant="secondary"
      className="w-full"
      disabled={isLoading}
      onClick={() => {
        closeMenu();
        setShowLoginModal(true);
        setShouldLoginWithWallet(false);
        setAuthMode('login');
      }}
    >
      <span className="font-geistMono font-semibold text-[15px] leading-none tracking-[0] text-white">
        Sign In
      </span>
    </Button>
    <Button
      variant="secondary"
      disabled={isLoading}
      className="w-full"
      onClick={() => {
        closeMenu();
        setShowLoginModal(true);
        setShouldLoginWithWallet(false);
        setAuthMode('signup');
      }}
    >
      Get Started
    </Button>
  </div>
);

// Main GuestNavMobile Component
const GuestNavMobile: React.FC<GuestNavMobileProps> = ({
  isLoading,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  setShowLoginModal,
  setShouldLoginWithWallet,
  setAuthMode,
}) => {
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle mobile nav link click (closes menu)
  const handleMobileNavLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Close menu helper
  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="lg:hidden bg-black backdrop-blur-sm sticky top-0 z-10 h-[64px] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-white/0 after:via-white/50 after:to-white/0">
      <MobileNavHeader toggleMobileMenu={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Mobile Menu Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTitle className="hidden">Guest Nav Mobile Menu</SheetTitle>
        <SheetContent
          showCloseButton={false}
          side="right"
          className="w-full p-0 border-r-0 h-full bg-black mt-[64px]"
        >
          <div className="px-4 py-6 space-y-2 overflow-y-auto h-[calc(100vh-64px)] scrollbar-hide bg-black flex flex-col items-center">
            <MobileNavLinks handleMobileNavLinkClick={handleMobileNavLinkClick} />
            <MobileNavButtons
              isLoading={isLoading}
              closeMenu={closeMenu}
              setShowLoginModal={setShowLoginModal}
              setShouldLoginWithWallet={setShouldLoginWithWallet}
              setAuthMode={setAuthMode}
            />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default GuestNavMobile;
