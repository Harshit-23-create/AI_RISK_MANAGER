import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Server, Shield, BrainCircuit, ArrowRight, Network } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30 font-sans overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-sm font-black text-white tracking-tight uppercase">AI Risk Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/login" className="px-4 py-2 text-sm font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
              Launch Console
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            SYSTEM ONLINE • SOC ACTIVE
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
            Real-Time Payment <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Risk Intelligence</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
            Detect payment fraud, behavioral anomalies, and network threats before they become financial losses. A comprehensive SOC built for modern fintechs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
              Launch Risk Console <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-center gap-2">
              Explore Demo Mode
            </Link>
          </div>
        </div>
      </section>

      {/* ── Value / Core Capabilities ── */}
      <section className="py-20 border-t border-slate-800/50 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Utilize Isolation Forests and XGBoost models to detect complex behavioral anomalies in real-time.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Network Intelligence</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Deep Packet Inspection (DPI) telemetry correlates L7 network metadata with application-layer payments.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">SOC Alert Management</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                A dedicated Security Operations Center interface for analysts to triage, escalate, and resolve incidents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works Flow ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-white mb-16">The Intelligence Pipeline</h2>
          
          <div className="flex flex-col items-center gap-4 text-sm font-bold font-mono">
            <div className="w-48 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-200">
              Payment Initiated
            </div>
            <div className="h-8 w-px bg-cyan-500/50"></div>
            
            <div className="w-full max-w-md grid grid-cols-2 gap-4">
              <div className="py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">Behavioral Analysis</div>
              <div className="py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Network / DPI Analysis</div>
            </div>
            <div className="h-8 w-px bg-cyan-500/50"></div>
            
            <div className="w-48 py-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
              ML Anomaly Detection
            </div>
            <div className="h-8 w-px bg-cyan-500/50"></div>
            
            <div className="w-48 py-3 rounded-xl border border-cyan-500/50 bg-cyan-500/20 text-cyan-300">
              Risk Score Generated
            </div>
            <div className="h-8 w-px bg-cyan-500/50"></div>

            <div className="flex items-center justify-center gap-3 w-full max-w-md">
              <span className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">ALLOW</span>
              <span className="px-3 py-1.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">MONITOR</span>
              <span className="px-3 py-1.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs">STEP-UP</span>
              <span className="px-3 py-1.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs">BLOCK</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Risk Engine Breakdown ── */}
      <section className="py-24 border-t border-slate-800/50 bg-slate-900/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-white mb-6">Explainable AI Risk Engine</h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Our decision engine uses a transparent, weighted model. Every transaction is scored across multiple vectors, providing SOC analysts with clear Shapley values and LLM-generated explanations for every block or step-up challenge.
              </p>
              
              <div className="space-y-4 font-mono text-sm">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Transaction Risk</span>
                    <span>25%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-400 w-[25%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Behavioral Risk</span>
                    <span>25%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-indigo-400 w-[25%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Network / DPI</span>
                    <span>20%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400 w-[20%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>ML Anomaly (IF)</span>
                    <span>15%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-purple-400 w-[15%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>ML Supervised (XGB)</span>
                    <span>15%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-pink-400 w-[15%]"></div></div>
                </div>
              </div>
            </div>
            
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="w-48 h-48" />
              </div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" /> Real-Time Architecture
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Powered by a high-performance Redis Pub/Sub backplane and WebSocket feeds, ensuring analysts see risk events the millisecond they occur.
              </p>
              <div className="flex flex-col gap-2 font-mono text-xs text-slate-500">
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950">✓ Redis Event Streaming</div>
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950">✓ Python FastAPI ML Microservice</div>
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950">✓ Express.js REST Core</div>
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950">✓ React Router SPA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 text-center">
        <h2 className="text-3xl font-black text-white mb-6">Enter the Risk Operations Center</h2>
        <p className="text-slate-400 mb-10 max-w-xl mx-auto">
          Start investigating synthetic transactions instantly using our built-in simulation engine. No configuration required.
        </p>
        <Link to="/login" className="inline-flex px-8 py-4 text-sm font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]">
          Launch Risk Console
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
            <span className="font-bold text-slate-300">AI Risk Manager</span>
            <span>— Payment Security SOC</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-cyan-400 transition-colors">Product</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Security</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
