import React, { useState } from 'react';
import { 
  TrendingUp, 
  Database, 
  FileSpreadsheet, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Play, 
  Sliders, 
  Info, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { 
  ConfidenceBandType, 
  ArpsDeclineType, 
  PhysicsConstraintMode,
  ForecastHorizonYears,
  ForecastInterval,
  User 
} from '../../types';

interface Props {
  initialReservoirId?: string;
  initialDatasetId?: string;
  onNavigate: (page: string, params?: any) => void;
  currentUser: User;
}

export function ForecastConfigPage({ initialReservoirId, initialDatasetId, onNavigate, currentUser }: Props) {
  const reservoirs = storage.getReservoirs();
  const allDatasets = storage.getDatasets();

  const [reservoirId, setReservoirId] = useState(initialReservoirId || (reservoirs[0]?.id || ''));
  const availableDatasets = allDatasets.filter(d => d.reservoir_id === reservoirId);
  const [datasetId, setDatasetId] = useState(initialDatasetId || (availableDatasets[0]?.id || ''));

  // Configuration options
  const [horizonYears, setHorizonYears] = useState<ForecastHorizonYears>(25);
  const [interval, setInterval] = useState<ForecastInterval>('monthly');
  const [confidenceBand, setConfidenceBand] = useState<ConfidenceBandType>('P10_P50_P90');
  const [arpsModel, setArpsModel] = useState<ArpsDeclineType>('hyperbolic');
  const [physicsMode, setPhysicsMode] = useState<PhysicsConstraintMode>('full');
  const [selectedWells, setSelectedWells] = useState<string[]>([]);
  const [customStoiip, setCustomStoiip] = useState<number | undefined>(undefined);

  const selectedReservoir = reservoirs.find(r => r.id === reservoirId);
  const selectedDataset = allDatasets.find(d => d.id === datasetId);

  // Initialize selected wells from dataset when dataset changes
  React.useEffect(() => {
    if (selectedDataset && selectedDataset.detected_wells.length > 0) {
      setSelectedWells(selectedDataset.detected_wells);
    }
  }, [selectedDataset]);

  const handleLaunchForecast = async () => {
    if (!reservoirId || !datasetId) {
      alert('Please select both a reservoir and an uploaded historical dataset.');
      return;
    }

    const { job } = await storage.enqueueForecastJob(
      reservoirId,
      datasetId,
      {
        horizon_years: horizonYears,
        interval,
        confidence_bands: confidenceBand,
        arps_baseline: arpsModel,
        physics_mode: physicsMode,
        selected_wells: selectedWells,
        custom_stoiip_mmstb: customStoiip,
      }
    );

    onNavigate('forecast-execution', { jobId: job.id });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <TrendingUp className="w-6 h-6 text-teal-600" />
          <span>Configure Reservoir Forecast</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Parametrize physics-informed PyTorch Neural ODEs with material balance audits, DCA baseline comparison, and uncertainty envelopes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Asset & Data Source */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              <span>1. Target Reservoir & Production History</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Target Reservoir Asset</label>
                <select
                  value={reservoirId}
                  onChange={e => {
                    setReservoirId(e.target.value);
                    const matching = allDatasets.filter(d => d.reservoir_id === e.target.value);
                    if (matching[0]) setDatasetId(matching[0].id);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                >
                  {reservoirs.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.field_name} &bull; {r.stoiip_mmstb} MMstb)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Historical Dataset</label>
                {availableDatasets.length === 0 ? (
                  <button
                    onClick={() => onNavigate('upload-dataset', { reservoirId })}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-teal-500 rounded-lg text-xs text-teal-700 font-bold transition"
                  >
                    + Upload History Dataset for Asset
                  </button>
                ) : (
                  <select
                    value={datasetId}
                    onChange={e => setDatasetId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  >
                    {availableDatasets.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.rows_count} records &bull; {d.detected_wells.length} wells)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {selectedReservoir && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex flex-wrap items-center gap-4 font-mono">
                <span>Fluid: <strong className="text-teal-700">{selectedReservoir.fluid_type}</strong></span>
                <span>Drive: <strong className="text-slate-800">{selectedReservoir.drive_mechanism}</strong></span>
                <span>STOIIP Cap: <strong className="text-slate-900">{selectedReservoir.stoiip_mmstb} MMstb</strong></span>
              </div>
            )}
          </div>

          {/* Section 2: Forecast Horizon & Time Resolution */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>2. Forecast Horizon & Resolution</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Forecast Horizon</label>
                <div className="grid grid-cols-4 gap-2">
                  {([10, 25, 50, 100] as ForecastHorizonYears[]).map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setHorizonYears(yr)}
                      className={`py-2 text-xs font-mono font-bold rounded-lg border transition ${
                        horizonYears === yr
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {yr} yrs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Time Step Interval</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'quarterly', 'yearly'] as ForecastInterval[]).map(int => (
                    <button
                      key={int}
                      type="button"
                      onClick={() => setInterval(int)}
                      className={`py-2 text-xs font-semibold capitalize rounded-lg border transition ${
                        interval === int
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {int}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Physics Invariants & DCA Comparison */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>3. Physics Constraints & Benchmarks</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Physics Invariant Enforcement Mode</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between transition ${
                    physicsMode === 'full' ? 'bg-teal-50/80 border-teal-500 text-teal-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Full Physics Gate</span>
                      <input
                        type="radio"
                        name="physicsMode"
                        checked={physicsMode === 'full'}
                        onChange={() => setPhysicsMode('full')}
                        className="accent-teal-600"
                      />
                    </div>
                    <span className="text-[10px] mt-1 text-slate-500">Enforce dNp/dt ≥ 0, STOIIP ceiling & Havlena-Odeh P(t)</span>
                  </label>

                  <label className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between transition ${
                    physicsMode === 'monotonicity_only' ? 'bg-teal-50/80 border-teal-500 text-teal-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Monotonicity Only</span>
                      <input
                        type="radio"
                        name="physicsMode"
                        checked={physicsMode === 'monotonicity_only'}
                        onChange={() => setPhysicsMode('monotonicity_only')}
                        className="accent-teal-600"
                      />
                    </div>
                    <span className="text-[10px] mt-1 text-slate-500">Guarantees non-negative cumulative production only</span>
                  </label>

                  <label className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between transition ${
                    physicsMode === 'unconstrained_experimental' ? 'bg-teal-50/80 border-teal-500 text-teal-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Unconstrained</span>
                      <input
                        type="radio"
                        name="physicsMode"
                        checked={physicsMode === 'unconstrained_experimental'}
                        onChange={() => setPhysicsMode('unconstrained_experimental')}
                        className="accent-teal-600"
                      />
                    </div>
                    <span className="text-[10px] mt-1 text-slate-500">Raw statistical model without physical barrier penalty</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Arps DCA Analytical Benchmark</label>
                  <select
                    value={arpsModel}
                    onChange={e => setArpsModel(e.target.value as ArpsDeclineType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  >
                    <option value="hyperbolic">Arps Hyperbolic Decline (0 &lt; b &lt; 1)</option>
                    <option value="exponential">Arps Exponential Decline (b = 0)</option>
                    <option value="harmonic">Arps Harmonic Decline (b = 1)</option>
                    <option value="none">No DCA Benchmark Line</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Uncertainty Confidence Envelope</label>
                  <select
                    value={confidenceBand}
                    onChange={e => setConfidenceBand(e.target.value as ConfidenceBandType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  >
                    <option value="P10_P50_P90">P10 / P50 / P90 (SPE Standard)</option>
                    <option value="P5_P50_P95">P5 / P50 / P95 (Wide Range)</option>
                    <option value="P50_only">P50 Deterministic Expected Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Summary Card & Action Trigger */}
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-600" />
              <span>Job Execution Summary</span>
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Reservoir</span>
                <span className="font-bold text-slate-900 truncate max-w-[140px]">{selectedReservoir?.name || 'None'}</span>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Horizon</span>
                <span className="text-teal-700 font-bold">{horizonYears} Years ({interval})</span>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Model Engine</span>
                <span className="text-slate-800 font-bold">PyTorch PINN v1.4</span>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Physics Gate</span>
                <span className="text-emerald-700 font-bold uppercase">{physicsMode}</span>
              </div>
            </div>

            <button
              onClick={handleLaunchForecast}
              disabled={!reservoirId || !datasetId}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition transform active:scale-98 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Enqueue Async Forecast Job</span>
            </button>

            <p className="text-[11px] text-slate-500 text-center leading-tight">
              Dispatches job to isolated background Celery worker with PyTorch GPU/CPU runtime.
            </p>
          </div>

          {/* Reproducibility Seal Note */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-600">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Cryptographic Model Pinning</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Every job run generates an immutable record pairing model weights hash, dataset SHA-256, and audit logs for regulatory compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
