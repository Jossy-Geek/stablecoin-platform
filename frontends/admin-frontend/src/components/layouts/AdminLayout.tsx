import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UserProvider } from '../../contexts/UserContext';
import NotificationBell from '../NotificationBell';

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  icon: ReactNode;
  label: string;
  path: string;
  badge?: number;
  submenu?: MenuItem[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

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

    fetchUser();
  }, [router]);

  const menuItems: MenuItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: 'Dashboard',
      path: '/admin/dashboard',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      label: 'Users',
      path: '/admin/users',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: 'Admins',
      path: '/admin/admins',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      label: 'Transactions',
      path: '/admin/transactions',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: 'Contracts',
      path: '/admin/contracts',
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
    <UserProvider user={user} loading={loading}>
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
