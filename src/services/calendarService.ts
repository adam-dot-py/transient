/**
 * Calendar sync service — adds gigs to the user's phone calendar.
 *
 * Uses expo-calendar to request permissions and create events.
 * Falls back gracefully if permissions are denied or unavailable.
 */

import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

import type { Gig } from '@/types';

/**
 * Prompts the user to add a gig to their phone calendar.
 * Requests calendar permissions if not already granted.
 *
 * @returns true if the event was added, false otherwise
 */
export async function addGigToCalendar(gig: Gig): Promise<boolean> {
  try {
    // Request permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Calendar Permission',
        'Calendar access is needed to add gig events. You can enable it in Settings.',
      );
      return false;
    }

    // Get a writable calendar
    const calendarId = await getDefaultCalendarId();
    if (!calendarId) {
      Alert.alert('Error', 'No writable calendar found on this device.');
      return false;
    }

    // Build event dates
    const startDate = new Date(`${gig.date}T${gig.startTime}:00`);
    const endDate = new Date(`${gig.date}T${gig.endTime}:00`);

    // Handle cases where end time is past midnight
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    // Create the event
    await Calendar.createEventAsync(calendarId, {
      title: gig.title,
      location: `${gig.venueName}, ${gig.addressLine1}, ${gig.city}`,
      startDate,
      endDate,
      notes: gig.description || `Gig at ${gig.venueName} — £${gig.pay}`,
      timeZone: 'Europe/London', // Default, could be made dynamic
    });

    return true;
  } catch (error) {
    console.error('[Calendar] Failed to add event:', error);
    return false;
  }
}

/**
 * Gets the default writable calendar ID for the platform.
 */
async function getDefaultCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar?.id ?? calendars[0]?.id ?? null;
  }

  // Android: find the first writable calendar
  const writable = calendars.find(
    (cal) => cal.allowsModifications && cal.source?.name !== 'Holidays'
  );
  return writable?.id ?? calendars[0]?.id ?? null;
}
