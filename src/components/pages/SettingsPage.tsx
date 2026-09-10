import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  ShieldCheck, 
  HardDrive, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  KeyRound, 
  FileCode,
  Save
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { User } from '../../types';

interface Props {
  currentUser: User;
}

export function SettingsPage({ currentUser }: Props) {
  const company = storage.getCurrentCompany();
  const [companyName, setCompanyName] = useState(company.name);
  const [allowTraining, setAllowTraining] = useState(company.consent_model_training);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateCompanySettings({
      name: companyName,
      consent_model_training: allowTraining,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const isAdmin = currentUser.role === 'Admin';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-teal-600" />
          <span>Tenant Configuration & Data Privacy</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage company profile, storage partitions, cryptographic keys, and strict data privacy boundaries
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Settings saved and applied to tenant partition.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Company Profile */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Company Tenant Profile</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company / Operator Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 disabled:opacity-60 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tenant ID & Slug (Immutable)</label>
              <input
                type="text"
                disabled
                value={`${company.id} (${company.slug})`}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-mono disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Data Privacy & Model Training Consent (CRITICAL) */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Strict Data Privacy & AI Model Training Policy</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              ZERO-LEAK GUARANTEE
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Allow Anonymized Model Optimization
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Strictly enforce: <strong>No customer production data, well coordinates, or reservoir fluid parameters will be used for foundation model training or retraining without explicit opt-in consent.</strong>
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={allowTraining}
                  onChange={e => setAllowTraining(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
              Status: {allowTraining ? 'Opted-In (Anonymized Telemetry Only)' : 'Opted-Out (Strict Air-Gapped Tenant Sandbox)'}
            </div>
          </div>
        </div>

        {/* Section 3: Object Storage / S3 Partition */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span>Object Storage Configuration (MinIO / S3)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 font-sans block text-[10px]">Tenant S3 Bucket Prefix</span>
              <span className="text-teal-700 font-bold">s3://quickflow-storage/tenants/{company.id}/</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 font-sans block text-[10px]">Assigned Quota</span>
              <span className="text-slate-800 font-bold">
                {(company.storage_used_mb / 1024).toFixed(2)} GB used of {(company.storage_quota_mb / 1024).toFixed(0)} GB ({company.tier} Tier)
              </span>
            </div>
          </div>
        </div>

        {/* Save Button (Admin Only) */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Tenant Settings</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
