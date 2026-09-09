import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import DateFilter from '../components/DateFilter';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ThreeCanvasChart from '../components/ThreeCanvasChart';
import LogIncomeModal from '../components/LogIncomeModal';
import SalaryCycleModal from '../components/SalaryCycleModal';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import CategorySelect from '../components/CategorySelect';
import { formatPKR } from '../utils/currency';
import {
  TrendingUp,
  TrendingDown,
  Car,
  Bike,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ShieldCheck,
  PiggyBank,
  Utensils,
  Wrench,
  Plus,
  Coffee,
  Banknote,
  AlertTriangle,
  Zap,
  History,
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [openCycleModal, setOpenCycleModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    preset: 'ALL_TIME',
    startDate: '',
    endDate: '',
  });

  // Quick Action Modals
  const [openIncomeModal, setOpenIncomeModal] = useState(false);
  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [expenseModalType, setExpenseModalType] = useState('DAILY'); // 'DAILY' | 'FOOD'
  const [expenseForm, setExpenseForm] = useState({
    kind: 'EXPENSE',
    expenseType: 'DAILY',
    category: 'Miscellaneous Daily',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'CASH',
    note: '',
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const toast = useToast();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;

      const [dashRes, monthRes] = await Promise.all([
        api.get('/dashboard', { params }),
        api.get('/finance/monthly-summary'),
      ]);

      setData(dashRes.data);
      setMonthlyData(monthRes.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to load dashboard data';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, toast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleOpenQuickExpense = (type = 'DAILY') => {
    setExpenseModalType(type);
    setExpenseForm({
      kind: 'EXPENSE',
      expenseType: type,
      category: type === 'FOOD' ? 'Office Lunch' : 'Bike Puncture & Tube',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'CASH',
      note: '',
    });
    setOpenExpenseModal(true);
  };

  const handleSaveQuickExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      toast('Please enter a valid amount', 'error');
      return;
    }
    setSubmittingExpense(true);
    try {
      await api.post('/transactions', expenseForm);
      toast(`${expenseModalType === 'FOOD' ? 'Food' : 'Daily'} expense logged!`, 'success');
      setOpenExpenseModal(false);
      fetchDashboard();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save expense', 'error');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const ledger = monthlyData?.savingsLedger;
  const metrics = monthlyData?.monthlyMetrics;

  return (
    <section className="dashboardPage">
      {/* Top Filter & Actions Header */}
      <div className="sectionHead">
        <div>
          <p className="eyebrow">FINANCIAL SUMMARY</p>
          <h2>Dashboard Overview</h2>
        </div>
        <div className="sectionHeadActions">
          <DateFilter value={dateFilter} onChange={setDateFilter} />

          <Button
            variant="ghost"
            icon={Coffee}
            onClick={() => handleOpenQuickExpense('FOOD')}
            className="foodAddBtn"
          >
            + Food Expense
          </Button>

          <Button
            variant="ghost"
            icon={Wrench}
            onClick={() => handleOpenQuickExpense('DAILY')}
          >
            + Daily Expense
          </Button>

          <Button
            variant="primary"
            icon={Banknote}
            onClick={() => setOpenIncomeModal(true)}
          >
            + Log Salary / Income
          </Button>
        </div>
      </div>

      {/* Hero Banner with PKR Badge */}
      <div className="hero">
        <div className="heroContent">
          <div className="heroBadge">
            <ShieldCheck size={14} />
            <span>Pakistan Currency Edition</span>
          </div>
          <h2>Your Financial Pulse</h2>
          <p>
            Track daily expenses, food spending, monthly salary inflows, and accumulated savings rollover in PKR.
          </p>
        </div>
        <div className="heroOrb" title="Pakistani Rupee (PKR)">
          PKR
        </div>
      </div>

      {loading ? (
        <LoadingState type="cards" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDashboard} />
      ) : (
        <>
          {/* Monthly Savings & Balance Quick Summary Card */}
          {ledger && (
            <div className="panel savingsLedgerPanel dashboardSavingsCard">
              <div className="savingsLedgerHead">
                <div className="savingsHeadLeft">
                  <div className="savingsIconOrb">
                    <PiggyBank size={24} />
                  </div>
                  <div>
                    <h3>
                      Monthly Savings & Financial Rollover ({monthlyData?.selectedMonth || 'Current Month'})
                    </h3>
                    <p className="panelSubtitle">
                      Unspent salary from last month automatically preserved in your savings reserve.
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
                </div>
              </div>

              {ledger.isDippingIntoSavings && (
                <div className="savingsWarningBanner">
                  <AlertTriangle size={20} className="warnIcon" />
                  <div>
                    <strong>Dipping into previous savings: {formatPKR(ledger.dippingAmount)}</strong>
                    <p>
                      This month's expenses exceeded current income. Difference was withdrawn from previous savings.
                    </p>
                  </div>
                </div>
              )}

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
                    Salary: {formatPKR(metrics?.salaryIncome || 0)}
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
                  <div className="metricSub">Unused monthly budget</div>
                </div>

                <div className="savingsMetricItem lastMonthCard">
                  <div className="metricItemTop">
                    <div className="metricIconOrb orbAmber">
                      <History size={18} />
                    </div>
                    <span className="metricLabel">Last Month Savings</span>
                  </div>
                  <div className="metricValue textGood">
                    {formatPKR(ledger.lastMonthSavings)}
                  </div>
                  <div className="metricSub">Brought forward</div>
                </div>

                <div className="savingsMetricItem highlightItem totalSavingsCard">
                  <div className="metricItemTop">
                    <div className="metricIconOrb orbPurple">
                      <PiggyBank size={18} />
                    </div>
                    <span className="metricLabel">Accumulated Savings</span>
                  </div>
                  <div className="metricValue textAccent">
                    {formatPKR(ledger.totalAccumulatedSavings)}
                  </div>
                  <div className="metricSub">
                    {ledger.isDippingIntoSavings
                      ? `Used ${formatPKR(ledger.dippingAmount)} this month`
                      : `+${formatPKR(ledger.currentMonthNewSavings)} added this month`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Financial Metrics Grid */}
          <div className="grid">
            <Card
              title="Total Income"
              value={data?.income}
              icon={TrendingUp}
              badge="Inflow"
              badgeType="good"
            />
            <Card
              title="Home & Misc Expenses"
              value={data?.expense}
              icon={TrendingDown}
              badge="Outflow"
              badgeType="bad"
            />
            <Card
              title="Food Spending"
              value={data?.foodExpense || metrics?.foodExpenses || 0}
              icon={Utensils}
              subtitle="Lunch, dinner, chai, groceries"
              badge="Food & Dining"
              badgeType="bad"
            />
            <Card
              title="Daily & Utilities"
              value={data?.dailyExpense || metrics?.dailyExpenses || 0}
              icon={Wrench}
              subtitle="Punctures, bills, packages"
              badge="Daily Misc"
              badgeType="info"
            />
            <Card
              title="Car Expenses"
              value={data?.car}
              icon={Car}
              subtitle="Fuel & Maintenance"
            />
            <Card
              title="Bike Expenses"
              value={data?.bike}
              icon={Bike}
              subtitle="Fuel & Repairs"
            />
            <Card
              title="Udhaar Diya"
              value={data?.toReceive ?? data?.given}
              icon={ArrowUpRight}
              badge="To Receive"
              badgeType="good"
              subtitle="Money Lent"
            />
            <Card
              title="Udhaar Liya"
              value={data?.toPay ?? data?.received}
              icon={ArrowDownLeft}
              badge="To Pay"
              badgeType="bad"
              subtitle="Money Borrowed"
            />
            <Card
              title="Net Cash Flow"
              value={data?.netCashFlow}
              icon={Wallet}
              badge={data?.netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
              badgeType={data?.netCashFlow >= 0 ? 'good' : 'bad'}
              className="colSpanAll"
            />
          </div>

          {/* Interactive 3D Canvas Financial Chart */}
          <ThreeCanvasChart
            income={data?.income}
            expense={data?.expense}
            car={data?.car}
            bike={data?.bike}
            given={data?.given}
            received={data?.received}
            netCashFlow={data?.netCashFlow}
          />
        </>
      )}

      {/* Quick Add Expense Modal */}
      <Modal
        open={openExpenseModal}
        title={expenseModalType === 'FOOD' ? 'Quick Add Food Expense' : 'Quick Add Daily Expense'}
        onClose={() => setOpenExpenseModal(false)}
        maxWidth="520px"
      >
        <form onSubmit={handleSaveQuickExpense} className="formGrid">
          <FormField label="Category (Search or Create)" required>
            <CategorySelect
              value={expenseForm.category}
              onChange={(cat) => setExpenseForm({ ...expenseForm, category: cat })}
              type={expenseModalType}
              placeholder="Select or enter category..."
            />
          </FormField>

          <div className="formTwoCol">
            <FormField label="Amount in PKR" required>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="e.g. 500"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                autoFocus
              />
            </FormField>

            <FormField label="Date" required>
              <input
                type="date"
                required
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Note (Optional)">
            <input
              type="text"
              placeholder="Additional details..."
              value={expenseForm.note}
              onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
            />
          </FormField>

          <div className="formActions">
            <Button variant="ghost" type="button" onClick={() => setOpenExpenseModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingExpense}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Income / Salary Modal */}
      <LogIncomeModal
        open={openIncomeModal}
        onClose={() => setOpenIncomeModal(false)}
        onSuccess={fetchDashboard}
      />

      {/* Automated Salary Cycle Modal */}
      <SalaryCycleModal
        open={openCycleModal}
        onClose={() => setOpenCycleModal(false)}
        onSuccess={fetchDashboard}
      />
    </section>
  );
}
