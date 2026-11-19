// components/CredentialCard.jsx
// Displays a single vault entry. The parent (Dashboard) manages visibility and
// copied state so the card itself stays stateless and simple.

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

// Pick a consistent accent colour for the site-initial avatar based on name
const AVATAR_COLOURS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500',
  'bg-teal-500',   'bg-rose-500',   'bg-amber-500',
];
const avatarColour = (name) =>
  AVATAR_COLOURS[name.charCodeAt(0) % AVATAR_COLOURS.length];

export default function CredentialCard({
  credential,
  passwordVisible,
  copiedField,       // { field: 'username'|'password' } or null
  onTogglePassword,
  onCopy,
  onEdit,
  onDelete,
}) {
  const { _id, siteName, siteUrl, username, password, category } = credential;

  return (
    <div className="bg-gray-800 rounded-2xl p-5 flex flex-col gap-4 border border-gray-700/50
                    hover:border-indigo-500/40 transition-colors group">

      {/* Top row: avatar + site name + category badge */}
      <div className="flex items-start gap-3">
        {/* Site initial avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                         text-white font-bold text-lg ${avatarColour(siteName)}`}>
          {siteName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base truncate">{siteName}</h3>
          {siteUrl ? (
            <a
              href={siteUrl} target="_blank" rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-xs truncate block transition-colors"
            >
              {siteUrl.replace(/^https?:\/\//, '')}
            </a>
          ) : (
            <span className="text-gray-500 text-xs">No URL</span>
          )}
        </div>

        {/* Category badge */}
        <span className={`flex-shrink-0 text-xs font-medium text-white px-2.5 py-0.5 rounded-full ${badgeColour(category)}`}>
          {category}
        </span>
      </div>

      {/* Credentials rows */}
      <div className="space-y-2.5">

        {/* Username row */}
        <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
          <span className="text-gray-400 text-xs w-16 flex-shrink-0">Username</span>
          <span className="text-gray-200 text-sm truncate flex-1">{username}</span>
          <CopyButton
            copied={copiedField?.field === 'username'}
            onClick={() => onCopy(_id, 'username', username)}
          />
        </div>

        {/* Password row */}
        <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
          <span className="text-gray-400 text-xs w-16 flex-shrink-0">Password</span>
          <span className="text-gray-200 text-sm truncate flex-1 font-mono">
            {passwordVisible ? password : '•'.repeat(Math.min(password.length, 12))}
          </span>
          {/* Show/hide toggle */}
          <button
            onClick={() => onTogglePassword(_id)}
            className="text-gray-400 hover:text-white transition-colors text-sm flex-shrink-0"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          >
            {passwordVisible ? '🙈' : '👁'}
          </button>
          <CopyButton
            copied={copiedField?.field === 'password'}
            onClick={() => onCopy(_id, 'password', password)}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onEdit(credential)}
          className="flex-1 text-xs font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600
                     rounded-lg py-1.5 transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onDelete(_id)}
          className="flex-1 text-xs font-medium text-red-400 hover:text-white bg-gray-700 hover:bg-red-600
                     rounded-lg py-1.5 transition-colors"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

// Small reusable copy button — shows a tick when just copied
function CopyButton({ copied, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 text-sm transition-colors
        ${copied ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
      aria-label="Copy to clipboard"
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}
