import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { apolloClient } from '../../lib/apollo-client';
import { GET_USERS } from '../../graphql/queries/users.query';

interface User {
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
  active: string; // 'all' | 'true' | 'false'
}

export default function UsersList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    displayId: '',
    email: '',
    firstName: '',
    lastName: '',
    countryCode: '',
    mobileNumber: '',
    active: 'all',
  });

  // Debounce function
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const { data, loading, error, refetch } = useQuery(GET_USERS, {
    client: apolloClient,
    variables: {
      page,
      limit,
      role: 'user',
      filters: {
        displayId: columnFilters.displayId || undefined,
        email: columnFilters.email || undefined,
        firstName: columnFilters.firstName || undefined,
        lastName: columnFilters.lastName || undefined,
        countryCode: columnFilters.countryCode || undefined,
        mobileNumber: columnFilters.mobileNumber || undefined,
        active: columnFilters.active !== 'all' ? columnFilters.active === 'true' : undefined,
      },
    },
    fetchPolicy: 'network-only',
    skip: !localStorage.getItem('token'),
  });

  const users = data?.users?.data || [];
  const total = data?.users?.total || 0;
  const totalPages = data?.users?.totalPages || 1;

  // Sync pagination horizontal scroll with table scroll
  useEffect(() => {
    const tableContainer = document.getElementById('table-scroll-container');
    const paginationContainer = document.getElementById('pagination-scroll-container');
    
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
  }, [users]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching users:', error);
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        router.push('/login');
      }
    }
  }, [error, router]);

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
      active: 'all',
    });
    setPage(1);
  };

  return (
    <div className="bg-gray-50 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col p-2">
        <div className="mb-2 flex justify-between items-center">
          <h1 className="text-xl font-bold">Users Management</h1>
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 px-2 py-1 text-xs border rounded"
            >
              Clear Filters
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>


        {/* Users Table with Column Filters */}
        <div className="bg-white rounded-lg shadow flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0" id="table-scroll-container">
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
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]">Active</span>
                          <select
                            value={columnFilters.active}
                            onChange={(e) => handleColumnFilterChange('active', e.target.value)}
                            className="text-[10px] px-1 py-0.5 border rounded w-full h-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="all">All</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="text-[10px]">Roles</span>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="text-[10px]">Status</span>
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        <span className="text-[10px]">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-2 py-0.5 w-16">
                          <div className="flex-shrink-0 h-6 w-6">
                            {user.profileImage ? (
                              <img
                                className="h-6 w-6 rounded-full object-cover"
                                src={user.profileImage}
                                alt={`${user.firstName} ${user.lastName}`}
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-[10px]">
                                {user.firstName?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-0.5 text-[11px] font-medium text-gray-900">
                          {user.displayId}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-900">
                          {user.firstName}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-900">
                          {user.lastName}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-500">
                          {user.countryCode || '-'}
                        </td>
                        <td className="px-2 py-0.5 text-[11px] text-gray-500">
                          {user.mobileNumber || '-'}
                        </td>
                        <td className="px-2 py-0.5">
                          <span
                            className={`px-1 py-0 text-[10px] rounded ${
                              user.isVerified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {user.isVerified ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-2 py-0.5">
                          <div className="flex flex-wrap gap-0.5">
                            {user.roles.map((r, idx) => (
                              <span
                                key={idx}
                                className={`px-1 py-0 text-[10px] rounded ${
                                  r.role === 'super_admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : r.role === 'admin'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
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
                              user.isVerified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {user.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="px-2 py-0.5 text-[11px] font-medium w-16">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination - always visible below table */}
              <div className="bg-white border-t border-gray-200" id="pagination-scroll-container">
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
                          <span className="font-medium">{total}</span> users
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
