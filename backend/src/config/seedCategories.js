import Category from '../models/Category.js';

export const DEFAULT_CATEGORIES = [
  // Food categories
  { name: 'Breakfast / Nashta', type: 'FOOD', icon: 'Utensils', color: '#f59e0b', isDefault: true },
  { name: 'Office Lunch', type: 'FOOD', icon: 'Utensils', color: '#ef4444', isDefault: true },
  { name: 'Dinner', type: 'FOOD', icon: 'Utensils', color: '#8b5cf6', isDefault: true },
  { name: 'Chai & Tea', type: 'FOOD', icon: 'Coffee', color: '#d97706', isDefault: true },
  { name: 'Snacks & Biscuits', type: 'FOOD', icon: 'Cookie', color: '#f97316', isDefault: true },
  { name: 'Groceries & Ration', type: 'FOOD', icon: 'ShoppingCart', color: '#10b981', isDefault: true },
  { name: 'Restaurant & Dining Out', type: 'FOOD', icon: 'UtensilsCrossed', color: '#ec4899', isDefault: true },
  { name: 'Food Delivery', type: 'FOOD', icon: 'Bike', color: '#f43f5e', isDefault: true },
  { name: 'Bakery & Dairy', type: 'FOOD', icon: 'Milk', color: '#06b6d4', isDefault: true },
  { name: 'Fruits & Vegetables', type: 'FOOD', icon: 'Apple', color: '#84cc16', isDefault: true },

  // Daily & Utilities categories
  { name: 'Bike Puncture & Tube', type: 'DAILY', icon: 'Wrench', color: '#f97316', isDefault: true },
  { name: 'Bike Repair & Service', type: 'DAILY', icon: 'Wrench', color: '#eab308', isDefault: true },
  { name: 'Petrol / Fuel (Daily)', type: 'DAILY', icon: 'Fuel', color: '#38bdf8', isDefault: true },
  { name: 'Internet / WiFi Bill', type: 'UTILITY', icon: 'Wifi', color: '#6366f1', isDefault: true },
  { name: 'Mobile Load / Package', type: 'UTILITY', icon: 'Smartphone', color: '#0ea5e9', isDefault: true },
  { name: 'Electricity Bill', type: 'UTILITY', icon: 'Zap', color: '#eab308', isDefault: true },
  { name: 'Gas Bill', type: 'UTILITY', icon: 'Flame', color: '#f97316', isDefault: true },
  { name: 'Water & Tanker', type: 'UTILITY', icon: 'Droplet', color: '#0284c7', isDefault: true },
  { name: 'Medical / Pharmacy', type: 'DAILY', icon: 'HeartPulse', color: '#ef4444', isDefault: true },
  { name: 'Laundry & Ironing', type: 'DAILY', icon: 'Shirt', color: '#a855f7', isDefault: true },
  { name: 'Personal Grooming & Salon', type: 'DAILY', icon: 'Scissors', color: '#ec4899', isDefault: true },
  { name: 'Office Expenses', type: 'DAILY', icon: 'Briefcase', color: '#64748b', isDefault: true },
  { name: 'House Maintenance', type: 'DAILY', icon: 'Home', color: '#14b8a6', isDefault: true },
  { name: 'Miscellaneous Daily', type: 'DAILY', icon: 'Receipt', color: '#94a3b8', isDefault: true },

  // Income categories
  { name: 'Monthly Salary', type: 'SALARY', icon: 'Banknote', color: '#10b981', isDefault: true },
  { name: 'Freelance / Remote Work', type: 'INCOME', icon: 'Laptop', color: '#38bdf8', isDefault: true },
  { name: 'Business Revenue', type: 'INCOME', icon: 'Building2', color: '#6366f1', isDefault: true },
  { name: 'Bonus / Incentive', type: 'INCOME', icon: 'Sparkles', color: '#eab308', isDefault: true },
  { name: 'Gift / Cash Inflow', type: 'INCOME', icon: 'Gift', color: '#ec4899', isDefault: true },
  { name: 'Rental Income', type: 'INCOME', icon: 'Home', color: '#14b8a6', isDefault: true },
  { name: 'Investment Return', type: 'INCOME', icon: 'TrendingUp', color: '#8b5cf6', isDefault: true },
  { name: 'Other Income', type: 'INCOME', icon: 'Coins', color: '#22c55e', isDefault: true },

  // General categories
  { name: 'Household General', type: 'GENERAL', icon: 'Home', color: '#64748b', isDefault: true },
  { name: 'Shopping & Clothing', type: 'GENERAL', icon: 'ShoppingBag', color: '#a855f7', isDefault: true },
  { name: 'Entertainment', type: 'GENERAL', icon: 'Film', color: '#f43f5e', isDefault: true },
  { name: 'Education & Courses', type: 'GENERAL', icon: 'GraduationCap', color: '#3b82f6', isDefault: true },
];

/**
 * Idempotently seeds default categories into MongoDB.
 */
export async function seedCategories() {
  try {
    const ops = DEFAULT_CATEGORIES.map((cat) => ({
      updateOne: {
        filter: { nameLower: cat.name.trim().toLowerCase() },
        update: {
          $setOnInsert: {
            name: cat.name.trim(),
            nameLower: cat.name.trim().toLowerCase(),
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
            isDefault: true,
            createdBy: null,
          },
        },
        upsert: true,
      },
    }));

    await Category.bulkWrite(ops, { ordered: false });
    // Seeded successfully
  } catch (err) {
    console.error('Category seeding error (non-fatal):', err.message);
  }
}

export default seedCategories;
