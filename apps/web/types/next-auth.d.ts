import 'next-auth';
import { ProviderType } from './auth';

declare module 'next-auth' {
  // keep this interface here to avoid type errors in JWT callback
  interface User {
    id: string;
    name: string;
    email: string;
    accessToken?: string;
    refreshToken?: string;
    twitterLinked?: boolean;
    googleLinked?: boolean;
    provider?: ProviderType;
    username?: string;
  }

  interface Session {
    accessToken?: string;
    user?: {
      id: string;
      email: string;
      name: string;
      refreshToken: string;
      accessToken: string;
      twitterLinked: boolean;
      googleLinked: boolean;
      provider: ProviderType;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: {
      accessToken?: string;
      id?: string;
      email?: string;
      refreshToken?: string;
      name?: string;
      twitterLinked?: boolean;
      googleLinked?: boolean;
      provider?: ProviderType;
    };
  }
}
