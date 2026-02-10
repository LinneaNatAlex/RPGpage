import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/routes.jsx";
import { AuthProvider } from "./context/authContext.jsx";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.jsx";

// root element for the application
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </ErrorBoundary>
);
