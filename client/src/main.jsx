// src/main.jsx
// Application entry point – mounts the React tree into the HTML root div.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Tailwind base styles
import App from "./App";

createRoot(document.getElementById("root")).render(
  // StrictMode intentionally double-invokes certain functions in development
  // to help surface side-effects and deprecated API usage early.
  <StrictMode>
    <App />
  </StrictMode>
);
