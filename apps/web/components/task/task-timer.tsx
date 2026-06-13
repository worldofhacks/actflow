'use client';

import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface TaskTimerProps {
  expiresAt?: number;
  label?: string;
  colorScheme?: 'default' | 'warning' | 'danger' | 'success';
}

export function TaskTimer({ expiresAt, label, colorScheme = 'default' }: TaskTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  console.log('expiresAt', expiresAt);
  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining('N/A');
      return;
    }

    const updateTimer = () => {
      const now = new Date();

      const normalizedExpiresAt = expiresAt < 10000000000 ? expiresAt * 1000 : expiresAt;

      const expiresAtDate = new Date(normalizedExpiresAt);
      const diff = expiresAtDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        setIsExpired(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const getColorClasses = () => {
    if (isExpired) return 'text-red-500';

    switch (colorScheme) {
      case 'warning':
        return 'text-yellow-500';
      case 'danger':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-act-2-purple-light';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Clock size={21} className={` ${getColorClasses()}`} />
      <div>
        {label && <div className="text-sm text-act-2-gray-medium">{label}</div>}
        <div className={`font-medium ${getColorClasses()}`}>{timeRemaining}</div>
      </div>
    </div>
  );
}
