// utils/crypto.js
// AES-256-CBC encryption/decryption helpers for vault passwords.
//
// WHY AES-256-CBC?
//   AES-256 is a NIST-approved symmetric cipher. With a 256-bit key it has
//   no known practical attacks. CBC (Cipher Block Chaining) mode means each
//   block is XOR-ed with the previous ciphertext block before encryption,
//   so identical plaintexts produce different ciphertexts when given
//   different IVs — which is exactly what we do (fresh random IV per save).
//
// WHY store the IV alongside the ciphertext?
//   The IV doesn't need to be secret — its only job is to make each
//   encryption unique. Storing it in the DB lets us decrypt later.
//   The secret is the ENCRYPTION_KEY, which never touches the DB.

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc'; // requires a 32-byte key and 16-byte IV
const IV_LENGTH = 16;            // AES block size is always 128 bits (16 bytes)

// --- Derive a stable 32-byte key from the env variable ---
// WHY SHA-256 the env string instead of using it raw?
//   AES-256 requires exactly 32 bytes. Rather than force the .env value to
//   be a specific length, we hash it with SHA-256 (output is always 32 bytes).
//   The result is deterministic: same input string → same key every time.
const getKey = () => {
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error('ENCRYPTION_KEY is not set in .env');
  }
  return crypto.createHash('sha256').update(keyStr).digest(); // → 32-byte Buffer
};

// --- Encrypt a plaintext password ---
// Returns { encryptedPassword (hex string), iv (hex string) }
// Both are stored in MongoDB; only encryptedPassword is a secret.
const encrypt = (plaintext) => {
  const key = getKey();

  // WHY a fresh random IV every call?
  //   If we reused the same IV, two identical passwords would produce the
  //   same ciphertext, leaking that they're the same. Random IV prevents this.
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // update() encrypts the data; final() flushes the last (possibly padded) block
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encryptedPassword: encrypted,
    iv: iv.toString('hex'), // store as hex string for easy DB persistence
  };
};

// --- Decrypt a stored password ---
// Takes the hex-encoded ciphertext and hex-encoded IV stored in MongoDB.
const decrypt = (encryptedPassword, ivHex) => {
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

module.exports = { encrypt, decrypt };
