'use server';

import { USER_ROLE_COOKIE_NAME } from '@/lib/config/constants/cookies';
import { Role } from '@/types/user';
import { cookies } from 'next/headers';

export async function updateUserRoleInCookies(role: Role) {
  // Set the cookie
  const cookieStore = await cookies();
  cookieStore.set(USER_ROLE_COOKIE_NAME, role, {
    path: '/',
    maxAge: 31536000, // 1 year in seconds
    sameSite: 'lax',
  });

  // Revalidate all paths that might be affected by this change
  //   revalidatePath('/');
  //   revalidatePath('/dashboard');

  return { success: true };
}

/**
 * Server action to get the current user's preferred role from cookies
 */
export async function getUserRoleFromCookies(): Promise<Role> {
  const cookieStore = await cookies();
  const role = cookieStore.get(USER_ROLE_COOKIE_NAME)?.value || Role.User;

  return role as Role;
}
