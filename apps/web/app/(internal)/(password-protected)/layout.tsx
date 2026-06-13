import { authOptions } from '@/auth.config';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

/**
 * Simple session gate. The legacy invite-code + generated-wallet gate was
 * intentionally dropped during the monorepo port.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    redirect('/error?error=NotLoggedIn');
  }

  return <>{children}</>;
}
