import { Link } from 'react-router-dom';
import {
  ShieldCheck, Activity, Server, Shield, BrainCircuit, ArrowRight, Network,
  CheckCircle2, Zap, LockKeyhole
} from 'lucide-react';

const capabilities = [
  {
    icon: BrainCircuit,
    title: 'AI-Powered Analysis',
    text: 'Isolation Forest and XGBoost models identify behavioral anomalies and high-risk payment patterns in real time.',
    tone: 'blue',
  },
  {
    icon: Network,
    title: 'Network Intelligence',
    text: 'DPI telemetry correlates network metadata with application-layer payments to expose suspicious activity.',
    tone: 'emerald',
  },
  {
    icon: Activity,
    title: 'SOC Alert Management',
    text: 'Give analysts one place to triage, acknowledge, escalate, and resolve security incidents.',
    tone: 'amber',
  },
];

const pipeline = [
  ['Payment Initiated', 'slate'],
  ['Behavioral Analysis', 'blue'],
  ['Network / DPI Analysis', 'emerald'],
  ['ML Anomaly Detection', 'purple'],
  ['Risk Score Generated', 'cyan'],
];

const weights = [
  ['Transaction Risk', '25%', 'bg-blue-400'],
  ['Behavioral Risk', '25%', 'bg-indigo-400'],
  ['Network / DPI', '20%', 'bg-emerald-400'],
  ['ML Anomaly (IF)', '15%', 'bg-purple-400'],
  ['ML Supervised (XGB)', '15%', 'bg-pink-400'],
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] min-w-0 overflow-x-hidden bg-slate-950 text-slate-200">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0 rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-1.5 text-cyan-400">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="truncate text-xs font-black uppercase tracking-tight text-white sm:text-sm">
              AI Risk Manager
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="rounded-lg px-2 py-2 text-xs font-semibold text-slate-300 transition hover:text-white sm:px-3 sm:text-sm"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-cyan-500 px-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/15 transition hover:bg-cyan-400 sm:px-4 sm:text-sm"
            >
              Launch Console
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-800/60">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,.16),transparent_60%)]" />
          <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[9px] font-bold font-mono uppercase tracking-wider text-cyan-300 sm:text-xs">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                  <span className="relative h-2 w-2 rounded-full bg-cyan-400" />
                </span>
                System Online · SOC Active
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Real-Time Payment
                <span className="block bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Risk Intelligence
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7 lg:text-lg">
                Detect payment fraud, behavioral anomalies, and network threats
                before they become financial losses. A focused security
                operations center for modern fintech teams.
              </p>

              <div className="mx-auto mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  to="/login"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/15 transition hover:bg-cyan-400 sm:w-auto"
                >
                  Launch Risk Console
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:border-slate-600 hover:bg-slate-800 sm:w-auto"
                >
                  Explore Demo Mode
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 sm:text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Real-time scoring
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Explainable decisions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Live SOC telemetry
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="border-b border-slate-800/60 bg-slate-900/20">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mb-8 max-w-2xl sm:mb-10">
              <p className="text-[10px] font-bold font-mono uppercase tracking-[.2em] text-cyan-400">
                Built for analysts
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                One security layer for the entire payment flow
              </h2>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-3">
              {capabilities.map(({ icon: Icon, title, text, tone }) => (
                <article
                  key={title}
                  className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-slate-700 sm:p-6"
                >
                  <div className={`mb-5 inline-flex rounded-xl border p-3 ${
                    tone === 'blue'
                      ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                      : tone === 'emerald'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-white sm:text-lg">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-400 sm:text-sm">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section className="border-b border-slate-800/60">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
            <p className="text-[10px] font-bold font-mono uppercase tracking-[.2em] text-cyan-400">
              Detection workflow
            </p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              The Intelligence Pipeline
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm">
              Multiple signals are evaluated before a transaction receives a
              routing decision.
            </p>

            <div className="mx-auto mt-10 max-w-2xl">
              <div className="flex flex-col items-center">
                <div className="w-full max-w-xs rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold font-mono text-slate-200 sm:text-sm">
                  Payment Initiated
                </div>
                <div className="h-8 w-px bg-cyan-500/50" />

                <div className="grid w-full gap-3 sm:grid-cols-2">
                  {pipeline.slice(1, 3).map(([label, tone]) => (
                    <div
                      key={label}
                      className={`rounded-xl border px-3 py-3 text-xs font-bold font-mono ${
                        tone === 'blue'
                          ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div className="h-8 w-px bg-cyan-500/50" />
                <div className="w-full max-w-xs rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-xs font-bold font-mono text-purple-300 sm:text-sm">
                  ML Anomaly Detection
                </div>

                <div className="h-8 w-px bg-cyan-500/50" />
                <div className="w-full max-w-xs rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-xs font-bold font-mono text-cyan-300 sm:text-sm">
                  Risk Score Generated
                </div>

                <div className="h-8 w-px bg-cyan-500/50" />

                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {[
                    ['ALLOW', 'emerald'],
                    ['MONITOR', 'blue'],
                    ['STEP-UP', 'amber'],
                    ['BLOCK', 'rose'],
                  ].map(([label, tone]) => (
                    <span
                      key={label}
                      className={`rounded-lg border px-2 py-2 text-[9px] font-bold font-mono sm:text-xs ${
                        tone === 'emerald'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : tone === 'blue'
                            ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                            : tone === 'amber'
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Explainable engine */}
        <section className="bg-slate-900/20">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid min-w-0 items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div className="min-w-0">
                <p className="text-[10px] font-bold font-mono uppercase tracking-[.2em] text-purple-400">
                  Explainability
                </p>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                  Explainable AI Risk Engine
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                  Every transaction is evaluated across multiple risk vectors,
                  giving SOC analysts a clear explanation behind block,
                  step-up, monitor, or allow decisions.
                </p>

                <div className="mt-7 space-y-4">
                  {weights.map(([label, weight, bar]) => (
                    <div key={label}>
                      <div className="mb-1.5 flex justify-between gap-4 text-xs font-mono text-slate-300">
                        <span className="truncate">{label}</span>
                        <span className="shrink-0">{weight}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${bar}`}
                          style={{ width: weight }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">
                <div className="pointer-events-none absolute -right-10 -top-10 opacity-[.06]">
                  <Shield className="h-56 w-56" />
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <Server className="h-4 w-4 text-cyan-400" />
                    Real-Time Architecture
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    Redis event streaming and WebSocket telemetry keep the
                    operations center synchronized with incoming risk events.
                  </p>

                  <div className="mt-6 grid gap-2">
                    {[
                      'Redis Event Streaming',
                      'Python FastAPI ML Microservice',
                      'Express.js REST Core',
                      'React Router SPA',
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-[10px] font-mono text-slate-400 sm:text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                        <span className="break-words">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <LockKeyhole className="h-4 w-4 text-emerald-400" />
                      <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Secure</p>
                      <p className="mt-0.5 text-xs font-semibold text-white">SOC-grade controls</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Fast</p>
                      <p className="mt-0.5 text-xs font-semibold text-white">Live risk telemetry</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-800/60">
          <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Enter the Risk Operations Center
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Investigate synthetic transactions instantly with the built-in
              simulation engine.
            </p>
            <Link
              to="/login"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/15 transition hover:bg-cyan-400"
            >
              Launch Risk Console
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-7 text-center text-[10px] text-slate-500 sm:px-6 sm:text-xs lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:text-left">
          <div className="flex items-center justify-center gap-2 lg:justify-start">
            <ShieldCheck className="h-4 w-4 text-cyan-500" />
            <span className="font-bold text-slate-300">AI Risk Manager</span>
            <span>— Payment Security SOC</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 lg:justify-end">
            <span>Product</span>
            <span>Security</span>
            <span>Documentation</span>
            <span>GitHub</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
