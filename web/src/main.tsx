import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/archivo/wght.css";
import "@fontsource-variable/source-sans-3/wght.css";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("No se encontró el elemento #root");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
