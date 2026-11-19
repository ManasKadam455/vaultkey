// components/CredentialModal.jsx
// Handles both creating a new credential (when 'credential' prop is null or empty)
// and editing an existing one (when 'credential' prop has an _id).
// Includes live password strength meter when typing or generating a password.

import { useState } from 'react';
import { checkPasswordStrength } from '../utils/passwordStrength';

// Deterministic colour for a category badge
const CATEGORY_COLOURS = {
  General:  'bg-gray-600',
  Social:   'bg-blue-600',
  Dev:      'bg-green-600',
  Finance:  'bg-yellow-600',
  Email:    'bg-purple-600',
  Work:     'bg-orange-600',
  Shopping: 'bg-pink-600',
};
const badgeColour = (cat) => CATEGORY_COLOURS[cat] || 'bg-indigo-600';

const CATEGORIES = ['General', 'Social', 'Dev', 'Finance', 'Email', 'Work', 'Shopping'];

export default function CredentialModal({ credential, onSave, onClose }) {
  const isEditing = Boolean(credential?._id);

  const [form, setForm] = useState({
    siteName: credential?.siteName || '',
    siteUrl:  credential?.siteUrl  || '',
    username: credential?.username || '',
    password: credential?.password || '',
    category: credential?.category || 'General',
  });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState([]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await onSave(form);           // parent handles the actual API call
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors.map((e) => e.msg));
      } else {
        setErrors([err.response?.data?.error || 'Something went wrong']);
      }
      setLoading(false);            // keep modal open so user can fix errors
    }
  };

  // Close on backdrop click (but not on the card itself)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const strength = form.password ? checkPasswordStrength(form.password) : null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Edit credential' : 'Add credential'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4">

          {/* Error list */}
          {errors.length > 0 && (
            <ul className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 space-y-1">
              {errors.map((msg, i) => <li key={i}>• {msg}</li>)}
            </ul>
          )}

          {/* Site name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Site name <span className="text-red-400">*</span>
            </label>
            <input
              type="text" name="siteName" required autoFocus={!isEditing}
              value={form.siteName} onChange={handleChange}
              placeholder="GitHub"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Site URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Site URL</label>
            <input
              type="url" name="siteUrl"
              value={form.siteUrl} onChange={handleChange}
              placeholder="https://github.com"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Username / Email <span className="text-red-400">*</span>
            </label>
            <input
              type="text" name="username" required
              value={form.username} onChange={handleChange}
              placeholder="alice@example.com"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Password with show/hide and mini strength check */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                required={!isEditing}
                value={form.password} onChange={handleChange}
                placeholder={isEditing ? 'Leave blank to keep current' : '••••••••'}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 pr-11 font-mono
                           placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>

            {/* Live Mini Strength meter */}
            {form.password && strength && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">Password strength:</span>
                  <span className={`font-semibold ${
                    strength.label === 'Strong' ? 'text-emerald-400' :
                    strength.label === 'Fair' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {strength.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength.label === 'Strong' ? 'bg-emerald-500' :
                      strength.label === 'Fair' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${strength.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat} type="button"
                  onClick={() => setForm((p) => ({ ...p, category: cat }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium text-white transition-opacity
                    ${badgeColour(cat)} ${form.category === cat ? 'opacity-100 ring-2 ring-white/40' : 'opacity-40 hover:opacity-70'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed
                         text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Saving…' : (isEditing ? 'Save changes' : 'Add credential')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
