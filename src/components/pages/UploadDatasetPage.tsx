import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  Download, 
  Database, 
  HardDrive, 
  RefreshCw, 
  FileCode, 
  Layers, 
  Info 
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { parseDatasetFile } from '../../lib/datasetParser';
import { downloadCSVTemplate, downloadXLSXTemplate, generateSampleDataset, generateCSVTemplateContent } from '../../lib/templates';
import { Reservoir, User } from '../../types';

interface Props {
  initialReservoirId?: string;
  onNavigate: (page: string, params?: any) => void;
  currentUser: User;
}

export function UploadDatasetPage({ initialReservoirId, onNavigate, currentUser }: Props) {
  const reservoirs = storage.getReservoirs();
  const [selectedReservoirId, setSelectedReservoirId] = useState(initialReservoirId || (reservoirs[0]?.id || ''));
  const [datasetName, setDatasetName] = useState('Monthly Field Production History 2022-2025');
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedReservoir = reservoirs.find(r => r.id === selectedReservoirId);

  const handleProcessFile = async (file: File) => {
    if (!selectedReservoirId) {
      setError('Please select or register a target reservoir first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const parsed = await parseDatasetFile(file);

      // Save dataset in tenant scoped storage
      const savedDataset = storage.createDataset({
        reservoir_id: selectedReservoirId,
        name: datasetName || file.name,
        version: 1,
        file_name: file.name,
        file_size_bytes: file.size,
        sha256_hash: parsed.rawContentHash,
        storage_path: `s3://quickflow-storage/tenants/${currentUser.company_id}/datasets/${Date.now()}_${file.name}`,
        rows_count: parsed.rows.length,
        detected_wells: parsed.report.detected_wells,
        date_range: {
          start: parsed.report.date_range.start,
          end: parsed.report.date_range.end,
        },
        validation_report: parsed.report,
        status: parsed.report.is_valid ? 'valid' : 'warning',
        rows_sample: parsed.rows,
      });

      // Navigate to validation report page
      onNavigate('validation-report', { datasetId: savedDataset.id });
    } catch (err: any) {
      setError(err?.message || 'Failed to parse dataset. Please check file format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadPreset = async (presetType: 'brent' | 'wolfcamp' | 'deepwater') => {
    if (!selectedReservoirId) {
      setError('Please select a target reservoir.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const csvContent = generateCSVTemplateContent();
      const filename = `${presetType}_production_sample.csv`;
      const file = new File([csvContent], filename, { type: 'text/csv' });

      const parsed = await parseDatasetFile(file);

      const savedDataset = storage.createDataset({
        reservoir_id: selectedReservoirId,
        name: `${presetType.toUpperCase()} Production History Baseline`,
        version: 1,
        file_name: filename,
        file_size_bytes: file.size,
        sha256_hash: parsed.rawContentHash,
        storage_path: `s3://quickflow-storage/tenants/${currentUser.company_id}/datasets/${Date.now()}_${filename}`,
        rows_count: parsed.rows.length,
        detected_wells: parsed.report.detected_wells,
        date_range: {
          start: parsed.report.date_range.start,
          end: parsed.report.date_range.end,
        },
        validation_report: parsed.report,
        status: parsed.report.is_valid ? 'valid' : 'warning',
        rows_sample: parsed.rows,
      });

      onNavigate('validation-report', { datasetId: savedDataset.id });
    } catch (err: any) {
      setError(err?.message || 'Failed to load sample dataset.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <UploadCloud className="w-6 h-6 text-teal-600" />
          <span>Upload Production History Dataset</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Ingest multi-well monthly or daily production records up to 50MB (CSV, XLSX). Automatic column normalization & physics integrity validation.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <div className="font-bold">Dataset Processing Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Target Reservoir Selection */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>Target Reservoir</span>
            </label>
            <select
              value={selectedReservoirId}
              onChange={e => setSelectedReservoirId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            >
              {reservoirs.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.field_name} &bull; {r.fluid_type} &bull; {r.stoiip_mmstb} MMstb STOIIP)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Dataset Display Label</label>
            <input
              type="text"
              value={datasetName}
              onChange={e => setDatasetName(e.target.value)}
              placeholder="e.g. 2022-2025 Historical Production"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
          </div>
        </div>

        {selectedReservoir && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex flex-wrap items-center gap-4 font-mono">
            <span>STOIIP Cap: <strong className="text-slate-900">{selectedReservoir.stoiip_mmstb} MMstb</strong></span>
            <span>Fluid: <strong className="text-teal-700">{selectedReservoir.fluid_type}</strong></span>
            <span>Drive: <strong className="text-slate-800">{selectedReservoir.drive_mechanism}</strong></span>
          </div>
        )}
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          const files = e.dataTransfer.files;
          if (files && files[0]) handleProcessFile(files[0]);
        }}
        className={`p-10 border-2 border-dashed rounded-2xl text-center space-y-4 transition cursor-pointer ${
          dragOver 
            ? 'border-teal-500 bg-teal-50/50' 
            : 'border-slate-300 bg-slate-50/50 hover:border-teal-500/80 hover:bg-teal-50/20'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv, .xlsx, .xls"
          className="hidden"
          onChange={e => {
            const files = e.target.files;
            if (files && files[0]) handleProcessFile(files[0]);
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-teal-600">
          {isProcessing ? (
            <RefreshCw className="w-8 h-8 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">
            {isProcessing ? 'Validating Dataset Physics & Schema...' : 'Drag & Drop CSV or XLSX file here'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            or click to browse from local computer (Max file size: 50MB)
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-500 font-mono shadow-2xs">
          <span>Supported: CSV, XLSX &bull; Automated Column Alias Matching</span>
        </div>
      </div>

      {/* Preset Fast-Loader Options */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quick Test: Pre-Configured Benchmark Datasets
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Load sample reservoir histories with 1-click</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleLoadPreset('brent')}
            disabled={isProcessing}
            className="p-3 rounded-lg bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 text-left transition space-y-1 group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-teal-700 flex items-center justify-between">
              <span>Brent North Sea (Offshore)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
            </div>
            <p className="text-[11px] text-slate-500">3 Wells &bull; 36 Monthly Records &bull; Water Drive</p>
          </button>

          <button
            onClick={() => handleLoadPreset('wolfcamp')}
            disabled={isProcessing}
            className="p-3 rounded-lg bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 text-left transition space-y-1 group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-teal-700 flex items-center justify-between">
              <span>Wolfcamp Permian (Unconventional)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
            </div>
            <p className="text-[11px] text-slate-500">4 Horizontal Wells &bull; Solution Gas Drive</p>
          </button>

          <button
            onClick={() => handleLoadPreset('deepwater')}
            disabled={isProcessing}
            className="p-3 rounded-lg bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 text-left transition space-y-1 group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-teal-700 flex items-center justify-between">
              <span>Deepwater Gulf of Mexico</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
            </div>
            <p className="text-[11px] text-slate-500">Subsea Tiebacks &bull; High Pressure Turbidite</p>
          </button>
        </div>
      </div>

      {/* Column Aliasing & Template Download Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Supported Canonical Column Mappings</span>
          </div>
          <div className="space-y-2 text-slate-600">
            <div><strong className="text-slate-900 font-mono">date:</strong> date, time, timestamp, period, month_year</div>
            <div><strong className="text-slate-900 font-mono">well_id:</strong> well, well_name, uwi, api_number, producer</div>
            <div><strong className="text-slate-900 font-mono">oil_rate:</strong> oil_rate_bopd, qo, bopd, oil_prod, oil_bbl</div>
            <div><strong className="text-slate-900 font-mono">optional:</strong> water_rate, gas_rate, pressure_psia, water_cut</div>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col justify-between space-y-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Download className="w-4 h-4 text-teal-600" />
              <span>Download Official QuickFlow Templates</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Start with standardized headers and sample production rows pre-populated.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadCSVTemplate()}
              className="flex-1 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 text-center shadow-2xs"
            >
              Download CSV (.csv)
            </button>
            <button
              onClick={() => downloadXLSXTemplate()}
              className="flex-1 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-teal-700 text-center shadow-2xs"
            >
              Download Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
