import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Redirect to dashboard or login based on authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router, isMounted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
