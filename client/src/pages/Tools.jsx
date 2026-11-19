// pages/Tools.jsx
// Standalone public page providing live client-side Password Strength Checker
// and CSPRNG Password Generator tools without requiring login.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthChecker from '../components/PasswordStrengthChecker';
import PasswordGenerator from '../components/PasswordGenerator';
import { copyWithAutoClear } from '../utils/clipboard';
import Toast from '../components/Toast';

export default function Tools() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleSaveToVault = async (password) => {
    if (user) {
      // Save prefilled password to sessionStorage so Dashboard can open the Add modal with it
      sessionStorage.setItem('prefill_vault_password', password);
      navigate('/dashboard');
    } else {
      await copyWithAutoClear(password, () => {
        showToast('🧹 Clipboard auto-cleared after 15s.');
      }, 15000);
      showToast('Password copied! (Auto-clearing in 15s). Sign in or register to save permanently.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-2xl">🔐</span>
            <span className="text-xl font-bold">VaultKey</span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Security Tools
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-colors shadow-md"
              >
                Go to Vault →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-300 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-xl transition-colors shadow-md"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Client-Side Security Suite
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Audit existing credentials or generate high-entropy keys. Evaluated directly in your browser without transmitting unencrypted passwords over the network.
          </p>
        </div>

        {/* Tools Grid: 2 columns on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Tool 1: Strength Checker */}
          <PasswordStrengthChecker showHeader={true} />

          {/* Tool 2: Password Generator */}
          <PasswordGenerator
            showHeader={true}
            onSaveToVault={handleSaveToVault}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-6 text-center text-xs text-gray-500">
        VaultKey • Built with AES-256 and Web Crypto CSPRNG
      </footer>

      {/* Toast Feedback */}
      <Toast message={toast} />
    </div>
  );
}
