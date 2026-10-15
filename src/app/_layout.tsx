import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import type { ApplicationStatusChangeEvent } from "@/context/ApplicationContext";
import { ApplicationProvider, useApplications } from "@/context/ApplicationContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { GigProvider, useGigs } from "@/context/GigContext";
import { GigPushProvider, useGigPush } from "@/context/GigPushContext";
import { NotificationProvider, useNotificationContext } from "@/context/NotificationContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { RoleProvider, useRole } from "@/context/RoleContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GigPushAlert } from "@/components/GigPushAlert";
import { CURRENT_USER } from "@/data/mockProfiles";
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

  // Use refs to avoid stale closures in the callback.
  // Assign in an effect (not during render) to satisfy the refs-in-render rule.
  const addNotificationRef = useRef(addNotification);
  const getGigByIdRef = useRef(getGigById);

  useEffect(() => {
    addNotificationRef.current = addNotification;
    getGigByIdRef.current = getGigById;
  }, [addNotification, getGigById]);

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
 * On apply: submits a REVIEWABLE application (shares the musician's profile with
 * the host for approval) and dismisses the alert — it does NOT auto-accept the
 * gig. This matches the "apply -> host approves" user story and the browse-screen
 * fix in commit deb0dd7. Guards against duplicate applications.
 *
 * On dismiss: removes the gig from the queue without action.
 */
function GigPushAlertRenderer() {
  const { role } = useRole();
  const { currentPushedGig, dismissPushedGig } = useGigPush();
  const { submitApplication, getApplicationsByMusician } = useApplications();

  const handleApply = (gigId: string) => {
    // Guard: don't submit a second application for the same gig.
    const alreadyApplied = getApplicationsByMusician(CURRENT_USER.id).some(
      (a) => a.gigId === gigId
    );
    if (alreadyApplied) {
      Alert.alert('Already applied', "You've already applied to this gig.");
      dismissPushedGig();
      return;
    }

    const result = submitApplication(gigId, CURRENT_USER.id);
    if (result.success) {
      Alert.alert('Application sent', 'The host will review your profile.');
    } else {
      Alert.alert('Could not apply', result.error ?? 'Please try again.');
    }
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

/** StatusBar bar style that follows the active (resolved) theme. Must live
 * INSIDE ThemeProvider so it reflects the in-app preference, not just the OS. */
function ThemedStatusBar() {
  const colorScheme = useColorScheme();
  return <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RoleProvider>
          <ProfileProvider>
            <GigProvider>
              <NotificationProvider>
                <GigPushProvider>
                  <ApplicationWithNotifications>
                    <AuthGate />
                    <GigPushAlertRenderer />
                    <ThemedStatusBar />
                  </ApplicationWithNotifications>
                </GigPushProvider>
              </NotificationProvider>
            </GigProvider>
          </ProfileProvider>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
