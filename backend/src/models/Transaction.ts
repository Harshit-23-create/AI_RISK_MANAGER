import { Schema, model, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  transactionId: string;
  userId: string;
  merchantId?: string;
  amount: number;
  currency: string;
  timestamp: Date;
  paymentMethod?: string;
  ipAddress?: string;
  deviceId?: string;
  country?: string;
  city?: string;
  userAgent?: string;
  apiEndpoint?: string;
  httpMethod?: string;
  responseStatus?: number;
  failedAttempts: number;
  transactionFrequency: number;
  accountAgeDays: number;
  previousTransactionAvg: number;
  previousTransactionCount: number;
  isNewDevice: boolean;
  isNewIp: boolean;
  scenarioLabel?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  merchantId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  timestamp: { type: Date, default: Date.now },
  paymentMethod: String,
  ipAddress: String,
  deviceId: String,
  country: String,
  city: String,
  userAgent: String,
  apiEndpoint: String,
  httpMethod: String,
  responseStatus: Number,
  failedAttempts: { type: Number, default: 0 },
  transactionFrequency: { type: Number, default: 0 },
  accountAgeDays: { type: Number, default: 365 },
  previousTransactionAvg: { type: Number, default: 0 },
  previousTransactionCount: { type: Number, default: 0 },
  isNewDevice: { type: Boolean, default: false },
  isNewIp: { type: Boolean, default: false },
  scenarioLabel: String,
  status: { type: String, default: 'pending' },
}, { timestamps: true });

transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ timestamp: -1 });
transactionSchema.index({ scenarioLabel: 1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
