import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  Building2,
  Lock,
  X
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { User, UserRole } from '../../types';

interface Props {
  currentUser: User;
}

export function TeamManagementPage({ currentUser }: Props) {
  const company = storage.getCurrentCompany();
  const [members, setMembers] = useState<User[]>(() => storage.getTeamMembers());
  const [showInviteModal, setShowInviteModal] = useState(false);

  const reloadMembers = () => {
    setMembers(storage.getTeamMembers());
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Tenant Workspace: {company.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-600" />
            <span>Team & Role-Based Access Control (RBAC)</span>
          </h1>
        </div>

        {currentUser.role === 'Admin' && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {/* Permissions Matrix Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-700">Admin</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Full Access</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Manage company settings, invite team members, access cryptographic audit logs, configure S3 partitions, and run all forecasts.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-700">Engineer</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">Operational</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Register reservoirs, upload CSV/XLSX production histories, configure & execute PyTorch forecasts, and export CSV/PDF reports.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-700">Viewer</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Read Only</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            View dashboards, inspect forecast curves, download report artifacts. Cannot mutate datasets or trigger execution.
          </p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Active Tenant Members ({members.length})
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Tenant Isolation: Strictly Enforced
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/60 text-slate-600 font-mono border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold">Full Name</th>
              <th className="p-3.5 font-semibold">Email Address</th>
              <th className="p-3.5 font-semibold">Assigned Role</th>
              <th className="p-3.5 font-semibold">Status</th>
              <th className="p-3.5 text-right font-semibold">Role Modifier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-slate-50/80 transition">
                <td className="p-3.5 font-bold text-slate-900">
                  {member.full_name}
                  {member.id === currentUser.id && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-mono">You</span>
                  )}
                </td>
                <td className="p-3.5 text-slate-500 font-mono">{member.email}</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    member.role === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    member.role === 'Engineer' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="p-3.5">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  {currentUser.role === 'Admin' && member.id !== currentUser.id ? (
                    <select
                      value={member.role}
                      onChange={e => {
                        storage.updateUserRole(member.id, e.target.value as UserRole);
                        reloadMembers();
                      }}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-teal-500 transition"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Engineer">Engineer</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">Protected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            setShowInviteModal(false);
            reloadMembers();
          }}
        />
      )}
    </div>
  );
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Engineer');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    storage.inviteUser({
      email,
      full_name: fullName,
      role,
    });
    onInvited();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-teal-600" />
            <span>Invite Team Member to Tenant</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleInvite} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan, PE"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Corporate Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="alex.morgan@company.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Role & Permissions</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            >
              <option value="Engineer">Engineer (Can upload & run forecasts)</option>
              <option value="Viewer">Viewer (Read-only access)</option>
              <option value="Admin">Admin (Full administrative privileges)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs transition"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
