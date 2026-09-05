import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';
import { RiskAssessment } from '../models/RiskAssessment';
import { createTransactionWithRisk } from '../services/transactionService';
import { HttpError } from '../middleware/errorHandler';
import { z } from 'zod';

const createSchema = z.object({
  transactionId: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  paymentMethod: z.string().optional(),
  ipAddress: z.string().optional(),
  deviceId: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  userAgent: z.string().optional(),
  apiEndpoint: z.string().optional(),
  httpMethod: z.string().optional(),
  responseStatus: z.number().optional(),
  failedAttempts: z.number().int().default(0),
  transactionFrequency: z.number().default(0),
  accountAgeDays: z.number().int().default(365),
  previousTransactionAvg: z.number().default(0),
  previousTransactionCount: z.number().int().default(0),
  isNewDevice: z.boolean().default(false),
  isNewIp: z.boolean().default(false),
  scenarioLabel: z.string().optional(),

  failed_attempts: z.number().int().optional(),
  transaction_frequency: z.number().optional(),
  account_age_days: z.number().int().optional(),
  previous_transaction_avg: z.number().optional(),
  previous_transaction_count: z.number().int().optional(),
  is_new_device: z.boolean().optional(),
  is_new_ip: z.boolean().optional(),
  scenario_label: z.string().optional(),
  ip_address: z.string().optional(),
  device_id: z.string().optional(),
  api_endpoint: z.string().optional(),
  http_method: z.string().optional(),
  response_status: z.number().optional(),
  payment_method: z.string().optional(),
  user_id: z.string().optional(),
  merchant_id: z.string().optional(),
});

export async function listTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const pageSize = Math.min(200, parseInt(req.query.page_size as string || '50'));
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    if (req.query.user_id) filter.userId = req.query.user_id;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.scenario_label) filter.scenarioLabel = req.query.scenario_label;
    if (req.query.is_new_device !== undefined) filter.isNewDevice = req.query.is_new_device === 'true';
    if (req.query.is_new_ip !== undefined) filter.isNewIp = req.query.is_new_ip === 'true';

    if (req.query.min_amount || req.query.max_amount) {
      const amountFilter: Record<string, number> = {};
      if (req.query.min_amount) amountFilter.$gte = parseFloat(req.query.min_amount as string);
      if (req.query.max_amount) amountFilter.$lte = parseFloat(req.query.max_amount as string);
      filter.amount = amountFilter;
    }

    if (req.query.from_date || req.query.to_date) {
      const tsFilter: Record<string, Date> = {};
      if (req.query.from_date) tsFilter.$gte = new Date(req.query.from_date as string);
      if (req.query.to_date) tsFilter.$lte = new Date(req.query.to_date as string);
      filter.timestamp = tsFilter;
    }

    if (req.query.decision) {
      const decision = (req.query.decision as string).toUpperCase();
      const raIds = await RiskAssessment.distinct('transactionId', { decision: decision as any });
      filter._id = { $in: raIds };
    }

    const [items, total] = await Promise.all([
      Transaction.find(filter).sort({ timestamp: -1 }).skip(skip).limit(pageSize).lean(),
      Transaction.countDocuments(filter),
    ]);

    const txIds = items.map(i => String(i._id));
    const assessments = await RiskAssessment.find({ transactionId: { $in: txIds } }).lean();
    const decisionMap = new Map(assessments.map(a => [String(a.transactionId), a.decision]));

    const mappedItems = items.map(txn => mapTxnToResponse(txn, decisionMap.get(String(txn._id))));
    res.json({ total, page, page_size: pageSize, items: mappedItems });
  } catch (err) { next(err); }
}

export async function getTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const txn = await Transaction.findOne({ transactionId: req.params.transaction_id }).lean();
    if (!txn) throw new HttpError(404, 'Transaction not found');
    res.json(mapTxnToResponse(txn));
  } catch (err) { next(err); }
}

export async function createTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = createSchema.parse(req.body);

    const input = {
      transactionId: raw.transactionId,
      userId: raw.userId || raw.user_id || '',
      amount: raw.amount,
      currency: raw.currency,
      paymentMethod: raw.paymentMethod || raw.payment_method,
      ipAddress: raw.ipAddress || raw.ip_address,
      deviceId: raw.deviceId || raw.device_id,
      country: raw.country,
      city: raw.city,
      userAgent: raw.userAgent,
      apiEndpoint: raw.apiEndpoint || raw.api_endpoint,
      httpMethod: raw.httpMethod || raw.http_method,
      responseStatus: raw.responseStatus || raw.response_status,
      failedAttempts: raw.failedAttempts ?? raw.failed_attempts ?? 0,
      transactionFrequency: raw.transactionFrequency ?? raw.transaction_frequency ?? 0,
      accountAgeDays: raw.accountAgeDays ?? raw.account_age_days ?? 365,
      previousTransactionAvg: raw.previousTransactionAvg ?? raw.previous_transaction_avg ?? 0,
      previousTransactionCount: raw.previousTransactionCount ?? raw.previous_transaction_count ?? 0,
      isNewDevice: raw.isNewDevice ?? raw.is_new_device ?? false,
      isNewIp: raw.isNewIp ?? raw.is_new_ip ?? false,
      scenarioLabel: raw.scenarioLabel || raw.scenario_label,
    };

    const existing = await Transaction.findOne({ transactionId: input.transactionId });
    if (existing) throw new HttpError(409, `Transaction ${input.transactionId} already exists`);

    const txn = await createTransactionWithRisk(input);
    res.status(201).json(mapTxnToResponse(txn.toObject()));
  } catch (err) { next(err); }
}

export async function getUserHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const pageSize = Math.min(100, parseInt(req.query.page_size as string || '20'));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      Transaction.find({ userId }).sort({ timestamp: -1 }).skip(skip).limit(pageSize).lean(),
      Transaction.countDocuments({ userId }),
    ]);

    const txIds = items.map(i => String(i._id));
    const assessments = await RiskAssessment.find({ transactionId: { $in: txIds } }).lean();
    const decisionMap = new Map(assessments.map(a => [String(a.transactionId), a.decision]));

    res.json({ total, page, page_size: pageSize, items: items.map(txn => mapTxnToResponse(txn, decisionMap.get(String(txn._id)))) });
  } catch (err) { next(err); }
}

function mapTxnToResponse(txn: any, decision?: string) {
  return {
    id: String(txn._id),
    transaction_id: txn.transactionId,
    user_id: txn.userId,
    merchant_id: txn.merchantId ?? null,
    amount: txn.amount,
    currency: txn.currency,
    ip_address: txn.ipAddress ?? null,
    device_id: txn.deviceId ?? null,
    country: txn.country ?? null,
    city: txn.city ?? null,
    payment_method: txn.paymentMethod ?? null,
    failed_attempts: txn.failedAttempts,
    transaction_frequency: txn.transactionFrequency,
    account_age_days: txn.accountAgeDays,
    previous_transaction_avg: txn.previousTransactionAvg,
    previous_transaction_count: txn.previousTransactionCount,
    is_new_device: txn.isNewDevice,
    is_new_ip: txn.isNewIp,
    scenario_label: txn.scenarioLabel ?? null,
    status: txn.status,
    decision: decision || null,
    timestamp: txn.timestamp,
    created_at: txn.createdAt,
  };
}
