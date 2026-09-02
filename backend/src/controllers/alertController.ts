import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Alert } from '../models/Alert';
import { HttpError } from '../middleware/errorHandler';

export async function listAlerts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const pageSize = parseInt(req.query.page_size as string || '50');
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    if (req.query.severity) filter.severity = (req.query.severity as string).toUpperCase();
    if (req.query.unresolved_only === 'true') filter.isResolved = false;
    if (req.query.alert_type) filter.alertType = req.query.alert_type;

    const [items, total] = await Promise.all([
      Alert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      Alert.countDocuments(filter),
    ]);

    const mapped = items.map(a => ({
      id: String(a._id),
      transaction_id: a.transactionId ? String(a.transactionId) : null,
      severity: a.severity,
      alert_type: a.alertType,
      title: a.title,
      message: a.message,
      is_resolved: a.isResolved,
      resolved_at: a.resolvedAt ?? null,
      created_at: a.createdAt,
    }));

    res.json({ total, page, page_size: pageSize, items: mapped });
  } catch (err) { next(err); }
}

export async function resolveAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const alert = await Alert.findByIdAndUpdate(
      id,
      { isResolved: true, resolvedAt: new Date() },
      { new: true }
    ).lean();
    if (!alert) throw new HttpError(404, 'Alert not found');
    res.json({ id: String(alert._id), is_resolved: alert.isResolved, resolved_at: alert.resolvedAt });
  } catch (err) { next(err); }
}
