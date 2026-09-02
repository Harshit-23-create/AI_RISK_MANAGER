import { Schema, model, Document, Types } from 'mongoose';

export interface INetworkEvent extends Document {
  _id: Types.ObjectId;
  transactionId?: Types.ObjectId;
  srcIp?: string;
  dstIp?: string;
  srcPort?: number;
  dstPort?: number;
  protocol?: string;
  packetSize: number;
  packetCount: number;
  requestCount: number;
  responseCount: number;
  requestFrequency: number;
  connectionCount: number;
  failedRequestCount: number;
  payloadSize: number;
  requestRate: number;
  httpMethod?: string;
  endpoint?: string;
  responseStatus?: number;
  isSuspicious: boolean;
  isSimulated: boolean;
  timestamp: Date;
}

const networkEventSchema = new Schema<INetworkEvent>({
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  srcIp: String,
  dstIp: String,
  srcPort: Number,
  dstPort: Number,
  protocol: String,
  packetSize: { type: Number, default: 300 },
  packetCount: { type: Number, default: 1 },
  requestCount: { type: Number, default: 1 },
  responseCount: { type: Number, default: 1 },
  requestFrequency: { type: Number, default: 0 },
  connectionCount: { type: Number, default: 1 },
  failedRequestCount: { type: Number, default: 0 },
  payloadSize: { type: Number, default: 0 },
  requestRate: { type: Number, default: 0 },
  httpMethod: String,
  endpoint: String,
  responseStatus: Number,
  isSuspicious: { type: Boolean, default: false },
  isSimulated: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
});

networkEventSchema.index({ transactionId: 1 });
networkEventSchema.index({ isSuspicious: 1 });
networkEventSchema.index({ timestamp: -1 });

export const NetworkEvent = model<INetworkEvent>('NetworkEvent', networkEventSchema);
