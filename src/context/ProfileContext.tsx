/**
 * ProfileContext — centralised state and actions for the current user's musician profile.
 *
 * Wraps profile data in a React context so any component in the tree can
 * read profile state or dispatch mutations without prop-drilling.
 * Follows the same pattern as GigContext and RoleContext.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import { mockMusicianProfiles } from '@/data/mockMusicianProfiles';
import * as profileService from '@/data/profileService';
import type { FullMusicianProfile } from '@/types';

export interface ProfileContextValue {
  profile: FullMusicianProfile | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<FullMusicianProfile>) => void;
  uploadAvatar: (file: { uri: string; size: number; mimeType: string }) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<FullMusicianProfile | null>(
    mockMusicianProfiles[0] ?? null
  );
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(
    (updates: Partial<FullMusicianProfile>) => {
      setError(null);

      if (!profile) {
        setError('No profile loaded');
        return;
      }

      const merged = { ...profile, ...updates };

      const validation = profileService.validateProfile({
        displayName: merged.displayName,
        genres: merged.genres,
      });

      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0] ?? 'Validation failed';
        setError(firstError);
        return;
      }

      setProfile(merged);
    },
    [profile]
  );

  const uploadAvatar = useCallback(
    (file: { uri: string; size: number; mimeType: string }) => {
      setError(null);

      if (!profile) {
        setError('No profile loaded');
        return;
      }

      const validation = profileService.validateProfileImage({
        size: file.size,
        mimeType: file.mimeType,
      });

      if (!validation.isValid) {
        setError(validation.error ?? 'Invalid image');
        return;
      }

      // Mock implementation: just set the avatarUrl to the provided URI
      setProfile({ ...profile, avatarUrl: file.uri });
    },
    [profile]
  );

  const value: ProfileContextValue = {
    profile,
    isLoading,
    error,
    updateProfile,
    uploadAvatar,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

/**
 * Convenience hook to consume ProfileContext.
 * Throws if used outside of a ProfileProvider.
 */
export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

export default ProfileProvider;
