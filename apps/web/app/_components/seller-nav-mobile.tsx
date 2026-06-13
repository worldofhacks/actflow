import { updateUserRoleInCookies } from '@/actions/role';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import crossIcon from '@/public/crossIcon.png';
import menuIcon from '@/public/menuIcon.png';
import { Role, User } from '@/types/user';
import { Bot, LogOut, UserCircle } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { Logo } from './logo';
import MobileNavLink from './mobile-nav-link';

interface SellerNavMobileProps {
  user: User | undefined;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  handleSignOut: () => void;
}

// 1. Mobile Header Component
const MobileHeader: React.FC<{ toggleMobileMenu: () => void; isMobileMenuOpen: boolean }> = ({
  toggleMobileMenu,
  isMobileMenuOpen,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 h-full">
      <Logo />
      <div className="flex items-center space-x-3">
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
    </div>
  );
};

// 2. Mobile Profile Component
const MobileProfile: React.FC<{ user: User | undefined }> = ({ user }) => {
  return (
    <div className="px-4 py-4 bg-black">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
          <Bot className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="text-white font-medium">{user?.name ?? 'AI Seller Name'}</h3>
          <p className="text-sm text-gray-400">{user?.email ?? 'seller@gmail.com'}</p>
        </div>
      </div>
    </div>
  );
};

// 3. Mobile Navigation Links Component
const MobileNavLinks: React.FC<{
  handleMobileNavLinkClick: () => void;
  handleSignOut: () => void;
}> = ({ handleMobileNavLinkClick, handleSignOut }) => {
  return (
    <div className="px-4 py-6 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)] scrollbar-hide bg-black">
      <Button
        className="w-full"
        onClick={() => {
          updateUserRoleInCookies(Role.User);
          handleMobileNavLinkClick();
        }}
      >
        <UserCircle className="h-4 w-4 mr-2 flex-shrink-0" />
        <span className="font-medium">SWITCH TO BUYING</span>
      </Button>
      <MobileNavLink to="/dashboard" onClick={handleMobileNavLinkClick}>
        Dashboard
      </MobileNavLink>
      <MobileNavLink to="/discover" onClick={handleMobileNavLinkClick}>
        Agents
      </MobileNavLink>
      <MobileNavLink to="/leaderboard" onClick={handleMobileNavLinkClick}>
        Leaderboard
      </MobileNavLink>
      <MobileNavLink to="/tasks" onClick={handleMobileNavLinkClick}>
        Your Tasks
      </MobileNavLink>
      <MobileNavLink to="/board" onClick={handleMobileNavLinkClick}>
        Board
      </MobileNavLink>
      <MobileNavLink to="/chat" onClick={handleMobileNavLinkClick}>
        AI Agent
      </MobileNavLink>

      <div className="pt-4 border-t border-[#181424] space-y-4">
        <MobileNavLink to="/wallet" onClick={handleMobileNavLinkClick}>
          Wallet
        </MobileNavLink>
        <MobileNavLink to="/notifications" onClick={handleMobileNavLinkClick}>
          Notifications
        </MobileNavLink>
        <div className="relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-white/0 before:via-white/50 before:to-white/0 pt-8">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              handleSignOut();
            }}
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">SIGN OUT</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main SellerNavMobile Component
const SellerNavMobile: React.FC<SellerNavMobileProps> = ({
  user,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleSignOut,
}) => {
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileNavLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="lg:hidden bg-black backdrop-blur-sm sticky top-0 z-10 h-[64px] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-white/0 after:via-white/50 after:to-white/0">
      <MobileHeader toggleMobileMenu={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTitle className="hidden">Seller Nav Mobile Menu</SheetTitle>
        <SheetContent
          showCloseButton={false}
          side="right"
          className="w-full p-0 border-r-0 h-full bg-black mt-[64px]"
        >
          {/* AI Agent Profile Section */}
          <MobileProfile user={user} />

          {/* Navigation Links */}
          <MobileNavLinks
            handleMobileNavLinkClick={handleMobileNavLinkClick}
            handleSignOut={() => {
              handleSignOut();
              setIsMobileMenuOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default SellerNavMobile;
