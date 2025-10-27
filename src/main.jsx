import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/routes.jsx";
import { AuthProvider } from "./context/authContext.jsx";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.jsx";
import "./assets/Cursor/magicalCursor.css";
import { enableMagicalCursor } from "./assets/Cursor/magicalCursor.js";

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
