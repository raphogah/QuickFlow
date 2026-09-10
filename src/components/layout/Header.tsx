import React, { useState } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  Building2, 
  User as UserIcon, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Zap, 
  Lock,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { User, NotificationItem } from '../../types';

interface Props {
  currentUser: User;
  onUserSwitch: (user: User) => void;
  onOpenTestModal: () => void;
  onNavigate: (page: string, params?: any) => void;
}

export function Header({ currentUser, onUserSwitch, onOpenTestModal, onNavigate }: Props) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const company = storage.getCurrentCompany();
  const notifications = storage.getNotifications();
  const unreadNotifs = notifications.filter(n => !n.read);

  // Available users in demo database for easy multi-role and cross-tenant switching
  const allUsers = [
    { id: 'usr_sarah_admin', name: 'Dr. Sarah Chen', role: 'Admin', comp: 'Apex Energy' },
    { id: 'usr_marcus_eng', name: 'Marcus Vance, PE', role: 'Engineer', comp: 'Apex Energy' },
    { id: 'usr_elena_view', name: 'Elena Rostova', role: 'Viewer', comp: 'Apex Energy' },
    { id: 'usr_dave_vanguard', name: 'Dave Miller (Foreign Tenant)', role: 'Admin', comp: 'Vanguard Petro' },
  ];

  const handleSelectUser = (userId: string) => {
    const switched = storage.switchUser(userId);
    onUserSwitch(switched);
    setShowUserMenu(false);
  };

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.markNotificationAsRead(id);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Left: Brand & Tenant Context */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center shadow-sm text-white group-hover:bg-teal-700 transition">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">QuickFlow<span className="text-teal-600">AI</span></span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-700 font-mono font-bold">V1</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Reservoir Forecast Engine</span>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs">
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-semibold text-slate-800">{company.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-500 font-mono border border-slate-200">
              {company.slug}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Tenant Scoped</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Run Cross-Tenant Isolation Tests Button */}
        <button
          onClick={onOpenTestModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-teal-500/50 hover:bg-teal-50/50 text-slate-700 hover:text-teal-700 transition shadow-xs"
          title="Run Automated Cross-Tenant Security and Isolation Verification Test Suite"
        >
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Security Audit Tests</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowUserMenu(false);
            }}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition relative shadow-xs"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</span>
                <span className="text-[11px] text-teal-600 font-mono font-semibold">{unreadNotifs.length} new</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        if (n.link) onNavigate('forecast-results', { resultId: n.link.split('/').pop() });
                        storage.markNotificationAsRead(n.id);
                        setShowNotifMenu(false);
                      }}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition flex gap-2.5 ${!n.read ? 'bg-teal-50/40' : ''}`}
                    >
                      {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                      {n.type === 'info' && <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />}
                      {n.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 flex items-center justify-between">
                          <span>{n.title}</span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">
                          {new Date(n.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity & Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-left shadow-xs"
          >
            <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-xs font-bold text-teal-700">
              {currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.full_name}</div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                  currentUser.role === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                  currentUser.role === 'Engineer' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                  'bg-sky-50 text-sky-700 border border-sky-200'
                }`}>
                  {currentUser.role}
                </span>
                <span className="text-[10px] text-slate-500">&bull; {company.slug}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
              <div className="p-2.5 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{currentUser.full_name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{currentUser.email}</div>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                  <span>Tenant:</span>
                  <span className="text-teal-700 font-semibold">{company.name}</span>
                </div>
              </div>

              <div className="p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 block mb-1">
                  Switch User / Role / Tenant (Demo)
                </span>
                <div className="space-y-1">
                  {allUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition ${
                        u.id === currentUser.id 
                          ? 'bg-teal-50 border border-teal-300 text-teal-900 font-bold' 
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.comp}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md transition"
                >
                  Company & Security Settings
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('login');
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
