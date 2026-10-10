import { config } from './env';

export interface RuntimeSettings {
  riskAllow: number;
  riskMonitor: number;
  riskStepup: number;
  weights: {
    transaction: number;
    behavioral: number;
    network: number;
    mlAnomaly: number;
    mlSupervised: number;
  };
  simulation: {
    intervalMs: number;
    maxSimulatedTransactions: number;
    defaultRate: number;
    defaultSuspiciousRatio: number;
  };
  retention: {
    maxTransactions: number;
    maxNetworkEvents: number;
    maxAlerts: number;
  };
}

export const runtimeSettings: RuntimeSettings = {
  riskAllow: config.riskAllow,
  riskMonitor: config.riskMonitor,
  riskStepup: config.riskStepup,
  weights: {
    transaction: 0.25,
    behavioral: 0.25,
    network: 0.20,
    mlAnomaly: 0.15,
    mlSupervised: 0.15,
  },
  simulation: {
    intervalMs: config.simulationIntervalMs,
    maxSimulatedTransactions: config.maxSimulatedTransactions,
    defaultRate: 2,
    defaultSuspiciousRatio: 0.25,
  },
  retention: {
    maxTransactions: config.maxTransactionRecords,
    maxNetworkEvents: config.maxNetworkEventRecords,
    maxAlerts: config.maxAlertRecords,
  },
};
