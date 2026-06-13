'use client';
import { useSiweSignIn } from '@/hooks/use-siwe-sign-in';
import { checkIfTheWalletAccountExists, logout } from '@/lib/service/authService';
import { ProviderType } from '@/types/auth';
import { Role, User } from '@/types/user';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { Address } from 'viem';
import { useAccount, useDisconnect } from 'wagmi';
import LoginV2 from './auth-form';
import BuyerNavDesktop from './buyer-nav-desktop';
import BuyerNavMobile from './buyer-nav-mobile';
import { GuestNavDesktop } from './guest-nav-desktop';
import GuestNavMobile from './guest-nav-mobile';
import SellerNavDesktop from './seller-nav-desktop';
import SellerNavMobile from './seller-nav-mobile';
import ValidatorNavDesktop from './validator-nav-desktop';
import ValidatorNavMobile from './validator-nav-mobile';

const Navbar: React.FC<{
  userRole: Role;
  user: User | undefined;
}> = ({ userRole, user }) => {
  const location = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { openConnectModal } = useConnectModal();
  const { isConnected, address, isDisconnected } = useAccount();
  const { disconnect } = useDisconnect();
  const siweSignIn = useSiweSignIn();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldLoginWithWallet, setShouldLoginWithWallet] = useState(false);
  const [isWalletLoginPending, setIsWalletLoginPending] = useState(false);

  const handleAuthSheetClose = () => {
    setTimeout(() => {
      setShowLoginModal(false);

      // Update URL params
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('signup');
      newSearchParams.delete('login');
      newSearchParams.delete('error');
      const newSearch = newSearchParams.toString();
      const newPath = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      router.replace(newPath);
    }, 500);
  };

  const handleWalletLoginWithRainbowKit = async () => {
    try {
      if (isConnected && address) {
        disconnect();
        setIsWalletLoginPending(true);
        return;
      }
      if (openConnectModal) {
        setShowLoginModal(false);
        setShouldLoginWithWallet(true);
        openConnectModal();
      }
    } catch (error) {
      console.error('Wallet login error:', error);
    }
  };

  const handleWalletLogin = useCallback(
    async (address: Address | undefined) => {
      try {
        setIsLoading(true);
        // check if the address is already in the database
        // if it is, then login
        const response = await checkIfTheWalletAccountExists(address!);
        if (response.success && response.data?.user) {
          // login the user with a signed SIWE message
          await siweSignIn(address!, '/discover');
        } else {
          // redirect to complete profile page
          const referrer = searchParams.get('referrer');
          const url = referrer ? '/complete-profile?referrer=' + referrer : '/complete-profile';
          router.push(url);
        }
      } catch (error) {
        console.error('Wallet Login Error: ', error);
      } finally {
        setIsLoading(false);
      }
    },
    [router, searchParams, siweSignIn],
  );

  useEffect(() => {
    if (isDisconnected && isWalletLoginPending && openConnectModal) {
      setIsWalletLoginPending(false);
      setShouldLoginWithWallet(true);
      // close the signin modal before opening the rainbowKit modal
      setShowLoginModal(false);
      openConnectModal();
    }
  }, [isDisconnected, isWalletLoginPending, openConnectModal]);

  useEffect(() => {
    if (isConnected && address && shouldLoginWithWallet) {
      setShouldLoginWithWallet(false);
      handleWalletLogin(address);
    }
  }, [isConnected, address, handleWalletLogin, shouldLoginWithWallet]);

  const handleSignOut = async () => {
    if (user?.provider?.type === ProviderType.WALLET) {
      disconnect();
    }
    // end the session on the server and revoke the refresh token
    if (session?.user?.refreshToken) await logout(session.user.refreshToken);
    // TODO: uncomment this when we want to unlink the account
    // await unlinkAccount();
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const showLogin = searchParams.get('login') === 'true';
    const hideLoginModal =
      searchParams.get('login') === 'false' || searchParams.get('signup') === 'false';
    const showSignUp = searchParams.get('signup') === 'true';
    if (showLogin || showSignUp) {
      setShowLoginModal(true);
      setAuthMode(showSignUp ? 'signup' : 'login');
    } else if (hideLoginModal) {
      handleAuthSheetClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Profile Popup Content

  // Guest Navigation
  const GuestNav = () => (
    <>
      {/* Desktop Navigation */}
      <GuestNavDesktop
        setAuthMode={setAuthMode}
        setShowLoginModal={setShowLoginModal}
        setShouldLoginWithWallet={setShouldLoginWithWallet}
        isLoading={isLoading}
      />

      {/* Mobile Navigation */}
      <GuestNavMobile
        isLoading={isLoading}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setShowLoginModal={setShowLoginModal}
        setShouldLoginWithWallet={setShouldLoginWithWallet}
        setAuthMode={setAuthMode}
      />
    </>
  );

  // Buyer Navigation
  const BuyerNav = ({ user }: { user: User | undefined }) => (
    <>
      {/* Desktop Navigation */}
      <BuyerNavDesktop userRole={userRole} user={user} handleSignOut={handleSignOut} />

      {/* Mobile Navigation */}
      <BuyerNavMobile
        user={user}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleSignOut={handleSignOut}
      />
    </>
  );

  // Seller Navigation
  const SellerNav = ({ user }: { user: User | undefined }) => (
    <>
      <SellerNavDesktop userRole={userRole} user={user} handleSignOut={handleSignOut} />

      <SellerNavMobile
        user={user}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleSignOut={handleSignOut}
      />
    </>
  );

  // Validator Navigation
  const ValidatorNav = ({ user }: { user: User | undefined }) => (
    <>
      <ValidatorNavDesktop userRole={Role.Validator} user={user} handleSignOut={handleSignOut} />

      <ValidatorNavMobile
        user={user}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleSignOut={handleSignOut}
      />
    </>
  );

  // Don't show navigation on auth pages
  return (
    <div className="md:h-[92px] h-[64px] fixed top-0 z-40 w-full" id="top-navigation">
      <LoginV2
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        mode={authMode}
        setMode={setAuthMode}
        onWalletLogin={handleWalletLoginWithRainbowKit}
        errorFromServer={searchParams.get('error') ?? ''}
      />

      {/* Don't show navigation on auth pages */}
      {location === '/login' || location === '/sign-up' ? null : !session?.user?.id ? (
        <GuestNav />
      ) : userRole === Role.Agent ? (
        <SellerNav user={user} />
      ) : userRole === Role.Validator ? (
        <ValidatorNav user={user} />
      ) : (
        <BuyerNav user={user} />
      )}
    </div>
  );
};

export default Navbar;
