/**
 * GigContext — centralised state and actions for gig data.
 *
 * Wraps the pure gigService functions in a React context so any component
 * in the tree can read gig state or dispatch mutations without prop-drilling.
 */

import React, { createContext, useContext, useMemo, useState } from 'react';

import * as gigService from '@/data/gigService';
import { MOCK_GIGS } from '@/data/mockGigs';
import { CURRENT_USER } from '@/data/mockProfiles';
import type { CreateGigInput, Gig, GigStatus, ValidationError } from '@/types';

export interface GigContextValue {
  gigs: Gig[];
  recentlyViewed: Gig[];
  acceptedGigs: Gig[];
  getGigById: (id: string) => Gig | null;
  getGigsByStatus: (status: GigStatus) => Gig[];
  createGig: (input: CreateGigInput) => Gig | ValidationError;
  acceptGig: (gigId: string) => void;
  addToRecentlyViewed: (gigId: string) => void;
  getHosterGigs: (hosterId: string) => { active: Gig[]; past: Gig[] };
  updateGigAcceptedMusicians: (gigId: string, acceptedMusicianIds: string[]) => void;
}

const GigContext = createContext<GigContextValue | null>(null);

export function GigProvider({ children }: { children: React.ReactNode }) {
  const [gigs, setGigs] = useState<Gig[]>(MOCK_GIGS);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  // Derived: full Gig objects for recently viewed IDs (most recent first)
  const recentlyViewed = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => gigService.getGigById(gigs, id))
        .filter((g): g is Gig => g !== null),
    [recentlyViewedIds, gigs]
  );

  // Derived: gigs with 'accepted' status
  const acceptedGigs = useMemo(
    () => gigService.filterByStatus(gigs, 'accepted'),
    [gigs]
  );

  const getGigById = (id: string): Gig | null => {
    return gigService.getGigById(gigs, id);
  };

  const getGigsByStatus = (status: GigStatus): Gig[] => {
    return gigService.filterByStatus(gigs, status);
  };

  const createGig = (input: CreateGigInput): Gig | ValidationError => {
    const result = gigService.createGig(gigs, input, CURRENT_USER.id);

    if ('error' in result) {
      return result.error;
    }

    setGigs(result.gigs);
    return result.gig;
  };

  const acceptGig = (gigId: string): void => {
    const updated = gigService.updateGig(gigs, gigId, {
      status: 'accepted',
      acceptedMusicianIds: [
        ...(gigService.getGigById(gigs, gigId)?.acceptedMusicianIds ?? []),
        CURRENT_USER.id,
      ],
    });

    if (updated) {
      setGigs(updated.gigs);
    }
  };

  const addToRecentlyViewed = (gigId: string): void => {
    setRecentlyViewedIds((prev) => gigService.addToRecentlyViewed(prev, gigId));
  };

  const updateGigAcceptedMusicians = (
    gigId: string,
    acceptedMusicianIds: string[]
  ): void => {
    const updated = gigService.updateGig(gigs, gigId, { acceptedMusicianIds });
    if (updated) {
      setGigs(updated.gigs);
    }
  };

  const getHosterGigs = (
    hosterId: string
  ): { active: Gig[]; past: Gig[] } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hosterGigs = gigs.filter((g) => g.hosterId === hosterId);

    const active = hosterGigs.filter(
      (g) => new Date(g.date + 'T00:00:00') >= today
    );
    const past = hosterGigs.filter(
      (g) => new Date(g.date + 'T00:00:00') < today
    );

    return { active, past };
  };

  const value: GigContextValue = {
    gigs,
    recentlyViewed,
    acceptedGigs,
    getGigById,
    getGigsByStatus,
    createGig,
    acceptGig,
    addToRecentlyViewed,
    getHosterGigs,
    updateGigAcceptedMusicians,
  };

  return <GigContext.Provider value={value}>{children}</GigContext.Provider>;
}

/**
 * Convenience hook to consume GigContext.
 * Throws if used outside of a GigProvider.
 */
export function useGigs(): GigContextValue {
  const context = useContext(GigContext);
  if (!context) {
    throw new Error('useGigs must be used within a GigProvider');
  }
  return context;
}
