import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  Terminal, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  Layers, 
  FileSpreadsheet, 
  HardDrive, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { ForecastJob, JobStage, JobStatus, User } from '../../types';

interface Props {
  jobId: string;
  onNavigate: (page: string, params?: any) => void;
  currentUser: User;
}

const STAGES: { key: JobStage; label: string; desc: string; icon: any }[] = [
  { key: 'validate', label: '1. Ingest & Validate', desc: 'Audit schema, dates & physical ranges', icon: FileSpreadsheet },
  { key: 'preprocess', label: '2. Preprocess & Tensorize', desc: 'Normalize history & build PyTorch dataloaders', icon: Layers },
  { key: 'inference', label: '3. Neural ODE Inference', desc: 'Integrate physics-informed Neural ODE forward in time', icon: Cpu },
  { key: 'uncertainty', label: '4. Quantile Propagation', desc: 'Simulate P10/P50/P90 confidence envelopes', icon: Activity },
  { key: 'physics_audit', label: '5. Physics Barrier Gate', desc: 'Audit monotonicity, material balance & STOIIP ceiling', icon: ShieldCheck },
  { key: 'persist', label: '6. Storage & Pinning', desc: 'Store forecast curves & pin artifact hashes', icon: HardDrive },
  { key: 'report', label: '7. Synthesis & ReportLab', desc: 'Synthesize PDF and CSV export bundles', icon: Sparkles },
];

export function ForecastExecutionPage({ jobId, onNavigate, currentUser }: Props) {
  const [job, setJob] = useState<ForecastJob | undefined>(() => storage.getForecastJobById(jobId));

  // Poll job state every 350ms until completed or failed
  useEffect(() => {
    const interval = setInterval(() => {
      const current = storage.getForecastJobById(jobId);
      if (current) {
        setJob({ ...current });
        if (current.status === 'Succeeded' || current.status === 'Failed' || current.status === 'Cancelled') {
          clearInterval(interval);
        }
      }
    }, 350);

    return () => clearInterval(interval);
  }, [jobId]);

  if (!job) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Job Not Found</h2>
        <p className="text-xs text-slate-500">Job {jobId} does not exist in this tenant partition.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 bg-white text-teal-700 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isFinished = job.status === 'Succeeded';
  const isFailed = job.status === 'Failed' || job.status === 'Cancelled';

  const getStageIndex = (stage: JobStage) => {
    return STAGES.findIndex(s => s.key === stage);
  };

  const currentStageIndex = getStageIndex(job.stage);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Job Identifier: <strong className="text-slate-800">{job.id}</strong></span> &bull;
            <span>Worker: <strong className="text-teal-700">Celery-GPU-01</strong></span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-teal-600" />
            <span>Asynchronous Forecast Execution Pipeline</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {job.status === 'Running' && (
            <button
              onClick={() => storage.cancelJob(job.id)}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-xs font-semibold text-slate-600 hover:text-rose-600 transition"
            >
              Cancel Job
            </button>
          )}

          {isFinished && job.result_id && (
            <button
              onClick={() => onNavigate('forecast-results', { resultId: job.result_id })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition transform active:scale-98"
            >
              <span>View Completed Forecast & Curves</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Status Pill */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
              isFinished 
                ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                : isFailed
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}>
              {!isFinished && !isFailed && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {isFinished && <CheckCircle2 className="w-3.5 h-3.5" />}
              {isFailed && <XCircle className="w-3.5 h-3.5" />}
              <span>{job.status.toUpperCase()}</span>
            </span>

            <span className="text-xs font-bold text-slate-900">
              {STAGES[currentStageIndex]?.label || job.stage}
            </span>
          </div>

          <div className="text-right">
            <span className="text-2xl font-extrabold text-teal-600 font-mono">{job.progress_pct}%</span>
          </div>
        </div>

        {/* Linear progress track */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div 
            className="h-full bg-teal-600 rounded-full transition-all duration-300"
            style={{ width: `${job.progress_pct}%` }}
          ></div>
        </div>
      </div>

      {/* 7 Pipeline Stages Visual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {STAGES.map((stg, idx) => {
          const isPassed = isFinished || currentStageIndex > idx;
          const isCurrent = !isFinished && !isFailed && currentStageIndex === idx;
          const Icon = stg.icon;

          return (
            <div
              key={stg.key}
              className={`p-3 rounded-xl border text-left transition space-y-1.5 ${
                isPassed 
                  ? 'bg-teal-50/50 border-teal-200 text-teal-900 shadow-2xs' 
                  : isCurrent
                  ? 'bg-white border-teal-500 shadow-xs ring-1 ring-teal-500'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${isPassed || isCurrent ? 'text-teal-600' : 'text-slate-400'}`} />
                {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                {isCurrent && <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />}
              </div>
              <div className="text-[11px] font-bold leading-tight text-slate-800">{stg.label}</div>
              <p className="text-[10px] text-slate-500 leading-tight hidden md:block line-clamp-2">{stg.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Live Terminal Log Stream */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 font-mono text-xs shadow-md text-slate-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-200">Execution Telemetry Logs</span>
          </div>
          <span className="text-[11px] text-slate-500">Live Socket Channel: /ws/jobs/{job.id}</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 max-h-64 overflow-y-auto space-y-1.5 text-[11px]">
          {job.stage_logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-slate-600 select-none">[{index + 1}]</span>
              <span className="text-slate-400">[{log.stage}]</span>
              <span className={
                log.message.includes('PASSED') || log.message.includes('SUCCESS') || log.message.includes('PINNED') || log.message.includes('completed')
                  ? 'text-teal-400 font-semibold'
                  : log.message.includes('Starting') || log.message.includes('Running') || log.message.includes('Step')
                  ? 'text-sky-300'
                  : log.message.includes('Physics') || log.message.includes('Havlena')
                  ? 'text-amber-300'
                  : 'text-slate-300'
              }>
                {log.message}
              </span>
            </div>
          ))}
          {!isFinished && !isFailed && (
            <div className="flex items-center gap-2 text-teal-400 animate-pulse pt-1">
              <span>&gt;</span>
              <span>Worker thread active...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
