import { Link } from 'react-router-dom';
import {
  ShieldCheck, Activity, Server, Shield, BrainCircuit, ArrowRight, Network,
  CheckCircle2,
} from 'lucide-react';

const capabilities = [
  {
    icon: BrainCircuit,
    title: 'Multi-Vector ML Inference',
    text: 'Isolation Forest vector anomaly detection and supervised XGBoost classifiers identify fraud patterns in real-time.',
    badge: 'XGBoost & IF',
  },
  {
    icon: Network,
    title: 'Layer-7 Packet Intelligence',
    text: 'DPI telemetry correlates packet sizes, auth velocity, and threat IP reputation directly with application payment events.',
    badge: 'Deep Packet Inspection',
  },
  {
    icon: Activity,
    title: 'SOC Incident Response',
    text: 'A high-density operational workbench for Tier-1/Tier-2 analysts to triage, escalate, resolve, and audit alerts.',
    badge: 'Operations Console',
  },
];

const pipeline = [
  ['Payment Ingestion', 'slate'],
  ['Behavioral Profiling', 'blue'],
  ['Network / DPI Telemetry', 'emerald'],
  ['ML Vector Inference', 'purple'],
  ['SOC Decision Generated', 'cyan'],
];

const weights = [
  ['Transaction Heuristics', '25%', 'bg-blue-400'],
  ['Behavioral Signals', '25%', 'bg-indigo-400'],
  ['Network / DPI Telemetry', '20%', 'bg-emerald-400'],
  ['ML Anomaly (Isolation Forest)', '15%', 'bg-purple-400'],
  ['ML Supervised (XGBoost)', '15%', 'bg-pink-400'],
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] min-w-0 overflow-x-hidden bg-canvas text-slate-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 border border-slate-800 text-cyan-400">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              AI Risk Manager
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="h-8 px-3.5 rounded bg-primary hover:bg-primary-hover text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              Launch Console <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-800/80 py-20 lg:py-28">
          <div className="relative mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] font-mono text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              SOC Tier-1 Architecture Active • Financial Fraud Intelligence
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise Real-Time Financial Fraud &amp; Network Security
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
              Detect automated payment fraud, credential stuffing spikes, and anomalous Layer-7 traffic patterns before settlement loss. Orchestrated for cybersecurity and fintech fraud intelligence teams.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="h-10 px-6 rounded bg-primary hover:bg-primary-hover text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
              >
                Launch Risk Console <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/login"
                className="h-10 px-6 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-semibold inline-flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
              >
                Instant Demo Mode
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-mono text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Multi-Vector ML Scoring
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                SHAP Explainability
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Live WebSocket Stream
              </span>
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="border-b border-slate-800/80 py-16 lg:py-20 bg-slate-950/40">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Architecture Capabilities</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Unified Defense Across Payment &amp; Network Layers
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {capabilities.map(({ icon: Icon, title, text, badge }) => (
                <div
                  key={title}
                  className="panel p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                        {badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detection Pipeline Overview */}
        <section className="border-b border-slate-800/80 py-16 lg:py-20">
          <div className="mx-auto w-full max-w-4xl px-4 text-center sm:px-6 lg:px-8 space-y-8">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Detection Methodology</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                The Multi-Stage Risk Pipeline
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Transactions traverse an orchestrated evaluation stack before outputting an automated routing decision
              </p>
            </div>

            <div className="flex flex-col items-center max-w-md mx-auto space-y-2 text-xs font-mono">
              {pipeline.map(([stage], i) => (
                <div key={stage} className="w-full">
                  <div className="panel p-2.5 text-center text-slate-200 font-semibold bg-slate-900/60">
                    {stage}
                  </div>
                  {i < pipeline.length - 1 && (
                    <div className="h-4 w-px bg-slate-800 mx-auto" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Explainability & Weights Section */}
        <section className="py-16 lg:py-20 bg-slate-950/40">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <span className="text-[10px] font-mono uppercase text-slate-400">Governance &amp; Transparency</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Normalized Signal Weights &amp; SHAP Rationale
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every decision is completely explainable. Analysts inspect individual feature impacts via SHAP value attributions, preventing black-box uncertainty during regulatory audits.
                </p>

                <div className="space-y-3 pt-2">
                  {weights.map(([label, weight, bar]) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono text-slate-300">
                        <span>{label}</span>
                        <span className="font-semibold">{weight}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div className={`h-full ${bar}`} style={{ width: weight }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel p-6 space-y-4 bg-slate-900/40">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <Server className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-mono font-semibold text-white uppercase">Production Core Topology</span>
                </div>
                <div className="grid gap-2 text-xs font-mono text-slate-300">
                  {[
                    'Redis Event Stream Broker (Pub/Sub)',
                    'FastAPI Python Machine Learning Service',
                    'Express REST Ingestion Engine',
                    'MongoDB Atlas Document Store',
                  ].map((item) => (
                    <div key={item} className="p-2 rounded bg-slate-950/70 border border-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">AI Risk Manager</span>
            <span>— Financial Fraud Intelligence SOC</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <a href="https://github.com/Harshit-23-create/AI_RISK_MANAGER" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
