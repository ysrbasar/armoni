import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { setupPwa } from "./lib/pwa";
import { TENANT } from "./lib/tenant";

setupPwa();
if (TENANT) document.title = `${TENANT.institution.name} · Armoni`;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
