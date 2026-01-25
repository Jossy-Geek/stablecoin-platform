import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from 'axios';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    countryCode: '+1',
    email: '',
    password: '',
  });
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCaptchaEnabled, setIsCaptchaEnabled] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState('');

  useEffect(() => {
    const captchaEnabled = process.env.NEXT_PUBLIC_IS_CAPTCHA === 'true';
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
    
    setIsCaptchaEnabled(captchaEnabled);
    setRecaptchaSiteKey(siteKey);
    
    if (captchaEnabled && !siteKey) {
      console.warn('ReCAPTCHA is enabled but NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate captcha if enabled
    if (isCaptchaEnabled && !captchaToken) {
      setError('Please complete the captcha verification');
      return;
    }
    
    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError('Configuration error: API URL not configured');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${apiUrl}/auth/register`, {
        ...formData,
        captchaToken: isCaptchaEnabled ? captchaToken : undefined,
      });
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
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
            <h2 className="text-3xl font-bold text-gray-900">Register as User</h2>
            <p className="text-gray-600 text-sm mt-2">
              Register for a user account. Admin accounts can only be created by Super Admin.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country Code</label>
                <input
                  type="text"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {isCaptchaEnabled && recaptchaSiteKey && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  sitekey={recaptchaSiteKey}
                  onChange={(token) => setCaptchaToken(token || '')}
                />
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || (isCaptchaEnabled && !captchaToken)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <div className="text-center">
            <a href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Already have an account? Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
