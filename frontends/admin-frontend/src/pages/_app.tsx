import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../components/layouts/AdminLayout';
import { ToastProvider } from '../contexts/ToastContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Redirect to login if not authenticated and trying to access protected routes or root
      if (router.pathname.startsWith('/admin') || router.pathname === '/') {
        router.push('/login');
      }
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      // Redirect authenticated users away from login/root to dashboard
      if (router.pathname === '/login' || router.pathname === '/') {
        router.push('/admin/dashboard');
      }
    }
    setLoading(false);
  }, [router]);

  // Don't wrap login page with layout
  if (router.pathname === '/login' || router.pathname === '/2fa' || router.pathname === '/forgot-password') {
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
    <ToastProvider>
      <AdminLayout>
        <Component {...pageProps} />
      </AdminLayout>
    </ToastProvider>
  );
}
