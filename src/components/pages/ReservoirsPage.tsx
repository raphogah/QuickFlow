import React, { useState } from 'react';
import { 
  Database, 
  PlusCircle, 
  Search, 
  Filter, 
  MapPin, 
  Activity, 
  Layers, 
  TrendingUp, 
  ArrowUpRight, 
  Edit3, 
  Building2,
  CheckCircle2,
  X
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { Reservoir, FluidType, DriveMechanism, User } from '../../types';

interface Props {
  onNavigate: (page: string, params?: any) => void;
  currentUser: User;
}

export function ReservoirsPage({ onNavigate, currentUser }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fluidFilter, setFluidFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReservoir, setEditingReservoir] = useState<Reservoir | null>(null);

  const reservoirs = storage.getReservoirs();
  const datasets = storage.getDatasets();
  const results = storage.getForecastResults();

  const filteredReservoirs = reservoirs.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFluid = fluidFilter === 'ALL' || r.fluid_type === fluidFilter;
    return matchesSearch && matchesFluid;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-teal-600" />
            <span>Reservoir Assets</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered geological assets, rock/fluid properties, and active well configurations
          </p>
        </div>

        {currentUser.role !== 'Viewer' && (
          <button
            onClick={() => {
              setEditingReservoir(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Reservoir</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by reservoir name, basin, or country..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Fluid:</span>
          <select
            value={fluidFilter}
            onChange={e => setFluidFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Fluid Types</option>
            <option value="Black Oil">Black Oil</option>
            <option value="Volatile Oil">Volatile Oil</option>
            <option value="Gas Condensate">Gas Condensate</option>
            <option value="Dry Gas">Dry Gas</option>
            <option value="Heavy Oil">Heavy Oil</option>
          </select>
        </div>
      </div>

      {/* Reservoir Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReservoirs.map(reservoir => {
          const resDatasets = datasets.filter(d => d.reservoir_id === reservoir.id);
          const resResults = results.filter(r => r.reservoir_id === reservoir.id);
          const latestResult = resResults[0];

          return (
            <div
              key={reservoir.id}
              className="bg-white border border-slate-200 hover:border-teal-400/80 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-sm transition group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition">
                      {reservoir.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      <span>{reservoir.field_name}, {reservoir.country}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700">
                    {reservoir.fluid_type}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                  {reservoir.notes || 'No description notes provided.'}
                </p>

                {/* Reservoir Metrics Matrix */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-sans block">STOIIP Ceiling</span>
                    <span className="text-slate-900 font-bold">{reservoir.stoiip_mmstb} MMstb</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-sans block">Drive Mech.</span>
                    <span className="text-slate-900 font-semibold truncate block">{reservoir.drive_mechanism}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-sans block">Initial Pressure</span>
                    <span className="text-slate-900">{reservoir.initial_pressure} psia</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-sans block">Producers</span>
                    <span className="text-slate-900">{reservoir.producers_count} Wells</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('reservoir-detail', { reservoirId: reservoir.id })}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center gap-1 transition shadow-2xs"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  {currentUser.role !== 'Viewer' && (
                    <button
                      onClick={() => {
                        setEditingReservoir(reservoir);
                        setShowCreateModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 shadow-2xs"
                      title="Edit Reservoir Metadata"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onNavigate('forecast-config', { reservoirId: reservoir.id })}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs transition"
                >
                  New Forecast
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Reservoir Modal */}
      {showCreateModal && (
        <ReservoirModal
          editingReservoir={editingReservoir}
          onClose={() => {
            setShowCreateModal(false);
            setEditingReservoir(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditingReservoir(null);
          }}
        />
      )}
    </div>
  );
}

interface ModalProps {
  editingReservoir: Reservoir | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ReservoirModal({ editingReservoir, onClose, onSaved }: ModalProps) {
  const [name, setName] = useState(editingReservoir?.name || '');
  const [fieldName, setFieldName] = useState(editingReservoir?.field_name || '');
  const [country, setCountry] = useState(editingReservoir?.country || 'United Kingdom');
  const [location, setLocation] = useState(editingReservoir?.location || 'North Sea (58.5° N, 1.9° E)');
  const [fluidType, setFluidType] = useState<FluidType>(editingReservoir?.fluid_type || 'Black Oil');
  const [driveMechanism, setDriveMechanism] = useState<DriveMechanism>(editingReservoir?.drive_mechanism || 'Water Drive');
  const [prodStartDate, setProdStartDate] = useState(editingReservoir?.production_start_date || '2022-01-01');
  const [initialPressure, setInitialPressure] = useState(editingReservoir?.initial_pressure || 4200);
  const [stoiip, setStoiip] = useState(editingReservoir?.stoiip_mmstb || 450);
  const [producersCount, setProducersCount] = useState(editingReservoir?.producers_count || 4);
  const [notes, setNotes] = useState(editingReservoir?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReservoir) {
      storage.updateReservoir(editingReservoir.id, {
        name,
        field_name: fieldName,
        country,
        location,
        fluid_type: fluidType,
        drive_mechanism: driveMechanism,
        production_start_date: prodStartDate,
        initial_pressure: initialPressure,
        stoiip_mmstb: stoiip,
        producers_count: producersCount,
        notes,
      });
    } else {
      storage.createReservoir({
        name,
        field_name: fieldName,
        country,
        location,
        fluid_type: fluidType,
        drive_mechanism: driveMechanism,
        production_start_date: prodStartDate,
        initial_pressure: initialPressure,
        stoiip_mmstb: stoiip,
        producers_count: producersCount,
        notes,
      });
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            <span>{editingReservoir ? 'Edit Reservoir Metadata' : 'Register New Reservoir Asset'}</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reservoir Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Brent Turbidite Alpha"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Field / Block Name</label>
              <input
                type="text"
                required
                value={fieldName}
                onChange={e => setFieldName(e.target.value)}
                placeholder="e.g. Block 211/29 Complex"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Country / Jurisdiction</label>
              <input
                type="text"
                required
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="United Kingdom, USA, Norway..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Basin / Geographic Coordinates</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. North Sea (58.2° N, 1.8° E)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fluid Type Classification</label>
              <select
                value={fluidType}
                onChange={e => setFluidType(e.target.value as FluidType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              >
                <option value="Black Oil">Black Oil</option>
                <option value="Volatile Oil">Volatile Oil</option>
                <option value="Gas Condensate">Gas Condensate</option>
                <option value="Dry Gas">Dry Gas</option>
                <option value="Heavy Oil">Heavy Oil</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Dominant Drive Mechanism</label>
              <select
                value={driveMechanism}
                onChange={e => setDriveMechanism(e.target.value as DriveMechanism)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              >
                <option value="Water Drive">Water Drive (Strong Edge Aquifer)</option>
                <option value="Solution Gas Drive">Solution Gas Drive (Depletion)</option>
                <option value="Gas Cap Expansion">Gas Cap Expansion</option>
                <option value="Combination Drive">Combination Drive</option>
                <option value="Gravity Drainage">Gravity Drainage</option>
                <option value="Compaction Drive">Compaction Drive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 font-sans">Initial Pressure (psia)</label>
              <input
                type="number"
                required
                value={initialPressure}
                onChange={e => setInitialPressure(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1 font-sans">STOIIP (MMstb)</label>
              <input
                type="number"
                required
                value={stoiip}
                onChange={e => setStoiip(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1 font-sans">Producer Count</label>
              <input
                type="number"
                required
                value={producersCount}
                onChange={e => setProducersCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Geological & Engineering Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Facies, fault compartmentalization, aquifer strength notes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs"
            >
              {editingReservoir ? 'Save Changes' : 'Register Reservoir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
