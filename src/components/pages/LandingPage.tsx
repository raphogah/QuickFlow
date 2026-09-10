import React from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Database, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  FileSpreadsheet, 
  Zap, 
  Terminal,
  Compass,
  Play
} from 'lucide-react';

interface Props {
  onStartDemo: () => void;
  onNavigate: (page: string) => void;
}

export function LandingPage({ onStartDemo, onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Banner Navigation */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center shadow-xs">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">QuickFlow<span className="text-teal-600">AI</span></span>
            <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-mono font-semibold">
              V1 SaaS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('login')}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="px-4 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-lg shadow-2xs transition"
          >
            Register Company
          </button>
          <button
            onClick={onStartDemo}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs transition transform active:scale-98"
          >
            <span>Launch Live App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs text-teal-800 mb-6 font-mono font-semibold">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Physics-Constrained PyTorch Neural Operator &bull; Multi-Tenant Isolated</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          Next-Generation Reservoir <span className="text-teal-600">Production Forecasting</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Ingest multi-well production history, normalize flexible schemas, execute versioned physics-informed Neural ODEs, and verify STOIIP upper bounds with zero data leaks.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartDemo}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition transform active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Enter Enterprise Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('onboarding')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm shadow-xs transition"
          >
            <Compass className="w-4 h-4 text-teal-600" />
            <span>Interactive Onboarding</span>
          </button>
        </div>

        {/* Live Feature Preview Banner */}
        <div className="mt-14 p-4 rounded-2xl bg-white border border-slate-200 shadow-md text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs font-mono text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-teal-600"></span>
              <span className="ml-2 text-slate-800 font-semibold">QuickFlow AI V1 Production Workflow</span>
            </div>
            <span className="text-teal-700 font-semibold">Async Job Runner: 7-Stage Pipeline</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 text-xs font-mono">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-slate-500 mb-1 font-semibold">01. INGEST & ALIAS</div>
              <div className="font-bold text-slate-900">CSV & XLSX (50MB)</div>
              <div className="text-[11px] text-teal-700 font-semibold mt-1">Automatic Alias Mapping</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-slate-500 mb-1 font-semibold">02. AUDIT INTEGRITY</div>
              <div className="font-bold text-slate-900">Physical Range & Gaps</div>
              <div className="text-[11px] text-teal-700 font-semibold mt-1">Porosity 0-1 & Monotonicity</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-slate-500 mb-1 font-semibold">03. PYTORCH PINN</div>
              <div className="font-bold text-slate-900">Neural ODE + Arps</div>
              <div className="text-[11px] text-teal-700 font-semibold mt-1">P10 / P50 / P90 Bands</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-slate-500 mb-1 font-semibold">04. PHYSICS GATE</div>
              <div className="font-bold text-slate-900">STOIIP & Material Bal.</div>
              <div className="text-[11px] text-teal-700 font-semibold mt-1">Signed PDF & CSV Export</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Built for High-Stakes Reservoir Engineering</h2>
          <p className="text-sm text-slate-600 mt-2">Every forecast is constrained by reservoir physics and auditable by design.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Physics-Constrained Neural ODEs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eliminate unphysical forecasts. PyTorch models enforce monotonic cumulative production ($dN_p/dt \ge 0$) and bound EUR by theoretical recovery factors.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Zero-Leak Multi-Tenancy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every database entity is partition-scoped with cryptographic SHA-256 event chains. Never cross tenant boundaries in queries, datasets, or object storage.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated Dataset Diagnostics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Normalize aliases (BOPD, qo, API, UWI) with row-level error reporting, gap detection, porosity verification, and instant CSV/XLSX template downloads.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">QuickFlow AI V1</span>
            <span>&bull; Enterprise Reservoir Intelligence</span>
          </div>
          <div>Strict Multi-Tenant SaaS Architecture &bull; PyTorch PINN Physics Engine</div>
        </div>
      </footer>
    </div>
  );
}
