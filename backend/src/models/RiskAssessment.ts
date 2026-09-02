import { Schema, model, Document, Types } from 'mongoose';

export interface IRiskFactor {
  factor: string;
  description: string;
  severity: string;
  contribution: number;
}

export interface IRiskAssessment extends Document {
  _id: Types.ObjectId;
  transactionId: Types.ObjectId;
  transactionUuid: string;
  finalScore: number;
  decision: 'ALLOW' | 'MONITOR' | 'STEP-UP' | 'BLOCK';
  confidence: number;
  transactionScore: number;
  behavioralScore: number;
  networkScore: number;
  mlAnomalyScore: number;
  mlSupervisedScore: number;
  riskFactors: IRiskFactor[];
  shapValues?: Record<string, number>;
  llmExplanation?: string;
  ruleFlags?: Record<string, unknown>;
  mlFallback: boolean;
  createdAt: Date;
}

const riskFactorSchema = new Schema<IRiskFactor>({
  factor: String,
  description: String,
  severity: String,
  contribution: Number,
}, { _id: false });

const riskAssessmentSchema = new Schema<IRiskAssessment>({
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  transactionUuid: { type: String, required: true },
  finalScore: { type: Number, required: true },
  decision: { type: String, enum: ['ALLOW', 'MONITOR', 'STEP-UP', 'BLOCK'], required: true },
  confidence: { type: Number, default: 0.8 },
  transactionScore: { type: Number, default: 0 },
  behavioralScore: { type: Number, default: 0 },
  networkScore: { type: Number, default: 0 },
  mlAnomalyScore: { type: Number, default: 0 },
  mlSupervisedScore: { type: Number, default: 0 },
  riskFactors: [riskFactorSchema],
  shapValues: { type: Schema.Types.Mixed },
  llmExplanation: String,
  ruleFlags: { type: Schema.Types.Mixed },
  mlFallback: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

riskAssessmentSchema.index({ transactionId: 1 }, { unique: true });
riskAssessmentSchema.index({ transactionUuid: 1 });
riskAssessmentSchema.index({ decision: 1 });
riskAssessmentSchema.index({ finalScore: 1 });

export const RiskAssessment = model<IRiskAssessment>('RiskAssessment', riskAssessmentSchema);
