// PWA Utilities for background sync and push notifications

export interface BackgroundSyncOptions {
  tag: string;
  data?: any;
}

export class PWAUtils {
  /**
   * Request permission for push notifications
   */
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  /**
   * Show a local notification
   */
  static async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    const permission = await this.requestNotificationPermission();
    
    if (permission === 'granted') {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          ...options
        });
      } else {
        new Notification(title, options);
      }
    }
  }

  /**
   * Register background sync
   */
  static async registerBackgroundSync(options: BackgroundSyncOptions): Promise<void> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.warn('Background sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore - SyncManager is not in TypeScript types yet
      await registration.sync.register(options.tag);
      
      // Store data for the sync event if provided
      if (options.data) {
        localStorage.setItem(`sync-${options.tag}`, JSON.stringify(options.data));
      }
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  /**
   * Check if app is installed as PWA
   */
  static isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore
      window.navigator.standalone === true
    );
  }

  /**
   * Check if device is online
   */
  static isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Listen for online/offline events
   */
  static onConnectivityChange(callback: (online: boolean) => void): () => void {
    const onlineHandler = () => callback(true);
    const offlineHandler = () => callback(false);

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }

  /**
   * Check if service worker is supported
   */
  static isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Get service worker registration
   */
  static async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isServiceWorkerSupported()) {
      return null;
    }

    try {
      return await navigator.serviceWorker.ready;
    } catch (error) {
      console.error('Failed to get service worker registration:', error);
      return null;
    }
  }
}

// Export background sync tags for consistent usage
export const SYNC_TAGS = {
  SAVE_PROJECT: 'save-project',
  UPLOAD_VIDEO: 'upload-video',
  SAVE_SETTINGS: 'save-settings',
  SYNC_DATA: 'sync-data'
} as const;
