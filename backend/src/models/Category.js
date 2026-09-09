import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameLower: { type: String, required: true, trim: true, lowercase: true },
    type: {
      type: String,
      enum: ['GENERAL', 'DAILY', 'FOOD', 'SALARY', 'INCOME', 'UTILITY'],
      default: 'DAILY',
      index: true,
    },
    icon: { type: String, default: '' },
    color: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Ensure case-insensitive uniqueness
schema.index({ nameLower: 1 }, { unique: true });

const Category = mongoose.model('Category', schema);
export default Category;
