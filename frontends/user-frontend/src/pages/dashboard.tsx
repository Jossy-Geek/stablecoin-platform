import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { useUser } from '../contexts/UserContext';

export default function Dashboard() {
  const router = useRouter();
  const { user, balance } = useUser();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchTransactions = async () => {
      const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;

      if (!transactionApiUrl) {
        console.error('NEXT_PUBLIC_TRANSACTION_API_URL is not set in environment variables');
        setLoading(false);
        return;
      }

      try {
        const transactionsResponse = await axios.get(`${transactionApiUrl}/wallet/transactions?page=1&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { data: [] } }));
        
        setTransactions(transactionsResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch transactions, balance comes from context
    fetchTransactions();
  }, [router]);

  if (loading) {
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
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Wallet Balance</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ${parseFloat(balance?.balance || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Stablecoin Balance</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {parseFloat(balance?.stablecoinBalance || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} STC
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/wallet"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-center"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">Wallet</p>
        </Link>

        <Link
          href="/transactions"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-center"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">Transactions</p>
        </Link>

        <Link
          href="/wallet"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-center"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">Deposit</p>
        </Link>

        <Link
          href="/wallet"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-center"
        >
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">Withdraw</p>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Link
            href="/transactions"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </Link>
        </div>
        <div className="p-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.transactionType === 'deposit' ? 'bg-green-100' :
                      tx.transactionType === 'withdraw' ? 'bg-red-100' :
                      tx.transactionType === 'mint' ? 'bg-blue-100' :
                      'bg-purple-100'
                    }`}>
                      {tx.transactionType === 'deposit' && (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      {tx.transactionType === 'withdraw' && (
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                      {tx.transactionType === 'mint' && (
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      {tx.transactionType === 'burn' && (
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{tx.transactionType}</p>
                      <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {parseFloat(tx.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency || 'USD'}
                    </p>
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded-full mt-1 ${
                      tx.status === 'confirmed' || tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
