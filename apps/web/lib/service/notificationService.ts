'use server';

import { Role } from '@/types/user';
import { fetchWithAuth } from '.';
import { Notification } from '../../types/notifications';

/**
 * Get all notifications for the current user
 * @param userType 'buyer' or 'seller'
 * @returns list of notifications
 */
export async function getNotifications() {
  const response = await fetchWithAuth<Notification[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
    {
      method: 'GET',
    },
  );

  return response;
}

/**
 * Mark a specific notification as read
 * @param notificationId ID of the notification to mark as read
 * @returns Updated notification
 */
export async function markNotificationAsRead(notificationId: string) {
  const response = await fetchWithAuth<Notification>(
    `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
    },
  );

  return response;
}

/**
 * Mark all notifications as read for the specified user type
 * @param userType 'buyer' or 'seller'
 * @returns Updated notifications
 */
export async function markAllNotificationsAsRead(userType: Role) {
  const response = await fetchWithAuth<Notification[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all?userType=${userType}`,
    {
      method: 'PATCH',
    },
  );

  return response;
}
