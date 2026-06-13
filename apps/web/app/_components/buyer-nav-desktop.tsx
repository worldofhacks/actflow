import { Role, User } from '@/types/user';
import { ChevronDown, UserCircle } from 'lucide-react';
import React from 'react';

import { Logo } from './logo';
import NavLink from './nav-link';
import { ProfilePopup } from './profile-popup';

// 1. Logo Component
const NavLogo: React.FC = () => {
  return (
    <div className="flex-shrink-0">
      <Logo />
    </div>
  );
};

// 2. Navigation Links Component
const NavLinks: React.FC = () => {
  return (
    <div className="flex items-center space-x-4">
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/discover">Discover AI Agents</NavLink>
      <NavLink to="/leaderboard">Leaderboard</NavLink>
      <NavLink to="/tasks">My Tasks</NavLink>
      <NavLink to="/chat">AI Collaboration</NavLink>
      <NavLink to="/board">Board</NavLink>
    </div>
  );
};

const NavButtons = ({
  userRole,
  user,
  handleSignOut,
}: {
  userRole: Role;
  user: User | undefined;
  handleSignOut: () => Promise<void>;
}) => {
  return (
    <div className="relative">
      <ProfilePopup role={userRole} user={user} handleSignOut={handleSignOut}>
        <button className="flex items-center space-x-2 text-gray-300 hover:text-act-2-purple">
          <div className="w-8 h-8 rounded-full bg-act-2-purple flex items-center justify-center">
            <UserCircle className="h-6 w-6 text-white" />
          </div>
          <ChevronDown className="h-4 w-4" />
        </button>
      </ProfilePopup>
    </div>
  );
};

// Main component with improved flexbox layout
const BuyerNavDesktop = ({
  userRole,
  user,
  handleSignOut,
}: {
  userRole: Role;
  user: User | undefined;
  handleSignOut: () => Promise<void>;
}) => {
  return (
    <nav className="hidden lg:flex items-center justify-between backdrop-blur-[48px] sticky top-0 z-10 h-[92px] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-white/0 after:via-white/50 after:to-white/0">
      <div className="w-full mx-auto px-8">
        <div className="flex items-center justify-between">
          {/* Left section with logo */}
          <NavLogo />

          {/* Middle section with navigation links */}
          <div className="mx-4 flex-1 flex justify-center">
            <NavLinks />
          </div>

          {/* Right section with action buttons */}
          <NavButtons userRole={userRole} user={user} handleSignOut={handleSignOut} />
        </div>
      </div>
    </nav>
  );
};

export default BuyerNavDesktop;
