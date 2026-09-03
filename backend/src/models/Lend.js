const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    isExternal: { type: Boolean, default: false },
    externalPersonName: { type: String, trim: true },
    externalPersonContact: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    direction: { type: String, enum: ['GIVEN', 'RECEIVED'], required: true },
    date: { type: Date, required: true },
    note: { type: String, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DISPUTED', 'SETTLED'],
      default: 'PENDING',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    acceptedAt: Date,
    disputedAt: Date,
    settledAt: Date,
  },
  { timestamps: true }
);

schema.index({ fromUserId: 1, toUserId: 1 });
schema.index({ createdBy: 1, isExternal: 1 });

module.exports = mongoose.model('Lend', schema);
