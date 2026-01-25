import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

export default function Wallet() {
  const router = useRouter();
  const { user, balance } = useUser();
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const [showBurn, setShowBurn] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchWalletInfo();
  }, [router]);

  const fetchWalletInfo = async () => {
    const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
    if (!transactionApiUrl) {
      console.error('NEXT_PUBLIC_TRANSACTION_API_URL is not set');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Fetch wallet info, balance, and deposit address in parallel
      const [walletInfoResponse, balanceResponse, depositAddressResponse] = await Promise.all([
        axios.get(`${transactionApiUrl}/wallet/info`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: null })),
        axios.get(`${transactionApiUrl}/transactions/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { balance: '0', stablecoinBalance: '0' } })),
        axios.get(`${transactionApiUrl}/wallet/deposit-address`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: null })),
      ]);
      
      setWalletInfo({
        ...walletInfoResponse.data,
        balance: balanceResponse.data,
        depositAddress: depositAddressResponse.data ? {
          address: depositAddressResponse.data.address,
          vaultAccountId: depositAddressResponse.data.vaultAccountId,
          customerRefId: depositAddressResponse.data.customerRefId,
          isActive: depositAddressResponse.data.isActive,
        } : null,
      });
    } catch (err: any) {
      console.error('Error fetching wallet info:', err);
      setError(err.response?.data?.message || 'Failed to load wallet information');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
    if (!transactionApiUrl) {
      setError('Configuration error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${transactionApiUrl}/wallet/deposit`,
        {
          amount: depositAmount,
          currency: 'USD',
          note: 'Deposit transaction',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuccess('Deposit transaction created successfully');
      setDepositAmount('');
      setShowDeposit(false);
      // Refresh wallet info and balance
      await fetchWalletInfo();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create deposit');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
    if (!transactionApiUrl) {
      setError('Configuration error');
      return;
    }

    // Check if user has sufficient USD balance
    const currentUsdBalance = parseFloat(walletInfo?.balance?.balance || balance?.balance || '0');
    const withdrawUsdAmount = parseFloat(withdrawAmount);
    
    if (withdrawUsdAmount > currentUsdBalance) {
      setError('Insufficient USD balance');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${transactionApiUrl}/transactions/withdraw`,
        {
          transactionType: 'withdraw',
          amount: withdrawAmount,
          currency: 'USD',
          note: 'Withdraw transaction',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuccess('Withdraw transaction created successfully. Waiting for admin approval.');
      setWithdrawAmount('');
      setShowWithdraw(false);
      // Refresh wallet info and balance
      await fetchWalletInfo();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create withdraw');
    }
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
    if (!transactionApiUrl) {
      setError('Configuration error');
      return;
    }

    // Check if user has sufficient USD balance
    const currentUsdBalance = parseFloat(walletInfo?.balance?.balance || balance?.balance || '0');
    const mintUsdAmount = parseFloat(mintAmount);
    
    if (mintUsdAmount > currentUsdBalance) {
      setError('Insufficient USD balance');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${transactionApiUrl}/transactions/mint`,
        {
          transactionType: 'mint',
          amount: mintAmount,
          currency: 'USD',
          toCurrency: 'STC',
          note: 'Mint stablecoin',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuccess('Mint transaction created successfully. Waiting for admin approval.');
      setMintAmount('');
      setShowMint(false);
      // Refresh wallet info and balance
      await fetchWalletInfo();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create mint transaction');
    }
  };

  const handleBurn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const transactionApiUrl = process.env.NEXT_PUBLIC_TRANSACTION_API_URL;
    if (!transactionApiUrl) {
      setError('Configuration error');
      return;
    }

    // Check if user has sufficient stablecoin balance
    const currentStablecoinBalance = parseFloat(walletInfo?.balance?.stablecoinBalance || balance?.stablecoinBalance || '0');
    const burnStablecoinAmount = parseFloat(burnAmount);
    
    if (burnStablecoinAmount > currentStablecoinBalance) {
      setError('Insufficient stablecoin balance');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${transactionApiUrl}/transactions/burn`,
        {
          transactionType: 'burn',
          amount: burnAmount,
          currency: 'STC',
          toCurrency: 'USD',
          note: 'Burn stablecoin',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuccess('Burn transaction created successfully. Waiting for admin approval.');
      setBurnAmount('');
      setShowBurn(false);
      // Refresh wallet info and balance
      await fetchWalletInfo();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create burn transaction');
    }
  };

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
          <h1 className="text-xl font-bold text-gray-900">Wallet</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your wallet and transactions</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">USD Balance</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ${parseFloat((walletInfo?.balance?.balance || balance?.balance || '0')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Stablecoin Balance</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {parseFloat((walletInfo?.balance?.stablecoinBalance || balance?.stablecoinBalance || '0')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} STC
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

      {/* Deposit Address */}
      {walletInfo?.depositAddress?.address ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Deposit Address</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-50 p-2 rounded border font-mono text-xs break-all">
              {walletInfo.depositAddress.address}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(walletInfo.depositAddress.address);
                setSuccess('Address copied to clipboard');
                setTimeout(() => setSuccess(''), 3000);
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Send funds to this address to deposit into your wallet
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Deposit Address</h3>
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-gray-500">Loading deposit address...</p>
          </div>
        </div>
      )}

      {/* Action Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deposit Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Deposit</h3>
          {!showDeposit ? (
            <button
              onClick={() => setShowDeposit(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Create Deposit Transaction
            </button>
          ) : (
            <form onSubmit={handleDeposit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeposit(false);
                    setDepositAmount('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Withdraw Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Withdraw</h3>
          {!showWithdraw ? (
            <button
              onClick={() => setShowWithdraw(true)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Create Withdraw Transaction
            </button>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdraw(false);
                    setWithdrawAmount('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Mint Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Mint (Create Stablecoin)</h3>
          <p className="text-xs text-gray-500 mb-3">Convert fiat USD to stablecoin (1:1 ratio)</p>
          {!showMint ? (
            <button
              onClick={() => setShowMint(true)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Create Mint Transaction
            </button>
          ) : (
            <form onSubmit={handleMint} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {mintAmount && parseFloat(mintAmount) > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-xs text-gray-600">You will receive:</p>
                  <p className="text-sm font-semibold text-green-700">
                    {parseFloat(mintAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} STC
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMint(false);
                    setMintAmount('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Burn Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Burn (Convert to Fiat)</h3>
          <p className="text-xs text-gray-500 mb-3">Convert stablecoin back to fiat USD (1:1 ratio)</p>
          {!showBurn ? (
            <button
              onClick={() => setShowBurn(true)}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              Create Burn Transaction
            </button>
          ) : (
            <form onSubmit={handleBurn} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (STC)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {burnAmount && parseFloat(burnAmount) > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                  <p className="text-xs text-gray-600">You will receive:</p>
                  <p className="text-sm font-semibold text-orange-700">
                    ${parseFloat(burnAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBurn(false);
                    setBurnAmount('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
