import mongoose from 'mongoose';
import { getMonthYearPkt } from '../utils/dateFilter.js';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['INCOME', 'EXPENSE'], required: true, index: true },
    expenseType: {
      type: String,
      enum: ['GENERAL', 'DAILY', 'FOOD', 'SALARY', 'UTILITY'],
      default: 'GENERAL',
      index: true,
    },
    category: { type: String, default: 'General', index: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, index: true },
    monthYear: { type: String, index: true }, // e.g. '2026-09' in PKT
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CARD', 'JAZZCASH', 'EASYPAISA', 'OTHER'],
      default: 'CASH',
    },
    isSalary: { type: Boolean, default: false },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound indexes for high performance querying & financial aggregation
schema.index({ userId: 1, date: -1 });
schema.index({ userId: 1, monthYear: 1 });
schema.index({ userId: 1, expenseType: 1, date: -1 });
schema.index({ userId: 1, kind: 1, monthYear: 1 });

// Automatically compute and sync monthYear in Pakistan Standard Time
schema.pre('save', function (next) {
  if (this.date) {
    this.monthYear = getMonthYearPkt(this.date);
  }
  next();
});

const Transaction = mongoose.model('Transaction', schema);
export default Transaction;
