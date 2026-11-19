// components/Toast.jsx
// Lightweight copy-to-clipboard feedback notification.
// Appears at the bottom-centre of the screen for 2 seconds then vanishes.

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                    bg-gray-700 text-white text-sm font-medium
                    px-5 py-2.5 rounded-full shadow-lg
                    animate-fade-in-up pointer-events-none">
      {message}
    </div>
  );
}
