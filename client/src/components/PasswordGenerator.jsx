// components/PasswordGenerator.jsx
// Cryptographically secure password generator UI using Web Crypto API
// with 15-second automatic clipboard wipe.

import { useState, useEffect, useCallback } from 'react';
import { generatePassword } from '../utils/passwordGenerator';
import { checkPasswordStrength } from '../utils/passwordStrength';
import { copyWithAutoClear } from '../utils/clipboard';

export default function PasswordGenerator({ onSaveToVault, showHeader = true }) {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');

  // Generate a fresh password whenever length or options change
  const handleGenerate = useCallback(() => {
    const pwd = generatePassword({
      length,
      ...options,
    });
    setGeneratedPassword(pwd);
    setCopied(false);
    setNotice('');
  }, [length, options]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const toggleOption = (key) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Prevent unchecking everything — at least one character set must remain active
      const hasAny = Object.values(next).some(Boolean);
      return hasAny ? next : prev;
    });
  };

  const handleCopy = async () => {
    if (!generatedPassword) return;

    const ok = await copyWithAutoClear(generatedPassword, () => {
      setNotice('🧹 Clipboard cleared after 15s');
      setTimeout(() => setNotice(''), 3000);
    }, 15000);

    if (ok) {
      setCopied(true);
      setNotice('Copied! Auto-clears in 15s ⏱️');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const strength = checkPasswordStrength(generatedPassword);

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/60 shadow-xl flex flex-col gap-5">
      {showHeader && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⚡</span>
            <h3 className="text-lg font-semibold text-white">Password Generator</h3>
          </div>
          <p className="text-xs text-gray-400">
            CSPRNG-powered generator using hardware entropy via <code className="text-indigo-400">crypto.getRandomValues</code> with 15s auto-clear clipboard security.
          </p>
        </div>
      )}

      {/* Output Display Box */}
      <div className="space-y-1.5">
        <div className="relative bg-gray-900 border border-gray-700/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <span className="font-mono text-base text-emerald-400 font-semibold break-all select-all flex-1">
            {generatedPassword}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Refresh / Regenerate */}
            <button
              type="button"
              onClick={handleGenerate}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Generate New Password"
              aria-label="Generate New Password"
            >
              🔄
            </button>
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1
                ${copied ? 'bg-emerald-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'}`}
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Temporary Copy/Auto-clear notice */}
        {notice && (
          <div className="text-[11px] text-indigo-400 font-medium px-1 flex items-center gap-1">
            <span>ℹ️</span>
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* Mini Strength Indicator for Generated Password */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Entropy Level:</span>
          <span className={`font-semibold ${strength.label === 'Strong' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {strength.label}
          </span>
        </div>
        <span className="text-gray-500 font-mono">{length} characters</span>
      </div>

      {/* Length Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-300 font-medium">
          <span>Password Length</span>
          <span className="font-mono text-indigo-400 font-bold">{length}</span>
        </div>
        <input
          type="range"
          min="8"
          max="48"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full accent-indigo-500 bg-gray-700 rounded-lg cursor-pointer h-2"
        />
        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
          <span>8 chars</span>
          <span>24 chars</span>
          <span>48 chars</span>
        </div>
      </div>

      {/* Character Type Toggles */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <ToggleItem
          label="Uppercase (A-Z)"
          checked={options.uppercase}
          onChange={() => toggleOption('uppercase')}
        />
        <ToggleItem
          label="Lowercase (a-z)"
          checked={options.lowercase}
          onChange={() => toggleOption('lowercase')}
        />
        <ToggleItem
          label="Numbers (0-9)"
          checked={options.numbers}
          onChange={() => toggleOption('numbers')}
        />
        <ToggleItem
          label="Symbols (!@#$...)"
          checked={options.symbols}
          onChange={() => toggleOption('symbols')}
        />
      </div>

      {/* Save to Vault Action Button */}
      {onSaveToVault && (
        <button
          type="button"
          onClick={() => onSaveToVault(generatedPassword)}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl
                     shadow-lg transition-colors flex items-center justify-center gap-2 text-sm mt-1"
        >
          <span>🔐</span>
          <span>Save to Vault</span>
        </button>
      )}
    </div>
  );
}

function ToggleItem({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-900/60 border border-gray-700/40 cursor-pointer hover:bg-gray-900 transition-colors select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded text-indigo-600 accent-indigo-500 bg-gray-700 border-gray-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
      />
      <span className="text-gray-300 font-medium text-xs">{label}</span>
    </label>
  );
}
