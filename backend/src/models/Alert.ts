import { Schema, model, Document, Types } from 'mongoose';

export interface IAlert extends Document {
  _id: Types.ObjectId;
  transactionId?: Types.ObjectId;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alertType: string;
  title: string;
  message: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';
  isResolved: boolean;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  escalatedAt?: Date;
  assignedTo?: string;
  createdAt: Date;
}

const alertSchema = new Schema<IAlert>({
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
  alertType: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED'], default: 'OPEN' },
  isResolved: { type: Boolean, default: false },
  acknowledgedAt: Date,
  resolvedAt: Date,
  escalatedAt: Date,
  assignedTo: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

alertSchema.index({ status: 1 });
alertSchema.index({ isResolved: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ transactionId: 1 });

export const Alert = model<IAlert>('Alert', alertSchema);
