import { useEffect, useState } from 'react';
import { PWAUtils } from '@/lib/pwa-utils';

export function usePWA() {
  const [isOnline, setIsOnline] = useState(PWAUtils.isOnline());
  const [isInstalled, setIsInstalled] = useState(PWAUtils.isStandalone());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    // Listen for connectivity changes
    const cleanup = PWAUtils.onConnectivityChange((online) => {
      setIsOnline(online);
      
      // Show notification when coming back online
      if (online) {
        PWAUtils.showNotification('You\'re back online!', {
          body: 'Your changes will now sync automatically',
          tag: 'connectivity'
        });
      }
    });

    return cleanup;
  }, []);

  const requestNotificationPermission = async () => {
    const permission = await PWAUtils.requestNotificationPermission();
    setNotificationPermission(permission);
    return permission;
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    await PWAUtils.showNotification(title, options);
  };

  return {
    isOnline,
    isInstalled,
    notificationPermission,
    requestNotificationPermission,
    showNotification,
    registerBackgroundSync: PWAUtils.registerBackgroundSync
  };
}
