// pages/Dashboard.jsx
// The main vault interface with embedded CSPRNG Generator & Strength Checker tools.

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import CredentialCard  from '../components/CredentialCard';
import CredentialModal from '../components/CredentialModal';
import PasswordGenerator from '../components/PasswordGenerator';
import PasswordStrengthChecker from '../components/PasswordStrengthChecker';
import { copyWithAutoClear } from '../utils/clipboard';
import Toast from '../components/Toast';

export default function Dashboard() {
  const { user, logout } = useAuth();

  // --- Core data ---
  const [credentials, setCredentials] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // --- UI state ---
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('All');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null); // null = create mode
  const [showTools,   setShowTools]   = useState(false); // toggle inline security tools

  // Track which cards have their password visible (by credential _id)
  const [visiblePwds, setVisiblePwds] = useState(new Set());

  // Track the most recently copied field for 2-second feedback
  const [copiedField, setCopiedField] = useState(null);

  // Brief toast message shown at screen bottom
  const [toast, setToast] = useState('');

  // ── Fetch credentials ──────────────────────────────────────────────
  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/vault');
      setCredentials(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();

    // Check if user came from public /tools page with a generated password to save
    const prefill = sessionStorage.getItem('prefill_vault_password');
    if (prefill) {
      sessionStorage.removeItem('prefill_vault_password');
      setEditTarget({ password: prefill, category: 'General' });
      setModalOpen(true);
      showToast('Generated password prefilled into new credential form!');
    }
  }, [fetchCredentials]);

  // ── Derived / filtered list ────────────────────────────────────────
  const categories = ['All', ...new Set(credentials.map((c) => c.category))];

  const filtered = credentials.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.siteName.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q);
    const matchCategory = category === 'All' || c.category === category;
    return matchSearch && matchCategory;
  });

  // ── CRUD handlers ──────────────────────────────────────────────────
  const handleSave = async (form) => {
    if (editTarget?._id) {
      // For edits, only send password if the user typed a new one
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await api.put(`/vault/${editTarget._id}`, payload);
      showToast('Credential updated ✓');
    } else {
      await api.post('/vault', form);
      showToast('Credential saved to vault ✓');
    }
    closeModal();
    fetchCredentials();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this credential? This cannot be undone.')) return;
    try {
      await api.delete(`/vault/${id}`);
      setCredentials((prev) => prev.filter((c) => c._id !== id));
      showToast('Credential deleted');
    } catch {
      showToast('Delete failed — please try again');
    }
  };

  // ── Password visibility toggle ──────────────────────────────────────
  const togglePassword = (id) => {
    setVisiblePwds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Copy to clipboard with 15s auto-clear ──────────────────────────
  const handleCopy = async (id, field, text) => {
    setCopiedField({ id, field });

    if (field === 'password') {
      const ok = await copyWithAutoClear(text, () => {
        showToast('🧹 Clipboard auto-cleared after 15 seconds.');
      }, 15000);

      if (ok) {
        showToast('Password copied! (Auto-clearing in 15s ⏱️)');
      } else {
        showToast('Copy failed — check browser permissions');
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Username copied!');
      } catch {
        showToast('Copy failed — check browser permissions');
      }
    }

    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Pre-fill generator password into Add Form ───────────────────────
  const handleSaveGeneratedToVault = (pwd) => {
    setEditTarget({ password: pwd, category: 'General' });
    setModalOpen(true);
  };

  // ── Modal helpers ───────────────────────────────────────────────────
  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit   = (cred) => { setEditTarget(cred); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  // ── Toast helper ────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔐</span>
            <span className="text-xl font-bold tracking-tight">VaultKey</span>
            <Link
              to="/tools"
              className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors hidden sm:inline-block"
            >
              Public Tools Page ↗
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">
              {user?.name || user?.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5
                         border border-gray-700 hover:border-gray-500 rounded-lg"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Title row + Action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">My Vault</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {credentials.length} credential{credentials.length !== 1 ? 's' : ''} stored securely with AES-256
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Toggle Security Tools Drawer */}
            <button
              onClick={() => setShowTools((v) => !v)}
              className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2.5 rounded-xl border transition-all
                ${showTools
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'}`}
            >
              <span>⚡</span>
              <span>{showTools ? 'Hide Tools' : 'Security Tools'}</span>
            </button>

            {/* Add Credential Button */}
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500
                         text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg text-sm"
            >
              <span className="text-base leading-none">+</span>
              <span>Add credential</span>
            </button>
          </div>
        </div>

        {/* ── Collapsible Security Tools Panel ── */}
        {showTools && (
          <div className="mb-8 p-6 bg-gray-800/60 border border-indigo-500/30 rounded-2xl animate-fade-in-down">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🛠️</span>
                  <span>Vault Security Utilities</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Generate strong credentials and prefill directly into your vault, or evaluate existing passwords.
                </p>
              </div>
              <button
                onClick={() => setShowTools(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-gray-700/60"
              >
                Close ✕
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PasswordGenerator onSaveToVault={handleSaveGeneratedToVault} />
              <PasswordStrengthChecker />
            </div>
          </div>
        )}

        {/* Search + Category filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by site, username or category…"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-2.5
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 rounded-xl px-4 py-2.5
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition cursor-pointer sm:w-44"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 mb-6">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-2xl p-5 h-44 animate-pulse border border-gray-700/50" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-800">
            <p className="text-5xl mb-4">🗝</p>
            {credentials.length === 0 ? (
              <>
                <p className="text-gray-300 font-semibold text-lg">Your vault is empty</p>
                <p className="text-gray-500 mt-1 text-sm max-w-sm mx-auto mb-4">
                  Add credentials manually or use the Password Generator above to create strong random passwords.
                </p>
                <button
                  onClick={() => setShowTools(true)}
                  className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 px-3.5 py-2 rounded-xl transition"
                >
                  ⚡ Open Password Generator
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-300 font-semibold text-lg">No matching credentials</p>
                <p className="text-gray-500 mt-1 text-sm">Try clearing your search or category filter</p>
              </>
            )}
          </div>
        )}

        {/* Credential grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cred) => (
              <CredentialCard
                key={cred._id}
                credential={cred}
                passwordVisible={visiblePwds.has(cred._id)}
                copiedField={copiedField?.id === cred._id ? copiedField : null}
                onTogglePassword={togglePassword}
                onCopy={handleCopy}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ── */}
      {modalOpen && (
        <CredentialModal
          credential={editTarget}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* ── Toast ── */}
      <Toast message={toast} />
    </div>
  );
}
