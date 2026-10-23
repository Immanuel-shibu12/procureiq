const mongoose = require('mongoose');
const { Schema } = mongoose;

const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // bcrypt hash, never plain text
  role: { type: String, enum: ['admin', 'requester', 'officer', 'approver'], default: 'requester' },
}, { timestamps: true }));

const Supplier = mongoose.model('Supplier', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true }, phone: String,
  categories: [String],
  quotes: [{ category: String, price: { type: Number, min: 0 } }], // quoted unit price per category
  quality: { type: Number, min: 0, max: 5, default: null },        // null = no data
  onTimePct: { type: Number, min: 0, max: 100, default: null },    // null = no data
  delayedDeliveries: { type: Number, default: 0 },
  documents: [{ name: String, status: { type: String, enum: ['valid', 'expired', 'missing'] }, expiry: Date }],
  orders: [{ po: String, date: Date, value: Number, onTime: Boolean }],
  status: { type: String, enum: ['active', 'inactive', 'under_review', 'suspended'], default: 'active' },
  isSample: { type: Boolean, default: false }, // clearly labelled demo data
}, { timestamps: true }));

const RequestSchema = new Schema({
  itemName: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'], validate: Number.isInteger },
  unitPrice: { type: Number, required: true, min: [0.01, 'Price must be greater than 0'] },
  totalCost: Number,
  requiredDate: { type: Date, required: true },
  justification: { type: String, required: true, minlength: 10 },
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'draft',
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'ordered', 'delivered'] },
  rejectionReason: String,
  order: { supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' }, poNumber: String, value: Number, orderedAt: Date, deliveredAt: Date },
  history: [{ status: String, by: { type: Schema.Types.ObjectId, ref: 'User' }, byName: String, note: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });

// Estimated total is always calculated on the server
RequestSchema.pre('validate', function (next) {
  this.totalCost = +(this.quantity * this.unitPrice).toFixed(2);
  next();
});

const Request = mongoose.model('Request', RequestSchema);

module.exports = { User, Supplier, Request };
