import { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import Card from '../components/Card';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Shield,
  UserCheck,
  Search,
  UserX,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,
} from 'lucide-react';

export default function Admin() {
  const { user: loggedInUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Action states
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageLimit,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/admin/users', { params });
      if (res.data.users) {
        setData(res.data);
        setTotalRecords(res.data.total ?? res.data.count ?? res.data.users.length);
        setTotalPages(res.data.totalPages ?? 1);
      } else if (Array.isArray(res.data)) {
        setData({ users: res.data, count: res.data.length });
        setTotalRecords(res.data.length);
        setTotalPages(1);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Access denied or error fetching user list';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageLimit, searchQuery, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Search Input Change (resets to page 1)
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Toggle user active / disabled status
  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/users/${statusTarget._id}/status`);
      toast(res.data.message || 'User status updated');
      setStatusTarget(null);
      fetchUsers();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete standard user
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/admin/users/${deleteTarget._id}`);
      toast(res.data.message || 'User deleted successfully');
      setDeleteTarget(null);
      fetchUsers();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const usersList = data?.users || [];

  return (
    <section className="adminPage">
      <div className="sectionHead">
        <div>
          <p className="eyebrow">SUPER ADMIN PANEL</p>
          <h2>System Users & Security Directory</h2>
        </div>
      </div>

      <div className="grid summaryGrid">
        <Card
          title="Total Registered Users"
          value={totalRecords}
          isCurrency={false}
          icon={Users}
          badge="System Total"
          badgeType="good"
        />
        <Card
          title="Super Administrators"
          value={usersList.filter((u) => u.role === 'SUPER_ADMIN')?.length || 1}
          isCurrency={false}
          icon={Shield}
          badge="Protected"
          badgeType="neutral"
        />
        <Card
          title="Active Standard Users"
          value={usersList.filter((u) => u.role === 'USER' && u.status === 'ACTIVE')?.length || 0}
          isCurrency={false}
          icon={UserCheck}
          badge="Active"
          badgeType="good"
        />
        <Card
          title="Disabled Accounts"
          value={usersList.filter((u) => u.status === 'DISABLED')?.length || 0}
          isCurrency={false}
          icon={UserX}
          badge="Disabled"
          badgeType="bad"
        />
      </div>

      <div className="filterBar">
        <div className="searchBox">
          <Search size={15} className="searchIcon" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {loading ? (
        <div className="panel">
          <LoadingState count={5} message="Loading registered users..." />
        </div>
      ) : error ? (
        <div className="panel">
          <ErrorState
            title="Admin Access Restricted"
            message={error}
            onRetry={fetchUsers}
          />
        </div>
      ) : usersList.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Users}
            title="No users found"
            description="No registered users match your search query."
          />
        </div>
      ) : (
        <div className="panel tableWrap">
          <table>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th className="textRight">Account Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => {
                const isSuperAdmin = u.role === 'SUPER_ADMIN';
                const isSelf = String(u._id) === String(loggedInUser?._id || loggedInUser?.id);
                const isActive = u.status === 'ACTIVE';

                return (
                  <tr key={u._id}>
                    <td>
                      <div className="personInfo">
                        <strong className="personName">{u.name}</strong>
                        {isSuperAdmin && <span className="superAdminTag">👑 Super Admin</span>}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`pill ${isSuperAdmin ? 'superAdminPill' : 'userPill'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${isActive ? 'good' : 'bad'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="textRight">
                      <div className="rowActions">
                        {isSuperAdmin ? (
                          <span className="protectedBadge" title="Super Admin is permanently protected">
                            <Shield size={12} /> Protected Root
                          </span>
                        ) : (
                          <>
                            {/* Toggle Disable / Enable Button */}
                            <button
                              type="button"
                              className={`btnAction ${isActive ? 'disputeBtn' : 'acceptBtn'}`}
                              title={isActive ? 'Disable user access' : 'Activate user access'}
                              onClick={() => setStatusTarget(u)}
                            >
                              {isActive ? (
                                <>
                                  <Lock size={12} /> Disable
                                </>
                              ) : (
                                <>
                                  <Unlock size={12} /> Activate
                                </>
                              )}
                            </button>

                            {/* Delete User Button */}
                            <button
                              type="button"
                              className="actionBtn deleteBtn"
                              title="Delete user and clean records"
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            limit={pageLimit}
            onPageChange={setCurrentPage}
            onLimitChange={setPageLimit}
          />
        </div>
      )}

      {/* Toggle Status Confirmation Modal */}
      <ConfirmModal
        open={!!statusTarget}
        title={statusTarget?.status === 'ACTIVE' ? 'Disable User Account' : 'Activate User Account'}
        message={
          statusTarget?.status === 'ACTIVE'
            ? `Are you sure you want to disable ${statusTarget?.name} (${statusTarget?.email})? They will immediately lose login access.`
            : `Are you sure you want to reactivate ${statusTarget?.name} (${statusTarget?.email})?`
        }
        confirmLabel={statusTarget?.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
        confirmVariant={statusTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleToggleStatus}
        onClose={() => setStatusTarget(null)}
      />

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete User Permanently"
        message={`Are you sure you want to delete ${deleteTarget?.name} (${deleteTarget?.email})? All associated finance and vehicle records will be permanently removed.`}
        confirmLabel="Delete User"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteUser}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  );
}
