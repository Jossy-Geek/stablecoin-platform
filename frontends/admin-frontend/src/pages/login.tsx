import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from 'axios';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCaptchaEnabled, setIsCaptchaEnabled] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Get base URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error('NEXT_PUBLIC_API_URL is not set in environment variables');
      setError('Configuration error: API URL not configured');
      return;
    }
    setBaseUrl(apiUrl);
    
    // Check if captcha is enabled
    const captchaEnabled = process.env.NEXT_PUBLIC_IS_CAPTCHA === 'true';
    setIsCaptchaEnabled(captchaEnabled);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate captcha if enabled
    if (isCaptchaEnabled && !captchaToken) {
      setError('Please complete the captcha verification');
      return;
    }
    
    if (!baseUrl) {
      setError('Configuration error: API URL not configured');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${baseUrl}/auth/admin/login`, {
        email,
        password,
        captchaToken: isCaptchaEnabled ? captchaToken : undefined,
      });

      if (response.data.requiresTwoFactor) {
        localStorage.setItem('tempToken', response.data.tempToken);
        router.push('/2fa');
      } else {
        localStorage.setItem('token', response.data.token);
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">SP</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
            <p className="text-gray-600 text-sm mt-2">
              Admin users cannot register. Only Super Admin can create admin accounts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="admin@stablecoin.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>
            {isCaptchaEnabled && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
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
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>
          <div className="text-center">
            <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
