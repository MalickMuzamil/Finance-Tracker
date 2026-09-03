const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['CAR', 'BIKE'], required: true },
    name: { type: String, required: true, trim: true },
    expenseCategory: {
      type: String,
      enum: ['FUEL', 'TUNING', 'REPAIR', 'OIL_CHANGE', 'TIRE', 'TAX_TOKEN', 'WASH', 'OTHER'],
      default: 'OTHER',
    },
    expense: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    odometer: { type: Number }, // Meter reading in KM
    nextServiceDueKm: { type: Number }, // Next service meter reading due
    nextServiceDueDate: { type: Date }, // Next service date due
    repairType: { type: String, trim: true }, // e.g. Brakes, Suspension, AC, Battery, Engine
    partsReplaced: { type: String, trim: true }, // List of replaced parts
    workshopName: { type: String, trim: true }, // Workshop / Mechanic name
    fuelLiters: { type: Number }, // Fuel volume in liters
    fuelRate: { type: Number }, // Rate per liter
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', schema);
