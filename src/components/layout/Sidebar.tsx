import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  UploadCloud, 
  Activity, 
  TrendingUp, 
  History, 
  Users, 
  Settings, 
  ShieldCheck, 
  FileSpreadsheet,
  Cpu,
  PlusCircle,
  HardDrive,
  FileCode
} from 'lucide-react';
import { User } from '../../types';
import { storage } from '../../lib/storage';

interface Props {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  currentUser: User;
}

export function Sidebar({ currentPage, onNavigate, currentUser }: Props) {
  const company = storage.getCurrentCompany();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reservoirs', label: 'Reservoirs', icon: Database },
    { id: 'upload-dataset', label: 'Upload Dataset', icon: UploadCloud },
    { id: 'forecast-config', label: 'New Forecast', icon: TrendingUp },
    { id: 'forecast-history', label: 'Forecast History', icon: History },
    { id: 'team', label: 'Team & Roles', icon: Users },
    { id: 'audit-log', label: 'Admin Audit Log', icon: ShieldCheck, adminOnly: true },
    { id: 'settings', label: 'Settings & Privacy', icon: Settings },
  ];

  const quotaPercent = Math.round((company.storage_used_mb / company.storage_quota_mb) * 100);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="space-y-6">
        {/* Quick Action Button */}
        <div>
          <button
            onClick={() => onNavigate('forecast-config')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-sm transition transform active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch Forecast Job</span>
          </button>
        </div>

        {/* Primary Navigation List */}
        <div className="space-y-1">
          <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Reservoir Engineering
          </div>

          {navItems.map(item => {
            if (item.adminOnly && currentUser.role !== 'Admin') return null;
            const Icon = item.icon;
            const isActive = currentPage === item.id || 
              (item.id === 'reservoirs' && (currentPage === 'reservoir-detail' || currentPage === 'create-reservoir')) ||
              (item.id === 'upload-dataset' && currentPage === 'validation-report');

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.id === 'forecast-config' && (
                  <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-100/70 text-teal-800 font-bold">
                    PINN
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Model Status Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-teal-600" />
              <span>Model Runtime</span>
            </span>
            <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-bold">
              v1.4.2 Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            PyTorch PINN Neural-ODE with Havlena-Odeh material balance penalties.
          </p>
        </div>
      </div>

      {/* Footer / Tenant Storage Stats */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-sky-600" />
              <span className="font-medium">S3 Tenant Storage</span>
            </span>
            <span className="font-mono text-slate-700 font-semibold">
              {(company.storage_used_mb / 1024).toFixed(1)} / {(company.storage_quota_mb / 1024).toFixed(0)} GB
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-teal-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.max(5, quotaPercent)}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
          <span>Tenant: {company.slug}</span>
          <span className="text-emerald-600 font-semibold">&bull; Isolated</span>
        </div>
      </div>
    </aside>
  );
}
