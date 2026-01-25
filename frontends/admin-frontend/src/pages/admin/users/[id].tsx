import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

interface UserProfile {
  id: string;
  displayId: string;
  email: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  countryCode: string;
  profileImage: string | null;
  isVerified: boolean;
  isTwoFactorEnabled: boolean;
  roles: Array<{
    role: string;
    isActive: boolean;
    isBlocked: boolean;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error('NEXT_PUBLIC_API_URL is not set in environment variables');
        setLoading(false);
        return;
      }
      const response = await axios.get(
        `${apiUrl}/users/${id}/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(response.data);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      } else if (err.response?.status === 404) {
        router.push('/admin/users');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-red-500">User not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/users')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Users List
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0">
              {user.profileImage ? (
                <img
                  className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-4xl font-semibold border-4 border-gray-200">
                  {user.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600 mb-4">{user.email}</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {user.displayId}
                </span>
                {user.isVerified && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Verified
                  </span>
                )}
                {user.isTwoFactorEnabled && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    2FA Enabled
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Display ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.displayId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.firstName} {user.lastName}
                  </dd>
                </div>
                {user.mobileNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.countryCode} {user.mobileNumber}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Roles & Permissions</h2>
              <div className="space-y-2">
                {user.roles.map((role, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        role.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : role.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {role.role}
                    </span>
                    <div className="flex gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          role.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {role.isBlocked && (
                        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                          Blocked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
