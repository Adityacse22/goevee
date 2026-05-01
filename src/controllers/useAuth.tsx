/**
 * CONTROLLER — Auth context provider + hook.
 * Orchestrates auth state by calling authService (Model layer).
 *
 * Uses the Evee REST API and stores the API bearer token in authService.
 */

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { AppUser, Profile, AuthContextType } from '@/models/auth.model';
import * as authService from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          setProfile(currentUser ? authService.toProfile(currentUser) : null);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const signedInUser = await authService.signIn(email, password);
    setUser(signedInUser);
    setProfile(authService.toProfile(signedInUser));
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const signedUpUser = await authService.signUp(email, password, fullName);
    setUser(signedUpUser);
    setProfile(authService.toProfile(signedUpUser));
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
