// utils/passwordGenerator.js
// Cryptographically secure password generator using the Web Crypto API.
//
// WHY crypto.getRandomValues instead of Math.random()?
//   Math.random() uses a pseudo-random number generator (PRNG like xorshift128+)
//   whose seed and internal state can be reconstructed by an attacker after
//   observing a sequence of outputs.
//   crypto.getRandomValues() queries the OS cryptographically secure pseudorandom
//   number generator (CSPRNG), seeded by hardware entropy (keyboard timings,
//   mouse movements, CPU interrupt intervals), making future outputs unpredictable.

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Returns a cryptographically secure random integer in [0, max - 1].
 * Uses rejection sampling to eliminate modulo bias.
 */
function getSecureRandomInt(max) {
  if (max <= 1) return 0;

  // Max value of a 32-bit unsigned integer (2^32 - 1)
  const maxUint32 = 0xffffffff;
  // Largest multiple of `max` that fits in a 32-bit unsigned integer
  const limit = maxUint32 - (maxUint32 % max);

  const buffer = new Uint32Array(1);
  let randomVal;

  // Reject values in the biased upper slice so each index in [0, max - 1]
  // has the exact same probability.
  do {
    window.crypto.getRandomValues(buffer);
    randomVal = buffer[0];
  } while (randomVal >= limit);

  return randomVal % max;
}

/**
 * Generates a cryptographically random password according to selected options.
 *
 * @param {Object} options
 * @param {number} options.length - Length of password (default: 16)
 * @param {boolean} options.uppercase - Include A-Z
 * @param {boolean} options.lowercase - Include a-z
 * @param {boolean} options.numbers - Include 0-9
 * @param {boolean} options.symbols - Include !@#$%...
 * @returns {string} The generated password
 */
export function generatePassword({
  length = 16,
  uppercase = true,
  lowercase = true,
  numbers = true,
  symbols = true,
} = {}) {
  let pool = '';
  const guaranteedChars = [];

  // Guarantee at least one character from each selected set
  if (uppercase) {
    pool += CHAR_SETS.uppercase;
    guaranteedChars.push(CHAR_SETS.uppercase[getSecureRandomInt(CHAR_SETS.uppercase.length)]);
  }
  if (lowercase) {
    pool += CHAR_SETS.lowercase;
    guaranteedChars.push(CHAR_SETS.lowercase[getSecureRandomInt(CHAR_SETS.lowercase.length)]);
  }
  if (numbers) {
    pool += CHAR_SETS.numbers;
    guaranteedChars.push(CHAR_SETS.numbers[getSecureRandomInt(CHAR_SETS.numbers.length)]);
  }
  if (symbols) {
    pool += CHAR_SETS.symbols;
    guaranteedChars.push(CHAR_SETS.symbols[getSecureRandomInt(CHAR_SETS.symbols.length)]);
  }

  // Fallback to lowercase if no checkboxes were selected
  if (!pool) {
    pool = CHAR_SETS.lowercase;
    guaranteedChars.push(CHAR_SETS.lowercase[getSecureRandomInt(CHAR_SETS.lowercase.length)]);
  }

  // Fill the remaining length with random selections from the whole pool
  const passwordChars = [...guaranteedChars];
  for (let i = passwordChars.length; i < length; i++) {
    passwordChars.push(pool[getSecureRandomInt(pool.length)]);
  }

  // Shuffle the array using the Fisher-Yates algorithm driven by CSPRNG
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.slice(0, length).join('');
}
