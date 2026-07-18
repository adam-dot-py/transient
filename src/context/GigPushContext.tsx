/**
 * GigPushContext — manages the queue of gigs that have been "pushed" to
 * the current musician user.
 *
 * When a host creates a gig with push notifications enabled, the gig is
 * added to the push queue. The GigPushAlert component consumes the queue
 * and displays each pushed gig one at a time as a full-screen alert.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { Gig } from '@/types';

export interface GigPushContextValue {
  /** The next gig in the push queue (null if empty) */
  currentPushedGig: Gig | null;
  /** Add a gig to the push queue */
  pushGig: (gig: Gig) => void;
  /** Dismiss the current pushed gig (removes from queue) */
  dismissPushedGig: () => void;
}

const GigPushContext = createContext<GigPushContextValue | null>(null);

export function GigPushProvider({ children }: { children: React.ReactNode }) {
  const [pushedGigs, setPushedGigs] = useState<Gig[]>([]);

  const currentPushedGig = pushedGigs.length > 0 ? pushedGigs[0] : null;

  const pushGig = useCallback((gig: Gig): void => {
    setPushedGigs((prev) => [...prev, gig]);
  }, []);

  const dismissPushedGig = useCallback((): void => {
    setPushedGigs((prev) => prev.slice(1));
  }, []);

  const value: GigPushContextValue = useMemo(
    () => ({
      currentPushedGig,
      pushGig,
      dismissPushedGig,
    }),
    [currentPushedGig, pushGig, dismissPushedGig]
  );

  return (
    <GigPushContext.Provider value={value}>
      {children}
    </GigPushContext.Provider>
  );
}

/**
 * Convenience hook to consume GigPushContext.
 * Throws if used outside of a GigPushProvider.
 */
export function useGigPush(): GigPushContextValue {
  const context = useContext(GigPushContext);
  if (!context) {
    throw new Error('useGigPush must be used within a GigPushProvider');
  }
  return context;
}
