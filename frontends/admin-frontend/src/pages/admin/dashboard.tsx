import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useUser } from '../../contexts/UserContext';
import { apolloClientTransaction } from '../../lib/apollo-client-transaction';
import { GET_TRANSACTION_STATS } from '../../graphql/queries/transaction-stats.query';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  const { data, loading: statsLoading, error } = useQuery(GET_TRANSACTION_STATS, {
    client: apolloClientTransaction,
    fetchPolicy: 'network-only',
    onCompleted: () => {
      setLoading(false);
    },
    onError: (err) => {
      console.error('Error fetching stats:', err);
      setLoading(false);
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const stats = data?.transactionStats || { totalMint: '0.00', totalBurn: '0.00' };
  const isLoading = loading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.firstName} {user?.lastName}!</p>
        </div>
        <Link
          href="/admin/users"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <span>← Back</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Mint</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats?.totalMint || '0.00'}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Burn</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats?.totalBurn || '0.00'}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
