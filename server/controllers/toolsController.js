// controllers/toolsController.js
// Handles server-side security utilities, including HaveIBeenPwned breach checks
// implementing the mathematical k-Anonymity privacy model.

const crypto = require('crypto');

/**
 * POST /api/tools/breach-check
 * Body: { password }
 *
 * WHY k-Anonymity?
 * Sending a user's raw password (or even its full hash) to an external third-party
 * API like HaveIBeenPwned would defeat the purpose of a password vault by leaking
 * which credentials are being queried.
 *
 * k-Anonymity solves this:
 * 1. The server computes the SHA-1 hash of the password.
 * 2. Only the first 5 characters (the "prefix") are sent to HIBP.
 * 3. HIBP returns a list of all hash suffixes (~500-1000) that start with that 5-char prefix.
 * 4. We search for our 35-character suffix locally in memory.
 *
 * Because millions of possible passwords share the exact same 5-character prefix,
 * HIBP never learns the user's password or full hash!
 */
const checkBreach = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Step 1: Compute SHA-1 hash in uppercase hex (HIBP expects uppercase)
    const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();

    // Step 2: Split into 5-character prefix and 35-character suffix
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    // Step 3: Query the HIBP Pwned Passwords Range API
    // User-Agent is required by HIBP API terms of use.
    // 'Add-Padding: true' instructs HIBP to add random dummy hashes so network eavesdroppers
    // cannot guess passwords based on the exact HTTP response byte length.
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'VaultKey-Internship-Assessment',
        'Add-Padding': 'true',
      },
    });

    if (!response.ok) {
      throw new Error(`HIBP API returned status ${response.status}`);
    }

    const text = await response.text();

    // Step 4: Parse lines locally to find our matching suffix
    // Each line format: <SUFFIX>:<COUNT>\r\n
    const lines = text.split('\n');
    let breachCount = 0;

    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(':');
      if (hashSuffix === suffix) {
        breachCount = parseInt(countStr, 10) || 0;
        break;
      }
    }

    res.json({
      breached: breachCount > 0,
      count: breachCount,
      prefix, // returned for verification/interview demo purposes
    });
  } catch (err) {
    console.error('Breach check error:', err.message);
    res.status(503).json({
      error: 'Breach check service temporarily unavailable',
      details: err.message,
    });
  }
};

module.exports = { checkBreach };
