/**
 * NotificationContext — centralised state and actions for push notifications.
 *
 * Manages the notification list, unread count, mark-as-read actions,
 * and push token registration state. Wraps the useNotifications hook
 * so components can access notification state without prop-drilling.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { mockNotifications } from '@/data/mockNotifications';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/types';

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
  tokenRegistered: boolean;
  registerForNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [tokenRegistered, setTokenRegistered] = useState(false);

  const { requestPermission, registerToken } = useNotifications();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback((notificationId: string): void => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback((): void => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((notification: Notification): void => {
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  const registerForNotifications = useCallback(async (): Promise<void> => {
    await requestPermission();
    await registerToken();
    setTokenRegistered(true);
  }, [requestPermission, registerToken]);

  const value: NotificationContextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      tokenRegistered,
      registerForNotifications,
    }),
    [
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      tokenRegistered,
      registerForNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Convenience hook to consume NotificationContext.
 * Throws if used outside of a NotificationProvider.
 */
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within a NotificationProvider'
    );
  }
  return context;
}

export default NotificationProvider;
