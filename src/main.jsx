import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/routes.jsx";
import { AuthProvider } from "./context/authContext.jsx";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.jsx";

function isSuppressedError(err) {
  const msg = err?.message ?? err?.reason?.message ?? String(err);
  if (typeof msg !== "string") return false;
  return (
    msg.includes("INTERNAL ASSERTION FAILED") ||
    msg.includes("Minified React error #426") ||
    msg.includes("suspended while responding to synchronous input")
  );
}

window.addEventListener("error", (event) => {
  if (isSuppressedError(event.error)) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
});
window.addEventListener("unhandledrejection", (event) => {
  if (isSuppressedError(event.reason)) {
    event.preventDefault();
  }
});

const _consoleError = console.error.bind(console);
console.error = (...args) => {
  const str = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
  if (
    str.includes("INTERNAL ASSERTION FAILED") ||
    str.includes("Minified React error #426") ||
    str.includes("suspended while responding to synchronous input") ||
    (str.includes("firestore.googleapis") && str.includes("400")) ||
    str.includes("React Router caught the following error during render")
  ) {
    return;
  }
  _consoleError.apply(console, args);
};

// root element for the application
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </ErrorBoundary>
);
