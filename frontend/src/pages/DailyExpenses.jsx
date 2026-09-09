import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import DateFilter from '../components/DateFilter';
import CategorySelect from '../components/CategorySelect';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ConfirmModal from '../components/ConfirmModal';
import { useDebounce } from '../utils/debounce';
import { formatPKR } from '../utils/currency';
import { useToast } from '../components/Toast';
import {
  Utensils,
  Wrench,
  Receipt,
  Plus,
  Edit2,
  Trash2,
  Search,
  Coffee,
  Calendar,
  Layers,
  ArrowUpDown,
  CreditCard,
  PieChart,
} from 'lucide-react';

const INITIAL_FORM = {
  kind: 'EXPENSE',
  expenseType: 'DAILY',
  category: 'Miscellaneous Daily',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'CASH',
  note: '',
};

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { id: 'JAZZCASH', label: 'JazzCash' },
  { id: 'EASYPAISA', label: 'EasyPaisa' },
  { id: 'CARD', label: 'Card' },
  { id: 'OTHER', label: 'Other' },
];

/**
 * Computes list of recent months for the month selector dropdown
 */
function getRecentMonths() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push({ value: `${y}-${m}`, label });
  }
  return months;
}

export default function DailyExpenses() {
  // Month selector
  const availableMonths = useMemo(() => getRecentMonths(), []);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0]?.value || '');

  // Monthly summary & analytics data
  const [monthlyMetrics, setMonthlyMetrics] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Table state
  const [rows, setRows] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL | FOOD | DAILY | UTILITY
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [dateFilter, setDateFilter] = useState({
    preset: 'ALL_TIME',
    startDate: '',
    endDate: '',
  });

  // Modals state
  const [openAddModal, setOpenAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('DAILY'); // 'DAILY' or 'FOOD'
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  // Load Monthly Summary & Analytics
  const loadMonthlySummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get('/finance/monthly-summary', {
        params: { month: selectedMonth },
      });
      setMonthlyMetrics(res.data?.monthlyMetrics || null);
    } catch (err) {
      console.error('Failed to load monthly summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedMonth]);

  // Load Transactions for table
  const loadTransactions = useCallback(async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      const params = {
        kind: 'EXPENSE',
        page: currentPage,
        limit: pageLimit,
      };

      // Only apply monthYear if custom date range is not actively set
      if (dateFilter.preset === 'ALL_TIME' || dateFilter.preset === 'THIS_MONTH' || dateFilter.preset === 'LAST_MONTH') {
        if (!dateFilter.startDate && !dateFilter.endDate && selectedMonth) {
          params.monthYear = selectedMonth;
        }
      }

      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;

      if (typeFilter === 'FOOD') {
        params.expenseType = 'FOOD';
      } else if (typeFilter === 'DAILY') {
        params.expenseType = 'DAILY';
      } else if (typeFilter === 'UTILITY') {
        params.expenseType = 'UTILITY';
      } else {
        // Exclude general home finance if desired, or show all daily/food
        params.expenseType = 'DAILY,FOOD,UTILITY';
      }

      if (paymentFilter !== 'ALL') {
        params.paymentMethod = paymentFilter;
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const res = await api.get('/transactions', { params });

      if (res.data?.data) {
        setRows(res.data.data);
        setTotalRecords(res.data.total ?? res.data.data.length);
        setTotalPages(res.data.totalPages ?? 1);
      } else if (Array.isArray(res.data)) {
        setRows(res.data);
        setTotalRecords(res.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch daily expenses';
      setTableError(msg);
      toast(msg, 'error');
    } finally {
      setTableLoading(false);
    }
  }, [currentPage, pageLimit, selectedMonth, dateFilter, typeFilter, paymentFilter, debouncedSearch, toast]);

  useEffect(() => {
    loadMonthlySummary();
  }, [loadMonthlySummary]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Open Quick Add Modal
  const handleOpenAdd = (type = 'DAILY') => {
    setEditingItem(null);
    setModalMode(type);
    setForm({
      ...INITIAL_FORM,
      expenseType: type,
      category: type === 'FOOD' ? 'Office Lunch' : 'Bike Puncture & Tube',
      date: new Date().toISOString().slice(0, 10),
    });
    setOpenAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalMode(item.expenseType || 'DAILY');
    setForm({
      kind: 'EXPENSE',
      expenseType: item.expenseType || 'DAILY',
      category: item.category || 'Miscellaneous Daily',
      amount: item.amount || '',
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      paymentMethod: item.paymentMethod || 'CASH',
      note: item.note || '',
    });
    setOpenAddModal(true);
  };

  // Save (Add / Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast('Please enter a valid positive amount', 'error');
      return;
    }
    if (!form.category?.trim()) {
      toast('Please select or enter a category', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/transactions/${editingItem._id}`, form);
        toast('Expense updated successfully', 'success');
      } else {
        await api.post('/transactions', form);
        toast('Expense logged successfully', 'success');
      }
      setOpenAddModal(false);
      loadTransactions();
      loadMonthlySummary();
    } catch (err) {
      toast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Expense
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/transactions/${deleteTarget._id}`);
      toast('Expense deleted', 'success');
      setDeleteTarget(null);
      loadTransactions();
      loadMonthlySummary();
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Compute highest category
  const highestCategory = useMemo(() => {
    if (!monthlyMetrics?.categoryBreakdown?.length) return '—';
    const all = [
      ...(monthlyMetrics?.foodAnalytics?.topCategories || []),
      ...(monthlyMetrics?.dailyAnalytics?.topCategories || []),
    ];
    if (!all.length) return '—';
    all.sort((a, b) => b.amount - a.amount);
    return `${all[0].category} (${formatPKR(all[0].amount)})`;
  }, [monthlyMetrics]);

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

  const getBadgeStyle = (eType) => {
    switch (eType) {
      case 'FOOD':
        return 'pillFood';
      case 'UTILITY':
        return 'pillUtility';
      case 'DAILY':
      default:
        return 'pillDaily';
    }
  };

  return (
    <section className="dailyExpensesPage">
      {/* Top Header & Quick Actions */}
      <div className="sectionHead">
        <div>
          <p className="eyebrow">DAILY & FOOD EXPENSE TRACKER</p>
          <h2>Day-to-Day Spending & Food</h2>
        </div>
        <div className="sectionHeadActions">
          {/* Month Selector */}
          <div className="monthSelectWrap">
            <Calendar size={15} className="monthIcon" />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="monthSelect"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <DateFilter
            value={dateFilter}
            onChange={(d) => {
              setDateFilter(d);
              setCurrentPage(1);
            }}
          />

          <Button
            variant="ghost"
            icon={Coffee}
            onClick={() => handleOpenAdd('FOOD')}
            className="foodAddBtn"
          >
            + Add Food
          </Button>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => handleOpenAdd('DAILY')}
          >
            + Add Daily Expense
          </Button>
        </div>
      </div>

      {/* Analytical Summary Cards */}
      <div className="grid summaryGrid">
        <Card
          title="Total Month Expenses"
          value={monthlyMetrics?.expenses || 0}
          icon={Receipt}
          badge="Total Outflow"
          badgeType="bad"
          subtitle={`All expenses in ${availableMonths.find((m) => m.value === selectedMonth)?.label || 'Month'}`}
        />

        <Card
          title="Total Food Expense"
          value={monthlyMetrics?.foodAnalytics?.totalFood || 0}
          icon={Utensils}
          badge={`Avg: ${formatPKR(monthlyMetrics?.foodAnalytics?.dailyAverage || 0)} / day`}
          badgeType="good"
          subtitle={`${monthlyMetrics?.foodAnalytics?.transactionCount || 0} Food entries logged`}
        />

        <Card
          title="Daily Misc & Utilities"
          value={monthlyMetrics?.dailyAnalytics?.totalDaily || 0}
          icon={Wrench}
          badge="Bills & Repairs"
          badgeType="info"
          subtitle="Punctures, WiFi, load, utilities"
        />

        <Card
          title="Top Expense Category"
          value={highestCategory}
          icon={Layers}
          badge="Highest Consumer"
          badgeType="bad"
          subtitle="Category consuming most funds"
        />
      </div>

      {/* Visual Spending Breakdown (Food vs Daily vs Utilities vs Vehicles) */}
      {monthlyMetrics?.categoryBreakdown && monthlyMetrics.categoryBreakdown.length > 0 && (
        <div className="panel breakdownPanel">
          <div className="breakdownHead">
            <div>
              <h3>Is Mahine Mera Paisa Kahan Gaya?</h3>
              <p className="panelSubtitle">
                Detailed visual distribution of your expenditures for this month.
              </p>
            </div>
            <div className="totalSpentBadge">
              Total Spent: <strong>{formatPKR(monthlyMetrics.expenses)}</strong>
            </div>
          </div>

          {/* Multi-segment progress bar */}
          <div className="multiProgressBar">
            {monthlyMetrics.categoryBreakdown.map((c) => (
              <div
                key={c.name}
                className="progressSegment"
                style={{
                  width: `${Math.max(c.percentage, 3)}%`,
                  backgroundColor: c.color,
                }}
                title={`${c.name}: ${c.percentage}% (${formatPKR(c.amount)})`}
              />
            ))}
          </div>

          {/* Category breakdown cards list */}
          <div className="breakdownCardsGrid">
            {monthlyMetrics.categoryBreakdown.map((c) => (
              <div key={c.name} className="breakdownMetricCard">
                <div className="metricIndicator" style={{ backgroundColor: c.color }} />
                <div className="metricDetails">
                  <span className="metricName">{c.name}</span>
                  <div className="metricAmountRow">
                    <span className="metricVal">{formatPKR(c.amount)}</span>
                    <span className="metricPct">{c.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Top subcategories highlight */}
          <div className="topSubcategoriesRow">
            {monthlyMetrics.foodAnalytics?.topCategories?.length > 0 && (
              <div className="topSubcatCol">
                <h4>🍽️ Top Food Items</h4>
                <div className="tagList">
                  {monthlyMetrics.foodAnalytics.topCategories.slice(0, 4).map((f) => (
                    <span key={f.category} className="subcatTag foodTag">
                      {f.category}: <strong>{formatPKR(f.amount)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {monthlyMetrics.dailyAnalytics?.topCategories?.length > 0 && (
              <div className="topSubcatCol">
                <h4>🔧 Top Daily / Utility Bills</h4>
                <div className="tagList">
                  {monthlyMetrics.dailyAnalytics.topCategories.slice(0, 4).map((d) => (
                    <span key={d.category} className="subcatTag dailyTag">
                      {d.category}: <strong>{formatPKR(d.amount)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="filterBar">
        <div className="typePills">
          {[
            { id: 'ALL', label: 'All Daily & Food' },
            { id: 'FOOD', label: 'Food Only' },
            { id: 'DAILY', label: 'Daily Misc' },
            { id: 'UTILITY', label: 'Utilities & Bills' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`filterPill ${typeFilter === pill.id ? 'active' : ''}`}
              onClick={() => {
                setTypeFilter(pill.id);
                setCurrentPage(1);
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="filterBarRight">
          {/* Payment method filter */}
          <select
            className="paymentSelect"
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Payment Methods</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.label}
              </option>
            ))}
          </select>

          {/* Debounced Search Box */}
          <div className="searchBox">
            <Search size={15} className="searchIcon" />
            <input
              type="text"
              placeholder="Search by category, note, amount..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Table Content Area */}
      {tableLoading ? (
        <div className="panel">
          <LoadingState count={6} message="Loading expenses..." />
        </div>
      ) : tableError ? (
        <div className="panel">
          <ErrorState message={tableError} onRetry={loadTransactions} />
        </div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Receipt}
            title="No daily or food expenses found"
            description={
              searchQuery || typeFilter !== 'ALL' || dateFilter.preset !== 'ALL_TIME'
                ? 'No transactions match your active filters. Try clearing filters or add a new record.'
                : 'No daily or food expenses recorded for this month yet. Start tracking your daily spending!'
            }
            actionLabel="Add Daily Expense"
            onAction={() => handleOpenAdd('DAILY')}
          />
        </div>
      ) : (
        <div className="panel tableWrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount (PKR)</th>
                <th>Payment</th>
                <th>Note</th>
                <th className="textRight">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td>{formatDateCell(r.date)}</td>
                  <td>
                    <span className="categoryBadgeMain">{r.category}</span>
                  </td>
                  <td>
                    <span className={`pill ${getBadgeStyle(r.expenseType)}`}>
                      {r.expenseType || 'DAILY'}
                    </span>
                  </td>
                  <td className="amountCell">
                    <span className="textBad">- {formatPKR(r.amount)}</span>
                  </td>
                  <td>
                    <span className="paymentBadge">
                      <CreditCard size={12} />
                      <span>{r.paymentMethod || 'CASH'}</span>
                    </span>
                  </td>
                  <td className="noteCell">{r.note || '—'}</td>
                  <td className="textRight">
                    <div className="rowActions">
                      <button
                        type="button"
                        className="actionBtn editBtn"
                        title="Edit expense"
                        onClick={() => handleOpenEdit(r)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="actionBtn deleteBtn"
                        title="Delete expense"
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

          {/* Pagination */}
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

      {/* Add / Edit Daily & Food Expense Modal */}
      <Modal
        open={openAddModal}
        title={editingItem ? 'Edit Expense Record' : modalMode === 'FOOD' ? 'Add Food Expense' : 'Add Daily Expense'}
        onClose={() => setOpenAddModal(false)}
        maxWidth="560px"
      >
        <form className="formGrid" onSubmit={handleSave}>
          <div className="formTwoCol">
            <FormField label="Expense Type" required>
              <select
                value={form.expenseType}
                onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
              >
                <option value="FOOD">FOOD (Lunch, Dinner, Chai, Groceries)</option>
                <option value="DAILY">DAILY (Bike puncture, Petrol, Medical)</option>
                <option value="UTILITY">UTILITY (WiFi, Electricity, Gas, Water)</option>
                <option value="GENERAL">GENERAL (Other Household)</option>
              </select>
            </FormField>

            <FormField label="Amount in PKR" required>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="e.g. 450"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                autoFocus
              />
            </FormField>
          </div>

          <div className="formTwoCol">
            <FormField label="Category (Search or Create)" required>
              <CategorySelect
                value={form.category}
                onChange={(cat) => setForm({ ...form, category: cat })}
                type={form.expenseType}
                placeholder="Search or type new category..."
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

          <div className="formTwoCol">
            <FormField label="Payment Method">
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Note / Reference (Optional)">
              <input
                type="text"
                placeholder="e.g. Nayatel monthly, Tire tube change"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </FormField>
          </div>

          <div className="formActions">
            <Button variant="ghost" type="button" onClick={() => setOpenAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingItem ? 'Update Expense' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Expense Record"
        message={`Are you sure you want to delete ${deleteTarget?.category} of ${formatPKR(deleteTarget?.amount)}?`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  );
}
