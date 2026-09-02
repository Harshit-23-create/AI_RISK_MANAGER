import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: String,
  ipAddress: String,
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
