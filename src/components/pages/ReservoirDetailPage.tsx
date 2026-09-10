import React, { useState } from 'react';
import { 
  Database, 
  ArrowLeft, 
  MapPin, 
  PlusCircle, 
  UploadCloud, 
  TrendingUp, 
  FileSpreadsheet, 
  ShieldCheck, 
  Layers, 
  Activity, 
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { Reservoir, Well, Dataset, ForecastResult, User } from '../../types';

interface Props {
  reservoirId: string;
  onNavigate: (page: string, params?: any) => void;
  currentUser: User;
}

export function ReservoirDetailPage({ reservoirId, onNavigate, currentUser }: Props) {
  const reservoir = storage.getReservoirById(reservoirId);
  const wells = storage.getWells(reservoirId);
  const datasets = storage.getDatasets(reservoirId);
  const results = storage.getForecastResults(reservoirId);

  const [activeTab, setActiveTab] = useState<'wells' | 'datasets' | 'forecasts'>('wells');
  const [showAddWellModal, setShowAddWellModal] = useState(false);

  if (!reservoir) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Reservoir Not Found or Access Denied</h2>
        <p className="text-xs text-slate-500">Strict tenant scoping prevents unauthorized access.</p>
        <button
          onClick={() => onNavigate('reservoirs')}
          className="px-4 py-2 bg-white text-teal-700 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50"
        >
          Back to Reservoirs
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('reservoirs')}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{reservoir.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-bold">
                {reservoir.fluid_type}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>{reservoir.field_name}, {reservoir.country} ({reservoir.location})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('upload-dataset', { reservoirId: reservoir.id })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Upload Production Data</span>
          </button>

          <button
            onClick={() => onNavigate('forecast-config', { reservoirId: reservoir.id })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Run PINN Forecast</span>
          </button>
        </div>
      </div>

      {/* Reservoir Properties Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-500 font-sans block">STOIIP Upper Bound</span>
          <span className="text-base font-extrabold text-slate-900">{reservoir.stoiip_mmstb} MMstb</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-500 font-sans block">Drive Mechanism</span>
          <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">{reservoir.drive_mechanism}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-500 font-sans block">Initial Pressure</span>
          <span className="text-base font-extrabold text-blue-600">{reservoir.initial_pressure} psia</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-500 font-sans block">Production Start</span>
          <span className="text-xs font-bold text-slate-800 block mt-0.5">{reservoir.production_start_date}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-500 font-sans block">Active Producers</span>
          <span className="text-base font-extrabold text-teal-600">{wells.length || reservoir.producers_count} Wells</span>
        </div>
      </div>

      {/* Engineering Notes Banner */}
      {reservoir.notes && (
        <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl text-xs text-slate-700 flex items-start gap-3">
          <Activity className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">Asset Notes: </span>
            <span>{reservoir.notes}</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveTab('wells')}
          className={`pb-3 transition flex items-center gap-1.5 relative ${
            activeTab === 'wells' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Wells Cluster ({wells.length})</span>
          {activeTab === 'wells' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>}
        </button>

        <button
          onClick={() => setActiveTab('datasets')}
          className={`pb-3 transition flex items-center gap-1.5 relative ${
            activeTab === 'datasets' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Uploaded Datasets ({datasets.length})</span>
          {activeTab === 'datasets' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>}
        </button>

        <button
          onClick={() => setActiveTab('forecasts')}
          className={`pb-3 transition flex items-center gap-1.5 relative ${
            activeTab === 'forecasts' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Forecast History ({results.length})</span>
          {activeTab === 'forecasts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>}
        </button>
      </div>

      {/* TAB 1: WELLS */}
      {activeTab === 'wells' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Wellbore completions, petrophysical matrix, and coordinates</span>
            {currentUser.role !== 'Viewer' && (
              <button
                onClick={() => setShowAddWellModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-teal-700 text-xs font-semibold shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register Well</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                <tr>
                  <th className="p-3.5 font-semibold">Well Identifier</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold">Net Pay (ft)</th>
                  <th className="p-3.5 font-semibold">Porosity (φ)</th>
                  <th className="p-3.5 font-semibold">Permeability (mD)</th>
                  <th className="p-3.5 font-semibold">UTM Coordinates (X, Y)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {wells.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 font-sans">
                      No wells registered yet. Upload a production history dataset to automatically register detected wellbores.
                    </td>
                  </tr>
                ) : (
                  wells.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-teal-700">{w.well_id}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans font-bold">
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-800">{w.net_pay} ft</td>
                      <td className="p-3.5 text-slate-800">{(w.porosity * 100).toFixed(1)}%</td>
                      <td className="p-3.5 text-slate-800">{w.permeability} mD</td>
                      <td className="p-3.5 text-slate-500">
                        {w.x ? `${w.x}, ${w.y}` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DATASETS */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Validated production history datasets stored in tenant S3 partition</span>
            <button
              onClick={() => onNavigate('upload-dataset', { reservoirId: reservoir.id })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload CSV / XLSX</span>
            </button>
          </div>

          <div className="grid gap-4">
            {datasets.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500 shadow-xs">
                No datasets uploaded for this reservoir yet.
              </div>
            ) : (
              datasets.map(ds => (
                <div 
                  key={ds.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{ds.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 border border-slate-200 font-bold">
                        v{ds.version}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        VALIDATED
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                      <span>{ds.rows_count} records</span> &bull;
                      <span>{ds.detected_wells.length} wells detected</span> &bull;
                      <span>{ds.date_range.start} to {ds.date_range.end}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-md">
                      S3: {ds.storage_path}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('validation-report', { datasetId: ds.id })}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
                    >
                      Audit Report
                    </button>
                    <button
                      onClick={() => onNavigate('forecast-config', { reservoirId: reservoir.id, datasetId: ds.id })}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                    >
                      Forecast with this Dataset
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FORECASTS */}
      {activeTab === 'forecasts' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {results.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500 shadow-xs">
                No forecast runs generated yet for this reservoir.
              </div>
            ) : (
              results.map(res => (
                <div
                  key={res.id}
                  className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 text-sm">
                        {res.params.horizon_years}-Year PINN Decline Forecast
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                        PHYSICS AUDIT: PASSED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 font-sans block">EUR</span>
                        <span className="text-teal-700 font-bold">{res.kpis.eur_mmstb} MMstb</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-sans block">Terminal Rate</span>
                        <span className="text-slate-800">{res.kpis.terminal_rate_bopd} BOPD</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-sans block">R² Goodness</span>
                        <span className="text-slate-800">{(res.kpis.r2 * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-sans block">Model</span>
                        <span className="text-slate-500">{res.model_version}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('forecast-results', { resultId: res.id })}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 self-start md:self-center shadow-xs"
                  >
                    <span>View Curves & Results</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Well Modal */}
      {showAddWellModal && (
        <AddWellModal
          reservoirId={reservoir.id}
          onClose={() => setShowAddWellModal(false)}
          onSaved={() => setShowAddWellModal(false)}
        />
      )}
    </div>
  );
}

function AddWellModal({ reservoirId, onClose, onSaved }: { reservoirId: string; onClose: () => void; onSaved: () => void }) {
  const [wellId, setWellId] = useState('');
  const [name, setName] = useState('');
  const [netPay, setNetPay] = useState(60);
  const [porosity, setPorosity] = useState(0.22);
  const [permeability, setPermeability] = useState(150);
  const [x, setX] = useState(582000);
  const [y, setY] = useState(6421000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storage.createWell({
      reservoir_id: reservoirId,
      well_id: wellId || `WELL-${Date.now().toString().slice(-3)}`,
      name: name || wellId,
      net_pay: netPay,
      porosity,
      permeability,
      x,
      y,
      status: 'Active',
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Register Producer Wellbore</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Well Identifier (API / UWI)</label>
            <input
              type="text"
              required
              value={wellId}
              onChange={e => setWellId(e.target.value)}
              placeholder="e.g. PROD-A05"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 font-sans">Net Pay (ft)</label>
              <input
                type="number"
                value={netPay}
                onChange={e => setNetPay(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1 font-sans">Porosity (0-1)</label>
              <input
                type="number"
                step="0.01"
                value={porosity}
                onChange={e => setPorosity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1 font-sans">Perm (mD)</label>
              <input
                type="number"
                value={permeability}
                onChange={e => setPermeability(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs"
            >
              Save Well
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
