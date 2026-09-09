import { useState, useEffect } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import Button from './Button';
import { api } from '../services/api';
import { useToast } from './Toast';
import { RefreshCw, Zap, Calendar, Banknote, ShieldCheck } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { id: 'CASH', label: 'Cash' },
  { id: 'JAZZCASH', label: 'JazzCash' },
  { id: 'EASYPAISA', label: 'EasyPaisa' },
  { id: 'CARD', label: 'Card' },
];

export default function SalaryCycleModal({ open, onClose, onSuccess }) {
  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      // Fetch user profile to get current cycle settings
      api
        .get('/auth/me')
        .then((res) => {
          const cycle = res.data?.user?.salaryCycle;
          if (cycle) {
            setEnabled(Boolean(cycle.enabled));
            setAmount(cycle.amount || '');
            setDayOfMonth(cycle.dayOfMonth || 1);
            setPaymentMethod(cycle.paymentMethod || 'BANK_TRANSFER');
          }
        })
        .catch((err) => console.error('Failed to load salary cycle settings:', err));
    }
  }, [open]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (enabled && (!amount || Number(amount) <= 0)) {
      toast('Please enter your recurring salary amount', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.put('/user/salary-cycle', {
        enabled,
        amount: Number(amount) || 0,
        dayOfMonth: Number(dayOfMonth) || 1,
        paymentMethod,
      });

      toast('Monthly salary cycle updated successfully!', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update cycle settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleManualTrigger = async () => {
    if (!amount || Number(amount) <= 0) {
      toast('Please enter a valid salary amount first', 'error');
      return;
    }

    setTriggering(true);
    try {
      // First save settings if changed
      await api.put('/user/salary-cycle', {
        enabled: true,
        amount: Number(amount),
        dayOfMonth: Number(dayOfMonth) || 1,
        paymentMethod,
      });

      const res = await api.post('/finance/trigger-cycle');
      toast(res.data?.message || 'Cycle processed successfully!', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to process cycle', 'error');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Automated Monthly Salary & Savings Cycle"
      onClose={onClose}
      maxWidth="560px"
    >
      <form onSubmit={handleSaveSettings} className="formGrid">
        {/* Info Banner */}
        <div className="cycleHeaderBanner">
          <div className="cycleIconOrb">
            <Zap size={24} />
          </div>
          <div>
            <h3>Automate Monthly Rollover</h3>
            <p>
              Automatically credit your salary and roll previous month unspent funds into your savings reserve on a set date.
            </p>
          </div>
        </div>

        {/* Enable / Disable Toggle Card */}
        <div className="toggleCard">
          <div className="toggleCardLeft">
            <strong>Enable Monthly Auto-Cycle</strong>
            <p>When turned on, the system automatically creates your salary entry every month without manual input.</p>
          </div>
          <label className="switchToggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>

        <div className="formTwoCol">
          <FormField label="Monthly Salary (PKR)" required={enabled}>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required={enabled}
            />
          </FormField>

          <FormField label="Salary Arrival Day" required={enabled}>
            <select
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d === 1 ? '1st of every month' : d === 2 ? '2nd of every month' : d === 3 ? '3rd of every month' : `${d}th of every month`}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Default Salary Payment Method">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* Manual update action box */}
        <div className="manualCycleBox">
          <div className="manualCycleText">
            <strong>Want to trigger the cycle right now?</strong>
            <p>You can execute this month's salary credit and savings calculation immediately with one click.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            icon={RefreshCw}
            loading={triggering}
            onClick={handleManualTrigger}
            className="triggerNowBtn"
          >
            Roll Over & Credit Now
          </Button>
        </div>

        <div className="formActions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" type="submit" loading={saving}>
            Save Automation Settings
          </Button>
        </div>
      </form>
    </Modal>
  );
}
