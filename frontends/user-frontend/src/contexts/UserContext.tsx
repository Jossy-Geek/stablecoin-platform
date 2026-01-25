import { createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  displayId: string;
  email: string;
  firstName: string;
  lastName: string;
  mobileNumber?: string;
  countryCode?: string;
  profileImage?: string;
  currentRole?: string;
  roles?: Array<{
    role: string;
    isActive: boolean;
    isBlocked: boolean;
  }>;
  isTwoFactorEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Balance {
  balance: string;
  stablecoinBalance: string;
  currency?: string;
}

interface UserContextType {
  user: User | null;
  balance: Balance | null;
  loading: boolean;
  refreshBalance?: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  balance: null,
  loading: true,
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
  user: User | null;
  balance: Balance | null;
  loading: boolean;
  refreshBalance?: () => Promise<void>;
}

export function UserProvider({ children, user, balance, loading, refreshBalance }: UserProviderProps) {
  return (
    <UserContext.Provider value={{ user, balance, loading, refreshBalance }}>
      {children}
    </UserContext.Provider>
  );
}
