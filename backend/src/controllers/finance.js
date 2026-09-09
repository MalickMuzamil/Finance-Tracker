import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import Transaction from '../models/Transaction.js';
import Lend from '../models/Lend.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { superAdminEmail } from '../config/env.js';
import { buildDateFilter, getMonthYearPkt, getMonthDateRangePkt } from '../utils/dateFilter.js';
import { escapeRegex } from '../utils/regex.js';

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

// ==========================================
// VEHICLES CONTROLLER (PAGINATION + DEEP TRACKING)
// ==========================================
export async function vehicles(req, res) {
  if (req.method === 'GET') {
    const { startDate, endDate, type, category, search, page, limit = 10 } = req.query;
    const dateQuery = buildDateFilter(startDate, endDate, 'date');
    const query = {
      userId: req.user._id,
      ...dateQuery,
    };
    if (type && ['CAR', 'BIKE'].includes(type.toUpperCase())) {
      query.type = type.toUpperCase();
    }
    if (category && category !== 'ALL') {
      query.expenseCategory = category.toUpperCase();
    }
    if (search && search.trim()) {
      const q = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { note: { $regex: q, $options: 'i' } },
        { workshopName: { $regex: q, $options: 'i' } },
        { repairType: { $regex: q, $options: 'i' } },
        { partsReplaced: { $regex: q, $options: 'i' } },
      ];
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const [total, list] = await Promise.all([
        Vehicle.countDocuments(query),
        Vehicle.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum),
      ]);

      return res.json({
        data: list,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      });
    }

    const list = await Vehicle.find(query).sort({ date: -1, createdAt: -1 });
    return res.json(list);
  }

  // POST: Create vehicle record with deep tracking
  const {
    type,
    name,
    expenseCategory = 'OTHER',
    expense,
    date,
    odometer,
    nextServiceDueKm,
    nextServiceDueDate,
    repairType,
    partsReplaced,
    workshopName,
    fuelLiters,
    fuelRate,
    note,
  } = req.body;

  if (!['CAR', 'BIKE'].includes(type) || !name || Number(expense) < 0 || !date) {
    return res.status(400).json({
      message: 'Invalid vehicle data. Type (CAR/BIKE), name, positive expense, and date are required.',
    });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  const created = await Vehicle.create({
    userId: req.user._id,
    type,
    name: name.trim(),
    expenseCategory: expenseCategory.toUpperCase(),
    expense: Number(expense),
    date: parsedDate,
    odometer: odometer ? Number(odometer) : undefined,
    nextServiceDueKm: nextServiceDueKm ? Number(nextServiceDueKm) : undefined,
    nextServiceDueDate: nextServiceDueDate ? new Date(nextServiceDueDate) : undefined,
    repairType: (repairType || '').trim(),
    partsReplaced: (partsReplaced || '').trim(),
    workshopName: (workshopName || '').trim(),
    fuelLiters: fuelLiters ? Number(fuelLiters) : undefined,
    fuelRate: fuelRate ? Number(fuelRate) : undefined,
    note: (note || '').trim(),
  });

  return res.status(201).json(created);
}

export async function vehicleUpdate(req, res) {
  const {
    type,
    name,
    expenseCategory = 'OTHER',
    expense,
    date,
    odometer,
    nextServiceDueKm,
    nextServiceDueDate,
    repairType,
    partsReplaced,
    workshopName,
    fuelLiters,
    fuelRate,
    note,
  } = req.body;

  if (!['CAR', 'BIKE'].includes(type) || !name || Number(expense) < 0 || !date) {
    return res.status(400).json({ message: 'Invalid vehicle data.' });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  const updated = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    {
      type,
      name: name.trim(),
      expenseCategory: expenseCategory.toUpperCase(),
      expense: Number(expense),
      date: parsedDate,
      odometer: odometer ? Number(odometer) : null,
      nextServiceDueKm: nextServiceDueKm ? Number(nextServiceDueKm) : null,
      nextServiceDueDate: nextServiceDueDate ? new Date(nextServiceDueDate) : null,
      repairType: (repairType || '').trim(),
      partsReplaced: (partsReplaced || '').trim(),
      workshopName: (workshopName || '').trim(),
      fuelLiters: fuelLiters ? Number(fuelLiters) : null,
      fuelRate: fuelRate ? Number(fuelRate) : null,
      note: (note || '').trim(),
    },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ message: 'Vehicle record not found or access denied.' });
  }

  return res.json(updated);
}

export async function vehicleDelete(req, res) {
  const r = await Vehicle.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (!r.deletedCount) {
    return res.status(404).json({ message: 'Vehicle record not found.' });
  }
  return res.json({ message: 'Vehicle record deleted successfully.' });
}

// ==========================================
// TRANSACTIONS CONTROLLER (PAGINATION + SEARCH + EXPENSE TYPE)
// ==========================================
export async function transactions(req, res) {
  if (req.method === 'GET') {
    const {
      startDate,
      endDate,
      monthYear,
      kind,
      expenseType,
      category,
      paymentMethod,
      search,
      page,
      limit = 10,
    } = req.query;

    const dateQuery = buildDateFilter(startDate, endDate, 'date');
    const query = {
      userId: req.user._id,
      ...dateQuery,
    };

    if (monthYear && /^\d{4}-\d{2}$/.test(monthYear.trim())) {
      query.monthYear = monthYear.trim();
    }

    if (kind && ['INCOME', 'EXPENSE'].includes(kind.toUpperCase())) {
      query.kind = kind.toUpperCase();
    }

    if (expenseType && expenseType !== 'ALL') {
      const types = expenseType.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
      if (types.length === 1) {
        query.expenseType = types[0];
      } else if (types.length > 1) {
        query.expenseType = { $in: types };
      }
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      query.paymentMethod = paymentMethod.toUpperCase();
    }

    if (category && category.trim() && category !== 'ALL') {
      query.category = { $regex: escapeRegex(category.trim()), $options: 'i' };
    }

    if (search && search.trim()) {
      const q = escapeRegex(search.trim());
      const conditions = [
        { category: { $regex: q, $options: 'i' } },
        { note: { $regex: q, $options: 'i' } },
        { expenseType: { $regex: q, $options: 'i' } },
        { paymentMethod: { $regex: q, $options: 'i' } },
      ];

      const numSearch = Number(search.trim());
      if (!isNaN(numSearch) && numSearch > 0) {
        conditions.push({ amount: numSearch });
      }

      query.$or = conditions;
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const [total, list] = await Promise.all([
        Transaction.countDocuments(query),
        Transaction.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum),
      ]);

      return res.json({
        data: list,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      });
    }

    const list = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
    return res.json(list);
  }

  // POST: Create transaction
  const { kind, category, amount, date, note, expenseType, paymentMethod, isSalary } = req.body;
  if (!['INCOME', 'EXPENSE'].includes(kind) || Number(amount) < 0 || !date) {
    return res.status(400).json({ message: 'Invalid transaction data. Kind, non-negative amount and date are required.' });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  const determinedMonthYear = getMonthYearPkt(parsedDate);

  // Determine appropriate default expenseType if not provided
  let determinedExpenseType = 'GENERAL';
  if (expenseType && ['GENERAL', 'DAILY', 'FOOD', 'SALARY', 'UTILITY'].includes(expenseType.toUpperCase())) {
    determinedExpenseType = expenseType.toUpperCase();
  } else if (kind === 'INCOME') {
    determinedExpenseType = isSalary || category?.toLowerCase()?.includes('salary') ? 'SALARY' : 'GENERAL';
  } else if (category) {
    const catLower = category.toLowerCase();
    if (['lunch', 'dinner', 'nashta', 'breakfast', 'chai', 'food', 'snack', 'grocery', 'ration', 'restaurant', 'bakery', 'fruit'].some((w) => catLower.includes(w))) {
      determinedExpenseType = 'FOOD';
    } else if (['puncture', 'repair', 'bill', 'wifi', 'internet', 'gas', 'electric', 'water', 'medical', 'laundry', 'grooming', 'petrol'].some((w) => catLower.includes(w))) {
      determinedExpenseType = 'DAILY';
    }
  }

  const created = await Transaction.create({
    userId: req.user._id,
    kind,
    expenseType: determinedExpenseType,
    category: (category || 'General').trim(),
    amount: Number(amount),
    date: parsedDate,
    monthYear: determinedMonthYear,
    paymentMethod: paymentMethod && ['CASH', 'BANK_TRANSFER', 'CARD', 'JAZZCASH', 'EASYPAISA', 'OTHER'].includes(paymentMethod.toUpperCase())
      ? paymentMethod.toUpperCase()
      : 'CASH',
    isSalary: Boolean(isSalary || determinedExpenseType === 'SALARY'),
    note: (note || '').trim(),
  });

  return res.status(201).json(created);
}

export async function transactionUpdate(req, res) {
  const { kind, category, amount, date, note, expenseType, paymentMethod, isSalary } = req.body;
  if (!['INCOME', 'EXPENSE'].includes(kind) || Number(amount) < 0 || !date) {
    return res.status(400).json({ message: 'Invalid transaction data.' });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  const updateData = {
    kind,
    category: (category || 'General').trim(),
    amount: Number(amount),
    date: parsedDate,
    monthYear: getMonthYearPkt(parsedDate),
    note: (note || '').trim(),
  };

  if (expenseType && ['GENERAL', 'DAILY', 'FOOD', 'SALARY', 'UTILITY'].includes(expenseType.toUpperCase())) {
    updateData.expenseType = expenseType.toUpperCase();
  }
  if (paymentMethod && ['CASH', 'BANK_TRANSFER', 'CARD', 'JAZZCASH', 'EASYPAISA', 'OTHER'].includes(paymentMethod.toUpperCase())) {
    updateData.paymentMethod = paymentMethod.toUpperCase();
  }
  if (typeof isSalary === 'boolean') {
    updateData.isSalary = isSalary;
  }

  const updated = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updateData,
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ message: 'Transaction not found or access denied.' });
  }

  return res.json(updated);
}

export async function transactionDelete(req, res) {
  const r = await Transaction.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (!r.deletedCount) {
    return res.status(404).json({ message: 'Transaction not found.' });
  }
  return res.json({ message: 'Transaction deleted successfully.' });
}

// ==========================================
// CATEGORIES CONTROLLER (SEARCHABLE + CREATABLE)
// ==========================================
export async function getCategories(req, res) {
  const { type, search } = req.query;
  const query = {};

  if (type && type !== 'ALL') {
    query.type = type.toUpperCase();
  }

  if (search && search.trim()) {
    const q = escapeRegex(search.trim());
    query.name = { $regex: q, $options: 'i' };
  }

  // Return default + user created categories sorted alphabetically
  const list = await Category.find(query).sort({ isDefault: -1, name: 1 });
  return res.json(list);
}

export async function createCategory(req, res) {
  const { name, type = 'DAILY', icon = '', color = '' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // Case-insensitive duplicate check
  const existing = await Category.findOne({ nameLower: lower });
  if (existing) {
    return res.status(200).json(existing);
  }

  const validTypes = ['GENERAL', 'DAILY', 'FOOD', 'SALARY', 'INCOME', 'UTILITY'];
  const safeType = validTypes.includes((type || '').toUpperCase()) ? type.toUpperCase() : 'DAILY';

  const created = await Category.create({
    name: trimmed,
    nameLower: lower,
    type: safeType,
    icon: (icon || '').trim(),
    color: (color || '').trim(),
    isDefault: false,
    createdBy: req.user._id,
  });

  return res.status(201).json(created);
}

// ==========================================
// AUTOMATED MONTHLY SALARY CYCLE & SAVINGS ROLLOVER
// ==========================================
export async function checkAndProcessSalaryCycle(user, force = false) {
  if (!user) return null;
  const dbUser = await User.findById(user._id || user.id);
  if (!dbUser || !dbUser.salaryCycle?.enabled || dbUser.salaryCycle?.amount <= 0) {
    return null;
  }

  const nowPkt = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const currentDay = nowPkt.getUTCDate();
  const currentMonth = getMonthYearPkt(nowPkt);
  const salaryDay = dbUser.salaryCycle.dayOfMonth || 1;

  // Trigger if today has reached or passed the salary day, or if forced
  if (currentDay >= salaryDay || force) {
    // Check if salary already logged for currentMonth
    const existing = await Transaction.findOne({
      userId: dbUser._id,
      monthYear: currentMonth,
      $or: [
        { isSalary: true },
        { expenseType: 'SALARY' },
        { category: { $regex: 'salary', $options: 'i' } },
      ],
    });

    if (!existing) {
      const salaryDateStr = `${currentMonth}-${String(Math.min(currentDay, salaryDay)).padStart(2, '0')}`;
      const salaryDate = new Date(`${salaryDateStr}T09:00:00.000+05:00`);

      const createdSalary = await Transaction.create({
        userId: dbUser._id,
        kind: 'INCOME',
        expenseType: 'SALARY',
        category: 'Monthly Salary',
        amount: Number(dbUser.salaryCycle.amount),
        date: salaryDate,
        monthYear: currentMonth,
        paymentMethod: dbUser.salaryCycle.paymentMethod || 'BANK_TRANSFER',
        isSalary: true,
        note: `Automated recurring salary for ${currentMonth}`,
      });

      await User.updateOne(
        { _id: dbUser._id },
        { $set: { 'salaryCycle.lastAutoGeneratedMonth': currentMonth } }
      );

      return createdSalary;
    }
  }

  return null;
}

export async function updateSalaryCycle(req, res) {
  const { enabled, amount, dayOfMonth, paymentMethod } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.salaryCycle = {
    enabled: Boolean(enabled),
    amount: Math.max(0, Number(amount) || 0),
    dayOfMonth: Math.min(28, Math.max(1, parseInt(dayOfMonth, 10) || 1)),
    paymentMethod: paymentMethod || 'BANK_TRANSFER',
    lastAutoGeneratedMonth: user.salaryCycle?.lastAutoGeneratedMonth || '',
  };

  await user.save();

  // If enabled, check if should auto-credit for current month right away
  if (user.salaryCycle.enabled && user.salaryCycle.amount > 0) {
    await checkAndProcessSalaryCycle(user);
  }

  return res.json({
    message: 'Monthly salary cycle settings updated successfully',
    salaryCycle: user.salaryCycle,
  });
}

export async function triggerSalaryCycle(req, res) {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (!user.salaryCycle?.amount || user.salaryCycle.amount <= 0) {
    return res.status(400).json({ message: 'Please configure your recurring salary amount first.' });
  }

  const result = await checkAndProcessSalaryCycle(user, true);
  if (!result) {
    return res.json({
      message: 'Salary for this month has already been recorded or credited.',
      alreadyExists: true,
    });
  }

  return res.json({
    message: `Monthly salary of PKR ${user.salaryCycle.amount} credited successfully!`,
    transaction: result,
  });
}

// ==========================================
// MONTHLY FINANCIAL SUMMARY & SAVINGS LEDGER
// ==========================================
export async function monthlySummary(req, res) {
  // Check and execute auto salary cycle if applicable
  await checkAndProcessSalaryCycle(req.user);

  const currentMonth = getMonthYearPkt();
  const targetMonth = req.query.month && /^\d{4}-\d{2}$/.test(req.query.month.trim())
    ? req.query.month.trim()
    : currentMonth;

  // Retrieve user transactions, vehicles and lends
  const [allTransactions, allVehicles, allLends] = await Promise.all([
    Transaction.find({ userId: req.user._id }),
    Vehicle.find({ userId: req.user._id }),
    Lend.find({
      $or: [
        { fromUserId: req.user._id },
        { toUserId: req.user._id },
        { createdBy: req.user._id, isExternal: true },
      ],
      status: { $ne: 'DISPUTED' },
    }),
  ]);

  const monthlyData = {};

  const ensureMonth = (m) => {
    if (!monthlyData[m]) {
      monthlyData[m] = {
        income: 0,
        salaryIncome: 0,
        otherIncome: 0,
        foodExpenses: 0,
        dailyExpenses: 0,
        generalExpenses: 0,
        vehicleExpenses: 0,
        lendGiven: 0,
        lendReceived: 0,
        foodCount: 0,
        dailyCount: 0,
        transactionCount: 0,
        foodSubCategories: {},
        dailySubCategories: {},
      };
    }
    return monthlyData[m];
  };

  allTransactions.forEach((t) => {
    const m = t.monthYear || getMonthYearPkt(t.date);
    const mObj = ensureMonth(m);
    const amt = Number(t.amount) || 0;

    if (t.kind === 'INCOME') {
      mObj.income += amt;
      if (t.isSalary || t.expenseType === 'SALARY' || t.category?.toLowerCase()?.includes('salary')) {
        mObj.salaryIncome += amt;
      } else {
        mObj.otherIncome += amt;
      }
    } else {
      mObj.transactionCount += 1;
      if (t.expenseType === 'FOOD') {
        mObj.foodExpenses += amt;
        mObj.foodCount += 1;
        const cat = t.category || 'Other Food';
        mObj.foodSubCategories[cat] = (mObj.foodSubCategories[cat] || 0) + amt;
      } else if (t.expenseType === 'DAILY' || t.expenseType === 'UTILITY') {
        mObj.dailyExpenses += amt;
        mObj.dailyCount += 1;
        const cat = t.category || 'Other Daily';
        mObj.dailySubCategories[cat] = (mObj.dailySubCategories[cat] || 0) + amt;
      } else {
        mObj.generalExpenses += amt;
      }
    }
  });

  allVehicles.forEach((v) => {
    const m = getMonthYearPkt(v.date);
    const mObj = ensureMonth(m);
    mObj.vehicleExpenses += Number(v.expense) || 0;
  });

  allLends.forEach((l) => {
    const m = getMonthYearPkt(l.date);
    const mObj = ensureMonth(m);
    const isSender = String(l.fromUserId?._id || l.fromUserId) === String(req.user._id);
    const isReceiver = String(l.toUserId?._id || l.toUserId) === String(req.user._id);
    if (isSender) mObj.lendGiven += (l.amount || 0);
    if (isReceiver) mObj.lendReceived += (l.amount || 0);
  });

  // Ensure targetMonth exists in the data set
  ensureMonth(targetMonth);

  // Chronologically sort all months
  const sortedMonths = Object.keys(monthlyData).sort();

  let runningSavings = 0;
  const history = [];
  let targetDetails = null;

  for (const m of sortedMonths) {
    const d = monthlyData[m];
    const totalExpenses = d.foodExpenses + d.dailyExpenses + d.generalExpenses + d.vehicleExpenses;
    const netBalance = d.income - totalExpenses;

    const openingSavings = runningSavings;
    let previousSavingsUsed = 0;
    let currentMonthNewSavings = 0;
    let currentIncomeConsumed = 0;
    let currentMonthRemaining = 0;

    if (totalExpenses <= d.income) {
      currentIncomeConsumed = totalExpenses;
      currentMonthRemaining = d.income - totalExpenses;
      previousSavingsUsed = 0;
      currentMonthNewSavings = d.income - totalExpenses;
      runningSavings = openingSavings + currentMonthNewSavings;
    } else {
      currentIncomeConsumed = d.income;
      currentMonthRemaining = 0;
      const deficit = totalExpenses - d.income;
      previousSavingsUsed = deficit;
      currentMonthNewSavings = 0;
      runningSavings = Math.max(0, openingSavings - deficit);
    }

    const monthRecord = {
      month: m,
      income: d.income,
      salaryIncome: d.salaryIncome,
      otherIncome: d.otherIncome,
      expenses: totalExpenses,
      foodExpenses: d.foodExpenses,
      dailyExpenses: d.dailyExpenses,
      vehicleExpenses: d.vehicleExpenses,
      generalExpenses: d.generalExpenses,
      netBalance,
      openingSavings,
      previousSavingsUsed,
      currentMonthNewSavings,
      currentMonthRemaining,
      closingSavings: runningSavings,
      isDippingIntoSavings: previousSavingsUsed > 0,
      dippingAmount: previousSavingsUsed,
      transactionCount: d.transactionCount,
    };

    history.push(monthRecord);

    if (m === targetMonth) {
      const topFood = Object.entries(d.foodSubCategories)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      const topDaily = Object.entries(d.dailySubCategories)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      // Days elapsed in targetMonth for average daily food spend
      const [yStr, mStr] = targetMonth.split('-');
      const yNum = parseInt(yStr, 10);
      const mNum = parseInt(mStr, 10);
      const daysInMonth = new Date(Date.UTC(yNum, mNum, 0)).getUTCDate();

      let daysCount = daysInMonth;
      if (targetMonth === currentMonth) {
        const nowPkt = new Date(Date.now() + 5 * 60 * 60 * 1000);
        daysCount = Math.max(1, Math.min(daysInMonth, nowPkt.getUTCDate()));
      }

      const dailyFoodAverage = daysCount > 0 ? d.foodExpenses / daysCount : 0;

      // Expense breakdown percentages
      const catBreakdown = [];
      if (totalExpenses > 0) {
        if (d.foodExpenses > 0) {
          catBreakdown.push({
            name: 'Food & Dining',
            amount: d.foodExpenses,
            percentage: Number(((d.foodExpenses / totalExpenses) * 100).toFixed(1)),
            color: '#ef4444',
          });
        }
        if (d.dailyExpenses > 0) {
          catBreakdown.push({
            name: 'Daily Misc & Utilities',
            amount: d.dailyExpenses,
            percentage: Number(((d.dailyExpenses / totalExpenses) * 100).toFixed(1)),
            color: '#f97316',
          });
        }
        if (d.vehicleExpenses > 0) {
          catBreakdown.push({
            name: 'Vehicles',
            amount: d.vehicleExpenses,
            percentage: Number(((d.vehicleExpenses / totalExpenses) * 100).toFixed(1)),
            color: '#38bdf8',
          });
        }
        if (d.generalExpenses > 0) {
          catBreakdown.push({
            name: 'Home Finance & Other',
            amount: d.generalExpenses,
            percentage: Number(((d.generalExpenses / totalExpenses) * 100).toFixed(1)),
            color: '#a855f7',
          });
        }
      }

      targetDetails = {
        ...monthRecord,
        foodAnalytics: {
          totalFood: d.foodExpenses,
          dailyAverage: Math.round(dailyFoodAverage),
          transactionCount: d.foodCount,
          topCategories: topFood,
        },
        dailyAnalytics: {
          totalDaily: d.dailyExpenses,
          transactionCount: d.dailyCount,
          topCategories: topDaily,
        },
        categoryBreakdown: catBreakdown,
      };
    }
  }

  return res.json({
    selectedMonth: targetMonth,
    monthlyMetrics: targetDetails,
    savingsLedger: {
      openingSavings: targetDetails?.openingSavings || 0,
      lastMonthSavings: targetDetails?.openingSavings || 0,
      availableFunds: (targetDetails?.openingSavings || 0) + (targetDetails?.income || 0),
      previousSavingsUsed: targetDetails?.previousSavingsUsed || 0,
      currentMonthNewSavings: targetDetails?.currentMonthNewSavings || 0,
      totalAccumulatedSavings: targetDetails?.closingSavings || 0,
      isDippingIntoSavings: Boolean(targetDetails?.isDippingIntoSavings),
      dippingAmount: targetDetails?.dippingAmount || 0,
    },
    savingsHistory: [...history].reverse(), // most recent month first
  });
}

// ==========================================
// ADMIN & USER SEARCH CONTROLLER
// ==========================================
export async function users(req, res) {
  const { search, role, status, page, limit = 10 } = req.query;
  const query = {};

  if (search && search.trim()) {
    const q = escapeRegex(search.trim());
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  if (role && ['USER', 'SUPER_ADMIN'].includes(role.toUpperCase())) {
    query.role = role.toUpperCase();
  }
  if (status && ['ACTIVE', 'DISABLED'].includes(status.toUpperCase())) {
    query.status = status.toUpperCase();
  }

  if (page) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, list] = await Promise.all([
      User.countDocuments(query),
      User.find(query, '-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    return res.json({
      data: list,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    });
  }

  const list = await User.find(query, '-passwordHash').sort({ createdAt: -1 });
  return res.json(list);
}

export async function toggleUserStatus(req, res) {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (targetUser.email.toLowerCase() === superAdminEmail.toLowerCase()) {
    return res.status(403).json({ message: 'Root SuperAdmin status cannot be modified.' });
  }

  if (String(targetUser._id) === String(req.user._id)) {
    return res.status(403).json({ message: 'You cannot change your own status.' });
  }

  const newStatus = targetUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  targetUser.status = newStatus;
  await targetUser.save();

  return res.json({
    message: `User status changed to ${newStatus}.`,
    user: {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status,
    },
  });
}

export async function deleteUser(req, res) {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (targetUser.email.toLowerCase() === superAdminEmail.toLowerCase()) {
    return res.status(403).json({ message: 'Root SuperAdmin cannot be deleted.' });
  }

  if (String(targetUser._id) === String(req.user._id)) {
    return res.status(403).json({ message: 'You cannot delete your own account from the admin panel.' });
  }

  await Promise.all([
    User.deleteOne({ _id: targetUser._id }),
    Transaction.deleteMany({ userId: targetUser._id }),
    Vehicle.deleteMany({ userId: targetUser._id }),
    Lend.deleteMany({ createdBy: targetUser._id, isExternal: true }),
  ]);

  return res.json({ message: `User ${targetUser.name} (${targetUser.email}) and related records deleted successfully.` });
}

export async function searchUsers(req, res) {
  const q = escapeRegex((req.query.q || '').trim());
  if (q.length < 2) return res.json([]);
  const list = await User.find(
    {
      status: 'ACTIVE',
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    },
    'name email role'
  ).limit(10);
  return res.json(list);
}

// ==========================================
// LEN DEN (PAGINATION + EXTERNAL UDHAAR)
// ==========================================
export async function lends(req, res) {
  if (req.method === 'GET') {
    const { startDate, endDate, status, search, direction, page, limit = 10 } = req.query;
    const dateQuery = buildDateFilter(startDate, endDate, 'date');

    const userScope = {
      $or: [
        { fromUserId: req.user._id },
        { toUserId: req.user._id },
        { createdBy: req.user._id, isExternal: true },
      ],
    };

    const query = {
      $and: [userScope],
      ...dateQuery,
    };

    if (status && ['PENDING', 'ACCEPTED', 'DISPUTED', 'SETTLED'].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    if (direction && ['GIVEN', 'RECEIVED'].includes(direction.toUpperCase())) {
      query.direction = direction.toUpperCase();
    }

    if (search && search.trim()) {
      const q = escapeRegex(search.trim());
      query.$and.push({
        $or: [
          { externalPersonName: { $regex: q, $options: 'i' } },
          { note: { $regex: q, $options: 'i' } },
        ],
      });
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const [total, list] = await Promise.all([
        Lend.countDocuments(query),
        Lend.find(query)
          .populate('fromUserId', 'name email role')
          .populate('toUserId', 'name email role')
          .populate('createdBy', 'name email')
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
      ]);

      return res.json({
        data: list,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      });
    }

    const list = await Lend.find(query)
      .populate('fromUserId', 'name email role')
      .populate('toUserId', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    return res.json(list);
  }

  // POST: Create shared or external udhaar record
  const {
    isExternal = false,
    externalPersonName,
    externalPersonContact,
    toUserId,
    otherUserId,
    direction = 'GIVEN',
    directionType,
    amount,
    date,
    note,
  } = req.body;

  const chosenDirection = directionType || direction || 'GIVEN';

  if (Number(amount) <= 0 || !date) {
    return res.status(400).json({ message: 'Positive amount and date are required.' });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  if (isExternal) {
    if (!externalPersonName || !externalPersonName.trim()) {
      return res.status(400).json({ message: 'Person name is required for offline/unregistered record.' });
    }

    const createdLend = await Lend.create({
      isExternal: true,
      externalPersonName: externalPersonName.trim(),
      externalPersonContact: (externalPersonContact || '').trim(),
      fromUserId: chosenDirection === 'GIVEN' ? req.user._id : undefined,
      toUserId: chosenDirection === 'RECEIVED' ? req.user._id : undefined,
      amount: Number(amount),
      direction: chosenDirection,
      date: parsedDate,
      note: (note || '').trim(),
      status: 'PENDING',
      createdBy: req.user._id,
    });

    const populated = await Lend.findById(createdLend._id)
      .populate('fromUserId', 'name email role')
      .populate('toUserId', 'name email role')
      .populate('createdBy', 'name email');

    return res.status(201).json(populated);
  }

  const targetUserId = otherUserId || toUserId;
  if (!targetUserId || String(targetUserId) === String(req.user._id)) {
    return res.status(400).json({ message: 'A valid recipient from registered users is required.' });
  }

  const otherUser = await User.findOne({ _id: targetUserId, status: 'ACTIVE' });
  if (!otherUser) {
    return res.status(404).json({ message: 'Selected registered user was not found or is inactive.' });
  }

  let fromUserId = req.user._id;
  let recipientUserId = targetUserId;

  if (chosenDirection === 'RECEIVED') {
    fromUserId = targetUserId;
    recipientUserId = req.user._id;
  }

  const createdLend = await Lend.create({
    isExternal: false,
    fromUserId,
    toUserId: recipientUserId,
    amount: Number(amount),
    direction: chosenDirection,
    date: parsedDate,
    note: (note || '').trim(),
    status: 'PENDING',
    createdBy: req.user._id,
  });

  const populated = await Lend.findById(createdLend._id)
    .populate('fromUserId', 'name email role')
    .populate('toUserId', 'name email role')
    .populate('createdBy', 'name email');

  return res.status(201).json(populated);
}

export async function lendAction(req, res) {
  const lend = await Lend.findById(req.params.id);
  if (!lend) {
    return res.status(404).json({ message: 'Lend record not found.' });
  }

  const isCreator = String(lend.createdBy) === String(req.user._id);
  const isRecipient = String(lend.toUserId?._id || lend.toUserId) === String(req.user._id);
  const isSender = String(lend.fromUserId?._id || lend.fromUserId) === String(req.user._id);

  if (!['ACCEPTED', 'DISPUTED', 'SETTLED'].includes(req.body.status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  if (lend.isExternal) {
    if (!isCreator) {
      return res.status(403).json({ message: 'Only the creator can update an external record.' });
    }
    lend.status = req.body.status;
    if (lend.status === 'SETTLED') lend.settledAt = new Date();
    await lend.save();
  } else {
    if (req.body.status === 'SETTLED') {
      if (!isRecipient && !isSender) {
        return res.status(403).json({ message: 'Only involved participants can settle this record.' });
      }
      lend.status = 'SETTLED';
      lend.settledAt = new Date();
      await lend.save();
    } else {
      if (isCreator && !isRecipient) {
        return res.status(403).json({ message: 'Only the other participant can confirm or dispute this record.' });
      }
      lend.status = req.body.status;
      if (lend.status === 'ACCEPTED') lend.acceptedAt = new Date();
      if (lend.status === 'DISPUTED') lend.disputedAt = new Date();
      await lend.save();
    }
  }

  const updated = await Lend.findById(lend._id)
    .populate('fromUserId', 'name email role')
    .populate('toUserId', 'name email role')
    .populate('createdBy', 'name email');

  return res.json(updated);
}

export async function lendDelete(req, res) {
  const lend = await Lend.findById(req.params.id);
  if (!lend) {
    return res.status(404).json({ message: 'Lend record not found.' });
  }

  const isCreator = String(lend.createdBy) === String(req.user._id);
  const isParticipant =
    String(lend.fromUserId?._id || lend.fromUserId) === String(req.user._id) ||
    String(lend.toUserId?._id || lend.toUserId) === String(req.user._id);

  if (!isCreator && !isParticipant) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  await Lend.deleteOne({ _id: req.params.id });
  return res.json({ message: 'Lend record deleted successfully.' });
}

// ==========================================
// DASHBOARD CONTROLLER
// ==========================================
export async function dashboard(req, res) {
  // Automatically process salary cycle if due
  await checkAndProcessSalaryCycle(req.user);

  const { startDate, endDate } = req.query;
  const dateQuery = buildDateFilter(startDate, endDate, 'date');
  const userOid = toObjectId(req.user._id);

  const matchCondition = (additional = {}) => ({
    userId: userOid,
    ...additional,
    ...(dateQuery.date ? { date: dateQuery.date } : {}),
  });

  const [incAgg, expAgg, foodAgg, dailyAgg, vehAgg, lendsList] = await Promise.all([
    Transaction.aggregate([
      { $match: matchCondition({ kind: 'INCOME' }) },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: matchCondition({ kind: 'EXPENSE' }) },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: matchCondition({ kind: 'EXPENSE', expenseType: 'FOOD' }) },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: matchCondition({ kind: 'EXPENSE', expenseType: { $in: ['DAILY', 'UTILITY'] } }) },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Vehicle.aggregate([
      { $match: matchCondition() },
      { $group: { _id: '$type', total: { $sum: '$expense' } } },
    ]),
    Lend.find({
      $or: [
        { fromUserId: req.user._id },
        { toUserId: req.user._id },
        { createdBy: req.user._id, isExternal: true },
      ],
      ...(dateQuery.date ? { date: dateQuery.date } : {}),
    }),
  ]);

  const income = incAgg[0]?.total || 0;
  const expense = expAgg[0]?.total || 0;
  const foodExpense = foodAgg[0]?.total || 0;
  const dailyExpense = dailyAgg[0]?.total || 0;
  const car = vehAgg.find((x) => x._id === 'CAR')?.total || 0;
  const bike = vehAgg.find((x) => x._id === 'BIKE')?.total || 0;
  const totalVehicles = car + bike;

  // Given: money current user gave
  const given = lendsList
    .filter((x) => {
      const isSender = String(x.fromUserId?._id || x.fromUserId) === String(req.user._id);
      return isSender && x.status !== 'DISPUTED';
    })
    .reduce((s, x) => s + (x.amount || 0), 0);

  // Received: money current user received/borrowed
  const received = lendsList
    .filter((x) => {
      const isReceiver = String(x.toUserId?._id || x.toUserId) === String(req.user._id);
      return isReceiver && x.status !== 'DISPUTED';
    })
    .reduce((s, x) => s + (x.amount || 0), 0);

  const toReceive = lendsList
    .filter((x) => {
      const isSender = String(x.fromUserId?._id || x.fromUserId) === String(req.user._id);
      return isSender && ['PENDING', 'ACCEPTED'].includes(x.status);
    })
    .reduce((s, x) => s + (x.amount || 0), 0);

  const toPay = lendsList
    .filter((x) => {
      const isReceiver = String(x.toUserId?._id || x.toUserId) === String(req.user._id);
      return isReceiver && ['PENDING', 'ACCEPTED'].includes(x.status);
    })
    .reduce((s, x) => s + (x.amount || 0), 0);

  const netCashFlow = income - expense - totalVehicles - given + received;

  return res.json({
    income,
    expense,
    foodExpense,
    dailyExpense,
    car,
    bike,
    totalVehicles,
    given,
    received,
    toReceive,
    toPay,
    netCashFlow,
  });
}

export default {
  vehicles,
  vehicleUpdate,
  vehicleDelete,
  transactions,
  transactionUpdate,
  transactionDelete,
  getCategories,
  createCategory,
  monthlySummary,
  updateSalaryCycle,
  triggerSalaryCycle,
  users,
  toggleUserStatus,
  deleteUser,
  searchUsers,
  lends,
  lendAction,
  lendDelete,
  dashboard,
};
