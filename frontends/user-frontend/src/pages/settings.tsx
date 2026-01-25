import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

export default function Settings() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableVerificationCode, setDisableVerificationCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (user?.isTwoFactorEnabled) {
      setIs2FAEnabled(true);
    }
  }, [router, user]);

  const handleSetup2FA = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError('Configuration error: API URL not configured');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${apiUrl}/auth/setup-2fa`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setTwoFactorSecret(response.data.secret);
      setQrCodeUrl(response.data.qrCode || response.data.qrCodeUrl);
      setShowSetup(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      setLoading(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError('Configuration error: API URL not configured');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${apiUrl}/auth/enable-2fa`,
        { code: verificationCode },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuccess('2FA enabled successfully');
      setIs2FAEnabled(true);
      setShowSetup(false);
      setVerificationCode('');
      setTwoFactorSecret('');
      setQrCodeUrl('');
      // Refresh user data to get updated 2FA status
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enable 2FA. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (disableVerificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      setLoading(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError('Configuration error: API URL not configured');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${apiUrl}/auth/disable-2fa`,
        { code: disableVerificationCode },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuccess('2FA disabled successfully');
      setIs2FAEnabled(false);
      setShowDisable(false);
      setDisableVerificationCode('');
      // Refresh user data to get updated 2FA status
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable 2FA. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
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
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your account settings</p>
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

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Profile Information</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Display ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{user?.displayId}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          {user?.mobileNumber && (
            <div>
              <label className="block text-xs font-medium text-gray-700">Mobile Number</label>
              <p className="mt-1 text-sm text-gray-900">
                {user?.countryCode} {user?.mobileNumber}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Two-Factor Authentication</h2>
            <p className="text-xs text-gray-500 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          {is2FAEnabled && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
              Enabled
            </span>
          )}
        </div>

        {!is2FAEnabled ? (
          <div className="space-y-3">
            {!showSetup ? (
              <button
                onClick={handleSetup2FA}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Setting up...' : 'Enable 2FA'}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 mb-3">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  {qrCodeUrl ? (
                    <div className="flex justify-center mb-3">
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                  ) : twoFactorSecret ? (
                    <div className="flex justify-center mb-3">
                      <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                        <span className="text-gray-400 text-sm">QR Code not available</span>
                      </div>
                    </div>
                  ) : null}
                  {twoFactorSecret && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">Or enter this code manually:</p>
                      <code className="block bg-white p-2 rounded border font-mono text-xs break-all">
                        {twoFactorSecret}
                      </code>
                    </div>
                  )}
                </div>

                <form onSubmit={handleEnable2FA} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Enter 6-digit verification code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      className="w-full px-3 py-2 border rounded-lg text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="000000"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading || verificationCode.length !== 6}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                      {loading ? 'Verifying...' : 'Verify and Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSetup(false);
                        setTwoFactorSecret('');
                        setQrCodeUrl('');
                        setVerificationCode('');
                        setError('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                Two-factor authentication is enabled for your account. You'll be required to enter a verification code when logging in.
              </p>
            </div>
            {!showDisable ? (
              <button
                onClick={() => setShowDisable(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Disable 2FA
              </button>
            ) : (
              <form onSubmit={handleDisable2FA} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Enter 6-digit verification code to disable 2FA
                  </label>
                  <input
                    type="text"
                    value={disableVerificationCode}
                    onChange={(e) => setDisableVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    className="w-full px-3 py-2 border rounded-lg text-center text-xl tracking-widest focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the code from your authenticator app to confirm disabling 2FA
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || disableVerificationCode.length !== 6}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {loading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisable(false);
                      setDisableVerificationCode('');
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
        )}
      </div>
    </div>
  );
}
