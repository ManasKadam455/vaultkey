// utils/clipboard.js
// Clipboard helper that securely wipes sensitive text after 15 seconds.
//
// WHY auto-clear clipboard after 15 seconds?
// Passwords stored in the operating system clipboard remain accessible in plaintext
// to all other running local applications, background daemons, and browser extensions.
// Automatically clearing the clipboard after 15 seconds minimizes this exposure
// window while providing adequate time for the user to paste their password.

let activeTimerId = null;

/**
 * Copies text to the clipboard and schedules an automatic wipe after timeoutMs.
 *
 * @param {string} text - The text to copy
 * @param {Function} [onAutoCleared] - Callback fired when clipboard is wiped
 * @param {number} [timeoutMs=15000] - Timeout in milliseconds (default: 15s)
 * @returns {Promise<boolean>}
 */
export async function copyWithAutoClear(text, onAutoCleared, timeoutMs = 15000) {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);

    // Cancel any previously running timer
    if (activeTimerId) {
      clearTimeout(activeTimerId);
      activeTimerId = null;
    }

    // Set 15-second auto-clear timer
    activeTimerId = setTimeout(async () => {
      try {
        await navigator.clipboard.writeText('');
        if (typeof onAutoCleared === 'function') {
          onAutoCleared();
        }
      } catch (err) {
        // Tab focus loss may prevent background clipboard writes in some browsers
        console.warn('Clipboard auto-wipe skipped:', err.message);
      } finally {
        activeTimerId = null;
      }
    }, timeoutMs);

    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
