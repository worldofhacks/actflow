import NotificationCard from '@/app/(internal)/(password-protected)/notifications/_components/shared/notification-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getNotifications } from '@/lib/service/notificationService';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
export async function RecentNotifications() {
  const notificationsResponse = await getNotifications();
  const notifications = notificationsResponse?.data;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between w-full items-center ">
          Recent Notifications
          <Link
            href="/notifications"
            className="text-act-2-purple hover:text-act-2-purple/80 text-sm font-medium flex items-center"
          >
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 lg:space-y-4">
          {notifications?.map(notification => (
            <NotificationCard key={notification.entityId} notification={notification} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
