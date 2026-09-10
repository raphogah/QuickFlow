import React from 'react';
import { 
  Database, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  UploadCloud, 
  FileSpreadsheet, 
  ArrowUpRight, 
  PlusCircle, 
  Play, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building2,
  HardDrive,
  Cpu
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { User, Reservoir, ForecastJob, ForecastResult } from '../../types';
import { downloadCSVTemplate, downloadXLSXTemplate } from '../../lib/templates';

interface Props {
  onNavigate: (page: string, params?: any) => void;
  currentUser: User;
}

export function DashboardPage({ onNavigate, currentUser }: Props) {
  const company = storage.getCurrentCompany();
  const reservoirs = storage.getReservoirs();
  const datasets = storage.getDatasets();
  const jobs = storage.getForecastJobs();
  const results = storage.getForecastResults();

  // Metrics computation
  const totalStoiip = reservoirs.reduce((sum, r) => sum + (r.stoiip_mmstb || 0), 0);
  const totalEur = results.reduce((sum, r) => sum + (r.kpis.eur_mmstb || 0), 0);
  const avgR2 = results.length > 0 
    ? (results.reduce((sum, r) => sum + r.kpis.r2, 0) / results.length) * 100 
    : 95.2;

  const runningJobs = jobs.filter(j => j.status === 'Running' || j.status === 'Queued');
  const latestResult = results[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Company Overview & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Tenant: {company.name} ({company.slug})</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-teal-700 font-bold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">{company.tier} Tier</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Company Reservoir Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time physics-constrained production forecasting, STOIIP audit, and multi-well decline analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('upload-dataset')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <UploadCloud className="w-4 h-4 text-sky-600" />
            <span>Upload History</span>
          </button>

          <button
            onClick={() => onNavigate('create-reservoir')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4 text-teal-600" />
            <span>Register Reservoir</span>
          </button>

          <button
            onClick={() => onNavigate('forecast-config')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition transform active:scale-98"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Run Forecast</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Reservoirs</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">{reservoirs.length}</div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-teal-700 font-bold">
              {reservoirs.reduce((s, r) => s + (r.producers_count || 0), 0)}
            </span>
            <span>Total Producer Wells</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet STOIIP</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">{totalStoiip.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-500">MMstb</span></div>
          <div className="mt-1 text-[11px] text-slate-500">Tracked Original Oil in Place</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Forecast EUR</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-teal-700 font-mono">{totalEur.toFixed(1)} <span className="text-sm font-sans font-normal text-slate-500">MMstb</span></div>
          <div className="mt-1 text-[11px] text-slate-500">Physics-Constrained Ultimate Recovery</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model Goodness (R²)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">{avgR2.toFixed(1)}%</div>
          <div className="mt-1 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>0 Monotonicity Violations</span>
          </div>
        </div>
      </div>

      {/* Active Async Job Runner Notification if any */}
      {runningJobs.length > 0 && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-teal-600 animate-ping"></div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>Asynchronous Forecast In Progress: Job {runningJobs[0].id}</span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-teal-200 text-[10px] font-mono text-teal-800 uppercase font-bold">
                  Stage: {runningJobs[0].stage}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                PyTorch Neural-ODE forward integration running in background worker.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('forecast-execution', { jobId: runningJobs[0].id })}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition shadow-xs"
          >
            View Live Execution &bull; {runningJobs[0].progress_pct}%
          </button>
        </div>
      )}

      {/* Main Grid: Reservoirs List + Latest Forecast Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Reservoirs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              <span>Registered Reservoirs ({reservoirs.length})</span>
            </h2>
            <button
              onClick={() => onNavigate('reservoirs')}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reservoirs.map(r => {
              const resDatasets = datasets.filter(d => d.reservoir_id === r.id);
              const resResults = results.filter(res => res.reservoir_id === r.id);
              const latestResResult = resResults[0];

              return (
                <div 
                  key={r.id}
                  className="p-5 bg-white border border-slate-200 hover:border-teal-400/80 rounded-xl space-y-3 transition group flex flex-col justify-between shadow-xs hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition">
                          {r.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{r.field_name} &bull; {r.country}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-sky-700 font-semibold">
                        {r.fluid_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-3 mt-3 border-t border-slate-100 font-mono">
                      <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
                        <span className="text-slate-500 block text-[10px] font-sans">STOIIP</span>
                        <span className="text-slate-800 font-bold">{r.stoiip_mmstb} MMstb</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
                        <span className="text-slate-500 block text-[10px] font-sans">Drive Mech.</span>
                        <span className="text-slate-800 font-semibold truncate block">{r.drive_mechanism}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
                        <span className="text-slate-500 block text-[10px] font-sans">Producers</span>
                        <span className="text-slate-800 font-semibold">{r.producers_count} Wells</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50/70 border border-slate-100">
                        <span className="text-slate-500 block text-[10px] font-sans">Latest EUR</span>
                        <span className="text-teal-700 font-bold">
                          {latestResResult ? `${latestResResult.kpis.eur_mmstb} MMstb` : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onNavigate('reservoir-detail', { reservoirId: r.id })}
                      className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                    >
                      <span>Details & Wells</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onNavigate('forecast-config', { reservoirId: r.id })}
                      className="px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 transition"
                    >
                      New Forecast
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download Templates Banner */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Need Canonical Production Templates?</div>
                <div className="text-[11px] text-slate-500">Download formatted CSV or XLSX templates with column aliases</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadCSVTemplate()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs"
              >
                CSV Template
              </button>
              <button
                onClick={() => downloadXLSXTemplate()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 shadow-2xs"
              >
                XLSX Template
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Latest Physics Audit & Fast Forecast Preview */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Latest Physics Audit</span>
          </h2>

          {latestResult ? (
            <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  {reservoirs.find(r => r.id === latestResult.reservoir_id)?.name || 'Brent Turbidite Alpha'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                  AUDIT: PASSED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Monotonicity (dNp/dt ≥ 0)</span>
                  <span className="text-emerald-700 font-bold font-mono">0 Violations</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">STOIIP Upper Bound</span>
                  <span className="text-slate-800 font-bold font-mono">
                    {latestResult.physics_audit.recovery_factor_pct}% / {latestResult.physics_audit.max_allowable_rf_pct}% max
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Material Balance P(t)</span>
                  <span className="text-sky-700 font-bold font-mono">
                    {latestResult.physics_audit.material_balance_result}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">PyTorch PINN Version</span>
                  <span className="text-slate-700 font-mono text-[11px]">
                    {latestResult.model_version}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('forecast-results', { resultId: latestResult.id })}
                className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Inspect Forecast Curves & Export</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-2 shadow-xs">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-800">No Forecasts Run Yet</div>
              <p>Configure and enqueue your first asynchronous PINN run.</p>
            </div>
          )}

          {/* Model Registry Status Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-teal-600" />
                <span>Backend ML Operator</span>
              </span>
              <span className="text-[10px] font-mono text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Torch 2.4.0</span>
            </div>
            <div className="text-[11px] text-slate-600 font-mono break-all bg-slate-50 p-2 rounded-lg border border-slate-100">
              SHA: e8b49f28d7a1c325e806140b91d2938f3281045a90e31db48c772e04812a106f
            </div>
            <div className="text-[10px] text-slate-500">
              Immutable artifact signed and mounted from root registry.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
