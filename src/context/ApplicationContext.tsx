/**
 * ApplicationContext — centralised state and actions for gig applications.
 *
 * Wraps the pure applicationService functions in a React context so any
 * component in the tree can submit, approve, deny, or query applications
 * without prop-drilling.
 */

import React, { createContext, useContext, useState } from 'react';

import { useGigs } from '@/context/GigContext';
import type { ApplicationRecord } from '@/data/applicationService';
import * as applicationService from '@/data/applicationService';
import { mockApplicationsExtended } from '@/data/mockApplicationsExtended';

export interface ApplicationContextValue {
  applications: ApplicationRecord[];
  submitApplication: (
    gigId: string,
    musicianId: string,
    message?: string
  ) => { success: boolean; error?: string };
  approveApplication: (
    applicationId: string,
    gig: { acceptedMusicianIds: string[] }
  ) => {
    application: ApplicationRecord;
    gig: { acceptedMusicianIds: string[] };
  } | null;
  denyApplication: (applicationId: string) => ApplicationRecord | null;
  getApplicationsForGig: (gigId: string) => ApplicationRecord[];
  getApplicationsByMusician: (musicianId: string) => ApplicationRecord[];
}

const ApplicationContext = createContext<ApplicationContextValue | null>(null);

/**
 * Converts mockApplicationsExtended (ApplicationWithProfile[]) into
 * the simpler ApplicationRecord[] format used by the service layer.
 */
function initializeApplications(): ApplicationRecord[] {
  return mockApplicationsExtended.map((app) => ({
    id: app.id,
    gigId: app.gigId,
    musicianId: app.musicianId,
    status: app.status,
    message: app.message,
    createdAt: app.createdAt,
  }));
}

export interface ApplicationStatusChangeEvent {
  applicationId: string;
  gigId: string;
  musicianId: string;
  newStatus: 'accepted' | 'declined';
}

export function ApplicationProvider({
  children,
  onApplicationStatusChange,
}: {
  children: React.ReactNode;
  onApplicationStatusChange?: (event: ApplicationStatusChangeEvent) => void;
}) {
  const [applications, setApplications] = useState<ApplicationRecord[]>(
    initializeApplications
  );
  const { getGigById, updateGigAcceptedMusicians } = useGigs();

  const submitApplication = (
    gigId: string,
    musicianId: string,
    message?: string
  ): { success: boolean; error?: string } => {
    const result = applicationService.createApplication(
      applications,
      gigId,
      musicianId,
      message
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    setApplications((prev) => [...prev, result.application]);
    return { success: true };
  };

  const approveApplication = (
    applicationId: string,
    gig: { acceptedMusicianIds: string[] }
  ): {
    application: ApplicationRecord;
    gig: { acceptedMusicianIds: string[] };
  } | null => {
    const application = applications.find((a) => a.id === applicationId);
    if (!application) return null;

    const result = applicationService.approveApplication(application, gig);

    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? result.application : a))
    );

    // Update the gig's acceptedMusicianIds in GigContext
    updateGigAcceptedMusicians(application.gigId, result.gig.acceptedMusicianIds);

    // Notify listeners of the status change
    onApplicationStatusChange?.({
      applicationId,
      gigId: application.gigId,
      musicianId: application.musicianId,
      newStatus: 'accepted',
    });

    // Check if gig is now filled (simplification: 1 approval fills the gig)
    const currentGig = getGigById(application.gigId);
    const isFilled = currentGig
      ? result.gig.acceptedMusicianIds.length > 0
      : false;

    if (isFilled) {
      // Auto-decline remaining pending applications for this gig
      setApplications((prev) =>
        applicationService.autoDeclinePending(prev, application.gigId)
      );
    }

    return result;
  };

  const denyApplication = (
    applicationId: string
  ): ApplicationRecord | null => {
    const application = applications.find((a) => a.id === applicationId);
    if (!application) return null;

    const result = applicationService.updateApplicationStatus(
      application,
      'declined'
    );

    if (!result.isValid) return null;

    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? result.application : a))
    );

    // Notify listeners of the status change
    onApplicationStatusChange?.({
      applicationId,
      gigId: application.gigId,
      musicianId: application.musicianId,
      newStatus: 'declined',
    });

    return result.application;
  };

  const getApplicationsForGig = (gigId: string): ApplicationRecord[] => {
    return applications.filter((a) => a.gigId === gigId);
  };

  const getApplicationsByMusician = (
    musicianId: string
  ): ApplicationRecord[] => {
    return applications.filter((a) => a.musicianId === musicianId);
  };

  const value: ApplicationContextValue = {
    applications,
    submitApplication,
    approveApplication,
    denyApplication,
    getApplicationsForGig,
    getApplicationsByMusician,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
}

/**
 * Convenience hook to consume ApplicationContext.
 * Throws if used outside of an ApplicationProvider.
 */
export function useApplications(): ApplicationContextValue {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error(
      'useApplications must be used within an ApplicationProvider'
    );
  }
  return context;
}

export default ApplicationProvider;
