import { useState, FormEvent } from 'react';
import { apiUrl } from './apiBase';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Hash, 
  HelpCircle, 
  Info,
  Loader2,
  Copy,
  ArrowRight,
  ShieldAlert,
  FileSearch,
  RefreshCw,
  Lock,
  User,
  LogOut,
  ChevronRight,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RunOutcome {
  runId: string;
  recordsChecked: number;
  matched: number;
  autoFixed: number;
  markedFraudulent: number;
  flagged: number;
  failed: number;
  status: 'Succeeded' | 'Partial' | 'Failed';
  errorMessage: string | null;
}

interface RunSummaryRow {
  runId: string;
  triggeredBy: string;
  windowStartUtc: string;
  windowEndUtc: string;
  matchedCount: number;
  autoFixedCount: number;
  flaggedCount: number;
  failedCount: number;
  recordsChecked: number;
  status: 'Succeeded' | 'Partial' | 'Failed';
  startedAtUtc: string;
  completedAtUtc: string;
  durationMs: number;
  errorMessage: string | null;
}

interface AuditLine {
  auditId: number;
  orderNumber: string;
  mismatchType: string;
  actionTaken: string;
  reasonCode: string;
  reasonText: string;
  beforeJson: string;
  afterJson: string;
  createdAtUtc: string;
}

interface AuditDetails {
  runId: string;
  fraudMarkedCount: number;
  lines: AuditLine[];
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [authCode, setAuthCode] = useState('');
  const [reconciliationDate, setReconciliationDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'run' | 'reports' | 'help'>('run');

  // Reports state
  const [reportsAuthCode, setReportsAuthCode] = useState('');
  const [runs, setRuns] = useState<RunSummaryRow[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [selectedRun, setSelectedRun] = useState<RunSummaryRow | null>(null);
  const [auditDetails, setAuditDetails] = useState<AuditDetails | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsLoggedIn(true);
      } else {
        setLoginError(data.message || 'Invalid username or password credentials.');
      }
    } catch (err) {
      setLoginError('Server connection failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setOutcome(null);
    setRuns([]);
    setSelectedRun(null);
    setAuditDetails(null);
  };

  const handleRunReconciliation = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setOutcome(null);

    try {
      console.log("The Base URL is: "+ apiUrl);
      const response = await fetch(apiUrl('/api/StripeDbReconciliation/run-manual'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authCode,
          reconciliationDate,
          triggeredByUserId: 1001,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to run reconciliation');
      }

      setOutcome(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRuns = async () => {
    if (!reportsAuthCode) return;
    setIsLoadingRuns(true);
    setSelectedRun(null);
    setAuditDetails(null);
    try {
      const q = new URLSearchParams({ authCode: reportsAuthCode, take: '50' });
      const res = await fetch(apiUrl(`/api/StripeDbReconciliation/report/runs?${q}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRuns(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingRuns(false);
    }
  };

  const fetchAudit = async (run: RunSummaryRow) => {
    setSelectedRun(run);
    setIsLoadingAudit(true);
    setAuditDetails(null);
    try {
      const q = new URLSearchParams({ authCode: reportsAuthCode, take: '500' });
      const res = await fetch(apiUrl(`/api/StripeDbReconciliation/report/runs/${run.runId}/audit?${q}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAuditDetails(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          <div className="p-8 pb-4 text-center">
            <img 
              src="https://dashboard.kiwiticketing.com/wp-content/themes/kiwiticketing/assets/images/logo.svg" 
              alt="Kiwiticketing Logo" 
              className="h-12 w-auto mx-auto mb-6"
            />
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Admin Portal</h2>
            <p className="text-slate-500 text-sm">Please log in to manage reconciliation</p>
          </div>

          <div className="p-8 pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="username"
                    type="text"
                    required
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#9FC23F]/20 focus:border-[#9FC23F] outline-none transition-all placeholder:text-slate-400 text-slate-700"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#9FC23F]/20 focus:border-[#9FC23F] outline-none transition-all placeholder:text-slate-400 text-slate-700"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <AnimatePresence>
                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 p-3 rounded-lg border border-rose-100"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#9FC23F] hover:bg-[#8eaf38] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#9FC23F]/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In to Portal
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F6F6F6]">
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-screen sticky top-0 self-start z-20">
        <div className="pt-5 pb-5 px-4 border-b border-slate-200">
          <img
            src="https://dashboard.kiwiticketing.com/wp-content/themes/kiwiticketing/assets/images/logo.svg"
            alt="Kiwiticketing"
            className="h-9 w-auto"
          />
        </div>
        <nav className="flex flex-col gap-1 font-sans py-4 px-3 flex-1" aria-label="Main navigation">
            <button
              type="button"
              onClick={() => setActiveTab('run')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-all ${
                activeTab === 'run'
                  ? 'bg-[#9FC23F]/10 text-[#9FC23F] shadow-sm ring-1 ring-[#9FC23F]/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Activity className="w-5 h-5 shrink-0" aria-hidden />
              Run Manual
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-all ${
                activeTab === 'reports'
                  ? 'bg-[#9FC23F]/10 text-[#9FC23F] shadow-sm ring-1 ring-[#9FC23F]/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-5 h-5 shrink-0" aria-hidden />
              Reports
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-all ${
                activeTab === 'help'
                  ? 'bg-[#9FC23F]/10 text-[#9FC23F] shadow-sm ring-1 ring-[#9FC23F]/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-5 h-5 shrink-0" aria-hidden />
              Help
            </button>
          </nav>
        </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8 gap-4">
            <h1 className="text-lg font-bold text-slate-800 truncate min-w-0">
              Stripe–DB Reconciliation
            </h1>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-sm font-bold text-slate-900">Admin User</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Manager</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          {activeTab === 'run' ? (
            <motion.div
              key="run-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Form Section */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#9FC23F]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-[#9FC23F]/10 rounded-lg">
                      <Activity className="w-5 h-5 text-[#9FC23F]" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Manual Trigger</h2>
                  </div>
                  
                  <form onSubmit={handleRunReconciliation} className="space-y-6 relative z-10">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">AuthCode</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                          id="authCode"
                          type="text"
                          required
                          placeholder="WATERPARK_NORTH"
                          className="w-full pl-10 pr-4 py-3 border border-slate-100 bg-slate-50 rounded-xl focus:ring-2 focus:ring-[#9FC23F] focus:border-[#9FC23F] outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
                          value={authCode}
                          onChange={(e) => setAuthCode(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Local Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                          id="reconciliationDate"
                          type="date"
                          required
                          className="w-full pl-10 pr-4 py-3 border border-slate-100 bg-slate-50 rounded-xl focus:ring-2 focus:ring-[#9FC23F] focus:border-[#9FC23F] outline-none transition-all font-medium text-slate-700 select-none"
                          value={reconciliationDate}
                          onChange={(e) => setReconciliationDate(e.target.value)}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400 italic">
                        Select date in waterpark's local timezone.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#9FC23F] hover:bg-[#8eaf38] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-[#9FC23F]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Run Reconciliation
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                    
                    <div className="pt-6 border-t border-slate-100 flex gap-3 text-[11px] text-slate-400 leading-relaxed">
                      <Info className="w-4 h-4 shrink-0 text-amber-500" />
                      <p>Manual runs will create a new audit trace in `reconciliation_run_summary`. Please verify date before confirming.</p>
                    </div>
                  </form>
                </div>
              </div>

              {/* Results Section */}
              <div className="lg:col-span-2">
                {isLoading ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-[#9FC23F]/10 border-t-[#9FC23F] rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileSearch className="w-8 h-8 text-[#9FC23F] animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">Comparing Records...</h3>
                      <p className="text-slate-400">Verifying database entries against Stripe charges.</p>
                    </div>
                  </div>
                ) : outcome ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {/* Status Banner */}
                    <div className={`p-6 rounded-3xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 ${
                      outcome.status === 'Succeeded' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                        : outcome.status === 'Partial'
                        ? 'bg-amber-50 border-amber-100 text-amber-800'
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${
                          outcome.status === 'Succeeded' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                        }`}>
                          {outcome.status === 'Succeeded' ? (
                            <CheckCircle className="w-8 h-8" />
                          ) : (
                            <AlertCircle className="w-8 h-8" />
                          )}
                        </div>
                        <div>
                          <p className="text-2xl font-black tracking-tight leading-none uppercase">Run {outcome.status}</p>
                          <p className="text-xs font-mono mt-1 opacity-70 break-all">RID: {outcome.runId}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(outcome.runId)}
                        className="w-full sm:w-auto px-4 py-2 bg-white/50 hover:bg-white rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold"
                      >
                        <Copy className="w-4 h-4" />
                        Copy CID
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Checked', value: outcome.recordsChecked, icon: FileSearch, color: 'bg-slate-500' },
                        { label: 'Confirmed', value: outcome.matched, icon: CheckCircle, color: 'bg-[#9FC23F]' },
                        { label: 'Auto-Fixed', value: outcome.autoFixed, icon: Activity, color: 'bg-blue-500' },
                        { label: 'Fraud Mark', value: outcome.markedFraudulent, icon: ShieldAlert, color: 'bg-rose-500' },
                        { label: 'Flagged', value: outcome.flagged, icon: AlertCircle, color: 'bg-amber-500' },
                        { label: 'Failed', value: outcome.failed, icon: AlertCircle, color: 'bg-slate-400' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col group hover:border-[#9FC23F]/30 transition-colors">
                          <div className={`w-8 h-8 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center mb-4`}>
                            <stat.icon className={`w-4 h-4 ${stat.color.replace('bg-', 'text-')}`} />
                          </div>
                          <span className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</span>
                        </div>
                      ))}
                    </div>

                    {outcome.errorMessage && (
                      <div className="bg-rose-50 p-5 rounded-2xl border-2 border-rose-100 text-rose-800 text-xs font-medium">
                        <p className="font-bold mb-2 uppercase tracking-widest text-[10px] opacity-60">System Error Log:</p>
                        {outcome.errorMessage}
                      </div>
                    )}
                  </motion.div>
                ) : error ? (
                  <div className="bg-rose-50 border-2 border-rose-100 rounded-3xl p-10 flex flex-col items-center text-center gap-4 text-rose-800">
                    <div className="p-4 bg-rose-500/10 rounded-full">
                      <AlertCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">API Submission Failed</h3>
                      <p className="text-sm opacity-80 mt-1 max-w-sm">{error}</p>
                    </div>
                    <button 
                      onClick={() => setError(null)}
                      className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-xl font-bold text-sm"
                    >
                      Dismiss Error
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <Activity className="w-8 h-8 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400">Ready for Reconciliation</h3>
                    <p className="text-slate-300 text-sm max-w-xs mt-2">Enter the waterpark AuthCode and date to begin the audit process.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'reports' ? (
            <motion.div
              key="reports-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
                <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
                  <div className="flex-1 max-w-sm">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">AuthCode Filter</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="text"
                        placeholder="e.g. WATERPARK_NORTH"
                        className="w-full pl-10 pr-4 py-3 border border-slate-100 bg-slate-50 rounded-xl focus:ring-2 focus:ring-[#9FC23F] focus:border-[#9FC23F] outline-none transition-all font-medium text-slate-700"
                        value={reportsAuthCode}
                        onChange={(e) => setReportsAuthCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    onClick={fetchRuns}
                    disabled={isLoadingRuns || !reportsAuthCode}
                    className="bg-[#9FC23F] hover:bg-[#8eaf38] text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoadingRuns ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    Load Recent Runs
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Started (UTC)</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Trigger</th>
                        <th className="px-6 py-4 text-center">Matched</th>
                        <th className="px-6 py-4 text-center">Fixed</th>
                        <th className="px-6 py-4 text-center">Flagged</th>
                        <th className="px-6 py-4">Run ID</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {runs.length > 0 ? runs.map((run) => (
                        <tr 
                          key={run.runId} 
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedRun?.runId === run.runId ? 'bg-[#9FC23F]/5' : ''}`}
                          onClick={() => fetchAudit(run)}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            {new Date(run.startedAtUtc).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              run.status === 'Succeeded' ? 'bg-emerald-100 text-emerald-700' : 
                              run.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {run.triggeredBy}
                          </td>
                          <td className="px-6 py-4 text-sm text-center font-bold text-slate-700">{run.matchedCount}</td>
                          <td className="px-6 py-4 text-sm text-center font-bold text-blue-600">{run.autoFixedCount}</td>
                          <td className="px-6 py-4 text-sm text-center font-bold text-amber-600">{run.flaggedCount}</td>
                          <td className="px-6 py-4 text-[10px] font-mono text-slate-400">
                            {run.runId.substring(0, 12)}...
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${selectedRun?.runId === run.runId ? 'rotate-90 text-[#9FC23F]' : ''}`} />
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                            {isLoadingRuns ? 'Loading history...' : 'No runs loaded. Use filter and load recent runs.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Detail Panel */}
              <AnimatePresence>
                {selectedRun && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 space-y-6 overflow-hidden"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Run Audit Detail</h3>
                        <p className="text-xs text-slate-400 font-mono mt-1">ID: {selectedRun.runId}</p>
                      </div>
                      {auditDetails && (
                        <div className="flex gap-4">
                          <div className="bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 text-center">
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Fraud Marked</p>
                            <p className="text-lg font-black text-rose-700">{auditDetails.fraudMarkedCount}</p>
                          </div>
                          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Lines</p>
                            <p className="text-lg font-black text-slate-700">{auditDetails.lines.length}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {isLoadingAudit ? (
                      <div className="py-12 flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#9FC23F] animate-spin" />
                        <p className="text-sm font-bold text-slate-400 animate-pulse">Fetching Line-by-Line Audit...</p>
                      </div>
                    ) : auditDetails ? (
                      <div className="space-y-4">
                        {auditDetails.lines.map((line, idx) => (
                          <div key={idx} className="border border-slate-100 rounded-2xl p-6 hover:border-slate-200 transition-all bg-slate-50/30">
                            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${
                                  line.actionTaken === 'FraudMarked' ? 'bg-rose-500 animate-pulse' : 
                                  line.actionTaken === 'AutoFixed' ? 'bg-blue-500' : 'bg-[#9FC23F]'
                                }`}></span>
                                <p className="font-bold text-slate-800 text-sm">{line.orderNumber}</p>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
                                  {line.actionTaken}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(line.createdAtUtc).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue & Reason</p>
                                <p className="text-xs font-bold text-slate-700">{line.mismatchType} <span className="text-slate-400 font-normal">({line.reasonCode})</span></p>
                                <p className="text-xs text-slate-500 italic leading-relaxed">{line.reasonText}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Diff (JSON)</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="p-3 bg-white border border-slate-100 rounded-lg">
                                    <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter mb-1">Before</p>
                                    <pre className="text-[9px] font-mono whitespace-pre-wrap text-slate-400 truncate">{line.beforeJson}</pre>
                                  </div>
                                  <div className="p-3 bg-white border border-slate-100 rounded-lg">
                                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter mb-1">After</p>
                                    <pre className="text-[9px] font-mono whitespace-pre-wrap text-slate-400 truncate">{line.afterJson}</pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-sm italic">Failed to load audit data.</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="help-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <section className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#9FC23F]"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-[#9FC23F]/10 rounded-2xl">
                    <HelpCircle className="w-7 h-7 text-[#9FC23F]" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Technical Reference</h2>
                    <p className="text-slate-400 font-medium">Reconciliation Internal Logic & Policies</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 font-sans">
                  <div className="space-y-8">
                    <div className="relative pl-12">
                      <div className="absolute left-0 top-0 w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-[#9FC23F] font-black">1</div>
                      <h4 className="font-bold text-slate-900 mb-2">Stripe Integrity Check</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">System performs bidirectional verification. We match Payment Intents in Stripe with DB transactions using metadata descriptions and charge references.</p>
                    </div>
                    <div className="relative pl-12">
                      <div className="absolute left-0 top-0 w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-[#9FC23F] font-black">2</div>
                      <h4 className="font-bold text-slate-900 mb-2">Automated Resolutions</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">Safety-first updates (e.g. syncing TransactionId to Paid orders) are performed instantly to maintain database consistency.</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="relative pl-12">
                      <div className="absolute left-0 top-0 w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-[#9FC23F] font-black">3</div>
                      <h4 className="font-bold text-slate-900 mb-2">Fraud Isolation</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">Orders marked `Paid/Succeeded` in DB without a valid matching Stripe charge are flagged as `IsOrderFraudulent` (unless in Report-Only mode).</p>
                    </div>
                    <div className="relative pl-12">
                      <div className="absolute left-0 top-0 w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-[#9FC23F] font-black">4</div>
                      <h4 className="font-bold text-slate-900 mb-2">Timezone Window</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">Engine calculates a sliding UTC window based on the waterpark's specific timezone to ensure proper calendar day alignment.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-slate-950 p-10 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#9FC23F]/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 font-sans">
                  <div className="md:col-span-2">
                    <h3 className="text-2xl font-black text-white mb-4 tracking-tight flex items-center gap-3">
                      <ShieldAlert className="w-6 h-6 text-[#9FC23F]" />
                      Auditor Security Note
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      Every manual trigger is logged with the user's ID and timestamp. Attempts to run reconciliation for dates in the future or for auth codes not mapped to your organization will be rejected and flagged for review.
                    </p>
                    <div className="flex gap-4">
                      <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-[#9FC23F]">
                        ENGINE: v2.4a
                      </div>
                      <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-[#9FC23F]">
                        AUDIT: Enabled
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Environment</p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Auth Policy</span>
                          <span className="text-[10px] text-white font-black uppercase">Standard</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Stripe API</span>
                          <span className="text-[10px] text-emerald-400 font-black uppercase">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
        </main>

      <footer className="bg-white border-t border-slate-200 py-8 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <img 
              src="https://dashboard.kiwiticketing.com/wp-content/themes/kiwiticketing/assets/images/logo.svg" 
              alt="Logo" 
              className="h-5 opacity-40 grayscale"
            />
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] font-sans">Internal Admin portal</span>
          </div>
          <div className="text-slate-400 text-[11px] font-medium font-sans">
            © 2026 Kiwiticketing. All rights reserved. Secure Cloud Access.
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
