import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useUser } from '../contexts/UserContext';
import { useTransactionSocket, TransactionUpdatePayload } from '../hooks/useTransactionSocket';
import { apolloClient } from '../lib/apollo-client';
import { GET_TRANSACTIONS } from '../graphql/queries/transactions.query';

interface ColumnFilters {
  id: string;
  transactionType: string;
  amount: string;
  currency: string;
  status: string;
  txHash: string;
}

export default function Transactions() {
  const router = useRouter();
  const { user } = useUser();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    id: '',
    transactionType: '',
    amount: '',
    currency: '',
    status: '',
    txHash: '',
  });

  /**
   * Handle real-time transaction updates from Socket.IO
   */
  const handleTransactionUpdate = useCallback((payload: TransactionUpdatePayload) => {
    console.log('🔄 [Transactions] Processing real-time update:', payload);
    
    setTransactions((prevTransactions) => {
      // Find if transaction already exists
      const existingIndex = prevTransactions.findIndex(
        (tx) => tx.id === payload.transactionId
      );

      if (existingIndex >= 0) {
        // Update existing transaction
        console.log(`✅ [Transactions] Updating existing transaction: ${payload.transactionId}`);
        const updated = [...prevTransactions];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status: payload.status.toLowerCase(),
          txHash: payload.txHash || updated[existingIndex].txHash,
          updatedAt: payload.timestamp,
          // Update amount and currency if provided
          ...(payload.amount && { amount: payload.amount }),
          ...(payload.transactionType && { transactionType: payload.transactionType }),
        };
        return updated;
      } else {
        // Transaction doesn't exist, prepend it to the list
        console.log(`➕ [Transactions] Adding new transaction: ${payload.transactionId}`);
        const newTransaction = {
          id: payload.transactionId,
          transactionType: payload.transactionType,
          amount: payload.amount,
          currency: payload.transactionType === 'burn' ? 'STC' : 'USD',
          status: payload.status.toLowerCase(),
          txHash: payload.txHash || null,
          createdAt: payload.timestamp,
          updatedAt: payload.timestamp,
        };
        
        // Prepend to maintain chronological order (newest first)
        return [newTransaction, ...prevTransactions];
      }
    });
  }, []);

  // Initialize socket connection for real-time updates
  // Use user?.id if available, otherwise hook will extract from token
  const { isConnected, connectionError, reconnect } = useTransactionSocket(
    user?.id || null,
    handleTransactionUpdate,
  );

  // Log connection status for debugging
  useEffect(() => {
    if (user?.id) {
      console.log('👤 [Transactions] User ID available:', user.id);
    } else {
      console.warn('⚠️  [Transactions] User ID not available in user context');
    }
    console.log('🔌 [Transactions] Socket connection status:', { isConnected, connectionError });
  }, [isConnected, connectionError, user?.id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
    client: apolloClient,
    variables: {
      page,
      limit,
      filters: {
        id: columnFilters.id || undefined,
        transactionType: columnFilters.transactionType || undefined,
        amount: columnFilters.amount || undefined,
        currency: columnFilters.currency || undefined,
        status: columnFilters.status || undefined,
        txHash: columnFilters.txHash || undefined,
      },
    },
    fetchPolicy: 'network-only',
    skip: !localStorage.getItem('token'),
  });

  const transactions = data?.transactions?.data || [];
  const total = data?.transactions?.total || 0;
  const totalPages = data?.transactions?.totalPages || 0;

  const handleColumnFilterChange = (column: keyof ColumnFilters, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setColumnFilters({
      id: '',
      transactionType: '',
      amount: '',
      currency: '',
      status: '',
      txHash: '',
    });
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      broadcasting: 'bg-purple-100 text-purple-800',
      confirmed: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mint':
        return 'bg-green-100 text-green-800';
      case 'burn':
        return 'bg-red-100 text-red-800';
      case 'deposit':
        return 'bg-blue-100 text-blue-800';
      case 'withdraw':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !transactions.length) {
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
          <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-600 mt-1">View your transaction history</p>
          {/* Socket Connection Status */}
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? '' : 'animate-pulse'}`}></div>
            <span className="text-xs text-gray-500">
              {isConnected ? (
                '✅ Real-time updates active'
              ) : connectionError ? (
                <span className="text-red-600">❌ {connectionError}</span>
              ) : (
                '⏳ Connecting to socket service...'
              )}
            </span>
            {!isConnected && connectionError && (
              <button
                onClick={reconnect}
                className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
                title="Reconnect to socket service"
              >
                Retry
              </button>
            )}
          </div>
          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-1 space-x-2">
              <span>Socket: {process.env.NEXT_PUBLIC_SOCKET_URL || 'Not configured'}</span>
              <span>|</span>
              <span>User: {user?.id ? `${user.id.substring(0, 8)}...` : 'Not available'}</span>
              <span>|</span>
              <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          )}
        </div>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 border rounded-lg hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transactions found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col gap-1">
                        <span>Transaction ID</span>
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={columnFilters.id}
                          onChange={(e) => handleColumnFilterChange('id', e.target.value)}
                          className="text-xs px-2 py-1 border rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col gap-1">
                        <span>Type</span>
                        <select
                          value={columnFilters.transactionType}
                          onChange={(e) => handleColumnFilterChange('transactionType', e.target.value)}
                          className="text-xs px-2 py-1 border rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">All</option>
                          <option value="deposit">Deposit</option>
                          <option value="withdraw">Withdraw</option>
                          <option value="mint">Mint</option>
                          <option value="burn">Burn</option>
                        </select>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col gap-1">
                        <span>Amount</span>
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={columnFilters.amount}
                          onChange={(e) => handleColumnFilterChange('amount', e.target.value)}
                          className="text-xs px-2 py-1 border rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col gap-1">
                        <span>Currency</span>
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={columnFilters.currency}
                          onChange={(e) => handleColumnFilterChange('currency', e.target.value)}
                          className="text-xs px-2 py-1 border rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col gap-1">
                        <span>Status</span>
                        <select
                          value={columnFilters.status}
                          onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                          className="text-xs px-2 py-1 border rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">All</option>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col gap-1">
                        <span>Transaction Hash</span>
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={columnFilters.txHash}
                          onChange={(e) => handleColumnFilterChange('txHash', e.target.value)}
                          className="text-xs px-2 py-1 border rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-900 font-mono">
                          {tx.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(tx.transactionType)}`}>
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(tx.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {tx.currency || 'USD'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {tx.txHash ? (
                          <a
                            href={`https://etherscan.io/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 font-mono"
                          >
                            {tx.txHash.slice(0, 10)}...
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Link
                          href={`/transactions/${tx.id}`}
                          className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View transaction details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} transactions
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
