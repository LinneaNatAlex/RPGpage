import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/routes.jsx";
import { AuthProvider } from "./context/authContext.jsx";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.jsx";
import "./assets/Cursor/magicalCursor.css";
import { enableMagicalCursor } from "./assets/Cursor/magicalCursor.js";

// Suppress ReactQuill findDOMNode warnings (early suppression)
if (import.meta.env.DEV) {
  // Suppress React DevTools message
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
  
  // Override console methods early
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = function (...args) {
    const message = args[0];
    if (typeof message === "string" && 
        (message.includes("findDOMNode") || 
         message.includes("deprecated") ||
         message.includes("will be removed"))) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };
  
  console.error = function (...args) {
    const message = args[0];
    if (typeof message === "string" && 
        (message.includes("findDOMNode") || 
         message.includes("deprecated") ||
         message.includes("will be removed"))) {
      return; // Suppress these errors
    }
    originalError.apply(console, args);
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
