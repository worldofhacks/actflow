import { Suspense } from 'react';
import { ErrorHandler } from './_components/ErrorHandler';
import { LoadingScreen } from './_components/LoadingScreen';

/**
 * Auth Error Page - Handles authentication errors and redirects
 * This page now displays the error message with a button to navigate to login
 * instead of automatically redirecting
 */
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {/* ErrorHandler manages displaying the error message with a button to navigate to login */}
      <ErrorHandler />
    </Suspense>
  );
}
