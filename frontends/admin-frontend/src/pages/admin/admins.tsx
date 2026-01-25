import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';

interface Admin {
  id: string;
  displayId: string;
  email: string;
  firstName: string;
  lastName: string;
  mobileNumber?: string;
  countryCode?: string;
  profileImage: string | null;
  isVerified: boolean;
  roles: Array<{
    role: string;
    isActive: boolean;
    isBlocked: boolean;
  }>;
  createdAt: string;
}

interface ColumnFilters {
  displayId: string;
  email: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  mobileNumber: string;
}

export default function AdminsList() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    displayId: '',
    email: '',
    firstName: '',
    lastName: '',
    countryCode: '',
    mobileNumber: '',
  });
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [isCaptchaEnabled, setIsCaptchaEnabled] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    countryCode: '+1',
    mobileNumber: '',
    role: 'admin',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsCaptchaEnabled(process.env.NEXT_PUBLIC_IS_CAPTCHA === 'true');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchAdmins();
  }, [page, columnFilters]);

  // Sync pagination horizontal scroll with table scroll
  useEffect(() => {
    const tableContainer = document.getElementById('admins-table-scroll-container');
    const paginationContainer = document.getElementById('admins-pagination-scroll-container');
    
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
  }, [admins]);

  const fetchAdmins = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        role: 'admin', // Fetch both admin and super_admin
      });

      // Add column-specific filters
      if (columnFilters.displayId) params.append('displayId', columnFilters.displayId);
      if (columnFilters.email) params.append('email', columnFilters.email);
      if (columnFilters.firstName) params.append('firstName', columnFilters.firstName);
      if (columnFilters.lastName) params.append('lastName', columnFilters.lastName);
      if (columnFilters.countryCode) params.append('countryCode', columnFilters.countryCode);
      if (columnFilters.mobileNumber) params.append('mobileNumber', columnFilters.mobileNumber);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error('NEXT_PUBLIC_API_URL is not set in environment variables');
        setLoading(false);
        return;
      }
      const response = await axios.get(
        `${apiUrl}/users/admins?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAdmins(response.data.data);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      console.error('Error fetching admins:', err);
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
      displayId: '',
      email: '',
      firstName: '',
      lastName: '',
      countryCode: '',
      mobileNumber: '',
    });
    setPage(1);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error('NEXT_PUBLIC_API_URL is not set in environment variables');
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

      alert('Admin created successfully!');
      setShowAddAdmin(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        countryCode: '+1',
        mobileNumber: '',
        role: 'admin',
      });
      setCaptchaToken(null);
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col p-2">
        <div className="mb-2 flex justify-between items-center">
          <h1 className="text-xl font-bold">Admins Management</h1>
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 px-2 py-1 text-xs border rounded"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setShowAddAdmin(true)}
              className="bg-blue-600 text-white px-2 py-1 text-xs rounded-md hover:bg-blue-700"
            >
              Add Admin
            </button>
            <Link
              href="/admin/dashboard"
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Add Admin Sidebar */}
        {showAddAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-end">
            <div className="bg-white w-full max-w-md h-full shadow-xl overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Add Admin</h2>
                  <button
                    onClick={() => {
                      setShowAddAdmin(false);
                      setFormData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        password: '',
                        countryCode: '+1',
                        mobileNumber: '',
                        role: 'admin',
                      });
                      setCaptchaToken(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full rounded-md border p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full rounded-md border p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-md border p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-md border p-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country Code</label>
                      <input
                        type="text"
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="w-full rounded-md border p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        className="w-full rounded-md border p-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
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
                        onChange={(token) => setCaptchaToken(token)}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || (isCaptchaEnabled && !captchaToken)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Admin'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Admins Table with Column Filters */}
        <div className="bg-white rounded-lg shadow flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No admins found</div>
          ) : (
            <>
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0" id="admins-table-scroll-container">
                <table className="w-full divide-y divide-gray-200 table-auto">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Profile
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Display ID</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.displayId}
                            onChange={(e) => handleColumnFilterChange('displayId', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">First Name</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.firstName}
                            onChange={(e) => handleColumnFilterChange('firstName', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Last Name</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.lastName}
                            onChange={(e) => handleColumnFilterChange('lastName', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Email</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.email}
                            onChange={(e) => handleColumnFilterChange('email', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Country Code</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.countryCode}
                            onChange={(e) => handleColumnFilterChange('countryCode', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Mobile</span>
                          <input
                            type="text"
                            placeholder="Filter..."
                            value={columnFilters.mobileNumber}
                            onChange={(e) => handleColumnFilterChange('mobileNumber', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="text-[10px]">Roles</span>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="text-[10px]">Status</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-2 py-0.5 w-16">
                          <div className="flex-shrink-0 h-6 w-6">
                            {admin.profileImage ? (
                              <img
                                className="h-6 w-6 rounded-full object-cover"
                                src={admin.profileImage}
                                alt={`${admin.firstName} ${admin.lastName}`}
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-[10px]">
                                {admin.firstName?.[0]?.toUpperCase() || 'A'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-0.5 text-[11px] font-medium text-gray-900">
                          {admin.displayId}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-900">
                          {admin.firstName}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-900">
                          {admin.lastName}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-500">
                          {admin.email}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-500">
                          {admin.countryCode || '-'}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-500">
                          {admin.mobileNumber || '-'}
                        </td>
                        <td className="px-2 py-0.5">
                          <div className="flex flex-wrap gap-0.5">
                            {admin.roles.map((r, idx) => (
                              <span
                                key={idx}
                                className={`px-1 py-0 text-[10px] rounded ${
                                  r.role === 'super_admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {r.role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-0.5">
                          <span
                            className={`px-1 py-0 text-[10px] rounded ${
                              admin.isVerified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {admin.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination - always visible below table */}
              <div className="bg-white border-t border-gray-200" id="admins-pagination-scroll-container">
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
                          <span className="font-medium">{total}</span> admins
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
    </div>
  );
}
