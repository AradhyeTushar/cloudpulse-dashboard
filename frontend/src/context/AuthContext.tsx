import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { MOCK_USER } from '../data/mock-user';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'user';
  workspaceName: string;
  status: 'active' | 'suspended';
  assignedPlan: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: 'owner' | 'admin' | 'user') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'cloudpulse_auth_user';
const AUTH_TOKEN_KEY = 'cloudpulse_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      id: MOCK_USER.id,
      name: MOCK_USER.name,
      email: MOCK_USER.email,
      role: 'owner',
      workspaceName: MOCK_USER.workspaceName,
      status: 'active',
      assignedPlan: 'pro-500gb',
    };
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_TOKEN_KEY) || 'mock_jwt_session_token_cp_auth';
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Try backend API first
      const res = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      if (res.ok) {
        const json = await res.json();
        const jwtToken = json.data?.token;
        const apiUser = json.data?.user;
        const authUser: AuthUser = {
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role || 'owner',
          workspaceName: apiUser.workspace_name || `${apiUser.name}'s Workspace`,
          status: apiUser.status || 'active',
          assignedPlan: 'pro-500gb',
        };
        setUser(authUser);
        setToken(jwtToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
        localStorage.setItem(AUTH_TOKEN_KEY, jwtToken);
        setIsLoading(false);
        return true;
      }
    } catch {
      // Offline fallback for smooth demo experience
    }

    // Local authentication fallback
    const role: 'owner' | 'admin' | 'user' = email.includes('admin') ? 'admin' : 'owner';
    const fallbackUser: AuthUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: email.split('@')[0].replace('.', ' '),
      email,
      role,
      workspaceName: `${email.split('@')[0]}'s Workspace`,
      status: 'active',
      assignedPlan: 'pro-500gb',
    };
    const fallbackToken = 'cp_sess_' + Math.random().toString(36).substring(2, 15);
    setUser(fallbackUser);
    setToken(fallbackToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackUser));
    localStorage.setItem(AUTH_TOKEN_KEY, fallbackToken);
    setIsLoading(false);
    return true;
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass }),
      });

      if (res.ok) {
        const json = await res.json();
        const jwtToken = json.data?.token;
        const apiUser = json.data?.user;
        const authUser: AuthUser = {
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role || 'owner',
          workspaceName: apiUser.workspace_name || `${name}'s Workspace`,
          status: 'active',
          assignedPlan: 'starter-100gb',
        };
        setUser(authUser);
        setToken(jwtToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
        localStorage.setItem(AUTH_TOKEN_KEY, jwtToken);
        setIsLoading(false);
        return true;
      }
    } catch {
      // Offline fallback
    }

    const fallbackUser: AuthUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      role: 'owner',
      workspaceName: `${name}'s Workspace`,
      status: 'active',
      assignedPlan: 'starter-100gb',
    };
    const fallbackToken = 'cp_sess_' + Math.random().toString(36).substring(2, 15);
    setUser(fallbackUser);
    setToken(fallbackToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackUser));
    localStorage.setItem(AUTH_TOKEN_KEY, fallbackToken);
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const switchRole = (newRole: 'owner' | 'admin' | 'user') => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
