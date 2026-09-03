import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import DateFilter from '../components/DateFilter';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { formatPKR } from '../utils/currency';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Search,
  Check,
  UserCheck,
  UserX,
  Phone,
  User,
} from 'lucide-react';

const INITIAL_FORM = {
  isExternal: false,
  otherUserId: '',
  externalPersonName: '',
  externalPersonContact: '',
  directionType: 'GIVEN', // 'GIVEN' (Maine Diya) or 'RECEIVED' (Maine Liya)
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
};

export default function Lend() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Form & Modals
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [userSearchText, setUserSearchText] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [directionFilter, setDirectionFilter] = useState('ALL'); // 'ALL' | 'GIVEN' | 'RECEIVED'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'DISPUTED' | 'SETTLED'
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL' | 'REGISTERED' | 'EXTERNAL'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({
    preset: 'ALL_TIME',
    startDate: '',
    endDate: '',
  });

  const toast = useToast();
  const currentUserId = currentUser?._id || currentUser?.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageLimit,
      };
      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (directionFilter !== 'ALL') params.direction = directionFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/lend', { params });

      if (res.data.data) {
        setRows(res.data.data);
        setTotalRecords(res.data.total ?? res.data.data.length);
        setTotalPages(res.data.totalPages ?? 1);
      } else if (Array.isArray(res.data)) {
        setRows(res.data);
        setTotalRecords(res.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch shared money records';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageLimit, dateFilter, statusFilter, directionFilter, searchQuery, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search users for modal selection
  const searchRegisteredUsers = useCallback(async (q) => {
    if (!q || q.trim().length < 2) return;
    setSearchingUsers(true);
    try {
      const res = await api.get('/users/search', { params: { q: q.trim() } });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silent
    } finally {
      setSearchingUsers(false);
    }
  }, []);

  const handleOpenAddModal = () => {
    setForm(INITIAL_FORM);
    setUserSearchText('');
    setOpenModal(true);
    api.get('/users/search?q=a').then((r) => {
      if (Array.isArray(r.data)) setUsers(r.data);
    }).catch(() => {});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.isExternal && !form.otherUserId) {
      return toast('Please select a registered user to share this transaction with', 'error');
    }
    if (form.isExternal && !form.externalPersonName.trim()) {
      return toast('Please enter the person or shop name', 'error');
    }

    setSubmitting(true);
    try {
      await api.post('/lend', form);
      toast(
        form.isExternal
          ? 'Offline loan record saved successfully'
          : 'Loan transaction created successfully'
      );
      setOpenModal(false);
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create transaction', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusAction = async (id, status) => {
    try {
      await api.patch(`/lend/${id}/status`, { status });
      if (status === 'ACCEPTED') toast('Transaction accepted');
      else if (status === 'DISPUTED') toast('Transaction marked as disputed', 'info');
      else if (status === 'SETTLED') toast('Loan marked as settled / paid');
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/lend/${deleteTarget._id}`);
      toast('Loan record removed');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Helper to determine relative direction and counterparty
  const getRecordDetails = (record) => {
    const isExternal = Boolean(record.isExternal);

    if (isExternal) {
      const isGiven = record.direction === 'GIVEN';
      return {
        isExternal: true,
        relativeDirection: isGiven ? 'GIVEN' : 'RECEIVED',
        counterpartyName: record.externalPersonName || 'External Contact',
        counterpartyEmail: record.externalPersonContact || 'Offline / Non-App Contact',
        isCurrentUserSender: isGiven,
        isCurrentUserReceiver: !isGiven,
        isCreator: true,
      };
    }

    const fromId = typeof record.fromUserId === 'object' ? record.fromUserId?._id : record.fromUserId;
    const toId = typeof record.toUserId === 'object' ? record.toUserId?._id : record.toUserId;

    const isCurrentUserSender = String(fromId) === String(currentUserId);
    const isCurrentUserReceiver = String(toId) === String(currentUserId);

    const relativeDirection = isCurrentUserSender ? 'GIVEN' : 'RECEIVED';
    const counterparty = isCurrentUserSender ? record.toUserId : record.fromUserId;
    const isCreator = String(record.createdBy?._id || record.createdBy) === String(currentUserId);

    return {
      isExternal: false,
      relativeDirection,
      counterpartyName: counterparty?.name || 'Unknown User',
      counterpartyEmail: counterparty?.email || '—',
      isCurrentUserSender,
      isCurrentUserReceiver,
      isCreator,
    };
  };

  // Client filtering
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const details = getRecordDetails(r);

      if (sourceFilter === 'REGISTERED' && details.isExternal) return false;
      if (sourceFilter === 'EXTERNAL' && !details.isExternal) return false;

      return true;
    });
  }, [rows, sourceFilter, currentUserId]);

  // Computed summary metrics
  const summary = useMemo(() => {
    let totalGiven = 0;
    let totalReceived = 0;
    let pendingCount = 0;

    filteredRows.forEach((r) => {
      const details = getRecordDetails(r);
      const val = Number(r.amount) || 0;

      if (r.status !== 'DISPUTED' && r.status !== 'SETTLED') {
        if (details.relativeDirection === 'GIVEN') totalGiven += val;
        else totalReceived += val;
      }

      if (r.status === 'PENDING' && details.isCurrentUserReceiver && !details.isExternal) {
        pendingCount += 1;
      }
    });

    return {
      totalGiven,
      totalReceived,
      netBalance: totalGiven - totalReceived,
      pendingCount,
    };
  }, [filteredRows, currentUserId]);

  const formatDateCell = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(d);
    }
  };

  const formatSettledDateTime = (d) => {
    if (!d) return null;
    try {
      const dt = new Date(d);
      const datePart = dt.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timePart = dt.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      return `${datePart}, ${timePart}`;
    } catch {
      return String(d);
    }
  };

  const getStatusBadge = (status, record) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="pill good">Accepted</span>;
      case 'DISPUTED':
        return <span className="pill bad">Disputed</span>;
      case 'SETTLED': {
        const settledStr = formatSettledDateTime(record?.settledAt);
        return (
          <span className="settledBadgeWrap">
            <span className="pill settledPill">Settled / Paid</span>
            {settledStr && (
              <span className="settledDateLabel" title="Settlement date & time">{settledStr}</span>
            )}
          </span>
        );
      }
      case 'PENDING':
      default:
        return <span className="pill warningPill">Pending</span>;
    }
  };

  return (
    <section className="lendPage">
      {/* Header */}
      <div className="sectionHead">
        <div>
          <p className="eyebrow">LOAN &amp; CREDIT TRACKER</p>
          <h2>Shared &amp; Personal Money Records</h2>
        </div>
        <div className="sectionHeadActions">
          <DateFilter
            value={dateFilter}
            onChange={(d) => {
              setDateFilter(d);
              setCurrentPage(1);
            }}
          />
          <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
            Add Loan Record
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid summaryGrid">
        <Card
          title="Money Lent (To Receive)"
          value={summary.totalGiven}
          icon={ArrowUpRight}
          badge="Money Lent"
          badgeType="good"
        />
        <Card
          title="Money Borrowed (To Pay)"
          value={summary.totalReceived}
          icon={ArrowDownLeft}
          badge="Money Borrowed"
          badgeType="bad"
        />
        <Card
          title="Net Balance"
          value={summary.netBalance}
          icon={ArrowLeftRight}
          badge={summary.netBalance >= 0 ? 'Net Receivable' : 'Net Payable'}
          badgeType={summary.netBalance >= 0 ? 'good' : 'bad'}
        />
      </div>

      {/* Filter / Search Bar */}
      <div className="filterBar">
        <div className="typePills">
          {[
            { id: 'ALL', label: 'All Records' },
            { id: 'GIVEN', label: 'Money Lent' },
            { id: 'RECEIVED', label: 'Money Borrowed' },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              className={`filterPill ${directionFilter === d.id ? 'active' : ''}`}
              onClick={() => {
                setDirectionFilter(d.id);
                setCurrentPage(1);
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="statusPills">
          {[
            { id: 'ALL', label: 'All Source' },
            { id: 'REGISTERED', label: 'App Users' },
            { id: 'EXTERNAL', label: 'Manual / Offline' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              className={`filterPill ${sourceFilter === s.id ? 'active' : ''}`}
              onClick={() => {
                setSourceFilter(s.id);
                setCurrentPage(1);
              }}
            >
              {s.label}
            </button>
          ))}

          {['ALL', 'PENDING', 'ACCEPTED', 'DISPUTED', 'SETTLED'].map((st) => (
            <button
              key={st}
              type="button"
              className={`filterPill statusFilterPill ${statusFilter === st ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
            >
              {st === 'ALL' ? 'All Status' : st}
            </button>
          ))}
        </div>

        <div className="searchBox">
          <Search size={15} className="searchIcon" />
          <input
            type="text"
            placeholder="Search person, phone, note..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="panel">
          <LoadingState count={5} message="Loading udhaar records..." />
        </div>
      ) : error ? (
        <div className="panel">
          <ErrorState message={error} onRetry={loadData} />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={ArrowLeftRight}
            title="No money records found"
            description={
              searchQuery || directionFilter !== 'ALL' || statusFilter !== 'ALL' || dateFilter.preset !== 'ALL_TIME'
                ? 'No records match your active filters. Try resetting filters or add a new record.'
                : 'You have not recorded any lent or borrowed money yet.'
            }
            actionLabel="Add Loan Record"
            onAction={handleOpenAddModal}
          />
        </div>
      ) : (
        <div className="panel tableWrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Direction</th>
                <th>Person / Contact</th>
                <th>Amount (PKR)</th>
                <th>Status</th>
                <th>Note</th>
                <th className="textRight">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => {
                const details = getRecordDetails(r);
                const isGiven = details.relativeDirection === 'GIVEN';

                return (
                  <tr key={r._id}>
                    <td>{formatDateCell(r.date)}</td>
                    <td>
                      <span className={`directionBadge ${isGiven ? 'given' : 'received'}`}>
                        {isGiven ? (
                          <>
                            <ArrowUpRight size={13} /> Money Lent
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft size={13} /> Money Borrowed
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="personInfo">
                        <div className="personNameRow">
                          <strong className="personName">{details.counterpartyName}</strong>
                          {details.isExternal && <span className="externalTag">Offline Contact</span>}
                        </div>
                        <small className="personEmail">{details.counterpartyEmail}</small>
                      </div>
                    </td>
                    <td className="amountCell">
                      <span className={isGiven ? 'textGood' : 'textBad'}>
                        {isGiven ? '+' : '-'} {formatPKR(r.amount)}
                      </span>
                    </td>
                    <td>{getStatusBadge(r.status, r)}</td>
                    <td className="noteCell">{r.note || '—'}</td>
                    <td className="textRight">
                      <div className="rowActions">
                        {/* If registered user and record is PENDING & current user is receiver: Accept / Dispute */}
                        {!details.isExternal && r.status === 'PENDING' && details.isCurrentUserReceiver && (
                          <div className="actions">
                            <button
                              type="button"
                              className="btnAction acceptBtn"
                              title="Accept transaction"
                              onClick={() => handleStatusAction(r._id, 'ACCEPTED')}
                            >
                              <Check size={13} /> Accept
                            </button>
                            <button
                              type="button"
                              className="btnAction disputeBtn"
                              title="Dispute transaction"
                              onClick={() => handleStatusAction(r._id, 'DISPUTED')}
                            >
                              <XCircle size={13} /> Dispute
                            </button>
                          </div>
                        )}

                        {/* If external record OR accepted registered record, user can mark Settled */}
                        {r.status !== 'SETTLED' && (details.isExternal || r.status === 'ACCEPTED') && (
                          <button
                            type="button"
                            className="btnAction settleBtn"
                            title="Mark as Settled / Paid back"
                            onClick={() => handleStatusAction(r._id, 'SETTLED')}
                          >
                            Mark Settled
                          </button>
                        )}

                        {/* Delete/Cancel action */}
                        <button
                          type="button"
                          className="actionBtn deleteBtn"
                          title="Delete record"
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 size={14} />
                        </button>
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

      {/* Add / Share Udhaar Modal */}
      <Modal
        open={openModal}
        title="Add or Share a Loan Record"
        onClose={() => setOpenModal(false)}
      >
        <form className="formGrid" onSubmit={handleSave}>
          {/* Nature Toggle: Udhaar Diya vs Udhaar Liya */}
          <FormField label="Transaction Nature" required helper="Specify whether you gave money or borrowed money">
            <div className="directionToggleGrid">
              <button
                type="button"
                className={`directionOption ${form.directionType === 'GIVEN' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, directionType: 'GIVEN' })}
              >
                <ArrowUpRight size={18} />
                <div>
                  <strong>Money Lent</strong>
                  <small>I gave money (They owe me)</small>
                </div>
              </button>
              <button
                type="button"
                className={`directionOption ${form.directionType === 'RECEIVED' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, directionType: 'RECEIVED' })}
              >
                <ArrowDownLeft size={18} />
                <div>
                  <strong>Money Borrowed</strong>
                  <small>I received money (I owe them)</small>
                </div>
              </button>
            </div>
          </FormField>

          {/* Person Type Tabs */}
          <FormField label="Is the Person Registered in the App?" required>
            <div className="userTypeTabs">
              <button
                type="button"
                className={`userTypeTab ${!form.isExternal ? 'active' : ''}`}
                onClick={() => setForm({ ...form, isExternal: false })}
              >
                <UserCheck size={16} />
                <span>Registered App User</span>
              </button>
              <button
                type="button"
                className={`userTypeTab ${form.isExternal ? 'active' : ''}`}
                onClick={() => setForm({ ...form, isExternal: true })}
              >
                <UserX size={16} />
                <span>Manual / Offline Contact</span>
              </button>
            </div>
          </FormField>

          {/* If Registered User: Search & Select */}
          {!form.isExternal ? (
            <>
              <FormField
                label="Search Registered User"
                helper="Search by name or email address"
              >
                <div className="userSearchWrap">
                  <input
                    type="text"
                    placeholder="Type name or email to search..."
                    value={userSearchText}
                    onChange={(e) => {
                      setUserSearchText(e.target.value);
                      searchRegisteredUsers(e.target.value);
                    }}
                  />
                  {searchingUsers && <span className="searchIndicator">Searching...</span>}
                </div>
              </FormField>

              <FormField label="Select User" required>
                <select
                  required={!form.isExternal}
                  value={form.otherUserId}
                  onChange={(e) => setForm({ ...form, otherUserId: e.target.value })}
                >
                  <option value="">-- Choose Registered User --</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          ) : (
            /* If External / Offline Person */
            <div className="formTwoCol">
              <FormField label="Person / Shop Name" required helper="e.g. Ali Bhai, Kashif Store, Hamza">
                <input
                  type="text"
                  required={form.isExternal}
                  placeholder="e.g. Ali Bhai"
                  value={form.externalPersonName}
                  onChange={(e) => setForm({ ...form, externalPersonName: e.target.value })}
                />
              </FormField>

              <FormField label="Phone / Contact (Optional)" helper="e.g. 0300-1234567">
                <input
                  type="text"
                  placeholder="e.g. 0300-1234567"
                  value={form.externalPersonContact}
                  onChange={(e) => setForm({ ...form, externalPersonContact: e.target.value })}
                />
              </FormField>
            </div>
          )}

          <div className="formTwoCol">
            <FormField label="Amount in PKR" required>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="e.g. 10000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </FormField>

            <FormField label="Date" required>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Note / Reference (Optional)" helper="e.g. Emergency loan, Groceries udhaar, Project split">
            <input
              type="text"
              placeholder="e.g. For shop inventory purchase"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </FormField>

          <div className="formActions">
            <Button variant="ghost" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {form.isExternal ? 'Save Offline Record' : 'Save Loan Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Udhaar Record"
        message={`Are you sure you want to delete this loan record of ${formatPKR(deleteTarget?.amount)}?`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  );
}
