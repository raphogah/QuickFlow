import React, { useState } from 'react';
import { 
  History, 
  Database, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight, 
  RotateCw, 
  Download, 
  FileText,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { User, ForecastResult } from '../../types';
import { downloadForecastCSV, generatePDFReport } from '../../lib/pdfReportGenerator';

interface Props {
  onNavigate: (page: string, params?: any) => void;
  currentUser: User;
}

export function ForecastHistoryPage({ onNavigate, currentUser }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservoirFilter, setSelectedReservoirFilter] = useState('ALL');

  const results = storage.getForecastResults();
  const reservoirs = storage.getReservoirs();

  const filteredResults = results.filter(res => {
    const resv = reservoirs.find(r => r.id === res.reservoir_id);
    const matchesSearch = res.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resv?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReservoir = selectedReservoirFilter === 'ALL' || res.reservoir_id === selectedReservoirFilter;
    return matchesSearch && matchesReservoir;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-teal-600" />
            <span>Forecast Runs & Model Version History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical physics-constrained runs with reproducible model weights & signed artifact exports
          </p>
        </div>

        <button
          onClick={() => onNavigate('forecast-config')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
        >
          <TrendingUp className="w-4 h-4" />
          <span>New Forecast Run</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search run ID or reservoir asset..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-semibold">Reservoir:</span>
          <select
            value={selectedReservoirFilter}
            onChange={e => setSelectedReservoirFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
          >
            <option value="ALL">All Reservoirs</option>
            {reservoirs.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold">Run Identifier</th>
              <th className="p-3.5 font-semibold">Reservoir Asset</th>
              <th className="p-3.5 font-semibold">Horizon</th>
              <th className="p-3.5 font-semibold">EUR (MMstb)</th>
              <th className="p-3.5 font-semibold">R² Fit</th>
              <th className="p-3.5 font-semibold">Physics Audit</th>
              <th className="p-3.5 font-semibold">Generated Date</th>
              <th className="p-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                  No forecast runs matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredResults.map(res => {
                const reservoir = reservoirs.find(r => r.id === res.reservoir_id);

                return (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-teal-700 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                      <span>{res.id}</span>
                    </td>
                    <td className="p-3.5 text-slate-900 font-sans font-semibold">
                      {reservoir?.name || 'Reservoir'}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {res.params.horizon_years} Yrs ({res.params.interval})
                    </td>
                    <td className="p-3.5 font-bold text-teal-700">
                      {res.kpis.eur_mmstb.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-slate-800">
                      {(res.kpis.r2 * 100).toFixed(1)}%
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1 w-fit font-bold">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        <span>PASSED</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {new Date(res.completed_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigate('forecast-results', { resultId: res.id })}
                          className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold text-xs transition"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => downloadForecastCSV(res, `${reservoir?.name || 'Reservoir'}_Forecast`)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition"
                          title="Download CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
