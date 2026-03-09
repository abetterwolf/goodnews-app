import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearLocalUser, createUser, getLocalUser, getUserByEmail, getUsers, hashPassword, setLocalUser } from '../lib/api';
import { grantFirstUserAdmin, refreshAdminCache } from '../lib/admin';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContextcreateContextcreateContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useStateuseStateuseState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getLocalUser();
    if (stored) setUserState(stored);
    setLoading(false);
  }, []);

  const setUser = useCallback((u: User) => {
    setUserState(u);
    setLocalUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const existing = await getUserByEmail(email);
    if (!existing) throw new Error('No account found with that email. Please register first.');
    const inputHash = await hashPassword(password);
    if (existing.passwordHash && existing.passwordHash !== inputHash) {
      throw new Error('Incorrect password. Please try again.');
    }
    grantFirstUserAdmin(existing.email);
    setUser(existing);
    refreshAdminCache(); // sync cloud admin list in background
  }, [setUser]);

  const register = useCallback(async (email: string, displayName: string, password: string) => {
    const existing = await getUserByEmail(email);
    if (existing) throw new Error('An account with that email already exists. Please sign in.');
    await createUser({ email, displayName, password, authProvider: 'email' });
    // Re-fetch to get the server-assigned ID
    const fresh = await getUserByEmail(email);
    if (fresh) {
      grantFirstUserAdmin(fresh.email);
      setUser(fresh);
    }
  }, [setUser]);

  const logout = useCallback(() => {
    clearLocalUser();
    setUserState(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const users = await getUsers();
    const fresh = users.find(u => u.id === user.id);
    if (fresh) setUser(fresh);
  }, [user, setUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
