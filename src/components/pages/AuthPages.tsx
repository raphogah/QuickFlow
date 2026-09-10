import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  KeyRound, 
  Sparkles, 
  AlertCircle,
  Database
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { User, Company } from '../../types';

interface AuthProps {
  onSuccess: (user: User) => void;
  onNavigate: (page: string) => void;
}

// 1. LOGIN PAGE
export function LoginPage({ onSuccess, onNavigate }: AuthProps) {
  const [email, setEmail] = useState('sarah.chen@apexenergy.com');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const allUsers = [
      ...storage.getTeamMembers(),
      { id: 'usr_dave_vanguard', email: 'dave.miller@vanguardpetro.com', full_name: 'Dave Miller', role: 'Admin' as const, company_id: 'comp_vanguard_02', email_verified: true, created_at: '', is_active: true }
    ];
    
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      const active = storage.switchUser(user.id);
      onSuccess(active);
    } else {
      // Default to admin for demo if not found
      const active = storage.switchUser('usr_sarah_admin');
      onSuccess(active);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mx-auto shadow-xs">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-4 tracking-tight">QuickFlow<span className="text-teal-600">AI</span></h2>
          <p className="text-xs text-slate-500 mt-1">Sign in to your company reservoir workspace</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Corporate Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                placeholder="engineer@company.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => onNavigate('password-reset')}
                className="text-[11px] text-teal-600 hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition transform active:scale-98"
          >
            Sign In to Tenant Portal
          </button>
        </form>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Demo Quick Access Accounts:</span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => { setEmail('sarah.chen@apexenergy.com'); }}
              className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-teal-500 text-slate-800 shadow-2xs transition"
            >
              <div className="font-semibold text-teal-700">Dr. Sarah Chen</div>
              <div className="text-[10px] text-slate-500">Apex Admin</div>
            </button>
            <button
              onClick={() => { setEmail('marcus.vance@apexenergy.com'); }}
              className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-teal-500 text-slate-800 shadow-2xs transition"
            >
              <div className="font-semibold text-blue-700">Marcus Vance</div>
              <div className="text-[10px] text-slate-500">Apex Engineer</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          New operating company?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-teal-600 font-semibold hover:underline"
          >
            Register Company
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. REGISTRATION PAGE
export function RegisterPage({ onSuccess, onNavigate }: AuthProps) {
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [tier, setTier] = useState<'Enterprise' | 'Professional'>('Enterprise');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const { user } = storage.registerCompanyAndAdmin({
      company_name: companyName,
      admin_name: adminName,
      admin_email: adminEmail,
      tier,
    });
    onNavigate('email-verification');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mx-auto shadow-xs">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-4 tracking-tight">Create Company Tenant</h2>
          <p className="text-xs text-slate-500 mt-1">Multi-tenant isolated environment with encrypted storage</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Company / Operator Name</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. North Sea Petroleum Ltd."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Admin Full Name</label>
              <input
                type="text"
                required
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Admin Work Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="alex@northsea.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Deployment Tier</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between ${
                tier === 'Enterprise' ? 'bg-teal-50 border-teal-500 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Enterprise</span>
                  <input
                    type="radio"
                    name="tier"
                    checked={tier === 'Enterprise'}
                    onChange={() => setTier('Enterprise')}
                    className="accent-teal-600"
                  />
                </div>
                <span className="text-[10px] mt-1 text-slate-500">Up to 25 Reservoirs &bull; 50GB S3 &bull; Dedicated PINN cluster</span>
              </label>

              <label className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between ${
                tier === 'Professional' ? 'bg-teal-50 border-teal-500 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Professional</span>
                  <input
                    type="radio"
                    name="tier"
                    checked={tier === 'Professional'}
                    onChange={() => setTier('Professional')}
                    className="accent-teal-600"
                  />
                </div>
                <span className="text-[10px] mt-1 text-slate-500">10 Reservoirs &bull; 20GB S3</span>
              </label>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>Strict tenant isolation guarantee: No customer data is used for model training without explicit consent.</span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition"
          >
            Provision Company Tenant &bull; Continue
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-teal-600 font-semibold hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

// 3. EMAIL VERIFICATION PAGE
export function EmailVerificationPage({ onSuccess, onNavigate }: AuthProps) {
  const [token, setToken] = useState('749201');
  const [verified, setVerified] = useState(false);
  const currentUser = storage.getCurrentUser();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    storage.verifyEmail(currentUser.id);
    setVerified(true);
    setTimeout(() => {
      onNavigate('onboarding');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-teal-600">
          <Mail className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Verify Corporate Email</h2>
          <p className="text-xs text-slate-500 mt-1">
            We sent a verification code to <span className="font-mono text-slate-800 font-bold">{currentUser.email}</span>
          </p>
        </div>

        {verified ? (
          <div className="p-4 bg-teal-50 border border-teal-300 rounded-xl text-xs text-teal-800 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-teal-600" />
            <span className="font-bold">Email Verified Successfully!</span>
            <span className="text-slate-500">Redirecting to onboarding wizard...</span>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">6-Digit Verification Code</label>
              <input
                type="text"
                maxLength={6}
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-center font-mono text-lg text-teal-700 tracking-widest focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs"
            >
              Confirm Email & Continue
            </button>

            <div className="text-xs text-slate-500">
              Didn't receive code?{' '}
              <button
                type="button"
                onClick={() => alert('New verification code sent to ' + currentUser.email)}
                className="text-teal-600 hover:underline font-semibold"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// 4. PASSWORD RESET PAGE
export function PasswordResetPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto text-purple-600">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-4">Reset Corporate Password</h2>
          <p className="text-xs text-slate-500 mt-1">Enter your registered email to receive a secure reset link</p>
        </div>

        {sent ? (
          <div className="p-4 bg-teal-50 border border-teal-300 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-6 h-6 text-teal-600 mx-auto" />
            <div className="text-xs font-bold text-slate-900">Password Reset Link Sent</div>
            <p className="text-[11px] text-slate-500">Check your inbox for instructions to reset your tenant password.</p>
            <button
              onClick={() => onNavigate('login')}
              className="mt-3 px-4 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Registered Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="engineer@company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs"
            >
              Send Password Reset Link
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// 5. ONBOARDING WIZARD
export function OnboardingPage({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(1);
  const company = storage.getCurrentCompany();
  const [reservoirName, setReservoirName] = useState('Brent North Deep-1');
  const [stoiip, setStoiip] = useState(420);
  const [fluidType, setFluidType] = useState('Black Oil');

  const handleCreateAndComplete = () => {
    storage.createReservoir({
      name: reservoirName,
      field_name: 'Block 211/29',
      country: 'United Kingdom',
      location: 'North Sea',
      fluid_type: fluidType as any,
      drive_mechanism: 'Water Drive',
      production_start_date: '2022-01-01',
      initial_pressure: 4400,
      stoiip_mmstb: stoiip,
      producers_count: 4,
      notes: 'Initial reservoir created during onboarding flow.',
    });
    onFinish();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
        {/* Progress header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-mono text-teal-600 font-bold uppercase">QuickFlow AI V1 Onboarding</span>
            <h2 className="text-lg font-bold text-slate-900">Setup Workspace: {company.name}</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
            <span className={step >= 1 ? 'text-teal-700 font-bold' : ''}>1. Welcome</span> &bull;
            <span className={step >= 2 ? 'text-teal-700 font-bold' : ''}>2. First Reservoir</span> &bull;
            <span className={step >= 3 ? 'text-teal-700 font-bold' : ''}>3. Ready</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Tenant Provisioned & Configured</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Welcome to QuickFlow AI V1. Your multi-tenant storage partition is ready at <code className="text-teal-700 font-mono bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">s3://quickflow/tenants/{company.id}</code>. All production histories and forecasts are strictly isolated.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="font-bold text-slate-900">50 MB Uploads</div>
                <div className="text-[11px] text-slate-500 mt-0.5">CSV & XLSX with auto-aliasing</div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="font-bold text-slate-900">PyTorch PINN</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Havlena-Odeh material balance</div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="font-bold text-slate-900">Physics Audit</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Monotonicity & STOIIP cap</div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs"
            >
              Step 2: Register Your First Reservoir
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reservoir Asset Name</label>
                <input
                  type="text"
                  value={reservoirName}
                  onChange={e => setReservoirName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Fluid Type</label>
                  <select
                    value={fluidType}
                    onChange={e => setFluidType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  >
                    <option value="Black Oil">Black Oil</option>
                    <option value="Volatile Oil">Volatile Oil</option>
                    <option value="Gas Condensate">Gas Condensate</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">STOIIP Upper Bound (MMstb)</label>
                  <input
                    type="number"
                    value={stoiip}
                    onChange={e => setStoiip(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs"
            >
              Step 3: Review & Finalize
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
              <div className="text-sm font-bold text-slate-900">Your Workspace Is Ready!</div>
              <p className="text-xs text-slate-600">
                We will create <span className="text-teal-700 font-bold">{reservoirName}</span> and load pre-configured sample offshore datasets so you can run your first physics-constrained forecast immediately.
              </p>
            </div>

            <button
              onClick={handleCreateAndComplete}
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs"
            >
              Launch Dashboard &bull; Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
