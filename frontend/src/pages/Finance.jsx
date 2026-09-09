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
import CategorySelect from '../components/CategorySelect';
import LogIncomeModal from '../components/LogIncomeModal';
import SalaryCycleModal from '../components/SalaryCycleModal';
import { useDebounce } from '../utils/debounce';
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
  Banknote,
  PiggyBank,
  History,
  AlertTriangle,
  CreditCard,
  Calendar,
  CheckCircle2,
  Zap,
} from 'lucide-react';

const INITIAL_FORM = {
  kind: 'EXPENSE',
  expenseType: 'GENERAL',
  category: 'Household General',
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

export default function Finance() {
  const availableMonths = useMemo(() => getRecentMonths(), []);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0]?.value || '');

  // Monthly summary & savings ledger data
  const [monthlySummaryData, setMonthlySummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [showSavingsHistory, setShowSavingsHistory] = useState(false);

  // Table state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openIncomeModal, setOpenIncomeModal] = useState(false);
  const [openCycleModal, setOpenCycleModal] = useState(false);
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
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [dateFilter, setDateFilter] = useState({
    preset: 'ALL_TIME',
    startDate: '',
    endDate: '',
  });

  const toast = useToast();

  // Load Monthly Summary & Savings Ledger
  const loadMonthlySummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get('/finance/monthly-summary', {
        params: { month: selectedMonth },
      });
      setMonthlySummaryData(res.data || null);
    } catch (err) {
      console.error('Failed to load monthly financial summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedMonth]);

  // Load Transactions with debounced search
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageLimit,
      };

      if (dateFilter.preset === 'ALL_TIME' || dateFilter.preset === 'THIS_MONTH' || dateFilter.preset === 'LAST_MONTH') {
        if (!dateFilter.startDate && !dateFilter.endDate && selectedMonth) {
          params.monthYear = selectedMonth;
        }
      }

      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;
      if (typeFilter !== 'ALL') params.kind = typeFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

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
  }, [currentPage, pageLimit, selectedMonth, dateFilter, typeFilter, debouncedSearch, toast]);

  useEffect(() => {
    loadMonthlySummary();
  }, [loadMonthlySummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Add Transaction
  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setOpenAddModal(true);
  };

  // Handle Edit Transaction
  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setForm({
      kind: item.kind || 'EXPENSE',
      expenseType: item.expenseType || 'GENERAL',
      category: item.category || 'General',
      amount: item.amount || '',
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      paymentMethod: item.paymentMethod || 'CASH',
      note: item.note || '',
    });
    setOpenAddModal(true);
  };

  // Save Transaction
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast('Please enter a valid positive amount', 'error');
      return;
    }
    if (!form.category?.trim()) {
      toast('Please select or create a category', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, form);
        toast('Transaction updated successfully', 'success');
      } else {
        await api.post('/transactions', form);
        toast('Transaction added successfully', 'success');
      }
      setOpenAddModal(false);
      loadData();
      loadMonthlySummary();
    } catch (err) {
      toast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Transaction
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/transactions/${deleteTarget._id}`);
      toast('Transaction deleted', 'success');
      setDeleteTarget(null);
      loadData();
      loadMonthlySummary();
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

  const ledger = monthlySummaryData?.savingsLedger;
  const metrics = monthlySummaryData?.monthlyMetrics;

  return (
    <section className="financePage">
      {/* Header with Title and Add Buttons */}
      <div className="sectionHead">
        <div>
          <p className="eyebrow">HOME FINANCE & SAVINGS LEDGER</p>
          <h2>Income, Expenses & Savings</h2>
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
            icon={Banknote}
            onClick={() => setOpenIncomeModal(true)}
            className="salaryAddBtn"
          >
            + Log Salary / Income
          </Button>

          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            + Add Transaction
          </Button>
        </div>
      </div>

      {/* Monthly Savings & Financial Rollover Widget */}
      <div className="panel savingsLedgerPanel">
        <div className="savingsLedgerHead">
          <div className="savingsHeadLeft">
            <div className="savingsIconOrb">
              <PiggyBank size={24} />
            </div>
            <div>
              <h3>
                Monthly Financial Balance —{' '}
                <span>{availableMonths.find((m) => m.value === selectedMonth)?.label || selectedMonth}</span>
              </h3>
              <p className="panelSubtitle">
                End-to-end ledger tracking salary inflow, total spending, and accumulated savings rollover.
              </p>
            </div>
          </div>

          <div className="savingsHeadRight">
            <Button
              variant="ghost"
              icon={Zap}
              size="sm"
              onClick={() => setOpenCycleModal(true)}
              className="cycleConfigBtn"
            >
              Auto-Cycle Settings
            </Button>
            <Button
              variant="ghost"
              icon={History}
              size="sm"
              onClick={() => setShowSavingsHistory(!showSavingsHistory)}
            >
              {showSavingsHistory ? 'Hide History' : 'Savings History'}
            </Button>
          </div>
        </div>

        {/* Dipping into savings warning alert if expenses exceed income */}
        {ledger?.isDippingIntoSavings && (
          <div className="savingsWarningBanner">
            <AlertTriangle size={20} className="warnIcon" />
            <div>
              <strong>Dipping into previous savings: {formatPKR(ledger.dippingAmount)}</strong>
              <p>
                Total expenses this month ({formatPKR(metrics?.expenses)}) exceeded current month income ({formatPKR(metrics?.income)}).
                Difference of {formatPKR(ledger.dippingAmount)} has been deducted from your previous savings reserve.
              </p>
            </div>
          </div>
        )}

        {/* Savings Metrics Row */}
        <div className="savingsMetricsGrid">
          <div className="savingsMetricItem incomeCard">
            <div className="metricItemTop">
              <div className="metricIconOrb orbGreen">
                <TrendingUp size={18} />
              </div>
              <span className="metricLabel">This Month Income</span>
            </div>
            <div className="metricValue textGood">
              +{formatPKR(metrics?.income || 0)}
            </div>
            <div className="metricSub">
              Salary: {formatPKR(metrics?.salaryIncome || 0)} | Other: {formatPKR(metrics?.otherIncome || 0)}
            </div>
          </div>

          <div className="savingsMetricItem expenseCard">
            <div className="metricItemTop">
              <div className="metricIconOrb orbRed">
                <TrendingDown size={18} />
              </div>
              <span className="metricLabel">This Month Spending</span>
            </div>
            <div className="metricValue textBad">
              -{formatPKR(metrics?.expenses || 0)}
            </div>
            <div className="metricSub">
              Food: {formatPKR(metrics?.foodExpenses || 0)} | Daily: {formatPKR(metrics?.dailyExpenses || 0)}
            </div>
          </div>

          <div className="savingsMetricItem remainingCard">
            <div className="metricItemTop">
              <div className="metricIconOrb orbBlue">
                <Wallet size={18} />
              </div>
              <span className="metricLabel">Current Remaining</span>
            </div>
            <div className={`metricValue ${metrics?.currentMonthRemaining > 0 ? 'textGood' : 'textDim'}`}>
              {formatPKR(metrics?.currentMonthRemaining || 0)}
            </div>
            <div className="metricSub">
              {metrics?.currentMonthRemaining > 0 ? 'Unused monthly budget' : 'All income consumed'}
            </div>
          </div>

          <div className="savingsMetricItem lastMonthCard">
            <div className="metricItemTop">
              <div className="metricIconOrb orbAmber">
                <History size={18} />
              </div>
              <span className="metricLabel">Last Month Savings</span>
            </div>
            <div className="metricValue textGood">
              {formatPKR(ledger?.lastMonthSavings || 0)}
            </div>
            <div className="metricSub">Brought forward to this month</div>
          </div>

          <div className="savingsMetricItem highlightItem totalSavingsCard">
            <div className="metricItemTop">
              <div className="metricIconOrb orbPurple">
                <PiggyBank size={18} />
              </div>
              <span className="metricLabel">Accumulated Savings</span>
            </div>
            <div className="metricValue textAccent">
              {formatPKR(ledger?.totalAccumulatedSavings || 0)}
            </div>
            <div className="metricSub">
              {ledger?.isDippingIntoSavings
                ? `Reduced by ${formatPKR(ledger.dippingAmount)}`
                : `+${formatPKR(ledger?.currentMonthNewSavings || 0)} added this month`}
            </div>
          </div>
        </div>

        {/* Collapsible Month-by-Month Savings History */}
        {showSavingsHistory && monthlySummaryData?.savingsHistory?.length > 0 && (
          <div className="savingsHistorySection">
            <h4>Historical Monthly Savings Ledger</h4>
            <div className="historyTableWrap">
              <table className="miniHistoryTable">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Income</th>
                    <th>Total Outflow</th>
                    <th>Month Net</th>
                    <th>Saved / Used</th>
                    <th>Closing Savings Reserve</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummaryData.savingsHistory.map((h) => {
                    const isSelected = h.month === selectedMonth;
                    return (
                      <tr key={h.month} className={isSelected ? 'selectedHistoryRow' : ''}>
                        <td>
                          <strong>{h.month}</strong>
                          {isSelected && <span className="activeMonthTag">Current</span>}
                        </td>
                        <td className="textGood">+{formatPKR(h.income)}</td>
                        <td className="textBad">-{formatPKR(h.expenses)}</td>
                        <td className={h.netBalance >= 0 ? 'textGood' : 'textBad'}>
                          {h.netBalance >= 0 ? '+' : ''}{formatPKR(h.netBalance)}
                        </td>
                        <td>
                          {h.previousSavingsUsed > 0 ? (
                            <span className="pill bad">
                              Used {formatPKR(h.previousSavingsUsed)}
                            </span>
                          ) : h.currentMonthNewSavings > 0 ? (
                            <span className="pill good">
                              Saved +{formatPKR(h.currentMonthNewSavings)}
                            </span>
                          ) : (
                            <span className="pill">Balanced</span>
                          )}
                        </td>
                        <td>
                          <strong className="textAccent">{formatPKR(h.closingSavings)}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
            placeholder="Search by category, note, amount..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Content Table Area */}
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
                : 'You have not recorded any income or expenses for this period yet.'
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
                <th>Kind</th>
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
                    <span className={`pill ${r.kind === 'INCOME' ? 'good' : 'bad'}`}>
                      {r.kind}
                    </span>
                  </td>
                  <td>
                    <span className="categoryBadgeMain">{r.category || 'General'}</span>
                  </td>
                  <td>
                    <span className="pill subPill">{r.expenseType || 'GENERAL'}</span>
                  </td>
                  <td className="amountCell">
                    <span className={r.kind === 'INCOME' ? 'textGood' : 'textBad'}>
                      {r.kind === 'INCOME' ? '+' : '-'} {formatPKR(r.amount)}
                    </span>
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
        open={openAddModal}
        title={editingId ? 'Edit Transaction' : 'Add Financial Record'}
        onClose={() => setOpenAddModal(false)}
        maxWidth="560px"
      >
        <form className="formGrid" onSubmit={handleSave}>
          <div className="formTwoCol">
            <FormField label="Transaction Kind" required>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option value="EXPENSE">EXPENSE (Outflow)</option>
                <option value="INCOME">INCOME (Inflow)</option>
              </select>
            </FormField>

            <FormField label="Expense / Income Type">
              <select
                value={form.expenseType}
                onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
              >
                <option value="GENERAL">GENERAL</option>
                <option value="DAILY">DAILY</option>
                <option value="FOOD">FOOD</option>
                <option value="UTILITY">UTILITY</option>
                <option value="SALARY">SALARY</option>
              </select>
            </FormField>
          </div>

          <div className="formTwoCol">
            <FormField label="Category (Search or Create)" required>
              <CategorySelect
                value={form.category}
                onChange={(cat) => setForm({ ...form, category: cat })}
                type={form.kind === 'INCOME' ? 'INCOME' : form.expenseType}
                placeholder="Search or type new category..."
              />
            </FormField>

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
          </div>

          <div className="formTwoCol">
            <FormField label="Date" required>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormField>

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
            <Button variant="ghost" type="button" onClick={() => setOpenAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingId ? 'Update Record' : 'Save Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dedicated Log Salary / Income Modal */}
      <LogIncomeModal
        open={openIncomeModal}
        onClose={() => setOpenIncomeModal(false)}
        onSuccess={() => {
          loadData();
          loadMonthlySummary();
        }}
      />

      {/* Automated Monthly Salary Cycle Modal */}
      <SalaryCycleModal
        open={openCycleModal}
        onClose={() => setOpenCycleModal(false)}
        onSuccess={() => {
          loadData();
          loadMonthlySummary();
        }}
      />

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
