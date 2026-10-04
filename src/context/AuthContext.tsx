import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { RoleName, User } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsRole: (role: RoleName) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulatedUserId, setSimulatedUserId] = useState<number | null>(null);

  // Helper fetch with headers
  const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (simulatedUserId) {
      headers.set('x-dev-user-id', String(simulatedUserId));
    }
    headers.set('Content-Type', 'application/json');

    const res = await fetch(url, {
      ...init,
      headers,
    });
    return res;
  };

  const fetchProfile = async (currentToken: string | null, devUserId?: number | null) => {
    try {
      const headers: Record<string, string> = {};
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
      if (devUserId) headers['x-dev-user-id'] = String(devUserId);

      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Fallback default demo user if not logged in
        if (!user) {
          const defaultUser: User = {
            id: 1,
            uid: 'admin-default',
            email: 'admin@darulistiqomah.ac.id',
            displayName: 'Guz Najih (Super Admin)',
            roleId: 1,
            unitId: null,
            roleName: 'SUPER_ADMIN',
            roleDesc: 'Super Administrator Darul Istiqomah',
            unitName: null,
            isActive: true,
          };
          setUser(defaultUser);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback
      if (!user) {
        setUser({
          id: 1,
          uid: 'admin-default',
          email: 'admin@darulistiqomah.ac.id',
          displayName: 'Guz Najih (Super Admin)',
          roleId: 1,
          unitId: null,
          roleName: 'SUPER_ADMIN',
          roleDesc: 'Super Administrator Darul Istiqomah',
          unitName: null,
          isActive: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          await fetchProfile(idToken);
        } catch (e) {
          console.error('Failed to get ID token:', e);
          await fetchProfile(null);
        }
      } else {
        setToken(null);
        // Load default staff operator session for preview
        await fetchProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      setSimulatedUserId(null);
      await fetchProfile(idToken);
    } catch (err: any) {
      console.error('Google login error:', err);
      alert('Gagal login dengan Google: ' + (err.message || 'Pop-up ditutup atau diblokir'));
      setLoading(false);
    }
  };

  const loginAsRole = async (role: RoleName) => {
    setLoading(true);
    try {
      const roleMap: Record<RoleName, { id: number; name: string; email: string; unitName?: string }> = {
        SUPER_ADMIN: { id: 1, name: 'Guz Najih (Super Admin)', email: 'guznajih@gmail.com' },
        PIMPINAN: { id: 2, name: 'K.H. Pimpinan Pondok', email: 'pimpinan@darulistiqomah.ac.id' },
        BENDAHARA: { id: 3, name: 'Ust. Ahmad Dahlan (Bendahara)', email: 'bendahara@darulistiqomah.ac.id' },
        PETUGAS_KEUANGAN: { id: 4, name: 'Siti Fatimah (Kasir / Petugas)', email: 'kasir@darulistiqomah.ac.id' },
        UNIT: { id: 5, name: 'Ust. Ridwan (Divisi Dapur)', email: 'dapur@darulistiqomah.ac.id', unitName: 'Dapur' },
      };

      const selected = roleMap[role];
      const simulated: User = {
        id: selected.id,
        uid: `sim-${role.toLowerCase()}`,
        email: selected.email,
        displayName: selected.name,
        roleId: selected.id,
        unitId: role === 'UNIT' ? 4 : null,
        roleName: role,
        roleDesc: `Role ${role}`,
        unitName: selected.unitName || null,
        isActive: true,
      };
      setUser(simulated);
      setSimulatedUserId(selected.id);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setToken(null);
      setSimulatedUserId(null);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        loginWithGoogle,
        loginAsRole,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
