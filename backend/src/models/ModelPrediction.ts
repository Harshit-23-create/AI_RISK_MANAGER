import { Schema, model, Document, Types } from 'mongoose';

export interface IModelPrediction extends Document {
  _id: Types.ObjectId;
  transactionId: Types.ObjectId;
  modelName: string;
  modelVersion: string;
  score: number;
  anomalyFlag: boolean;
  predictedClass: string;
  createdAt: Date;
}

const modelPredictionSchema = new Schema<IModelPrediction>({
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  modelName: { type: String, required: true },
  modelVersion: { type: String, default: 'v1.0' },
  score: { type: Number, required: true },
  anomalyFlag: { type: Boolean, default: false },
  predictedClass: { type: String, default: 'normal' },
}, { timestamps: { createdAt: true, updatedAt: false } });

modelPredictionSchema.index({ transactionId: 1 });

export const ModelPrediction = model<IModelPrediction>('ModelPrediction', modelPredictionSchema);
