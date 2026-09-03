import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import Card from '../components/Card';
import DateFilter from '../components/DateFilter';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ThreeCanvasChart from '../components/ThreeCanvasChart';
import {
  TrendingUp,
  TrendingDown,
  Car,
  Bike,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    preset: 'ALL_TIME',
    startDate: '',
    endDate: '',
  });

  const toast = useToast();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;

      const res = await api.get('/dashboard', { params });
      setData(res.data);
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
            Track your income, household spending, vehicle expenses, and shared udhaar balances in PKR.
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
              title="Home Expenses"
              value={data?.expense}
              icon={TrendingDown}
              badge="Outflow"
              badgeType="bad"
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
    </section>
  );
}
