import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
    category: { type: String, default: 'General' },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', schema);
export default Transaction;
