import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import type { ApplicationStatusChangeEvent } from "@/context/ApplicationContext";
import { ApplicationProvider } from "@/context/ApplicationContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { GigProvider, useGigs } from "@/context/GigContext";
import { GigPushProvider, useGigPush } from "@/context/GigPushContext";
import { NotificationProvider, useNotificationContext } from "@/context/NotificationContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { RoleProvider, useRole } from "@/context/RoleContext";
import { GigPushAlert } from "@/components/GigPushAlert";
import { buildNotificationPayload } from "@/data/notificationService";
import { useColorScheme } from "@/hooks/useColorScheme";
import type { Notification } from "@/types";

/** Inner layout that handles auth-based routing */
function AuthGate() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

/**
 * Bridge that connects ApplicationProvider to NotificationContext.
 * Lives inside both GigProvider and NotificationProvider so it can
 * build notification payloads and inject them when applications change status.
 */
function ApplicationWithNotifications({ children }: { children: React.ReactNode }) {
  const { addNotification } = useNotificationContext();
  const { getGigById } = useGigs();

  // Use refs to avoid stale closures in the callback
  const addNotificationRef = useRef(addNotification);
  addNotificationRef.current = addNotification;
  const getGigByIdRef = useRef(getGigById);
  getGigByIdRef.current = getGigById;

  const handleApplicationStatusChange = useCallback(
    (event: ApplicationStatusChangeEvent) => {
      const gig = getGigByIdRef.current(event.gigId);
      if (!gig) return;

      const type =
        event.newStatus === 'accepted'
          ? 'application_approved'
          : 'application_declined';

      const payload = buildNotificationPayload(type, {
        id: gig.id,
        title: gig.title,
        venueName: gig.venueName,
        date: gig.date,
        pay: gig.pay,
        genres: gig.genres,
      });

      const notification: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: event.musicianId,
        type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        read: false,
        createdAt: new Date().toISOString(),
      };

      addNotificationRef.current(notification);
    },
    []
  );

  return (
    <ApplicationProvider onApplicationStatusChange={handleApplicationStatusChange}>
      {children}
    </ApplicationProvider>
  );
}

/**
 * Renders the GigPushAlert modal when:
 * 1. The user is in musician mode
 * 2. There is a pushed gig in the queue
 *
 * On apply: accepts the gig and dismisses the alert.
 * On dismiss: removes the gig from the queue without action.
 */
function GigPushAlertRenderer() {
  const { role } = useRole();
  const { currentPushedGig, dismissPushedGig } = useGigPush();
  const { acceptGig } = useGigs();

  const handleApply = (gigId: string) => {
    acceptGig(gigId);
    dismissPushedGig();
  };

  const isVisible = role === 'musician' && currentPushedGig !== null;

  if (!currentPushedGig) return null;

  return (
    <GigPushAlert
      gig={currentPushedGig}
      visible={isVisible}
      onApply={handleApply}
      onDismiss={dismissPushedGig}
    />
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <RoleProvider>
        <ProfileProvider>
          <GigProvider>
            <NotificationProvider>
              <GigPushProvider>
                <ApplicationWithNotifications>
                  <AuthGate />
                  <GigPushAlertRenderer />
                  <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
                </ApplicationWithNotifications>
              </GigPushProvider>
            </NotificationProvider>
          </GigProvider>
        </ProfileProvider>
      </RoleProvider>
    </AuthProvider>
  );
}
