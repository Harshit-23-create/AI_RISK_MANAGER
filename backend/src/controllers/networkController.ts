import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NetworkEvent } from '../models/NetworkEvent';

export async function getNetworkEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const pageSize = parseInt(req.query.page_size as string || '50');
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      NetworkEvent.find().sort({ timestamp: -1 }).skip(skip).limit(pageSize).lean(),
      NetworkEvent.countDocuments(),
    ]);

    const mapped = items.map(n => ({
      id: String(n._id),
      transaction_id: n.transactionId ? String(n.transactionId) : null,
      src_ip: n.srcIp,
      dst_ip: n.dstIp,
      packet_size: n.packetSize,
      packet_count: n.packetCount,
      request_rate: n.requestRate,
      failed_request_count: n.failedRequestCount,
      connection_count: n.connectionCount,
      endpoint: n.endpoint,
      response_status: n.responseStatus,
      is_suspicious: n.isSuspicious,
      is_simulated: n.isSimulated,
      timestamp: n.timestamp,
    }));

    res.json({ total, page, page_size: pageSize, items: mapped });
  } catch (err) { next(err); }
}

export async function getNetworkStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalEvents, suspiciousCount, avgRate, recentEvents] = await Promise.all([
      NetworkEvent.countDocuments(),
      NetworkEvent.countDocuments({ isSuspicious: true }),
      NetworkEvent.aggregate([{ $group: { _id: null, avg: { $avg: '$requestRate' } } }]),
      NetworkEvent.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .select('timestamp requestRate isSuspicious')
        .lean(),
    ]);

    // Get unique suspicious IPs
    const suspiciousIps = await NetworkEvent.distinct('srcIp', { isSuspicious: true });

    res.json({
      total_events: totalEvents,
      suspicious_events: suspiciousCount,
      average_request_rate: Math.round((avgRate[0]?.avg ?? 0) * 100) / 100,
      suspicious_ips: suspiciousIps.slice(0, 10),
      request_timeline: recentEvents.reverse().map(e => ({
        timestamp: e.timestamp.toISOString(),
        request_rate: e.requestRate,
        is_suspicious: e.isSuspicious,
      })),
    });
  } catch (err) { next(err); }
}
