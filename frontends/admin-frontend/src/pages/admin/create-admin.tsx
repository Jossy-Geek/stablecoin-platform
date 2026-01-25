import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from 'axios';
import { useUser } from '../../contexts/UserContext';

export default function CreateAdmin() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    countryCode: '+1',
    email: '',
    password: '',
    role: 'admin',
  });
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCaptchaEnabled, setIsCaptchaEnabled] = useState(false);

  useEffect(() => {
    // Check if captcha is enabled
    const captchaEnabled = process.env.NEXT_PUBLIC_IS_CAPTCHA === 'true';
    setIsCaptchaEnabled(captchaEnabled);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // User data is already available from AdminLayout context
    // Check if user is super_admin after user is loaded
    if (!userLoading && user) {
      if (user.currentRole !== 'super_admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, userLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate captcha if enabled
    if (isCaptchaEnabled && !captchaToken) {
      setError('Please complete the captcha verification');
      return;
    }
    
    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        setError('Configuration error: API URL not configured');
        setLoading(false);
        return;
      }
      await axios.post(
        `${apiUrl}/auth/create-admin`,
        {
          ...formData,
          captchaToken: isCaptchaEnabled ? captchaToken : undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess('Admin created successfully!');
      setFormData({
        firstName: '',
        lastName: '',
        mobileNumber: '',
        countryCode: '+1',
        email: '',
        password: '',
        role: 'admin',
      });
      setCaptchaToken('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.currentRole !== 'super_admin') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-3xl font-bold mb-6">Create Admin User</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full rounded-md border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full rounded-md border p-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Country Code</label>
                <input
                  type="text"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="w-full rounded-md border p-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="w-full rounded-md border p-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full rounded-md border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full rounded-md border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-md border p-2"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            {isCaptchaEnabled && (
              <div>
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
                  onChange={(token) => setCaptchaToken(token || '')}
                />
              </div>
            )}
            {error && <div className="text-red-500">{error}</div>}
            {success && <div className="text-green-500">{success}</div>}
            <button
              type="submit"
              disabled={loading || (isCaptchaEnabled && !captchaToken)}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Admin...' : 'Create Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
