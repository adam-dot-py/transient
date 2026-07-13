import { validateEmail, validatePassword } from '@/data/authService';
import React, { createContext, useCallback, useContext, useState } from 'react';

/** Session object representing an authenticated user */
interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: { id: string; email: string };
}

/** Internal auth state managed by the provider */
interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

/** Public context value exposed to consumers */
interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'apple' | 'google' | 'facebook') => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// Mock data for development
const MOCK_USER = { id: 'mock-user-001', email: 'musician@transient.app' };

const MOCK_SESSION: Session = {
  accessToken: 'mock-access-token-abc123',
  refreshToken: 'mock-refresh-token-xyz789',
  expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year from now
  user: MOCK_USER,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    isLoading: false,
    error: null,
  });

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Validate email
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setState((prev) => ({ ...prev, isLoading: false, error: emailResult.error ?? 'Invalid email' }));
      return;
    }

    // Validate password
    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      setState((prev) => ({ ...prev, isLoading: false, error: passwordResult.errors[0] }));
      return;
    }

    // Simulate network delay then set mock session
    await new Promise((resolve) => setTimeout(resolve, 500));

    setState({
      session: { ...MOCK_SESSION, user: { id: MOCK_USER.id, email: email.trim() } },
      isLoading: false,
      error: null,
    });
  }, []);

  const signInWithProvider = useCallback(async (provider: 'apple' | 'google' | 'facebook') => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Simulate OAuth delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    setState({
      session: { ...MOCK_SESSION, user: { ...MOCK_USER, email: `${provider}@transient.app` } },
      isLoading: false,
      error: null,
    });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Validate email
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setState((prev) => ({ ...prev, isLoading: false, error: emailResult.error ?? 'Invalid email' }));
      return;
    }

    // Validate password
    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      setState((prev) => ({ ...prev, isLoading: false, error: passwordResult.errors[0] }));
      return;
    }

    // Simulate account creation delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    setState({
      session: { ...MOCK_SESSION, user: { id: MOCK_USER.id, email: email.trim() } },
      isLoading: false,
      error: null,
    });
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    setState({
      session: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session: state.session,
        isLoading: state.isLoading,
        error: state.error,
        signIn,
        signInWithProvider,
        signUp,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
