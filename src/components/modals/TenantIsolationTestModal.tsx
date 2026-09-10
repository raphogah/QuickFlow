import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  AlertTriangle, 
  Lock, 
  FileCode, 
  X,
  Play,
  Terminal
} from 'lucide-react';
import { runAllCrossTenantIsolationTests, TestSuiteSummary } from '../../lib/tenantIsolationTests';

interface Props {
  onClose: () => void;
}

export function TenantIsolationTestModal({ onClose }: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<TestSuiteSummary | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    await new Promise(r => setTimeout(r, 300));
    const testSummary = await runAllCrossTenantIsolationTests();
    setSummary(testSummary);
    setIsRunning(false);
  };

  const allPassed = summary ? summary.failed === 0 : false;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cross-Tenant Isolation & Security Test Suite</h2>
              <p className="text-xs text-slate-500">Automated verification of tenant boundaries, RBAC, and storage partitions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action button & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <div className="text-xs font-bold text-slate-900">
              {summary 
                ? (allPassed ? `All ${summary.total} Security & Multi-Tenancy Tests PASSED (${summary.duration_ms}ms)` : `${summary.failed} of ${summary.total} Tests Failed`) 
                : 'Ready to execute live cross-tenant isolation assertions'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Validates memory boundaries, cross-tenant leak prevention, role-based mutation locks, and S3 path hashing.
            </p>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 shrink-0"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Isolation Suite</span>
              </>
            )}
          </button>
        </div>

        {/* Results List */}
        {summary && (
          <div className="space-y-3 font-mono text-xs">
            {summary.results.map((res, idx) => (
              <div 
                key={res.id}
                className={`p-4 rounded-xl border transition space-y-2 ${
                  res.status === 'PASSED' 
                    ? 'bg-slate-50 border-teal-200 text-slate-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold font-sans">
                    {res.status === 'PASSED' ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className={res.status === 'PASSED' ? 'text-slate-900' : 'text-rose-700'}>
                      [{res.id}] {res.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono">
                      {res.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{res.duration_ms}ms</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      res.status === 'PASSED' ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {res.status}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 pl-6">
                  <div className="text-slate-800 font-medium mb-1">{res.assertion}</div>
                  {res.logs.length > 0 && (
                    <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg border border-slate-800 text-[10px] space-y-1 max-h-24 overflow-y-auto font-mono">
                      {res.logs.map((log, lIdx) => (
                        <div key={lIdx} className={log.includes('PASSED') || log.includes('TRAP') || log.includes('ASSERTION_OK') ? 'text-emerald-400' : 'text-slate-300'}>
                          &gt; {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
