'use client';

import { Button } from '@/components/ui/button';
import { CardInner } from '@/components/ui/card';
import { markNotificationAsRead } from '@/lib/service/notificationService';
import { Notification } from '@/types/notifications';
import { Bell, Bot, Eye, MessageSquare, Star, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationCardProps {
  notification: Notification;
}

export default function NotificationCard({ notification }: NotificationCardProps) {
  const router = useRouter();

  // Map notification type to icon
  const getIconInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order':
        return { icon: Bot };
      case 'payment':
        return { icon: Wallet };
      case 'message':
        return { icon: MessageSquare };
      case 'review':
        return { icon: Star };
      default:
        return { icon: Bell };
    }
  };

  const { icon: IconComponent } = getIconInfo(notification.type);

  const handleMarkAsRead = async () => {
    try {
      if (notification.isRead) {
        await markNotificationAsRead(notification.entityId);
        router.refresh(); // Refresh the page to get the updated data
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return (
    <CardInner>
      <div className="flex items-start space-x-4">
        <div className={`p-2 bg-white/[0.03] rounded-lg flex-shrink-0`}>
          <IconComponent className={`h-5 w-5 text-act-2-purple`} />
        </div>
        <div className="flex-1 min-w-0">
          {/* Mobile-optimized header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <h3 className="text-white font-medium text-sm lg:text-base">
                {notification.message}
                {notification.isRead && (
                  <span className="ml-2 inline-block w-2 h-2 bg-act-2-purple rounded-full"></span>
                )}
              </h3>
              <span className="text-xs text-gray-400 lg:hidden">
                {notification.createdAt.toLocaleString()}
              </span>
            </div>
            <span className="hidden lg:block text-sm text-gray-400">
              {notification.createdAt.toLocaleString()}
            </span>
          </div>

          {/* Message with proper spacing */}
          <p className="text-gray-400 text-sm mt-2 mb-3 leading-relaxed">{notification.message}</p>

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-3 lg:mt-2">
            {/* Additional actions */}
            {!notification.isRead && (
              <Button variant="outline" size="sm" onClick={handleMarkAsRead}>
                <Eye size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </CardInner>
  );
}
