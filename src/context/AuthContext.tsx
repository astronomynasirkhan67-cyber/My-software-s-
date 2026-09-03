import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: string | null;
  isInitialSetup: boolean;
  login: (user: string) => void;
  logout: () => void;
  checkSetupStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isInitialSetup, setIsInitialSetup] = useState<boolean>(false);

  const checkSetupStatus = async () => {
    const isSetup = await window.api.auth.isSetup();
    setIsInitialSetup(!isSetup);
  };

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const login = (user: string) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, isInitialSetup, login, logout, checkSetupStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
