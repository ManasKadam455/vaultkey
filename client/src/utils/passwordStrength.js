// utils/passwordStrength.js
// Client-side password strength analyzer.
// Evaluates length, character diversity, patterns, and known common passwords.

// Common leaked or trivial passwords to immediately flag
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', '123456789', '12345',
  'qwerty', '111111', '1234567', 'dragon', 'admin', 'welcome', 'login',
  'football', 'monkey', 'letmein', 'master', 'iloveyou', 'sunshine',
  'princess', 'solo', 'starwars', 'pass123', 'secret', 'hunter2', 'vaultkey'
]);

/**
 * Evaluates password strength live.
 * Returns: {
 *   score: 0 (Weak) to 4 (Very Strong),
 *   label: 'Weak' | 'Fair' | 'Strong',
 *   color: string (Tailwind color classes),
 *   percentage: number (0 - 100),
 *   tips: string[] (actionable feedback),
 *   checks: { length: bool, uppercase: bool, lowercase: bool, numbers: bool, symbols: bool, noRepetition: bool, notCommon: bool }
 * }
 */
export function checkPasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: 'Too short',
      color: 'bg-gray-600 text-gray-400',
      percentage: 0,
      tips: ['Enter a password to evaluate its strength.'],
      checks: {
        length: false,
        lowercase: false,
        uppercase: false,
        numbers: false,
        symbols: false,
        noRepetition: false,
        notCommon: true,
      },
    };
  }

  const tips = [];
  const checks = {
    length: password.length >= 8,
    longLength: password.length >= 14,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^a-zA-Z0-9]/.test(password),
    noRepetition: !/(.)\1{2,}/i.test(password) && !/(?:abc|bcd|cde|def|123|234|345|456|567|678|789|qwe|asd|zxc)/i.test(password),
    notCommon: !COMMON_PASSWORDS.has(password.toLowerCase().trim()),
  };

  // Immediate fail for known common passwords
  if (!checks.notCommon) {
    return {
      score: 1,
      label: 'Weak',
      color: 'bg-red-500 text-red-400',
      percentage: 15,
      tips: [
        '⚠️ This is an extremely common password that is easily cracked via wordlist attacks.',
        'Choose a unique combination of random words or characters.',
      ],
      checks,
    };
  }

  // Calculate score points (0 to 6)
  let rawScore = 0;

  if (checks.length) rawScore += 1;
  if (checks.longLength) rawScore += 1;
  if (checks.lowercase && checks.uppercase) rawScore += 1;
  if (checks.numbers) rawScore += 1;
  if (checks.symbols) rawScore += 1;
  if (checks.noRepetition) rawScore += 1;

  // Add actionable tips based on failing checks
  if (password.length < 8) {
    tips.push('Use at least 8 characters (12-16+ recommended for strong security).');
  } else if (password.length < 12) {
    tips.push('Add more characters — length is the single biggest factor against brute-force.');
  }

  if (!checks.uppercase) {
    tips.push('Add uppercase letters (A-Z) to increase entropy.');
  }

  if (!checks.lowercase) {
    tips.push('Add lowercase letters (a-z).');
  }

  if (!checks.numbers) {
    tips.push('Add numbers (0-9).');
  }

  if (!checks.symbols) {
    tips.push('Add special symbols (!@#$%^&*...) to expand the character keyspace.');
  }

  if (!checks.noRepetition) {
    tips.push('Avoid repetitive characters (e.g. "aaa") or common sequences (e.g. "123", "qwerty").');
  }

  // Map rawScore (0-6) into 3 primary tiers: Weak / Fair / Strong
  let label = 'Weak';
  let color = 'bg-red-500 text-red-400';
  let percentage = 25;

  if (rawScore <= 2) {
    label = 'Weak';
    color = 'bg-red-500 text-red-400';
    percentage = Math.max(20, Math.min(35, rawScore * 18));
  } else if (rawScore <= 4) {
    label = 'Fair';
    color = 'bg-amber-500 text-amber-400';
    percentage = 65;
  } else {
    label = 'Strong';
    color = 'bg-emerald-500 text-emerald-400';
    percentage = 100;
  }

  if (tips.length === 0) {
    tips.push('✅ Excellent! This password has high entropy, varied character sets, and no predictable patterns.');
  }

  return {
    score: rawScore,
    label,
    color,
    percentage,
    tips,
    checks,
  };
}
