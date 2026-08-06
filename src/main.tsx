import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster
      theme="dark"
      toastOptions={{
        style: {
          background: "#0d1f3c",
          border: "1px solid rgba(89,169,255,0.35)",
          color: "#fff",
        },
      }}
    />
  </StrictMode>,
);
