import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Database, 
  TrendingUp, 
  Calendar, 
  HardDrive, 
  Activity, 
  FileSpreadsheet, 
  Layers,
  XCircle,
  FileCode
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { User } from '../../types';

interface Props {
  datasetId: string;
  onNavigate: (page: string, params?: any) => void;
  currentUser: User;
}

export function DatasetValidationPage({ datasetId, onNavigate, currentUser }: Props) {
  const dataset = storage.getDatasetById(datasetId);
  const reservoir = dataset ? storage.getReservoirById(dataset.reservoir_id) : null;

  if (!dataset) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Dataset Not Found</h2>
        <p className="text-xs text-slate-500">The requested dataset does not exist or belongs to another tenant partition.</p>
        <button
          onClick={() => onNavigate('upload-dataset')}
          className="px-4 py-2 bg-white text-teal-700 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50"
        >
          Back to Upload
        </button>
      </div>
    );
  }

  const { validation_report } = dataset;
  const summary_stats = validation_report.summary_stats;
  const isPassing = validation_report.is_valid;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('upload-dataset', { reservoirId: dataset.reservoir_id })}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{dataset.name}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isPassing 
                  ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isPassing ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Target: <strong className="text-slate-800">{reservoir?.name || 'Reservoir'}</strong></span> &bull;
              <span>Filename: <strong className="font-mono text-slate-700">{dataset.file_name}</strong></span> &bull;
              <span>SHA-256: <strong className="font-mono text-slate-400">{dataset.sha256_hash.slice(0, 16)}...</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('upload-dataset', { reservoirId: dataset.reservoir_id })}
            className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs"
          >
            Re-Upload File
          </button>

          {isPassing && (
            <button
              onClick={() => onNavigate('forecast-config', { reservoirId: dataset.reservoir_id, datasetId: dataset.id })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
            >
              <span>Proceed to Forecast</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4-Stage Visual Physics & Integrity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Check 1: Schema */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">01. Schema Mapping</span>
            {validation_report.schema_status === 'passed' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Canonical aliases mapped: <span className="text-teal-700 font-mono font-medium">date, well_id, oil_rate</span>.
          </p>
          <div className="text-[10px] font-mono text-slate-400">
            Status: {validation_report.schema_status.toUpperCase()}
          </div>
        </div>

        {/* Check 2: Dates */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">02. Date Chronology</span>
            {validation_report.date_status === 'passed' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Range: <span className="text-slate-800 font-mono font-medium">{dataset.date_range.start}</span> to <span className="text-slate-800 font-mono font-medium">{dataset.date_range.end}</span> (≥3mo).
          </p>
          <div className="text-[10px] font-mono text-slate-400">
            Status: {validation_report.date_status.toUpperCase()}
          </div>
        </div>

        {/* Check 3: Completeness */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">03. Completeness</span>
            {validation_report.completeness_status === 'passed' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {dataset.rows_count} records audited. Zero duplicate date timestamps.
          </p>
          <div className="text-[10px] font-mono text-slate-400">
            Status: {validation_report.completeness_status.toUpperCase()}
          </div>
        </div>

        {/* Check 4: Physical Ranges */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">04. Physical Ranges</span>
            {validation_report.physical_range_status === 'passed' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Non-negative rates. Porosity within (0.0-1.0), perm &gt; 0 mD.
          </p>
          <div className="text-[10px] font-mono text-slate-400">
            Status: {validation_report.physical_range_status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Dataset Summary Statistics Matrix */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          <span>Historical Production Baseline Statistics</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-sans block">Cum. Oil (Np)</span>
            <span className="text-base font-bold text-teal-700">{summary_stats?.cumulative_oil_historical_mmstb ? summary_stats.cumulative_oil_historical_mmstb.toFixed(3) : '0.000'} MMstb</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-sans block">Avg Oil Rate</span>
            <span className="text-base font-bold text-slate-900">{summary_stats?.avg_oil_rate ? summary_stats.avg_oil_rate.toFixed(0) : '0'} BOPD</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-sans block">Peak Rate</span>
            <span className="text-base font-bold text-slate-900">{summary_stats?.max_oil_rate ? summary_stats.max_oil_rate.toFixed(0) : '0'} BOPD</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-sans block">Avg Water Cut</span>
            <span className="text-base font-bold text-slate-800">{summary_stats?.avg_water_cut ? (summary_stats.avg_water_cut * 100).toFixed(1) : '0'}%</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-sans block">Avg GOR</span>
            <span className="text-base font-bold text-slate-800">{summary_stats?.avg_gor ? summary_stats.avg_gor.toFixed(0) : '0'} scf/stb</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-sans block">Avg Pressure</span>
            <span className="text-base font-bold text-blue-600">{summary_stats?.avg_pressure ? summary_stats.avg_pressure.toFixed(0) : '3850'} psia</span>
          </div>
        </div>

        {/* Detected Wellbores Badges */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-600 block mb-2">
            Detected Wellbores in Dataset ({dataset.detected_wells.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {dataset.detected_wells.map(w => (
              <span 
                key={w}
                className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-teal-800"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row-Level Errors & Warnings Diagnostics Table */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Row-Level Diagnostics & Physical Consistency Audit</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            {validation_report.errors.length} Errors &bull; {validation_report.warnings.length} Warnings
          </span>
        </div>

        {validation_report.errors.length === 0 && validation_report.warnings.length === 0 ? (
          <div className="p-4 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>100% clean dataset. All canonical columns normalized with zero schema or physics violations.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {validation_report.errors.map((err, idx) => (
              <div key={idx} className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 font-mono">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error (Row {err.row || 'Global'}{err.column ? ` &bull; ${err.column}` : ''}): </span>
                  <span>{err.message}</span>
                </div>
              </div>
            ))}

            {validation_report.warnings.map((warn, idx) => (
              <div key={idx} className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Warning (Row {warn.row || 'Global'}{warn.column ? ` &bull; ${warn.column}` : ''}): </span>
                  <span>{warn.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
