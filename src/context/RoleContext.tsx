import { STORAGE_KEYS, UserRole } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface RoleContextValue {
  role: UserRole;
  switchRole: () => void;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('musician');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPersistedRole() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
        if (saved === 'hoster') {
          setRole('hoster');
        }
        // Default remains 'musician' for any other value or null
      } catch {
        // Fail-safe: default to musician on any storage error
      } finally {
        setIsLoading(false);
      }
    }

    loadPersistedRole();
  }, []);

  const switchRole = useCallback(() => {
    setRole((current) => {
      const next: UserRole = current === 'musician' ? 'hoster' : 'musician';
      // Persist asynchronously — fire and forget, errors are non-critical
      AsyncStorage.setItem(STORAGE_KEYS.ROLE, next).catch(() => {});
      return next;
    });
  }, []);

  return (
    <RoleContext.Provider value={{ role, switchRole, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

export { RoleContext };
