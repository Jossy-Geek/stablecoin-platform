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

interface UserContextType {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
  user: User | null;
  loading: boolean;
}

export function UserProvider({ children, user, loading }: UserProviderProps) {
  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}
