
import { v4 as uuidv4 } from 'uuid';
import { createTransactionWithRisk, CreateTransactionInput } from './transactionService';

export const NAMED_SCENARIOS = [
  'normal_payment', 'unusual_amount', 'new_device', 'suspicious_ip',
  'multiple_failed_attempts', 'api_burst', 'high_risk_payment',
];

const MERCHANTS = [1, 2, 3, 4, 5];
const PAYMENT_METHODS = ['UPI', 'card', 'netbanking', 'wallet'];
const SUSPICIOUS_IPS = ['185.220.101.50', '198.51.100.44', '203.0.113.99', '45.33.32.156'];
const DEMO_SCENARIOS = ['demo_normal', 'demo_suspicious', 'demo_api_burst'];

const USER_PROFILES: Record<string, { avg: number; min: number; max: number; country: string; age: number; count: number }> = {};
const USER_KNOWN_DEVICES: Record<string, string> = {};
const USER_KNOWN_IPS: Record<string, string> = {};

function getProfile(userId: string) {
  if (!USER_PROFILES[userId]) {
    const avgBase = 500 + Math.abs(userId.charCodeAt(userId.length - 1)) * 120;
    USER_PROFILES[userId] = { avg: avgBase, min: avgBase * 0.5, max: avgBase * 2, country: 'India', age: 180 + Math.floor(Math.random() * 600), count: 20 };
    USER_KNOWN_DEVICES[userId] = `DEV_${userId.replace(/\W/g, '').toUpperCase().slice(-6)}`;
    USER_KNOWN_IPS[userId] = `103.${40 + (userId.charCodeAt(0) % 200)}.${userId.charCodeAt(1) % 256}.${userId.charCodeAt(2) % 256}`;
  }
  return USER_PROFILES[userId];
}

const ALL_USERS = Array.from({ length: 100 }, (_, i) => `USER_${String(i + 1).padStart(4, '0')}`);

function rnd(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function choice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNormal(): CreateTransactionInput {
  const userId = choice(ALL_USERS);
  const p = getProfile(userId);
  const amount = rnd(p.min, Math.min(p.max, p.avg * 1.5));
  return {
    transactionId: uuidv4(), userId, amount, currency: 'INR',
    merchantId: String(choice(MERCHANTS)),
    ipAddress: USER_KNOWN_IPS[userId],
    deviceId: USER_KNOWN_DEVICES[userId],
    country: 'India', city: 'Mumbai',
    userAgent: 'Mozilla/5.0 (Android 12; Mobile) Chrome/120',
    apiEndpoint: '/api/v1/payments/create', httpMethod: 'POST', responseStatus: 200,
    paymentMethod: choice(PAYMENT_METHODS),
    failedAttempts: Math.random() < 0.07 ? 1 : 0,
    transactionFrequency: rnd(0.1, 2.0),
    accountAgeDays: p.age, previousTransactionAvg: p.avg, previousTransactionCount: p.count,
    isNewDevice: false, isNewIp: false, scenarioLabel: 'normal',
  };
}

function generateUnusualAmount(): CreateTransactionInput {
  const userId = choice(ALL_USERS);
  const p = getProfile(userId);
  const multiplier = rnd(5, 20);
  const amount = Math.round(p.avg * multiplier * 100) / 100;
  return {
    transactionId: uuidv4(), userId, amount, currency: 'INR',
    merchantId: String(choice(MERCHANTS)),
    ipAddress: USER_KNOWN_IPS[userId],
    deviceId: USER_KNOWN_DEVICES[userId],
    country: 'India', city: 'Mumbai',
    userAgent: 'Mozilla/5.0 (Android 12; Mobile)',
    apiEndpoint: '/api/v1/payments/create', httpMethod: 'POST', responseStatus: 200,
    paymentMethod: choice(PAYMENT_METHODS),
    failedAttempts: randInt(0, 2), transactionFrequency: rnd(0.5, 3.0),
    accountAgeDays: p.age, previousTransactionAvg: p.avg, previousTransactionCount: p.count,
    isNewDevice: false, isNewIp: false, scenarioLabel: 'unusual_amount',
  };
}

function generateNewDevice(): CreateTransactionInput {
  const userId = choice(ALL_USERS);
  const p = getProfile(userId);
  const newDevice = `DEV_${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}_NEW`;
  return {
    transactionId: uuidv4(), userId,
    amount: Math.round(p.avg * rnd(0.8, 2.5) * 100) / 100,
    currency: 'INR', merchantId: String(choice(MERCHANTS)),
    ipAddress: USER_KNOWN_IPS[userId], deviceId: newDevice,
    country: 'India', city: 'Bengaluru',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17)',
    apiEndpoint: '/api/v1/payments/create', httpMethod: 'POST', responseStatus: 200,
    paymentMethod: choice(PAYMENT_METHODS),
    failedAttempts: randInt(1, 3), transactionFrequency: rnd(0.5, 4.0),
    accountAgeDays: p.age, previousTransactionAvg: p.avg, previousTransactionCount: p.count,
    isNewDevice: true, isNewIp: false, scenarioLabel: 'new_device',
  };
}

function generateSuspiciousIp(): CreateTransactionInput {
  const userId = choice(ALL_USERS);
  const p = getProfile(userId);
  const foreignCountry = choice(['Russia', 'Nigeria', 'Unknown', 'Netherlands', 'Romania']);
  return {
    transactionId: uuidv4(), userId,
    amount: Math.round(p.avg * rnd(0.5, 3.0) * 100) / 100,
    currency: 'INR', merchantId: String(choice(MERCHANTS)),
    ipAddress: choice(SUSPICIOUS_IPS), deviceId: USER_KNOWN_DEVICES[userId],
    country: foreignCountry, city: 'Unknown',
    userAgent: 'curl/7.88.1',
    apiEndpoint: '/api/v1/payments/create', httpMethod: 'POST', responseStatus: 200,
    paymentMethod: 'card',
    failedAttempts: randInt(0, 3), transactionFrequency: rnd(1.0, 6.0),
    accountAgeDays: p.age, previousTransactionAvg: p.avg, previousTransactionCount: p.count,
    isNewDevice: false, isNewIp: true, scenarioLabel: 'suspicious_ip',
  };
}

function generateMultipleFailed(): CreateTransactionInput {
  const userId = choice(ALL_USERS);
  const p = getProfile(userId);
  const failed = randInt(6, 15);
  return {
    transactionId: uuidv4(), userId,
    amount: Math.round(p.avg * rnd(1.0, 3.0) * 100) / 100,
    currency: 'INR', merchantId: String(choice(MERCHANTS)),
    ipAddress: USER_KNOWN_IPS[userId], deviceId: USER_KNOWN_DEVICES[userId],
    country: 'India', city: 'Delhi',
    userAgent: 'Mozilla/5.0',
    apiEndpoint: '/api/v1/auth/token', httpMethod: 'POST', responseStatus: 401,
    paymentMethod: choice(PAYMENT_METHODS),
    failedAttempts: failed, transactionFrequency: rnd(1.0, 5.0),
    accountAgeDays: p.age, previousTransactionAvg: p.avg, previousTransactionCount: p.count,
    isNewDevice: false, isNewIp: false, scenarioLabel: 'multiple_failed_attempts',
  };
}

function generateApiBurst(): CreateTransactionInput {
  const userId = choice(ALL_USERS);
  const p = getProfile(userId);
  const freq = rnd(18, 40);
  return {
    transactionId: uuidv4(), userId,
    amount: Math.round(p.avg * rnd(0.9, 1.5) * 100) / 100,
    currency: 'INR', merchantId: String(choice(MERCHANTS)),
    ipAddress: choice(SUSPICIOUS_IPS), deviceId: 'DEV_BOT_AUTO',
    country: 'India', city: 'Delhi',
    userAgent: 'python-requests/2.31.0',
    apiEndpoint: '/api/v1/payments/batch', httpMethod: 'POST', responseStatus: 429,
    paymentMethod: 'netbanking',
    failedAttempts: randInt(2, 5), transactionFrequency: freq,
    accountAgeDays: p.age, previousTransactionAvg: p.avg, previousTransactionCount: p.count,
    isNewDevice: false, isNewIp: false, scenarioLabel: 'api_burst',
  };
}

function generateHighRisk(): CreateTransactionInput {
  const userId = choice(ALL_USERS.slice(0, 50));
  const p = getProfile(userId);
  const newDevice = `DEV_${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}_NEW`;
  return {
    transactionId: uuidv4(), userId,
    amount: Math.round(p.avg * rnd(15, 40) * 100) / 100,
    currency: 'INR', merchantId: '3',
    ipAddress: choice(SUSPICIOUS_IPS), deviceId: newDevice,
    country: choice(['Russia', 'Nigeria', 'Unknown']), city: 'Unknown',
    userAgent: 'curl/7.68.0',
    apiEndpoint: '/api/v1/payments/create', httpMethod: 'POST', responseStatus: 200,
    paymentMethod: 'card',
    failedAttempts: randInt(8, 15), transactionFrequency: rnd(20, 35),
    accountAgeDays: p.age, previousTransactionAvg: p.avg, previousTransactionCount: p.count,
    isNewDevice: true, isNewIp: true, scenarioLabel: 'high_risk_payment',
  };
}

function generateDemoNormal(): CreateTransactionInput {
  return {
    transactionId: uuidv4(), userId: 'USER_0001', amount: 1200.00, currency: 'INR', merchantId: '1',
    ipAddress: '103.45.123.10', deviceId: 'DEV_KNOWN001', country: 'India', city: 'Mumbai',
    userAgent: 'Chrome/120', apiEndpoint: '/api/v1/payments/create', httpMethod: 'POST', responseStatus: 200,
    paymentMethod: 'UPI', failedAttempts: 0, transactionFrequency: 0.5,
    accountAgeDays: 730, previousTransactionAvg: 1100, previousTransactionCount: 45,
    isNewDevice: false, isNewIp: false, scenarioLabel: 'demo_normal',
  };
}

function generateDemoSuspicious(): CreateTransactionInput {
  return {
    transactionId: uuidv4(), userId: 'USER_0002', amount: 75000.00, currency: 'INR', merchantId: '3',
    ipAddress: '185.220.101.50', deviceId: `DEV_${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}_NEW`,
    country: 'Unknown', city: 'Unknown', userAgent: 'curl/7.68',
    apiEndpoint: '/api/v1/payments/create', httpMethod: 'POST', responseStatus: 200,
    paymentMethod: 'card', failedAttempts: 8, transactionFrequency: 15.0,
    accountAgeDays: 1, previousTransactionAvg: 500, previousTransactionCount: 2,
    isNewDevice: true, isNewIp: true, scenarioLabel: 'demo_suspicious',
  };
}

function generateDemoApiBurst(): CreateTransactionInput {
  return {
    transactionId: uuidv4(), userId: 'USER_0003', amount: 5000.00, currency: 'INR', merchantId: '4',
    ipAddress: '185.220.200.99', deviceId: 'DEV_BOT001',
    country: 'India', city: 'Delhi', userAgent: 'python-requests/2.28',
    apiEndpoint: '/api/v1/payments/batch', httpMethod: 'POST', responseStatus: 429,
    paymentMethod: 'netbanking', failedAttempts: 3, transactionFrequency: 28.0,
    accountAgeDays: 180, previousTransactionAvg: 4800, previousTransactionCount: 30,
    isNewDevice: false, isNewIp: true, scenarioLabel: 'demo_api_burst',
  };
}

export class SimulationService {
  isRunning = false;
  rate = 2;
  suspiciousRatio = 0.25;
  demoMode = false;
  eventsGenerated = 0;
  normalEvents = 0;
  suspiciousEvents = 0;
  startedAt: Date | null = null;
  private stopSignal = false;
  private demoIndex = 0;

  setParams(rate: number, suspiciousRatio: number, demoMode = false) {
    this.rate = Math.min(50, Math.max(1, rate));
    this.suspiciousRatio = Math.min(1, Math.max(0, suspiciousRatio));
    this.demoMode = demoMode;
  }

  stop() {
    this.stopSignal = true;
    this.isRunning = false;
  }

  getStatus() {
    const elapsed = this.startedAt ? (Date.now() - this.startedAt.getTime()) / 1000 : null;
    return {
      running: this.isRunning,
      rate: this.rate,
      suspicious_ratio: this.suspiciousRatio,
      demo_mode: this.demoMode,
      events_generated: this.eventsGenerated,
      normal_events: this.normalEvents,
      suspicious_events: this.suspiciousEvents,
      events_per_second: elapsed && elapsed > 0 ? Math.round(this.eventsGenerated / elapsed * 100) / 100 : 0,
      elapsed_seconds: elapsed ? Math.round(elapsed * 10) / 10 : null,
      started_at: this.startedAt?.toISOString() ?? null,
    };
  }

  generateScenario(scenario: string): CreateTransactionInput {
    const generators: Record<string, () => CreateTransactionInput> = {
      normal_payment: generateNormal,
      unusual_amount: generateUnusualAmount,
      new_device: generateNewDevice,
      suspicious_ip: generateSuspiciousIp,
      multiple_failed_attempts: generateMultipleFailed,
      api_burst: generateApiBurst,
      high_risk_payment: generateHighRisk,
    };
    const gen = generators[scenario] || generateNormal;
    return gen();
  }

  private nextDemoEvent(): CreateTransactionInput {
    const scenario = DEMO_SCENARIOS[this.demoIndex % DEMO_SCENARIOS.length];
    this.demoIndex++;
    if (scenario === 'demo_normal') return generateDemoNormal();
    if (scenario === 'demo_suspicious') return generateDemoSuspicious();
    return generateDemoApiBurst();
  }

  async run() {
    this.stopSignal = false;
    this.isRunning = true;
    this.startedAt = new Date();
    this.eventsGenerated = 0;
    this.normalEvents = 0;
    this.suspiciousEvents = 0;

    const SUSPICIOUS_SCENARIOS = ['unusual_amount', 'multiple_failed_attempts', 'new_device', 'suspicious_ip', 'api_burst'];
    const interval = 1000 / this.rate;

    while (!this.stopSignal) {
      try {
        let payload: CreateTransactionInput;
        let isSuspicious = false;

        if (this.demoMode) {
          payload = this.nextDemoEvent();
          isSuspicious = payload.scenarioLabel !== 'demo_normal';
        } else if (Math.random() < this.suspiciousRatio) {
          payload = this.generateScenario(choice(SUSPICIOUS_SCENARIOS));
          isSuspicious = true;
        } else {
          payload = generateNormal();
        }

        if (isSuspicious) this.suspiciousEvents++;
        else this.normalEvents++;

        await createTransactionWithRisk(payload);
        this.eventsGenerated++;
      } catch (err) {
        console.error('[Simulation] Event error:', (err as Error).message);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    this.isRunning = false;
    console.log(`[Simulation] Stopped. Generated ${this.eventsGenerated} events.`);
  }
}

export const simulationService = new SimulationService();
