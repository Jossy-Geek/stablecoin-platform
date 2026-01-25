import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { UserProvider } from '../../contexts/UserContext';

// Dynamically import NotificationBell with SSR disabled to avoid hooks order issues
const NotificationBell = dynamic(() => import('../NotificationBell'), {
  ssr: false,
});

interface UserLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  icon: ReactNode;
  label: string;
  path: string;
  badge?: number;
  submenu?: MenuItem[];
}

export default function UserLayout({ children }: UserLayoutProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<{ balance: string; stablecoinBalance: string; currency?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
    if (!transactionApiUrl) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const balanceResponse = await fetch(`${transactionApiUrl}/transactions/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          console.error('NEXT_PUBLIC_API_URL is not set in environment variables');
          setLoading(false);
          return;
        }

        const response = await fetch(`${apiUrl}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else if (response.status === 401) {
          router.push('/login');
          return;
        } else {
          console.error('Error fetching user:', response.status, response.statusText);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        // Don't redirect on network errors, just log
      } finally {
        setLoading(false);
      }
    };

    // Fetch user and balance once on mount
    fetchUser();
    fetchBalance();
  }, [router]);

  const menuItems: MenuItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Wallet',
      path: '/wallet',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      label: 'Transactions',
      path: '/transactions',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Settings',
      path: '/settings',
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const isActivePath = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <UserProvider user={user} balance={balance} loading={loading} refreshBalance={fetchBalance}>
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40 h-16 shadow-sm">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SP</span>
                </div>
                {!sidebarCollapsed && (
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Stablecoin Platform
                  </h1>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Balance Display */}
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <span className="text-xs text-gray-600">Balance:</span>
                <span className="text-sm font-semibold text-blue-600">
                  ${parseFloat(balance?.balance || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <aside
          className={`fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-30 overflow-y-auto ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <div key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-semibold shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          {!sidebarCollapsed && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs">
                <p className="font-semibold text-gray-700 mb-1">Display ID</p>
                <p className="text-blue-600 font-mono">{user?.displayId}</p>
                <p className="text-gray-500 mt-2 text-[10px]">© 2025 Stablecoin Platform</p>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main
          className={`pt-16 transition-all duration-300 min-h-screen ${
            sidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </UserProvider>
  );
}
