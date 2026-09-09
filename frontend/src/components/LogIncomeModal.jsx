import { useState } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import Button from './Button';
import CategorySelect from './CategorySelect';
import { api } from '../services/api';
import { useToast } from './Toast';
import { Banknote } from 'lucide-react';

const INCOME_PRESETS = [
  'Monthly Salary',
  'Freelance / Remote Work',
  'Business Revenue',
  'Bonus / Incentive',
  'Gift / Cash Inflow',
  'Rental Income',
  'Investment Return',
  'Other Income',
];

const PAYMENT_METHODS = [
  { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { id: 'CASH', label: 'Cash' },
  { id: 'JAZZCASH', label: 'JazzCash' },
  { id: 'EASYPAISA', label: 'EasyPaisa' },
  { id: 'CARD', label: 'Card / Debit' },
  { id: 'OTHER', label: 'Other' },
];

export default function LogIncomeModal({ open, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('Monthly Salary');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const isSalary = category.toLowerCase().includes('salary');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast('Please enter a valid positive amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/transactions', {
        kind: 'INCOME',
        expenseType: isSalary ? 'SALARY' : 'GENERAL',
        category: category || 'Monthly Salary',
        amount: Number(amount),
        date,
        paymentMethod,
        isSalary,
        note: note.trim(),
      });

      toast('Income logged successfully!', 'success');
      // Reset form
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setCategory('Monthly Salary');
      setNote('');
      onClose();
      onSuccess?.();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to record income', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Log Income / Salary"
      onClose={onClose}
      maxWidth="540px"
    >
      <form onSubmit={handleSubmit} className="formGrid">
        <div className="incomeModalHeader">
          <div className="incomeIconCircle">
            <Banknote size={24} />
          </div>
          <div>
            <h3>Record Inflow</h3>
            <p>Log your monthly salary, freelance earnings, or any other income.</p>
          </div>
        </div>

        {/* Quick presets row */}
        <div className="presetPillsRow">
          {INCOME_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`presetPill ${category === p ? 'active' : ''}`}
              onClick={() => setCategory(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="formTwoCol">
          <FormField label="Amount in PKR" required>
            <input
              type="number"
              min="1"
              step="any"
              required
              placeholder="e.g. 100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </FormField>

          <FormField label="Date Received" required>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>
        </div>

        <div className="formTwoCol">
          <FormField label="Income Category" required>
            <CategorySelect
              value={category}
              onChange={setCategory}
              type="INCOME"
              placeholder="Select or enter income source..."
            />
          </FormField>

          <FormField label="Payment Method">
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
        </div>

        <FormField label="Note / Reference (Optional)">
          <input
            type="text"
            placeholder="e.g. September Salary - ABC Company"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </FormField>

        <div className="formActions">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            Save Income
          </Button>
        </div>
      </form>
    </Modal>
  );
}
