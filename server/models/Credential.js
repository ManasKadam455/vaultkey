// models/Credential.js
// Represents one saved credential entry in a user's vault.
// encryptedPassword and iv are NEVER sent to the client — they are stripped
// in toJSON and the controller sends the decrypted password instead.

const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema(
  {
    // WHY index userId?
    // Every vault query filters on this field (find all credentials for user X).
    // An index turns that from a full-collection scan into a fast lookup.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    siteName: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      maxlength: [100, 'Site name cannot exceed 100 characters'],
    },

    siteUrl: {
      type: String,
      trim: true,
      default: '',
    },

    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      maxlength: [100, 'Username cannot exceed 100 characters'],
    },

    // The AES-256-CBC ciphertext (hex-encoded).
    // This is what gets stored; plaintext never touches the DB.
    encryptedPassword: {
      type: String,
      required: true,
    },

    // The random IV used for this specific encryption (hex-encoded).
    // Not secret, but must be stored so we can decrypt later.
    iv: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Strip encryption internals before the document is serialised to JSON.
// This means even if a future bug accidentally sends the raw document,
// encryptedPassword and iv will never be in the response body.
credentialSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.encryptedPassword; // never expose ciphertext to the client
    delete ret.iv;                // never expose iv to the client
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Credential', credentialSchema);
