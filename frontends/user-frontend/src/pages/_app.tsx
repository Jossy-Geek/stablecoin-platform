import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import UserLayout from '../components/layouts/UserLayout';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      if (router.pathname !== '/login' && router.pathname !== '/register' && router.pathname !== '/2fa') {
        router.push('/login');
      }
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      if (router.pathname === '/login' || router.pathname === '/register' || router.pathname === '/') {
        router.push('/dashboard');
      }
    }
    setLoading(false);
  }, [router, isMounted]);

  // Don't wrap login/register/2fa pages with layout
  if (router.pathname === '/login' || router.pathname === '/register' || router.pathname === '/2fa') {
    return <Component {...pageProps} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <UserLayout>
      <Component {...pageProps} />
    </UserLayout>
  );
}
