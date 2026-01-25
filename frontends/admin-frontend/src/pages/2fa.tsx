import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Admin2FA() {
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

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        setError('Configuration error: API URL not configured');
        return;
      }
      const response = await axios.post(`${apiUrl}/auth/verify-2fa`, {
        code,
        tempToken,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.removeItem('tempToken');
      // Redirect based on role
      if (response.data.user?.role === 'super_admin' || response.data.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Two-Factor Authentication</h2>
        <p className="text-center text-gray-600">Enter the 6-digit code from your authenticator app</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">2FA Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              className="mt-1 block w-full rounded-md border p-2 text-center text-2xl tracking-widest"
              placeholder="000000"
            />
          </div>
          {error && <div className="text-red-500">{error}</div>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}
