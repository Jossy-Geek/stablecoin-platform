import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function TwoFactorAuth() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const tempToken = localStorage.getItem('tempToken');
    if (!tempToken) {
      router.push('/login');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError('Configuration error: API URL not configured');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/auth/verify-2fa`, {
        code,
        tempToken,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.removeItem('tempToken');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">SP</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Two-Factor Authentication</h2>
            <p className="text-gray-600 text-sm mt-2">Enter the 6-digit code from your authenticator app</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">2FA Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="000000"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
