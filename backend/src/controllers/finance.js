const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Transaction = require('../models/Transaction');
const Lend = require('../models/Lend');
const User = require('../models/User');
const { superAdminEmail } = require('../config/env');
const { buildDateFilter } = require('../utils/dateFilter');

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

// ==========================================
// VEHICLES CONTROLLER (PAGINATION + DEEP TRACKING)
// ==========================================
async function vehicles(req, res) {
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
      const q = search.trim();
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

async function vehicleUpdate(req, res) {
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

async function vehicleDelete(req, res) {
  const r = await Vehicle.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (!r.deletedCount) {
    return res.status(404).json({ message: 'Vehicle record not found.' });
  }
  return res.json({ message: 'Vehicle record deleted successfully.' });
}

// ==========================================
// TRANSACTIONS CONTROLLER (PAGINATION + SEARCH)
// ==========================================
async function transactions(req, res) {
  if (req.method === 'GET') {
    const { startDate, endDate, kind, category, search, page, limit = 10 } = req.query;
    const dateQuery = buildDateFilter(startDate, endDate, 'date');
    const query = {
      userId: req.user._id,
      ...dateQuery,
    };
    if (kind && ['INCOME', 'EXPENSE'].includes(kind.toUpperCase())) {
      query.kind = kind.toUpperCase();
    }
    if (category && category.trim()) {
      query.category = { $regex: category.trim(), $options: 'i' };
    }
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { category: { $regex: q, $options: 'i' } },
        { note: { $regex: q, $options: 'i' } },
      ];
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

  const { kind, category, amount, date, note } = req.body;
  if (!['INCOME', 'EXPENSE'].includes(kind) || Number(amount) < 0 || !date) {
    return res.status(400).json({ message: 'Invalid transaction data.' });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  const created = await Transaction.create({
    userId: req.user._id,
    kind,
    category: (category || 'General').trim(),
    amount: Number(amount),
    date: parsedDate,
    note: (note || '').trim(),
  });

  return res.status(201).json(created);
}

async function transactionUpdate(req, res) {
  const { kind, category, amount, date, note } = req.body;
  if (!['INCOME', 'EXPENSE'].includes(kind) || Number(amount) < 0 || !date) {
    return res.status(400).json({ message: 'Invalid transaction data.' });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  const updated = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    {
      kind,
      category: (category || 'General').trim(),
      amount: Number(amount),
      date: parsedDate,
      note: (note || '').trim(),
    },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ message: 'Transaction not found or access denied.' });
  }

  return res.json(updated);
}

async function transactionDelete(req, res) {
  const r = await Transaction.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (!r.deletedCount) {
    return res.status(404).json({ message: 'Transaction not found.' });
  }
  return res.json({ message: 'Transaction deleted successfully.' });
}

// ==========================================
// ADMIN USER MANAGEMENT (STRICT SUPER ADMIN PROTECTION)
// ==========================================
async function users(req, res) {
  const { search, page, limit = 10 } = req.query;
  const query = {};

  if (search && search.trim()) {
    const q = search.trim();
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { role: { $regex: q, $options: 'i' } },
    ];
  }

  if (page) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, list] = await Promise.all([
      User.countDocuments(query),
      User.find(query, 'name email role status createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.json({
      count: total,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
      users: list,
    });
  }

  const list = await User.find(query, 'name email role status createdAt').sort({ createdAt: -1 });
  return res.json({ count: list.length, total: list.length, users: list });
}

async function toggleUserStatus(req, res) {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // STRICT SUPER ADMIN PROTECTION: Cannot disable Super Admin
  const isSuperAdminUser =
    targetUser.email.toLowerCase() === superAdminEmail || targetUser.role === 'SUPER_ADMIN';

  if (isSuperAdminUser) {
    return res.status(403).json({
      message: 'Access Denied: The Super Admin account is protected and can never be disabled.',
    });
  }

  if (String(targetUser._id) === String(req.user._id)) {
    return res.status(403).json({ message: 'You cannot disable your own active account.' });
  }

  const newStatus = targetUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  targetUser.status = newStatus;
  await targetUser.save();

  return res.json({
    message: `User status changed to ${newStatus}`,
    user: {
      id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status,
    },
  });
}

async function deleteUser(req, res) {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // STRICT SUPER ADMIN PROTECTION: Cannot delete Super Admin
  const isSuperAdminUser =
    targetUser.email.toLowerCase() === superAdminEmail || targetUser.role === 'SUPER_ADMIN';

  if (isSuperAdminUser) {
    return res.status(403).json({
      message: 'Access Denied: The Super Admin account is permanently protected and can never be deleted.',
    });
  }

  if (String(targetUser._id) === String(req.user._id)) {
    return res.status(403).json({ message: 'You cannot delete your own account from here.' });
  }

  // Remove target user's records safely
  await Promise.all([
    User.deleteOne({ _id: targetUser._id }),
    Transaction.deleteMany({ userId: targetUser._id }),
    Vehicle.deleteMany({ userId: targetUser._id }),
    Lend.deleteMany({ createdBy: targetUser._id, isExternal: true }),
  ]);

  return res.json({ message: `User ${targetUser.name} (${targetUser.email}) and related records deleted successfully.` });
}

async function searchUsers(req, res) {
  const q = (req.query.q || '').trim();
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
async function lends(req, res) {
  if (req.method === 'GET') {
    const { startDate, endDate, status, search, direction, page, limit = 10 } = req.query;
    const dateQuery = buildDateFilter(startDate, endDate, 'date');

    const query = {
      $or: [
        { fromUserId: req.user._id },
        { toUserId: req.user._id },
        { createdBy: req.user._id, isExternal: true },
      ],
      ...dateQuery,
    };

    if (status && ['PENDING', 'ACCEPTED', 'DISPUTED', 'SETTLED'].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    if (direction && ['GIVEN', 'RECEIVED'].includes(direction.toUpperCase())) {
      query.direction = direction.toUpperCase();
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        ...query.$or,
        { externalPersonName: { $regex: q, $options: 'i' } },
        { note: { $regex: q, $options: 'i' } },
      ];
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

  // Handle External / Unregistered Person
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

  // Handle Registered App User
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

async function lendAction(req, res) {
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

async function lendDelete(req, res) {
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
async function dashboard(req, res) {
  const { startDate, endDate } = req.query;
  const dateQuery = buildDateFilter(startDate, endDate, 'date');
  const userOid = toObjectId(req.user._id);

  const matchCondition = (additional = {}) => ({
    userId: userOid,
    ...additional,
    ...(dateQuery.date ? { date: dateQuery.date } : {}),
  });

  const [incAgg, expAgg, vehAgg, lendsList] = await Promise.all([
    Transaction.aggregate([
      { $match: matchCondition({ kind: 'INCOME' }) },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: matchCondition({ kind: 'EXPENSE' }) },
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

module.exports = {
  vehicles,
  vehicleUpdate,
  vehicleDelete,
  transactions,
  transactionUpdate,
  transactionDelete,
  users,
  toggleUserStatus,
  deleteUser,
  searchUsers,
  lends,
  lendAction,
  lendDelete,
  dashboard,
};
