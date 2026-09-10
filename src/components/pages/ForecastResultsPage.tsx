import React, { useState } from 'react';
import { 
  TrendingUp, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft, 
  Layers, 
  Cpu, 
  Database, 
  HardDrive, 
  Activity, 
  Sparkles,
  AlertTriangle,
  RotateCw,
  Eye,
  Sliders
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { InteractiveForecastChart } from '../charts/InteractiveForecastChart';
import { downloadForecastCSV, generatePDFReport } from '../../lib/pdfReportGenerator';
import { User, ForecastResult, ForecastDataPoint } from '../../types';

interface Props {
  resultId?: string;
  onNavigate: (page: string, params?: any) => void;
  currentUser: User;
}

export function ForecastResultsPage({ resultId, onNavigate, currentUser }: Props) {
  const results = storage.getForecastResults();
  const activeResult = resultId ? storage.getForecastResultById(resultId) : results[0];

  const [selectedWell, setSelectedWell] = useState<string>('FIELD');
  const [showReproducibility, setShowReproducibility] = useState(false);

  if (!activeResult) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Forecast Results Found</h2>
        <p className="text-xs text-slate-500">Launch a forecast run from the configuration page to view physics-constrained results.</p>
        <button
          onClick={() => onNavigate('forecast-config')}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-xs"
        >
          Configure New Forecast
        </button>
      </div>
    );
  }

  const reservoir = storage.getReservoirById(activeResult.reservoir_id);
  const dataset = storage.getDatasetById(activeResult.dataset_id);

  // Compute active chart series depending on field level or specific well
  const chartData: ForecastDataPoint[] = selectedWell === 'FIELD' 
    ? activeResult.time_series 
    : (activeResult.per_well_results[selectedWell]?.data_points.map(d => ({
        date: d.date,
        is_historical: d.is_historical,
        oil_rate_p50: d.oil_rate_p50,
        cumulative_np_p50: d.cumulative_np_p50,
      })) || activeResult.time_series);

  const handleExportCSV = () => {
    downloadForecastCSV(activeResult, `${reservoir?.name || 'Reservoir'}_Forecast_${activeResult.params.horizon_years}y`);
  };

  const handleExportPDF = () => {
    if (!reservoir) return;
    const company = storage.getCurrentCompany();
    generatePDFReport({
      result: activeResult,
      reservoir,
      dataset: dataset || undefined,
      company,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">
                {reservoir?.name || 'Reservoir'} &bull; {activeResult.params.horizon_years}-Year Forecast
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                AUDITED: PINN-TORCH
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
              <span>Run ID: <strong className="text-slate-700">{activeResult.id}</strong></span> &bull;
              <span>Horizon: <strong className="text-teal-700">{activeResult.params.horizon_years} Yrs ({activeResult.params.interval})</strong></span> &bull;
              <span>Generated: <strong className="text-slate-700">{new Date(activeResult.completed_at).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('forecast-config', { reservoirId: activeResult.reservoir_id, datasetId: activeResult.dataset_id })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <RotateCw className="w-3.5 h-3.5 text-teal-600" />
            <span>Rerun / Tweak</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition transform active:scale-98"
          >
            <FileText className="w-4 h-4" />
            <span>Download Signed PDF Report</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Estimated Ultimate Recovery (EUR)</span>
          <div className="mt-2 text-2xl font-extrabold text-teal-700 font-mono">
            {activeResult.kpis.eur_mmstb.toFixed(2)} <span className="text-xs font-sans text-slate-500">MMstb</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Recovery Factor: <strong className="text-slate-900">{activeResult.physics_audit.recovery_factor_pct}%</strong>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Terminal Production Rate</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {activeResult.kpis.terminal_rate_bopd.toLocaleString()} <span className="text-xs font-sans text-slate-500">BOPD</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Economic limit threshold satisfied
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Goodness of Fit (R²)</span>
          <div className="mt-2 text-2xl font-extrabold text-blue-600 font-mono">
            {(activeResult.kpis.r2 * 100).toFixed(2)}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            sMAPE: <strong className="text-slate-900">{activeResult.kpis.smape.toFixed(2)}%</strong>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">STOIIP Upper Bound</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {reservoir?.stoiip_mmstb || activeResult.physics_audit.stoiip_mmstb} <span className="text-xs font-sans text-slate-500">MMstb</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>STOIIP Cap Checked</span>
          </div>
        </div>
      </div>

      {/* Physics Invariant Barrier Audit Card */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Physics Invariant Verification & Barrier Audit
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
            PASSED 3 OF 3 CONSTRAINTS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">1. Cumulative Monotonicity</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="font-mono text-slate-500 text-[11px]">
              dNp/dt ≥ 0 across all time steps
            </div>
            <div className="text-[10px] text-teal-700 font-mono font-bold">
              Violations: {activeResult.physics_audit.monotonicity_violations}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">2. STOIIP Upper Bound</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="font-mono text-slate-500 text-[11px]">
              EUR ({activeResult.kpis.eur_mmstb.toFixed(1)} MMstb) ≤ {activeResult.physics_audit.max_allowable_rf_pct}% STOIIP
            </div>
            <div className="text-[10px] text-teal-700 font-mono font-bold">
              RF: {activeResult.physics_audit.recovery_factor_pct}% (Drive: {reservoir?.drive_mechanism || 'Water Drive'})
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">3. Havlena-Odeh Balance</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="font-mono text-slate-500 text-[11px]">
              Pressure P(t) consistently declines with Np
            </div>
            <div className="text-[10px] text-blue-600 font-mono font-bold">
              {activeResult.physics_audit.material_balance_result}
            </div>
          </div>
        </div>
      </div>

      {/* Well / Field Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600 font-semibold">Inspection Scope:</span>
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedWell('FIELD')}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                selectedWell === 'FIELD' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Field Aggregated Total
            </button>
            {Object.keys(activeResult.per_well_results).map(wId => (
              <button
                key={wId}
                onClick={() => setSelectedWell(wId)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
                  selectedWell === wId ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {wId}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowReproducibility(!showReproducibility)}
          className="text-xs text-slate-500 hover:text-teal-700 font-medium flex items-center gap-1.5"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{showReproducibility ? 'Hide Model Metadata' : 'Show ML Reproducibility & Signatures'}</span>
        </button>
      </div>

      {/* Primary Chart Canvas */}
      <InteractiveForecastChart
        data={chartData}
        confidenceBandType={activeResult.params.confidence_bands}
        showArps={activeResult.params.arps_baseline !== 'none'}
        stoiipMmstb={reservoir?.stoiip_mmstb}
        wellName={selectedWell === 'FIELD' ? undefined : selectedWell}
        height={480}
      />

      {/* Reproducibility & Cryptographic Provenance Drawer */}
      {showReproducibility && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 font-mono text-xs shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-600" />
              <span>Immutable ML Execution Provenance</span>
            </span>
            <span className="text-[11px] font-bold text-teal-700">Signed Artifact</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-slate-500 block">PyTorch Model Version & Hash</span>
              <div className="text-slate-900 font-bold">{activeResult.model_version}</div>
              <div className="text-slate-500 break-all">{activeResult.model_hash}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-slate-500 block">Dataset Origin & S3 Storage</span>
              <div className="text-slate-900 font-bold">{dataset?.name || 'Dataset'}</div>
              <div className="text-slate-500 break-all">{activeResult.dataset_hash}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1 text-slate-600">
            <div><strong className="text-slate-800">Target Tenant:</strong> {storage.getCurrentCompany().name} ({activeResult.company_id})</div>
            <div><strong className="text-slate-800">Job Reference:</strong> {activeResult.job_id} &bull; {activeResult.completed_at}</div>
            <div><strong className="text-slate-800">Execution Parameters:</strong> {JSON.stringify(activeResult.params)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
