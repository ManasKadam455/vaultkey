// controllers/vaultController.js
// CRUD operations for the password vault.
//
// Security invariant throughout this file:
//   Every DB query that reads or modifies a credential includes
//   { userId: req.user.id } in its filter. This guarantees that even if an
//   attacker guesses a valid credential ObjectId, they cannot access or
//   modify it unless it belongs to their own account.

const { validationResult } = require('express-validator');
const Credential = require('../models/Credential');
const { encrypt, decrypt } = require('../utils/crypto');

// ─────────────────────────────────────────────
//  GET /api/vault  — list all credentials for the logged-in user
// ─────────────────────────────────────────────
const getCredentials = async (req, res, next) => {
  try {
    // Filter is scoped to this user's id only — users never see each other's data
    const credentials = await Credential.find({ userId: req.user.id }).sort({ createdAt: -1 });

    // Decrypt each password before sending.
    // toJSON() strips encryptedPassword and iv (see model), so we add the
    // plaintext 'password' field manually after decryption.
    const result = credentials.map((cred) => {
      const obj = cred.toJSON();           // safe serialised form (no enc fields)
      obj.password = decrypt(cred.encryptedPassword, cred.iv); // decrypt in memory
      return obj;
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/vault  — save a new credential
// ─────────────────────────────────────────────
const createCredential = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { siteName, siteUrl, username, password, category } = req.body;

  try {
    // Encrypt the password before it touches the database
    const { encryptedPassword, iv } = encrypt(password);

    const credential = await Credential.create({
      userId: req.user.id, // bind to the logged-in user
      siteName,
      siteUrl: siteUrl || '',
      username,
      encryptedPassword,   // ciphertext goes to DB
      iv,                  // random IV goes to DB
      category: category || 'General',
    });

    // Build the response: safe fields from toJSON + decrypted password
    const result = credential.toJSON();
    result.password = password; // we just encrypted it; no need to decrypt again

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  PUT /api/vault/:id  — update a credential
// ─────────────────────────────────────────────
const updateCredential = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // WHY { _id, userId } together?
    // Using _id alone would let any authenticated user update any credential
    // by guessing its ObjectId. Adding userId ensures only the owner can edit.
    const credential = await Credential.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!credential) {
      // Return 404 (not 403) so we don't reveal whether the id exists
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Apply only the fields that were actually sent in the request body
    const { siteName, siteUrl, username, password, category } = req.body;

    if (siteName  !== undefined) credential.siteName  = siteName;
    if (siteUrl   !== undefined) credential.siteUrl   = siteUrl;
    if (username  !== undefined) credential.username  = username;
    if (category  !== undefined) credential.category  = category;

    // If a new password was provided, re-encrypt with a fresh random IV
    if (password) {
      const { encryptedPassword, iv } = encrypt(password);
      credential.encryptedPassword = encryptedPassword;
      credential.iv = iv;
    }

    await credential.save();

    // Decrypt the current (possibly just-updated) password for the response
    const result = credential.toJSON();
    result.password = decrypt(credential.encryptedPassword, credential.iv);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  DELETE /api/vault/:id  — delete a credential
// ─────────────────────────────────────────────
const deleteCredential = async (req, res, next) => {
  try {
    // findOneAndDelete with userId ownership check in a single atomic query
    const credential = await Credential.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id, // ownership check — cannot delete another user's entry
    });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({ message: 'Credential deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCredentials, createCredential, updateCredential, deleteCredential };
