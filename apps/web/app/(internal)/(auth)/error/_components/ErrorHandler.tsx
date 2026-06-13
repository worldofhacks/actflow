'use client';

import { ProviderType } from '@/types/auth';
import { signOut, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useDisconnect } from 'wagmi';
import { logout } from '../../../../../lib/service/authService';
import { ErrorDisplay } from './ErrorDisplay';
import { getErrorMessage } from './getErrorMessage';
import { LoadingScreen } from './LoadingScreen';

export function ErrorHandler() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const { disconnect } = useDisconnect();

  const handleSignOut = useCallback(async () => {
    if (session?.user?.provider === ProviderType.WALLET) {
      disconnect();
    }
    // end the session on the server and revoke the refresh token
    if (session?.user?.refreshToken) await logout(session.user.refreshToken);
    await signOut({ redirect: false });
    setIsProcessing(false);
  }, [disconnect, session?.user?.provider, session?.user?.refreshToken]);

  const processError = useCallback(() => {
    const error = searchParams.get('error');

    if (error) {
      setErrorMessage(getErrorMessage(error));
    } else {
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  }, [searchParams]);

  const init = useCallback(async () => {
    processError();
    await handleSignOut();
  }, [processError, handleSignOut]);

  useEffect(() => {
    init();
  }, [init]);

  if (isProcessing) {
    return <LoadingScreen />;
  }

  return <ErrorDisplay errorMessage={errorMessage} />;
}
