// pages/Register.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate      = useNavigate();

  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [errors,  setErrors]  = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      // express-validator returns an 'errors' array; general errors return 'error' or 'message'
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors.map((e) => e.msg));
      } else {
        const errorMsg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Registration failed';
        setErrors([errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-white">VaultKey</h1>
          <p className="text-gray-400 mt-1">Create your free vault</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-8 shadow-xl space-y-5">

          {/* Error list */}
          {errors.length > 0 && (
            <ul className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 space-y-1">
              {errors.map((msg, i) => <li key={i}>• {msg}</li>)}
            </ul>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
            <input
              type="text" name="name" required autoFocus
              value={form.name} onChange={handleChange}
              placeholder="Alice"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email" name="email" required
              value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
              <span className="text-gray-500 font-normal ml-2">(min. 8 characters)</span>
            </label>
            <input
              type="password" name="password" required minLength={8}
              value={form.password} onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed
                       text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          <div className="pt-2 border-t border-gray-700/60 text-center">
            <Link to="/tools" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors">
              🛡️ Try our Password Strength & Generator Tools →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
