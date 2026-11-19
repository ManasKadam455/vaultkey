// components/PasswordStrengthChecker.jsx
// Interactive live password strength evaluator with HaveIBeenPwned breach check
// using the k-Anonymity mathematical privacy model.

import { useState } from 'react';
import { checkPasswordStrength } from '../utils/passwordStrength';
import api from '../api/axios';

export default function PasswordStrengthChecker({ initialValue = '', showHeader = true }) {
  const [password, setPassword] = useState(initialValue);
  const [showPassword, setShowPassword] = useState(false);

  // Breach check state
  const [breachCheck, setBreachCheck] = useState({
    status: 'idle', // 'idle' | 'loading' | 'breached' | 'clean' | 'error'
    count: 0,
    prefix: '',
    errorMsg: '',
  });

  const result = checkPasswordStrength(password);

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    // Reset breach check when password changes
    if (breachCheck.status !== 'idle') {
      setBreachCheck({ status: 'idle', count: 0, prefix: '', errorMsg: '' });
    }
  };

  // Perform k-anonymity breach check via server endpoint
  const handleCheckBreach = async () => {
    if (!password) return;

    setBreachCheck({ status: 'loading', count: 0, prefix: '', errorMsg: '' });

    try {
      const { data } = await api.post('/tools/breach-check', { password });

      if (data.breached) {
        setBreachCheck({
          status: 'breached',
          count: data.count,
          prefix: data.prefix,
          errorMsg: '',
        });
      } else {
        setBreachCheck({
          status: 'clean',
          count: 0,
          prefix: data.prefix,
          errorMsg: '',
        });
      }
    } catch (err) {
      setBreachCheck({
        status: 'error',
        count: 0,
        prefix: '',
        errorMsg: err.response?.data?.error || 'Unable to contact breach check service.',
      });
    }
  };

  const getBarColor = (label) => {
    if (breachCheck.status === 'breached') return 'bg-red-500';
    switch (label) {
      case 'Weak':
        return 'bg-red-500';
      case 'Fair':
        return 'bg-amber-500';
      case 'Strong':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-600';
    }
  };

  const getBadgeColor = (label) => {
    if (breachCheck.status === 'breached') {
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    }
    switch (label) {
      case 'Weak':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'Fair':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Strong':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-gray-700 text-gray-400 border border-gray-600';
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/60 shadow-xl flex flex-col gap-5">
      {showHeader && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🛡️</span>
            <h3 className="text-lg font-semibold text-white">Password Strength & Breach Checker</h3>
          </div>
          <p className="text-xs text-gray-400">
            Real-time entropy analysis coupled with zero-knowledge HaveIBeenPwned breach verification.
          </p>
        </div>
      )}

      {/* Input Field with Show/Hide toggle */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCheckBreach(); }}
            placeholder="Type or paste a password to test..."
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 pr-12
                       placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-base"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        </div>

        {/* Breach Check Trigger Button */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Press Enter or click check to query breach records
          </span>
          <button
            type="button"
            onClick={handleCheckBreach}
            disabled={!password || breachCheck.status === 'loading'}
            className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 disabled:opacity-40 disabled:hover:bg-indigo-600/30
                       text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            {breachCheck.status === 'loading' ? (
              <>
                <span className="animate-spin text-xs">⏳</span>
                <span>Checking HIBP…</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>Check HaveIBeenPwned</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Breach Check Results Banner */}
      {breachCheck.status === 'breached' && (
        <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-xs sm:text-sm">
            <span>⚠️</span>
            <span>Compromised in {breachCheck.count.toLocaleString()} Data Breaches!</span>
          </div>
          <p className="text-xs text-red-300/80 leading-relaxed">
            This password appears in known publicly leaked databases. Hackers use these lists for credential stuffing attacks. Do not use this password!
          </p>
          <p className="text-[10px] text-gray-500 pt-1">
            Privacy: Checked via k-Anonymity (prefix <code>{breachCheck.prefix}</code> sent; full hash kept private).
          </p>
        </div>
      )}

      {breachCheck.status === 'clean' && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-2.5">
          <span className="text-emerald-400 text-base leading-none">✓</span>
          <div>
            <span className="text-xs font-semibold text-emerald-400 block">
              No Breaches Detected in HaveIBeenPwned
            </span>
            <span className="text-[11px] text-emerald-300/70 block mt-0.5">
              Verified using k-Anonymity — your raw password was never exposed to HIBP.
            </span>
          </div>
        </div>
      )}

      {breachCheck.status === 'error' && (
        <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-xl p-3">
          ⚠️ {breachCheck.errorMsg} (Local strength check remains fully operational).
        </div>
      )}

      {/* Strength Bar & Badge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 font-medium">Strength Assessment</span>
          <span className={`px-2.5 py-0.5 rounded-full font-semibold text-xs transition-all ${getBadgeColor(result.label)}`}>
            {breachCheck.status === 'breached' ? 'Compromised' : result.label}
          </span>
        </div>

        {/* Multi-segment styled colored bar */}
        <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden p-0.5 flex gap-1">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getBarColor(result.label)}`}
            style={{ width: `${breachCheck.status === 'breached' ? 100 : result.percentage}%` }}
          />
        </div>
      </div>

      {/* Check Criteria Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <CriteriaItem label="8+ chars" met={result.checks.length} />
        <CriteriaItem label="14+ chars" met={result.checks.longLength} />
        <CriteriaItem label="Uppercase (A-Z)" met={result.checks.uppercase} />
        <CriteriaItem label="Lowercase (a-z)" met={result.checks.lowercase} />
        <CriteriaItem label="Numbers (0-9)" met={result.checks.numbers} />
        <CriteriaItem label="Symbols (!@#)" met={result.checks.symbols} />
      </div>

      {/* Actionable Tips */}
      {result.tips.length > 0 && (
        <div className="bg-gray-900/70 border border-gray-700/50 rounded-xl p-3.5 space-y-1.5">
          <span className="text-xs font-semibold text-gray-300 block">Security Recommendations:</span>
          <ul className="text-xs text-gray-400 space-y-1">
            {result.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CriteriaItem({ label, met }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors
        ${met ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-gray-900/60 border-gray-800 text-gray-500'}`}
    >
      <span>{met ? '✓' : '✕'}</span>
      <span>{label}</span>
    </div>
  );
}
