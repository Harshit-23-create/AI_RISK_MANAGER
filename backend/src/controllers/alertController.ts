import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Alert } from '../models/Alert';
import { AuditLog } from '../models/AuditLog';
import { HttpError } from '../middleware/errorHandler';

export async function listAlerts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const pageSize = parseInt(req.query.page_size as string || '50');
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    if (req.query.severity) filter.severity = (req.query.severity as string).toUpperCase();
    if (req.query.status) filter.status = (req.query.status as string).toUpperCase();
    if (req.query.unresolved_only === 'true') filter.isResolved = false;
    if (req.query.alert_type) filter.alertType = req.query.alert_type;

    const [items, total] = await Promise.all([
      Alert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      Alert.countDocuments(filter),
    ]);

    const mapped = items.map(a => ({
      id: String(a._id),
      transaction_id: a.transactionUuid || (a.transactionId ? String(a.transactionId) : null),
      severity: a.severity,
      alert_type: a.alertType,
      title: a.title,
      message: a.message,
      status: a.status || (a.isResolved ? 'RESOLVED' : 'OPEN'),
      is_resolved: a.isResolved,
      acknowledged_at: a.acknowledgedAt ?? null,
      resolved_at: a.resolvedAt ?? null,
      escalated_at: a.escalatedAt ?? null,
      assigned_to: a.assignedTo ?? 'SOC Analyst',
      analyst_notes: a.analystNotes ?? null,
      created_at: a.createdAt,
    }));

    res.json({ total, page, page_size: pageSize, items: mapped });
  } catch (err) { next(err); }
}

export async function acknowledgeAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const notes = req.body?.notes;
    const update: Record<string, unknown> = {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
    };
    if (notes) update.analystNotes = notes;
    if (req.body?.assigned_to) update.assignedTo = req.body.assigned_to;

    const alert = await Alert.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!alert) throw new HttpError(404, 'Alert not found');

    await AuditLog.create({
      userId: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      action: 'ACKNOWLEDGE_ALERT',
      resource: 'ALERT',
      resourceId: String(id),
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date(),
    });

    res.json({
      id: String(alert._id),
      status: alert.status,
      acknowledged_at: alert.acknowledgedAt,
      analyst_notes: alert.analystNotes,
    });
  } catch (err) { next(err); }
}

export async function resolveAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const notes = req.body?.notes;
    const update: Record<string, unknown> = {
      status: 'RESOLVED',
      isResolved: true,
      resolvedAt: new Date(),
    };
    if (notes) update.analystNotes = notes;

    const alert = await Alert.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!alert) throw new HttpError(404, 'Alert not found');

    await AuditLog.create({
      userId: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      action: 'RESOLVE_ALERT',
      resource: 'ALERT',
      resourceId: String(id),
      ipAddress: req.ip || '127.0.0.1',
      metadata: { notes },
      timestamp: new Date(),
    });

    res.json({
      id: String(alert._id),
      status: alert.status,
      is_resolved: alert.isResolved,
      resolved_at: alert.resolvedAt,
      analyst_notes: alert.analystNotes,
    });
  } catch (err) { next(err); }
}

export async function escalateAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const notes = req.body?.notes;
    const update: Record<string, unknown> = {
      status: 'ESCALATED',
      escalatedAt: new Date(),
    };
    if (notes) update.analystNotes = notes;

    const alert = await Alert.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!alert) throw new HttpError(404, 'Alert not found');

    await AuditLog.create({
      userId: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      action: 'ESCALATE_ALERT',
      resource: 'ALERT',
      resourceId: String(id),
      ipAddress: req.ip || '127.0.0.1',
      metadata: { notes },
      timestamp: new Date(),
    });

    res.json({
      id: String(alert._id),
      status: alert.status,
      escalated_at: alert.escalatedAt,
      analyst_notes: alert.analystNotes,
    });
  } catch (err) { next(err); }
}

export async function updateAlertNotes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { notes, assigned_to } = req.body;
    const update: Record<string, unknown> = {};
    if (notes !== undefined) update.analystNotes = notes;
    if (assigned_to !== undefined) update.assignedTo = assigned_to;

    const alert = await Alert.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!alert) throw new HttpError(404, 'Alert not found');

    res.json({
      id: String(alert._id),
      status: alert.status,
      analyst_notes: alert.analystNotes,
      assigned_to: alert.assignedTo,
    });
  } catch (err) { next(err); }
}
