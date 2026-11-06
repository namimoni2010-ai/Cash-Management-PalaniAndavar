const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionDate: { type: Date, required: true }, // stored as UTC midnight of the chosen day
    type: { type: String, enum: ['RECEIVED', 'EXPENSE'], required: true },
    paymentMode: { type: String, enum: ['GPAY', 'CASH'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // required for EXPENSE
    description: { type: String, required: true, trim: true, maxlength: 200 },
    receivedFrom: { type: String, trim: true, default: '' },
    paidTo: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    clientRequestId: { type: String }, // idempotency key: stops double submits
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.transactionDate = ret.transactionDate.toISOString().slice(0, 10);
        delete ret.__v;
        return ret;
      },
    },
  }
);

transactionSchema.index({ transactionDate: -1, paymentMode: 1, type: 1 });
transactionSchema.index({ clientRequestId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);
