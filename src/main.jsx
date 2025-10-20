import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/routes.jsx";
import { AuthProvider } from "./context/authContext.jsx";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.jsx";
import "./assets/Cursor/magicalCursor.css";
import { enableMagicalCursor } from "./assets/Cursor/magicalCursor.js";

// Suppress findDOMNode warnings from react-quill in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = function (message) {
    if (typeof message === "string" && message.includes("findDOMNode")) {
      return; // Suppress findDOMNode warnings
    }
    // Call original console.warn for other messages
    originalWarn.apply(console, arguments);
  };
}

// root element for the application
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </ErrorBoundary>
);

// Enable magical cursor effect
enableMagicalCursor();
