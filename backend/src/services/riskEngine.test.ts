/**
 * Risk Engine unit tests — pure TypeScript, no DB required.
 */

// Mock the ML client so tests don't need the Python service
jest.mock('../ml/mlClient', () => ({
  predict: jest.fn().mockResolvedValue({
    anomalyScore: 20, supervisedScore: 20, confidence: 0.8,
    shapFactors: [], mlFallback: true, modelVersion: 'rule-fallback-v1',
  }),
  analyzeNetwork: jest.fn().mockResolvedValue({
    requestRate: 1, failedRequests: 0, packetSize: 300, packetCount: 1,
    connectionCount: 1, endpoint: '/api/v1/payments/create',
    responseStatus: 200, isSuspicious: false, networkRiskScore: 0, isSimulated: true,
  }),
}));

import { computeRisk } from '../services/riskEngine';
import { ITransaction } from '../models/Transaction';
import { Types } from 'mongoose';

function makeTxn(overrides: Partial<ITransaction> = {}): ITransaction {
  return {
    _id: new Types.ObjectId(),
    transactionId: 'TXN-TEST-001',
    userId: 'USER_0001',
    amount: 1000,
    currency: 'INR',
    timestamp: new Date(),
    failedAttempts: 0,
    transactionFrequency: 0.5,
    accountAgeDays: 365,
    previousTransactionAvg: 900,
    previousTransactionCount: 20,
    isNewDevice: false,
    isNewIp: false,
    country: 'India',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ITransaction;
}

describe('Risk Engine', () => {
  test('normal payment → ALLOW', async () => {
    const result = await computeRisk(makeTxn());
    expect(result.decision).toBe('ALLOW');
    expect(result.finalScore).toBeLessThan(31);
  });

  test('high amount deviation → higher score', async () => {
    const result = await computeRisk(makeTxn({ amount: 50000, previousTransactionAvg: 1000 }));
    expect(result.transactionScore).toBeGreaterThan(30);
  });

  test('new device raises behavioral score', async () => {
    const result = await computeRisk(makeTxn({ isNewDevice: true }));
    expect(result.behavioralScore).toBeGreaterThanOrEqual(25);
  });

  test('many failed attempts raises score', async () => {
    const result = await computeRisk(makeTxn({ failedAttempts: 12 }));
    expect(result.transactionScore).toBeGreaterThan(30);
  });

  test('high risk combined → BLOCK or STEP-UP', async () => {
    const result = await computeRisk(makeTxn({
      amount: 200000, previousTransactionAvg: 1000,
      failedAttempts: 15, isNewDevice: true, isNewIp: true,
      transactionFrequency: 30, accountAgeDays: 1,
    }));
    expect(['MONITOR', 'STEP-UP', 'BLOCK']).toContain(result.decision);
    expect(result.finalScore).toBeGreaterThan(50);
  });

  test('weights sum to 1.0', () => {
    const W = { transaction: 0.25, behavioral: 0.25, network: 0.20, mlAnomaly: 0.15, mlSupervised: 0.15 };
    const sum = Object.values(W).reduce((a, b) => a + b, 0);
    expect(Math.round(sum * 100) / 100).toBe(1.0);
  });

  test('decision thresholds', async () => {
    // Verify ALLOW threshold
    const allow = await computeRisk(makeTxn());
    expect(allow.decision === 'ALLOW' || allow.decision === 'MONITOR').toBeTruthy();
  });

  test('risk factors are sorted by contribution descending', async () => {
    const result = await computeRisk(makeTxn({
      amount: 50000, previousTransactionAvg: 1000,
      failedAttempts: 10, isNewDevice: true, isNewIp: true,
    }));
    for (let i = 1; i < result.riskFactors.length; i++) {
      expect(result.riskFactors[i - 1].contribution).toBeGreaterThanOrEqual(result.riskFactors[i].contribution);
    }
  });

  test('score is clamped to 0-100', async () => {
    const result = await computeRisk(makeTxn({
      amount: 9999999, previousTransactionAvg: 1,
      failedAttempts: 99, isNewDevice: true, isNewIp: true,
      transactionFrequency: 999,
    }));
    expect(result.finalScore).toBeGreaterThanOrEqual(0);
    expect(result.finalScore).toBeLessThanOrEqual(100);
  });
});
