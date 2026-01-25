import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { useToast } from '../../contexts/ToastContext';

interface Transaction {
  id: string;
  userId: string;
  transactionType: 'deposit' | 'withdraw' | 'mint' | 'burn';
  amount: string;
  currency: string;
  toCurrency?: string;
  status: string;
  txHash?: string;
  createdAt: string;
}

interface ColumnFilters {
  id: string;
  transactionType: string;
  amount: string;
  currency: string;
  toCurrency: string;
  status: string;
  txHash: string;
}

export default function TransactionsList() {
  const router = useRouter();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    id: '',
    transactionType: '',
    amount: '',
    currency: '',
    toCurrency: '',
    status: '',
    txHash: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchTransactions();
  }, [page, columnFilters]);

  const fetchTransactions = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add column filters
      Object.entries(columnFilters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
      if (!transactionApiUrl) {
        console.error('NEXT_PUBLIC_TRANSACTION_API_URL is not set in environment variables');
        setLoading(false);
        return;
      }
      const response = await axios.get(
        `${transactionApiUrl}/transactions?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTransactions(response.data.data || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

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
      toCurrency: '',
      status: '',
      txHash: '',
    });
    setPage(1);
  };

  const handleApproveClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowApproveModal(true);
  };

  const handleRejectClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleApproveTransaction = async () => {
    if (!selectedTransaction) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setProcessingId(selectedTransaction.id);
    try {
      const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
      if (!transactionApiUrl) {
        console.error('NEXT_PUBLIC_TRANSACTION_API_URL is not set in environment variables');
        setLoading(false);
        return;
      }
      await axios.post(
        `${transactionApiUrl}/transactions/${selectedTransaction.id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Refresh transactions list
      await fetchTransactions();
      setShowApproveModal(false);
      setSelectedTransaction(null);
      showToast('Transaction approved successfully', 'success');
    } catch (err: any) {
      console.error('Error approving transaction:', err);
      showToast(err.response?.data?.message || 'Failed to approve transaction', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTransaction = async () => {
    if (!selectedTransaction) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setProcessingId(selectedTransaction.id);
    try {
      const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
      if (!transactionApiUrl) {
        console.error('NEXT_PUBLIC_TRANSACTION_API_URL is not set in environment variables');
        setLoading(false);
        return;
      }
      await axios.post(
        `${transactionApiUrl}/transactions/${selectedTransaction.id}/reject`,
        { reason: rejectReason || undefined },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Refresh transactions list
      await fetchTransactions();
      setShowRejectModal(false);
      setSelectedTransaction(null);
      setRejectReason('');
      showToast('Transaction rejected successfully', 'success');
    } catch (err: any) {
      console.error('Error rejecting transaction:', err);
      showToast(err.response?.data?.message || 'Failed to reject transaction', 'error');
    } finally {
      setProcessingId(null);
    }
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Sync pagination horizontal scroll with table scroll
  useEffect(() => {
    const tableContainer = document.getElementById('transactions-table-scroll-container');
    const paginationContainer = document.getElementById('transactions-pagination-scroll-container');
    
    if (tableContainer && paginationContainer) {
      const paginationScrollDiv = paginationContainer.querySelector('.overflow-x-auto');
      
      if (paginationScrollDiv) {
        // Sync scroll positions
        const handleScroll = () => {
          (paginationScrollDiv as HTMLElement).scrollLeft = tableContainer.scrollLeft;
        };
        
        tableContainer.addEventListener('scroll', handleScroll);
        
        return () => {
          tableContainer.removeEventListener('scroll', handleScroll);
        };
      }
    }
  }, [transactions]);

  return (
    <div className="bg-gray-50 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col p-2">
        <div className="mb-2 flex justify-between items-center">
          <h1 className="text-xl font-bold">Transactions</h1>
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 px-2 py-1 text-xs border rounded"
            >
              Clear Filters
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Transactions Table with Column Filters */}
        <div className="bg-white rounded-lg shadow flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No transactions found</div>
          ) : (
            <>
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0" id="transactions-table-scroll-container">
                <table className="w-full divide-y divide-gray-200 table-auto">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Transaction ID</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.id}
                            onChange={(e) => handleColumnFilterChange('id', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Type</span>
                          <select
                            value={columnFilters.transactionType}
                            onChange={(e) => handleColumnFilterChange('transactionType', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
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
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Amount</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.amount}
                            onChange={(e) => handleColumnFilterChange('amount', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Currency</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.currency}
                            onChange={(e) => handleColumnFilterChange('currency', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">To Currency</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.toCurrency}
                            onChange={(e) => handleColumnFilterChange('toCurrency', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Status</span>
                          <select
                            value={columnFilters.status}
                            onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="broadcasting">Broadcasting</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Transaction Hash</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.txHash}
                            onChange={(e) => handleColumnFilterChange('txHash', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="text-[10px]">Date</span>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="text-[10px]">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-2 py-0.5 text-[11px] font-medium text-gray-900">
                          <Link
                            href={`/admin/transactions/${transaction.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {transaction.id.substring(0, 8)}...
                          </Link>
                        </td>
                        <td className="px-2 py-0.5">
                          <span className={`px-1 py-0 text-[10px] rounded ${getTypeColor(transaction.transactionType)}`}>
                            {transaction.transactionType}
                          </span>
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-900">
                          {parseFloat(transaction.amount).toFixed(2)}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-500">
                          {transaction.currency || 'USD'}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-500">
                          {transaction.toCurrency || '-'}
                        </td>
                        <td className="px-2 py-0.5">
                          <span className={`px-1 py-0 text-[10px] rounded ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-500 font-mono">
                          {transaction.txHash ? (
                            <span className="text-[10px]">{transaction.txHash.substring(0, 10)}...</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-0.5">
                          {transaction.status.toLowerCase() === 'pending' ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleApproveClick(transaction)}
                                disabled={processingId === transaction.id}
                                className="px-2 py-0.5 bg-green-600 text-white text-[10px] rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Approve transaction"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectClick(transaction)}
                                disabled={processingId === transaction.id}
                                className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reject transaction"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[10px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination - always visible below table */}
              <div className="bg-white border-t border-gray-200" id="transactions-pagination-scroll-container">
                <div className="overflow-x-auto">
                  <div className="px-2 py-1 flex items-center justify-between w-full">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="ml-3 relative inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex-shrink-0">
                        <p className="text-xs text-gray-700 whitespace-nowrap">
                          Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                          <span className="font-medium">{total}</span> transactions
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-2 py-1 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 10) {
                              pageNum = i + 1;
                            } else if (page <= 5) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 4) {
                              pageNum = totalPages - 9 + i;
                            } else {
                              pageNum = page - 4 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`relative inline-flex items-center px-2 py-1 border text-xs font-medium ${
                                  pageNum === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="relative inline-flex items-center px-2 py-1 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Approve Transaction Modal */}
      {showApproveModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Approve Transaction</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Transaction ID:</span>
                  <span className="text-sm text-gray-900 font-mono">{selectedTransaction.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Type:</span>
                  <span className={`text-sm px-2 py-0.5 rounded ${getTypeColor(selectedTransaction.transactionType)}`}>
                    {selectedTransaction.transactionType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Amount:</span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {parseFloat(selectedTransaction.amount).toFixed(2)} {selectedTransaction.currency || 'USD'}
                  </span>
                </div>
                {selectedTransaction.toCurrency && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">To Currency:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.toCurrency}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className={`text-sm px-2 py-0.5 rounded ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Date:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedTransaction.txHash && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Transaction Hash:</span>
                    <span className="text-sm text-gray-900 font-mono text-xs">
                      {selectedTransaction.txHash.substring(0, 10)}...
                    </span>
                  </div>
                )}
              </div>

              {selectedTransaction.transactionType === 'deposit' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Approving this deposit transaction will add {parseFloat(selectedTransaction.amount).toFixed(2)} {selectedTransaction.currency || 'USD'} to the user's fiat balance.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveTransaction}
                  disabled={processingId === selectedTransaction.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {processingId === selectedTransaction.id ? 'Processing...' : 'Yes, Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Transaction Modal */}
      {showRejectModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Transaction</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Transaction ID:</span>
                  <span className="text-sm text-gray-900 font-mono">{selectedTransaction.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Type:</span>
                  <span className={`text-sm px-2 py-0.5 rounded ${getTypeColor(selectedTransaction.transactionType)}`}>
                    {selectedTransaction.transactionType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Amount:</span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {parseFloat(selectedTransaction.amount).toFixed(2)} {selectedTransaction.currency || 'USD'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Date:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejecting this transaction..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedTransaction(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectTransaction}
                  disabled={processingId === selectedTransaction.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {processingId === selectedTransaction.id ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
