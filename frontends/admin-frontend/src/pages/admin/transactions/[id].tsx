import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { useToast } from '../../../contexts/ToastContext';

interface Transaction {
  id: string;
  userId: string;
  transactionType: 'deposit' | 'withdraw' | 'mint' | 'burn';
  amount: string;
  currency: string;
  toCurrency?: string;
  status: string;
  txHash?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export default function TransactionDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { showToast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchTransaction();
  }, [id, router]);

  const fetchTransaction = async () => {
    const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
    if (!transactionApiUrl) {
      setError('Transaction API URL is not configured');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${transactionApiUrl}/wallet/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransaction(response.data.data || response.data);
    } catch (err: any) {
      console.error('Error fetching transaction:', err);
      if (err.response?.status === 404) {
        setError('Transaction not found');
      } else if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to load transaction');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!transaction || !confirm('Are you sure you want to approve this transaction?')) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
      await axios.post(
        `${transactionApiUrl}/wallet/transactions/${transaction.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Transaction approved successfully', 'success');
      fetchTransaction(); // Refresh transaction data
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to approve transaction', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!transaction) return;
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
      await axios.post(
        `${transactionApiUrl}/wallet/transactions/${transaction.id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Transaction rejected successfully', 'success');
      fetchTransaction(); // Refresh transaction data
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reject transaction', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      broadcasting: 'bg-purple-100 text-purple-800 border-purple-200',
      confirmed: 'bg-gray-100 text-gray-800 border-gray-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mint':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'burn':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'deposit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'withdraw':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      iso: date.toISOString(),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'The transaction you are looking for does not exist.'}</p>
              <Link
                href="/admin/transactions"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Transactions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dateInfo = formatDate(transaction.createdAt);
  const updatedDateInfo = formatDate(transaction.updatedAt);
  const canApprove = transaction.status === 'pending' || transaction.status === 'processing';
  const canReject = transaction.status === 'pending' || transaction.status === 'processing';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/transactions"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Transactions
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
              <p className="text-sm text-gray-500 mt-1 font-mono">{transaction.id}</p>
            </div>
            {/* Action Buttons */}
            {(canApprove || canReject) && (
              <div className="flex gap-3">
                {canApprove && (
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Transaction Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Status Header */}
          <div className={`px-6 py-4 border-b border-gray-200 ${getStatusColor(transaction.status).split(' ')[0]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(transaction.status)}`}>
                  {transaction.status.toUpperCase()}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getTypeColor(transaction.transactionType)}`}>
                  {transaction.transactionType.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {dateInfo.date} at {dateInfo.time}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount Section */}
              <div className="md:col-span-2">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <div className="text-sm text-gray-600 mb-1">Amount</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {parseFloat(transaction.amount || '0').toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {transaction.currency || 'USD'}
                  </div>
                  {transaction.toCurrency && transaction.toCurrency !== transaction.currency && (
                    <div className="text-sm text-gray-500 mt-2">
                      Converting to {transaction.toCurrency}
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Transaction ID</div>
                <div className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200 break-all">
                  {transaction.id}
                </div>
              </div>

              {/* User ID */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">User ID</div>
                <Link
                  href={`/admin/users/${transaction.userId}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200 break-all block hover:bg-blue-50 transition-colors"
                >
                  {transaction.userId}
                </Link>
              </div>

              {/* Transaction Hash */}
              {transaction.txHash && (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-gray-500 mb-1">Transaction Hash</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200 break-all">
                      {transaction.txHash}
                    </div>
                    <a
                      href={`https://etherscan.io/tx/${transaction.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      View on Etherscan
                      <svg className="w-4 h-4 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {transaction.reason && (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-gray-500 mb-1">Rejection Reason</div>
                  <div className="text-sm text-gray-900 bg-red-50 px-3 py-2 rounded border border-red-200 text-red-800">
                    {transaction.reason}
                  </div>
                </div>
              )}

              {/* Created At */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Created At</div>
                <div className="text-sm text-gray-900">
                  {dateInfo.date}
                  <br />
                  <span className="text-gray-500">{dateInfo.time}</span>
                </div>
              </div>

              {/* Updated At */}
              {transaction.updatedAt && transaction.updatedAt !== transaction.createdAt && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Last Updated</div>
                  <div className="text-sm text-gray-900">
                    {updatedDateInfo.date}
                    <br />
                    <span className="text-gray-500">{updatedDateInfo.time}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-3">Additional Information</div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(transaction.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
