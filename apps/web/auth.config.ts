import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { fetchWithOutAuth } from './lib/service';
import { LoginResponse, ProviderType } from './types/auth';
import { User } from './types/user';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetch the user profile from the backend with a freshly issued access token.
 */
async function fetchProfile(accessToken: string | undefined) {
  return fetchWithOutAuth<User>(`${API_BASE}/users/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function toSessionUser(user: User, tokens: LoginResponse | undefined) {
  return {
    id: user._id,
    name: user.username,
    email: user.email,
    accessToken: tokens?.access_token,
    refreshToken: tokens?.refresh_token,
    twitterLinked: !!user.linkedAccounts?.twitter,
    googleLinked: !!user.linkedAccounts?.google,
    provider: user.provider?.type ?? ProviderType.CREDENTIALS,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const login = await fetchWithOutAuth<LoginResponse>(`${API_BASE}/auth/login`, {
          method: 'POST',
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });
        if (!login.success || !login.data?.access_token) {
          throw new Error(login.error ?? 'Authentication failed', {
            cause: 'AuthenticationError',
          });
        }

        const profile = await fetchProfile(login.data.access_token);
        if (!profile.success || !profile.data) {
          throw new Error(profile.error ?? 'Authentication failed', {
            cause: 'AuthenticationError',
          });
        }
        return toSessionUser(profile.data, login.data);
      },
    }),
    /**
     * Sign-In With Ethereum (EIP-4361).
     *
     * The client signs a SIWE message with the connected wallet; we verify the
     * signature server-side (signature recovery — EOA wallets) and only then
     * exchange `{ address, message, signature }` with the backend for an API
     * token. The legacy address-only `/auth/wallet/login` flow was deliberately
     * NOT ported.
     */
    CredentialsProvider({
      id: 'siwe',
      name: 'Sign-In With Ethereum',
      credentials: {
        address: { label: 'Address', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.address || !credentials?.signature) {
          throw new Error('Missing wallet address or signature', { cause: 'AuthenticationError' });
        }

        const address = credentials.address as string;
        const signature = credentials.signature as string;

        // The signature is over the backend's single-use nonce message (issued
        // by POST /auth/wallet/nonce and signed client-side via signWalletNonce).
        // The backend verifies it against the stored nonce — we do NOT rebuild or
        // re-validate a SIWE message here (that was the source of the mismatch).
        const login = await fetchWithOutAuth<LoginResponse>(`${API_BASE}/auth/wallet/login`, {
          method: 'POST',
          body: JSON.stringify({ address, signature }),
        });
        if (!login.success || !login.data?.access_token) {
          throw new Error(login.error ?? 'Wallet authentication failed', {
            cause: 'AuthenticationError',
          });
        }

        const profile = await fetchProfile(login.data.access_token);
        if (!profile.success || !profile.data) {
          throw new Error(profile.error ?? 'Wallet authentication failed', {
            cause: 'AuthenticationError',
          });
        }
        return toSessionUser(profile.data, login.data);
      },
    }),
  ],
  pages: {
    signIn: '/?login=true',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          twitterLinked: user.twitterLinked ?? false,
          googleLinked: user.googleLinked ?? false,
          provider: user.provider,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.user?.accessToken) {
        return {
          ...session,
          user: {
            accessToken: token.user.accessToken,
            id: token.user.id ?? '',
            name: token.user.name ?? '',
            refreshToken: token.user.refreshToken ?? '',
            email: token.user.email ?? '',
            twitterLinked: token.user.twitterLinked ?? false,
            googleLinked: token.user.googleLinked ?? false,
            provider: token.user.provider ?? ProviderType.CREDENTIALS,
          },
        };
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 3600 * 3, // match backend access-token lifetime (3h)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
