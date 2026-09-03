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
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Edit2,
  Trash2,
  Receipt,
  Search,
} from 'lucide-react';

const INITIAL_FORM = {
  kind: 'EXPENSE',
  category: 'General',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
};

export default function Finance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({
    preset: 'ALL_TIME',
    startDate: '',
    endDate: '',
  });

  const toast = useToast();

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
      if (typeFilter !== 'ALL') params.kind = typeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/transactions', { params });

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
      const msg = err.response?.data?.message || err.message || 'Failed to fetch transactions';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageLimit, dateFilter, typeFilter, searchQuery, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed summary metrics
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    rows.forEach((r) => {
      const val = Number(r.amount) || 0;
      if (r.kind === 'INCOME') income += val;
      else expense += val;
    });
    return {
      income,
      expense,
      balance: income - expense,
      count: totalRecords,
    };
  }, [rows, totalRecords]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setForm({
      kind: item.kind || 'EXPENSE',
      category: item.category || 'General',
      amount: item.amount || '',
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      note: item.note || '',
    });
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, form);
        toast('Transaction updated successfully');
      } else {
        await api.post('/transactions', form);
        toast('Transaction added successfully');
      }
      setOpenModal(false);
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/transactions/${deleteTarget._id}`);
      toast('Transaction deleted');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

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

  return (
    <section className="financePage">
      {/* Header with Title and Add Button */}
      <div className="sectionHead">
        <div>
          <p className="eyebrow">HOME FINANCE</p>
          <h2>Income & Expenses</h2>
        </div>
        <div className="sectionHeadActions">
          <DateFilter
            value={dateFilter}
            onChange={(d) => {
              setDateFilter(d);
              setCurrentPage(1);
            }}
          />
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Add transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid summaryGrid">
        <Card
          title="Total Income"
          value={summary.income}
          icon={TrendingUp}
          badge="Inflow"
          badgeType="good"
        />
        <Card
          title="Total Expenses"
          value={summary.expense}
          icon={TrendingDown}
          badge="Outflow"
          badgeType="bad"
        />
        <Card
          title="Net Balance"
          value={summary.balance}
          icon={Wallet}
          badge={summary.balance >= 0 ? 'Surplus' : 'Deficit'}
          badgeType={summary.balance >= 0 ? 'good' : 'bad'}
        />
      </div>

      {/* Filter / Search Bar */}
      <div className="filterBar">
        <div className="typePills">
          {['ALL', 'EXPENSE', 'INCOME'].map((type) => (
            <button
              key={type}
              type="button"
              className={`filterPill ${typeFilter === type ? 'active' : ''}`}
              onClick={() => {
                setTypeFilter(type);
                setCurrentPage(1);
              }}
            >
              {type === 'ALL' ? 'All Records' : type === 'EXPENSE' ? 'Expenses' : 'Income'}
            </button>
          ))}
        </div>

        <div className="searchBox">
          <Search size={15} className="searchIcon" />
          <input
            type="text"
            placeholder="Search by category or note..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="panel">
          <LoadingState count={5} message="Loading financial records..." />
        </div>
      ) : error ? (
        <div className="panel">
          <ErrorState message={error} onRetry={loadData} />
        </div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Receipt}
            title="No transactions found"
            description={
              searchQuery || typeFilter !== 'ALL' || dateFilter.preset !== 'ALL_TIME'
                ? 'No records match your active filters. Try resetting the filters or add a new transaction.'
                : 'You have not recorded any income or expenses yet.'
            }
            actionLabel="Add Transaction"
            onAction={handleOpenAdd}
          />
        </div>
      ) : (
        <div className="panel tableWrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount (PKR)</th>
                <th>Note</th>
                <th className="textRight">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td>{formatDateCell(r.date)}</td>
                  <td>
                    <span className={`pill ${r.kind === 'INCOME' ? 'good' : 'bad'}`}>
                      {r.kind}
                    </span>
                  </td>
                  <td>
                    <span className="categoryBadge">{r.category || 'General'}</span>
                  </td>
                  <td className="amountCell">
                    <span className={r.kind === 'INCOME' ? 'textGood' : 'textBad'}>
                      {r.kind === 'INCOME' ? '+' : '-'} {formatPKR(r.amount)}
                    </span>
                  </td>
                  <td className="noteCell">{r.note || '—'}</td>
                  <td className="textRight">
                    <div className="rowActions">
                      <button
                        type="button"
                        className="actionBtn editBtn"
                        title="Edit transaction"
                        onClick={() => handleOpenEdit(r)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="actionBtn deleteBtn"
                        title="Delete transaction"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Add / Edit Transaction Modal */}
      <Modal
        open={openModal}
        title={editingId ? 'Edit Transaction' : 'Add Home Finance Record'}
        onClose={() => setOpenModal(false)}
        maxWidth="560px"
      >
        <form className="formGrid" onSubmit={handleSave}>
          <div className="formTwoCol">
            <FormField label="Transaction Type" required>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option value="EXPENSE">EXPENSE (Outflow)</option>
                <option value="INCOME">INCOME (Inflow)</option>
              </select>
            </FormField>

            <FormField label="Category" required>
              <input
                type="text"
                required
                placeholder="e.g. Groceries, Electricity"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </FormField>
          </div>

          <div className="formTwoCol">
            <FormField label="Amount in PKR" required>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="e.g. 5000"
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

          <FormField label="Note (Optional)">
            <input
              type="text"
              placeholder="Additional details..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </FormField>

          <div className="formActions">
            <Button variant="ghost" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingId ? 'Update Record' : 'Save Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ${deleteTarget?.kind?.toLowerCase()} of ${formatPKR(deleteTarget?.amount)}?`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  );
}
