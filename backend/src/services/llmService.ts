/**
 * LLM Service — generates human-readable explanations of ML decisions.
 * The LLM NEVER determines the risk decision; it only explains the result.
 * Supports: OpenAI, Gemini, Mock (deterministic fallback).
 */
import axios from 'axios';
import { config } from '../config/env';

interface LlmContext {
  transaction_id: string;
  risk_score: number;
  decision: string;
  amount: number;
  currency: string;
  user_id: string;
  ip_address?: string;
  breakdown: {
    transaction: number;
    behavioral: number;
    network: number;
    ml_anomaly: number;
    ml_supervised: number;
  };
  risk_factors: Array<{ factor: string; description: string; severity: string; contribution: number }>;
  shap_values?: Record<string, number>;
}

function buildPrompt(ctx: LlmContext): string {
  const factors = ctx.risk_factors.slice(0, 5).map(f => `- ${f.description} (${f.severity})`).join('\n');
  const shapTop = ctx.shap_values
    ? Object.entries(ctx.shap_values)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v.toFixed(3)}`)
        .join(', ')
    : 'N/A';

  return `You are a senior payment security analyst. Explain the following risk assessment in 2–3 clear, concise sentences for a human analyst. Be specific. Do NOT recommend a different decision.

Transaction: ${ctx.transaction_id}
Amount: ${ctx.currency} ${ctx.amount.toLocaleString()}
User: ${ctx.user_id}
IP: ${ctx.ip_address || 'Unknown'}
Risk Score: ${ctx.risk_score}/100
Decision: ${ctx.decision}

Score Breakdown:
- Transaction rules: ${ctx.breakdown.transaction.toFixed(1)}
- Behavioral: ${ctx.breakdown.behavioral.toFixed(1)}
- Network/DPI: ${ctx.breakdown.network.toFixed(1)}
- ML Anomaly (IF): ${ctx.breakdown.ml_anomaly.toFixed(1)}
- ML Supervised (XGBoost): ${ctx.breakdown.ml_supervised.toFixed(1)}

Key Risk Factors:
${factors || 'No significant risk factors detected.'}

Top SHAP contributors: ${shapTop}

Write a concise explanation for the analyst:`;
}

function mockExplanation(ctx: LlmContext): string {
  const { decision, risk_score, risk_factors, breakdown } = ctx;

  if (decision === 'ALLOW') {
    return `Transaction ${ctx.transaction_id} received a low risk score of ${risk_score}/100, indicating normal payment behaviour consistent with the user's history. All scoring components (transaction: ${breakdown.transaction.toFixed(1)}, behavioral: ${breakdown.behavioral.toFixed(1)}, network: ${breakdown.network.toFixed(1)}) remain within acceptable thresholds. The transaction has been allowed to proceed without additional verification.`;
  }

  if (decision === 'BLOCK') {
    const topFactor = risk_factors[0]?.description || 'multiple combined risk signals';
    return `Transaction ${ctx.transaction_id} was BLOCKED with a critical risk score of ${risk_score}/100. The primary trigger was: ${topFactor}. Combined ML models (Isolation Forest: ${breakdown.ml_anomaly.toFixed(1)}, XGBoost: ${breakdown.ml_supervised.toFixed(1)}) and rule-based behavioral analysis all flagged this transaction as highly suspicious, warranting an immediate block.`;
  }

  if (decision === 'STEP-UP') {
    const topFactor = risk_factors[0]?.description || 'elevated risk signals';
    return `Transaction ${ctx.transaction_id} requires step-up authentication due to a risk score of ${risk_score}/100. The key concern is: ${topFactor}. While not conclusive enough to block, the combination of behavioral (${breakdown.behavioral.toFixed(1)}) and network (${breakdown.network.toFixed(1)}) signals warrants additional identity verification before proceeding.`;
  }

  // MONITOR
  return `Transaction ${ctx.transaction_id} is being monitored with a risk score of ${risk_score}/100. ${risk_factors.length > 0 ? `The system detected: ${risk_factors[0]?.description}.` : 'Some minor anomalies were detected.'} The transaction was allowed to proceed but will be tracked for any follow-up suspicious activity.`;
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    },
    { headers: { Authorization: `Bearer ${config.openaiApiKey}` }, timeout: 10000 }
  );
  return response.data.choices[0].message.content.trim();
}

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.googleApiKey}`;
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
  }, { timeout: 10000 });
  return response.data.candidates[0].content.parts[0].text.trim();
}

export async function generateExplanation(ctx: LlmContext): Promise<string> {
  const provider = config.llmProvider;
  const prompt = buildPrompt(ctx);

  if (provider === 'openai' && config.openaiApiKey) {
    try {
      return await callOpenAI(prompt);
    } catch (err) {
      console.warn('[LLM] OpenAI failed, using mock:', (err as Error).message);
    }
  }

  if (provider === 'gemini' && config.googleApiKey) {
    try {
      return await callGemini(prompt);
    } catch (err) {
      console.warn('[LLM] Gemini failed, using mock:', (err as Error).message);
    }
  }

  return mockExplanation(ctx);
}
